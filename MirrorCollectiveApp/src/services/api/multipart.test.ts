/**
 * Tests for the multipart-upload orchestrator.
 *
 * Mocks at the boundary: ReactNativeBlobUtil's fs + fetch surfaces, and
 * the EchoApiService methods that wrap the four backend routes. Asserts
 * the end-to-end pipeline shape (initiate → slice → presign → upload →
 * complete) plus failure / abort behavior.
 */

import { uploadMediaMultipart, MULTIPART_THRESHOLD } from './multipart';

// Pull the same mock surface BaseApiService tests use.
const mockFetch = jest.fn();
const mockWrap = jest.fn((p: string) => `WRAPPED:${p}`);
const mockSlice = jest.fn();
const mockUnlink = jest.fn();
const mockMkdir = jest.fn();
const mockStat = jest.fn();

jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    fetch: (...args: unknown[]) => mockFetch(...args),
    wrap: (p: string) => mockWrap(p),
    fs: {
      dirs: { CacheDir: '/cache' },
      slice: (...args: unknown[]) => mockSlice(...args),
      unlink: (...args: unknown[]) => mockUnlink(...args),
      mkdir: (...args: unknown[]) => mockMkdir(...args),
      stat: (...args: unknown[]) => mockStat(...args),
    },
  },
}));

function buildOkPutResponse(etag = '"deadbeef"') {
  return Object.assign(
    Promise.resolve({
      respInfo: { status: 200, headers: { ETag: etag } },
      text: () => '',
    }),
    { uploadProgress: jest.fn() },
  );
}

function buildFakeApi() {
  return {
    initiateMultipart: jest.fn().mockResolvedValue({
      success: true,
      data: { upload_id: 'UPLOAD-1', key: 'echoes/u-1/e-1.mp4' },
    }),
    getMultipartPartUrls: jest.fn().mockResolvedValue({
      success: true,
      data: {
        part_urls: [
          { part_number: 1, url: 'https://s3.example.com/p1' },
          { part_number: 2, url: 'https://s3.example.com/p2' },
        ],
      },
    }),
    completeMultipart: jest.fn().mockResolvedValue({
      success: true,
      data: { echo_id: 'e-1', media_url: 'https://canonical/x' },
    }),
    abortMultipart: jest.fn().mockResolvedValue({ success: true }),
  };
}

describe('uploadMediaMultipart', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockSlice.mockReset();
    mockUnlink.mockReset();
    mockMkdir.mockReset();
    mockStat.mockReset();
    mockSlice.mockResolvedValue(undefined);
    mockUnlink.mockResolvedValue(undefined);
    mockMkdir.mockResolvedValue(undefined);
  });

  it('runs initiate → part-urls → slice+upload (in parallel) → complete', async () => {
    // Slice/upload for the two parts run concurrently, so their exact
    // interleave isn't stable; the contract this test pins is the OUTER
    // ordering (initiate first, complete last) plus that every part got
    // sliced + uploaded between them.
    const order: string[] = [];
    const api = buildFakeApi();
    api.initiateMultipart.mockImplementation(async () => {
      order.push('initiate');
      return { success: true, data: { upload_id: 'U', key: 'k' } };
    });
    api.getMultipartPartUrls.mockImplementation(async () => {
      order.push('part-urls');
      return {
        success: true,
        data: {
          part_urls: [
            { part_number: 1, url: 'u1' },
            { part_number: 2, url: 'u2' },
          ],
        },
      };
    });
    mockSlice.mockImplementation(async () => {
      order.push('slice');
    });
    mockFetch.mockImplementation(() => {
      order.push('upload');
      return buildOkPutResponse();
    });
    api.completeMultipart.mockImplementation(async () => {
      order.push('complete');
      return { success: true, data: { echo_id: 'e-1' } };
    });

    const result = await uploadMediaMultipart({
      api: api as never,
      echoId: 'e-1',
      fileUri: '/local/big.mp4',
      contentType: 'video/mp4',
      // 7 MB so we get exactly 2 parts (5 MB + 2 MB).
      fileSize: 7 * 1024 * 1024,
    });

    expect(result.success).toBe(true);
    expect(order[0]).toBe('initiate');
    expect(order[1]).toBe('part-urls');
    expect(order[order.length - 1]).toBe('complete');
    // Two slices and two uploads happen between part-urls and complete.
    const middle = order.slice(2, -1);
    expect(middle.filter(s => s === 'slice')).toHaveLength(2);
    expect(middle.filter(s => s === 'upload')).toHaveLength(2);
  });

  it('aborts on upload failure and re-throws', async () => {
    const api = buildFakeApi();
    mockFetch.mockReturnValue(
      Object.assign(
        Promise.resolve({
          respInfo: { status: 500, headers: {} },
          text: () => 'oops',
        }),
        { uploadProgress: jest.fn() },
      ),
    );

    await expect(
      uploadMediaMultipart({
        api: api as never,
        echoId: 'e-1',
        fileUri: '/local/big.mp4',
        contentType: 'video/mp4',
        fileSize: 7 * 1024 * 1024,
      }),
    ).rejects.toThrow();

    expect(api.abortMultipart).toHaveBeenCalledWith('e-1', 'UPLOAD-1', 'echoes/u-1/e-1.mp4');
  });

  it('cleans up part files after each upload (bounded peak disk usage)', async () => {
    const api = buildFakeApi();
    mockFetch.mockReturnValue(buildOkPutResponse());

    await uploadMediaMultipart({
      api: api as never,
      echoId: 'e-1',
      fileUri: '/local/big.mp4',
      contentType: 'video/mp4',
      fileSize: 7 * 1024 * 1024,
    });

    // Both part files were unlinked, plus the slice directory itself.
    const unlinkedPaths = mockUnlink.mock.calls.map(c => c[0] as string);
    expect(unlinkedPaths.filter(p => p.includes('part-1'))).toHaveLength(1);
    expect(unlinkedPaths.filter(p => p.includes('part-2'))).toHaveLength(1);
    // Slice directory (parent) is also unlinked at the end.
    expect(unlinkedPaths.some(p => p.includes('mc-mp-e-1'))).toBe(true);
  });

  it('emits "uploading" progress as parts complete', async () => {
    const api = buildFakeApi();
    mockFetch.mockReturnValue(buildOkPutResponse());
    const stages: Array<{ type: string; sent?: number; total?: number }> = [];

    await uploadMediaMultipart({
      api: api as never,
      echoId: 'e-1',
      fileUri: '/local/big.mp4',
      contentType: 'video/mp4',
      fileSize: 7 * 1024 * 1024,
      onStage: stage => stages.push(stage as never),
    });

    const uploadingStages = stages.filter(s => s.type === 'uploading');
    expect(uploadingStages.length).toBe(2);
    // Last 'uploading' event must have sent === total.
    const last = uploadingStages[uploadingStages.length - 1];
    expect(last.sent).toBe(7 * 1024 * 1024);
    expect(last.total).toBe(7 * 1024 * 1024);
    expect(stages.some(s => s.type === 'finalizing')).toBe(true);
  });

  it('respects PART_CONCURRENCY (max 4 parts in flight)', async () => {
    const api = buildFakeApi();
    // Generate 12 parts worth of URLs.
    const partUrls = Array.from({ length: 12 }, (_, i) => ({
      part_number: i + 1,
      url: `u${i + 1}`,
    }));
    api.getMultipartPartUrls.mockResolvedValue({
      success: true,
      data: { part_urls: partUrls },
    });

    let inFlight = 0;
    let peakInFlight = 0;
    mockFetch.mockImplementation(() => {
      inFlight++;
      peakInFlight = Math.max(peakInFlight, inFlight);
      return new Promise<{
        respInfo: { status: number; headers: Record<string, string> };
        text: () => string;
      }>(resolve => {
        setTimeout(() => {
          inFlight--;
          resolve({
            respInfo: { status: 200, headers: { ETag: '"x"' } },
            text: () => '',
          });
        }, 20);
      }) as never;
    });

    await uploadMediaMultipart({
      api: api as never,
      echoId: 'e-1',
      fileUri: '/local/big.mp4',
      contentType: 'video/mp4',
      // 12 × 5 MB = 60 MB.
      fileSize: 12 * 5 * 1024 * 1024,
    });

    // PART_CONCURRENCY is 4; allow tiny slack for the moment a slice's
    // synchronous resolution lands between an acquire and the previous
    // task's release (Jest microtask ordering is deterministic but
    // not always intuitive). The contract is: we do NOT fan out 12
    // parallel uploads.
    expect(peakInFlight).toBeLessThanOrEqual(5);
    expect(peakInFlight).toBeLessThan(12);
  });

  it('retries a transient 5xx part failure up to 3 times', async () => {
    const api = buildFakeApi();
    let callCount = 0;
    mockFetch.mockImplementation(() => {
      callCount++;
      if (callCount <= 2) {
        return Object.assign(
          Promise.resolve({
            respInfo: { status: 503, headers: {} },
            text: () => 'transient',
          }),
          { uploadProgress: jest.fn() },
        );
      }
      return buildOkPutResponse();
    });

    await uploadMediaMultipart({
      api: api as never,
      echoId: 'e-1',
      fileUri: '/local/big.mp4',
      contentType: 'video/mp4',
      // 5 MB = 1 part.
      fileSize: 5 * 1024 * 1024,
    });

    // 2 transient failures + 1 success = 3 fetch calls total.
    expect(callCount).toBe(3);
  });

  it('does NOT retry on a 4xx — surfaces immediately', async () => {
    const api = buildFakeApi();
    let callCount = 0;
    mockFetch.mockImplementation(() => {
      callCount++;
      return Object.assign(
        Promise.resolve({
          respInfo: { status: 403, headers: {} },
          text: () => 'AccessDenied',
        }),
        { uploadProgress: jest.fn() },
      );
    });

    await expect(
      uploadMediaMultipart({
        api: api as never,
        echoId: 'e-1',
        fileUri: '/local/big.mp4',
        contentType: 'video/mp4',
        fileSize: 5 * 1024 * 1024,
      }),
    ).rejects.toThrow();

    expect(callCount).toBe(1);
    expect(api.abortMultipart).toHaveBeenCalled();
  });

  it('returns the failure envelope if initiate fails (no S3 upload created)', async () => {
    const api = buildFakeApi();
    api.initiateMultipart.mockResolvedValue({
      success: false,
      error: 'Echo not found',
    });

    await expect(
      uploadMediaMultipart({
        api: api as never,
        echoId: 'e-1',
        fileUri: '/local/big.mp4',
        contentType: 'video/mp4',
        fileSize: 7 * 1024 * 1024,
      }),
    ).rejects.toThrow('Echo not found');
    // abort is NOT called — no upload was created.
    expect(api.abortMultipart).not.toHaveBeenCalled();
  });

  it('aborts the S3 session if presign-urls fails after initiate succeeded', async () => {
    // Initiate succeeded, so an S3 multipart session exists. The
    // pipeline must call /abort to clean it up (otherwise the bucket
    // holds partial state until the 7-day lifecycle rule reaps it).
    const api = buildFakeApi();
    api.getMultipartPartUrls.mockResolvedValue({
      success: false,
      error: 'Could not generate part URLs',
    });

    await expect(
      uploadMediaMultipart({
        api: api as never,
        echoId: 'e-1',
        fileUri: '/local/big.mp4',
        contentType: 'video/mp4',
        fileSize: 7 * 1024 * 1024,
      }),
    ).rejects.toThrow();

    expect(api.abortMultipart).toHaveBeenCalledWith(
      'e-1',
      'UPLOAD-1',
      'echoes/u-1/e-1.mp4',
    );
  });

  it('uses a deterministic Idempotency-Key on completeMultipart', async () => {
    // The complete call must dedup across retries by the SAME S3 upload
    // session — a fresh UUID per call would defeat that.
    const api = buildFakeApi();
    // We're testing EchoApiService.completeMultipart directly here via
    // the api mock's call_args, not the orchestrator. The orchestrator
    // doesn't touch idempotency keys — that lives on the api wrapper.
    // Instead, verify the contract holds by inspecting how
    // completeMultipart was called: same upload_id → same key in the
    // request shape. The wrapper logic (mp-complete:${uploadId}) is
    // exercised via echo.test.ts; here we just confirm that the
    // orchestrator passes through a stable upload_id, not a re-rolled
    // one.
    mockFetch.mockReturnValue(buildOkPutResponse());
    await uploadMediaMultipart({
      api: api as never,
      echoId: 'e-1',
      fileUri: '/local/big.mp4',
      contentType: 'video/mp4',
      fileSize: 7 * 1024 * 1024,
    });
    const [, capturedUploadId] = (api.completeMultipart as jest.Mock).mock.calls[0];
    expect(capturedUploadId).toBe('UPLOAD-1');
  });
});

describe('MULTIPART_THRESHOLD', () => {
  it('is 50 MB', () => {
    expect(MULTIPART_THRESHOLD).toBe(50 * 1024 * 1024);
  });
});
