import { echoApiService, EchoResponse } from './echo';

// Mock dependencies
jest.mock('@services/tokenManager', () => ({
  tokenManager: {
    storeTokens: jest.fn(),
    clearTokens: jest.fn(),
    isAuthenticated: jest.fn(),
    getValidToken: jest.fn().mockResolvedValue('mock-token'),
  },
}));

jest.mock('./errorHandler', () => ({
  ApiErrorHandler: {
    handleApiResponse: jest.fn((response) => response),
    handleSystemError: jest.fn(() => ({
      success: false,
      error: 'System error occurred',
    })),
    shouldHandleGracefully: jest.fn(() => true),
  },
}));

// Mock react-native-blob-util — uploadMedia streams via the native module.
type UploadTask = Promise<{ respInfo: { status: number }; text: () => string }> & {
  uploadProgress: jest.Mock;
};
const mockUploadProgress = jest.fn();
const mockFetch = jest.fn();
const mockWrap = jest.fn((p: string) => `WRAPPED:${p}`);
const mockStat = jest.fn();
const mockUnlink = jest.fn();
jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    fetch: (...args: unknown[]) => mockFetch(...args),
    wrap: (p: string) => mockWrap(p),
    fs: {
      stat: (...args: unknown[]) => mockStat(...args),
      unlink: (...args: unknown[]) => mockUnlink(...args),
    },
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('EchoApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });
  });

  describe('getEchoes', () => {
    it('fetches user created echoes from /api/echoes', async () => {
      const mockEchoes: EchoResponse[] = [
        {
          echo_id: '1',
          title: 'My Echo',
          category: 'Memory',
          echo_type: 'TEXT',
          created_at: '2026-03-29T00:00:00Z',
          content: 'Test content',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockEchoes }),
      });

      const result = await echoApiService.getEchoes();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/echoes'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('getInboxEchoes', () => {
    it('fetches received echoes from /api/echoes/inbox', async () => {
      const mockInboxEchoes: EchoResponse[] = [
        {
          echo_id: '1',
          title: 'From Mom',
          category: 'Memory',
          echo_type: 'TEXT',
          created_at: '2026-03-29T00:00:00Z',
          content: 'Love you',
          recipient: {
            recipient_id: 'r1',
            name: 'Me',
            email: 'me@example.com',
            motif: '❤️',
          },
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockInboxEchoes }),
      });

      await echoApiService.getInboxEchoes();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/echoes/inbox'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('handles empty inbox', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await echoApiService.getInboxEchoes();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/echoes/inbox'),
        expect.any(Object)
      );
    });

    it('handles API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      await echoApiService.getInboxEchoes();

      expect(global.fetch).toHaveBeenCalled();
    });

    it('requires authentication', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await echoApiService.getInboxEchoes();

      // Verify that the request includes authentication header
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Bearer'),
          }),
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // Pagination contract (PR: feat/echo-pagination-contract)
  // The backend's list endpoints now accept ?limit=&cursor= and return
  // next_cursor. Legacy callers (getEchoes / getInboxEchoes / etc) keep
  // their "return one flat array" contract — internally they loop through
  // pages until next_cursor is null.
  // -------------------------------------------------------------------------
  describe('pagination — full-list helpers', () => {
    it('getEchoes loops through pages until next_cursor is null', async () => {
      const page1: EchoResponse[] = [
        { echo_id: 'e1' } as EchoResponse,
        { echo_id: 'e2' } as EchoResponse,
      ];
      const page2: EchoResponse[] = [{ echo_id: 'e3' } as EchoResponse];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: page1,
            next_cursor: 'cursor-page2',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: page2,
            next_cursor: null,
          }),
        });

      const result = await echoApiService.getEchoes();

      expect(global.fetch).toHaveBeenCalledTimes(2);
      // First call: no cursor query param, just limit
      const firstUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(firstUrl).toContain('/api/echoes');
      expect(firstUrl).toContain('limit=100');
      expect(firstUrl).not.toContain('cursor=');
      // Second call: cursor from first response
      const secondUrl = (global.fetch as jest.Mock).mock.calls[1][0] as string;
      expect(secondUrl).toContain('cursor=cursor-page2');
      // Combined data
      expect(result.data).toEqual([...page1, ...page2]);
    });

    it('getEchoes stops at the first page when next_cursor is null', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [{ echo_id: 'only-one' }],
          next_cursor: null,
        }),
      });

      const result = await echoApiService.getEchoes();
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.data).toHaveLength(1);
    });

    it('getInboxEchoes loops through pages and unwraps legacy data.echoes shape', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            // older backend may have wrapped under data.echoes — the
            // extractor still resolves this shape.
            data: { echoes: [{ echo_id: 'i1' }] },
            next_cursor: 'cur',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [{ echo_id: 'i2' }],
            next_cursor: null,
          }),
        });

      const result = await echoApiService.getInboxEchoes();
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.data).toEqual([{ echo_id: 'i1' }, { echo_id: 'i2' }]);
    });
  });

  describe('pagination — single-page helpers', () => {
    it('getEchoesPage passes limit and cursor through and returns nextCursor', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [{ echo_id: 'a' }, { echo_id: 'b' }],
          next_cursor: 'page-2-cursor',
        }),
      });

      const result = await echoApiService.getEchoesPage({
        limit: 25,
        cursor: 'prev-cursor',
      });

      const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('limit=25');
      expect(url).toContain('cursor=prev-cursor');
      expect(result.data?.items).toHaveLength(2);
      expect(result.data?.nextCursor).toBe('page-2-cursor');
    });

    it('getEchoesPage clamps limit to 100 even if caller asks for more', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [], next_cursor: null }),
      });

      await echoApiService.getEchoesPage({ limit: 500 });

      const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('limit=100');
      expect(url).not.toContain('limit=500');
    });

    it('getRecipientsPage and getGuardiansPage hit the right endpoints', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [], next_cursor: null }),
      });

      await echoApiService.getRecipientsPage({ limit: 10 });
      await echoApiService.getGuardiansPage({ limit: 10 });

      const calls = (global.fetch as jest.Mock).mock.calls;
      expect(calls[0][0]).toContain('/api/recipients');
      expect(calls[1][0]).toContain('/api/guardians');
    });
  });

  describe('uploadMedia (native streaming)', () => {
    const buildTask = (status: number, body = ''): UploadTask => {
      const task = Promise.resolve({
        respInfo: { status },
        text: () => body,
      }) as UploadTask;
      task.uploadProgress = mockUploadProgress;
      return task;
    };

    beforeEach(() => {
      mockFetch.mockReset();
      mockUploadProgress.mockReset();
      mockWrap.mockClear();
    });

    it('streams the file via ReactNativeBlobUtil.fetch + wrap()', async () => {
      mockFetch.mockReturnValue(buildTask(200));

      await echoApiService.uploadMedia(
        'https://s3.example.com/presigned',
        'file:///var/mobile/cache/clip.mp4',
        'video/mp4',
      );

      expect(mockWrap).toHaveBeenCalledWith('/var/mobile/cache/clip.mp4');
      expect(mockFetch).toHaveBeenCalledWith(
        'PUT',
        'https://s3.example.com/presigned',
        { 'Content-Type': 'video/mp4' },
        'WRAPPED:/var/mobile/cache/clip.mp4',
      );
    });

    it('leaves Android-style content:// URIs untouched', async () => {
      mockFetch.mockReturnValue(buildTask(200));

      await echoApiService.uploadMedia(
        'https://s3.example.com/presigned',
        'content://media/external/video/clip.mp4',
        'video/mp4',
      );

      expect(mockWrap).toHaveBeenCalledWith(
        'content://media/external/video/clip.mp4',
      );
    });

    it('wires the progress callback when provided', async () => {
      mockFetch.mockReturnValue(buildTask(200));
      const onProgress = jest.fn();

      await echoApiService.uploadMedia(
        'https://s3.example.com/presigned',
        '/local/clip.mp4',
        'video/mp4',
        onProgress,
      );

      expect(mockUploadProgress).toHaveBeenCalledTimes(1);
      const [opts, cb] = mockUploadProgress.mock.calls[0];
      expect(opts).toEqual({ interval: 250 });

      // Simulate the native module pushing a progress tick.
      cb('1024', '2048');
      expect(onProgress).toHaveBeenCalledWith(1024, 2048);
    });

    it('throws "Media upload failed" with the HTTP status on a non-2xx response', async () => {
      mockFetch.mockReturnValue(buildTask(403, 'AccessDenied'));

      await expect(
        echoApiService.uploadMedia(
          'https://s3.example.com/presigned',
          '/local/clip.mp4',
          'video/mp4',
        ),
      ).rejects.toThrow('Media upload failed (403)');
    });

    it('wraps native-side errors in a "Cannot upload media file" error', async () => {
      mockFetch.mockImplementation(() => {
        throw new Error('ECONNRESET');
      });

      await expect(
        echoApiService.uploadMedia(
          'https://s3.example.com/presigned',
          '/local/clip.mp4',
          'video/mp4',
        ),
      ).rejects.toThrow('Cannot upload media file: ECONNRESET');
    });
  });

  describe('idempotency keys', () => {
    function headersFromCall(call: unknown): Record<string, string> {
      // fetch is called as fetch(url, init). `init.headers` is the
      // merged header map that BaseApiService builds.
      const [, init] = call as [string, { headers: Record<string, string> }];
      return init.headers;
    }

    it('attaches Idempotency-Key on createEcho', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { echo_id: 'e-1' } }),
      });

      await echoApiService.createEcho({
        title: 't',
        category: 'c',
        echo_type: 'TEXT',
      });

      const call = (global.fetch as jest.Mock).mock.calls[0];
      const headers = headersFromCall(call);
      expect(headers['Idempotency-Key']).toBeTruthy();
      // UUID v4 shape.
      expect(headers['Idempotency-Key']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    });

    it('attaches Idempotency-Key on finalizeMedia', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { echo_id: 'e-1' } }),
      });

      await echoApiService.finalizeMedia('e-1', 'echoes/u-1/e-1.mp4', 'video/mp4');

      const call = (global.fetch as jest.Mock).mock.calls[0];
      const headers = headersFromCall(call);
      expect(headers['Idempotency-Key']).toBeTruthy();
    });

    it('uses a distinct key per createEcho call', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { echo_id: 'e' } }),
      });

      await echoApiService.createEcho({
        title: 'a',
        category: 'c',
        echo_type: 'TEXT',
      });
      await echoApiService.createEcho({
        title: 'b',
        category: 'c',
        echo_type: 'TEXT',
      });

      const calls = (global.fetch as jest.Mock).mock.calls;
      const k1 = headersFromCall(calls[0])['Idempotency-Key'];
      const k2 = headersFromCall(calls[1])['Idempotency-Key'];
      expect(k1).toBeTruthy();
      expect(k2).toBeTruthy();
      expect(k1).not.toBe(k2);
    });
  });

  describe('finalizeMedia', () => {
    it('POSTs to /api/echoes/{id}/finalize-media with key + content_type', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { echo_id: 'echo-1', media_url: 'https://b/.../echo-1_x.mp4' },
        }),
      });

      const result = await echoApiService.finalizeMedia(
        'echo-1',
        'echoes/u-1/echo-1_2026.mp4',
        'video/mp4',
      );

      expect(result.success).toBe(true);
      const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('/api/echoes/echo-1/finalize-media');
      const body = JSON.parse((init as { body: string }).body);
      expect(body).toEqual({
        key: 'echoes/u-1/echo-1_2026.mp4',
        content_type: 'video/mp4',
      });
    });

    it('URL-encodes the echo_id in the path', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      });
      await echoApiService.finalizeMedia('a/b c', 'echoes/u-1/a-b-c_2026.mp4');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url as string).toContain('/api/echoes/a%2Fb%20c/finalize-media');
    });
  });

  describe('completeMultipart', () => {
    it('uses a deterministic Idempotency-Key derived from upload_id', async () => {
      // Two calls with the SAME upload_id must produce the SAME key —
      // a fresh UUID per call would defeat backend dedup if the app
      // retried after a crash mid-flight.
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { echo_id: 'e-1' } }),
      });

      await echoApiService.completeMultipart('e-1', 'UPLOAD-X', 'k', [
        { part_number: 1, etag: 'a' },
      ]);
      await echoApiService.completeMultipart('e-1', 'UPLOAD-X', 'k', [
        { part_number: 1, etag: 'a' },
      ]);

      const calls = (global.fetch as jest.Mock).mock.calls;
      const k1 = (calls[0][1] as { headers: Record<string, string> }).headers[
        'Idempotency-Key'
      ];
      const k2 = (calls[1][1] as { headers: Record<string, string> }).headers[
        'Idempotency-Key'
      ];
      expect(k1).toBe(k2);
      expect(k1).toContain('UPLOAD-X');
    });

    it('uses different keys for different upload_ids', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { echo_id: 'e-1' } }),
      });

      await echoApiService.completeMultipart('e-1', 'UPLOAD-A', 'k', [
        { part_number: 1, etag: 'a' },
      ]);
      await echoApiService.completeMultipart('e-1', 'UPLOAD-B', 'k', [
        { part_number: 1, etag: 'b' },
      ]);

      const calls = (global.fetch as jest.Mock).mock.calls;
      const k1 = (calls[0][1] as { headers: Record<string, string> }).headers[
        'Idempotency-Key'
      ];
      const k2 = (calls[1][1] as { headers: Record<string, string> }).headers[
        'Idempotency-Key'
      ];
      expect(k1).not.toBe(k2);
    });
  });

  describe('uploadEchoMedia (umbrella)', () => {
    beforeEach(() => {
      mockFetch.mockReset();
      mockFetch.mockReturnValue(
        Object.assign(
          Promise.resolve({ respInfo: { status: 200 }, text: () => '' }),
          { uploadProgress: jest.fn() },
        ),
      );
      (global.fetch as jest.Mock).mockReset();
    });

    it('compresses → presigns → streams → finalizes, in that order', async () => {
      const order: string[] = [];
      const Video = jest.requireMock('react-native-compressor').Video as {
        compress: jest.Mock;
      };
      Video.compress.mockImplementation(async (uri: string) => {
        order.push('compress');
        return uri.replace('clip.mp4', 'clip.compressed.mp4');
      });

      mockFetch.mockImplementation(() => {
        order.push('upload');
        return Object.assign(
          Promise.resolve({ respInfo: { status: 200 }, text: () => '' }),
          { uploadProgress: jest.fn() },
        );
      });

      (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
        if (url.includes('/api/echoes/echo-1/finalize-media')) {
          order.push('finalize');
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: { echo_id: 'echo-1', media_url: 'https://canonical/x' },
            }),
          };
        }
        if (url.includes('/api/echoes/upload-url')) {
          order.push('presign');
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: {
                upload_url: 'https://s3.example.com/signed',
                media_url: 'https://canonical/x',
                key: 'echoes/u-1/echo-1_2026.mp4',
              },
            }),
          };
        }
        return { ok: true, json: async () => ({ success: true, data: {} }) };
      });

      const result = await echoApiService.uploadEchoMedia(
        'echo-1',
        '/local/clip.mp4',
        'video/mp4',
      );

      expect(result.success).toBe(true);
      expect(order).toEqual(['compress', 'presign', 'upload', 'finalize']);
    });

    it('emits onStage transitions for each phase', async () => {
      const Video = jest.requireMock('react-native-compressor').Video as {
        compress: jest.Mock;
      };
      Video.compress.mockImplementation(
        async (uri: string, _opts: unknown, onProg: (p: number) => void) => {
          onProg(0.5);
          return uri;
        },
      );

      (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
        if (url.includes('/finalize-media')) {
          return {
            ok: true,
            json: async () => ({ success: true, data: { echo_id: 'echo-1' } }),
          };
        }
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              upload_url: 'https://s3.example.com/signed',
              key: 'echoes/u-1/echo-1.mp4',
              media_url: 'x',
            },
          }),
        };
      });

      mockFetch.mockImplementation(() => {
        const task = Promise.resolve({
          respInfo: { status: 200 },
          text: () => '',
        }) as Promise<{ respInfo: { status: number }; text: () => string }> & {
          uploadProgress: jest.Mock;
        };
        task.uploadProgress = jest.fn((opts, cb) => {
          cb('512', '1024');
        });
        return task;
      });

      const stages: string[] = [];
      await echoApiService.uploadEchoMedia(
        'echo-1',
        '/local/clip.mp4',
        'video/mp4',
        stage => {
          stages.push(stage.type);
        },
      );

      expect(stages).toContain('compressing');
      expect(stages).toContain('requesting_url');
      expect(stages).toContain('uploading');
      expect(stages).toContain('finalizing');
    });

    it('unlinks the compressed temp file after a successful upload', async () => {
      const Video = jest.requireMock('react-native-compressor').Video as {
        compress: jest.Mock;
      };
      Video.compress.mockClear();
      mockUnlink.mockClear();
      mockStat.mockReset();
      mockUnlink.mockResolvedValue(undefined);

      // Source is large enough to trigger compression; result size is unknown.
      mockStat.mockResolvedValueOnce({ size: '50000000' });
      mockStat.mockResolvedValue({ size: '5000000' });
      Video.compress.mockResolvedValueOnce('/cache/clip.compressed.mp4');

      (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
        if (url.includes('/finalize-media')) {
          return {
            ok: true,
            json: async () => ({ success: true, data: { echo_id: 'echo-1' } }),
          };
        }
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              upload_url: 'https://s3.example.com/signed',
              key: 'echoes/u-1/echo-1.mp4',
              media_url: 'x',
            },
          }),
        };
      });
      mockFetch.mockReturnValue(
        Object.assign(
          Promise.resolve({ respInfo: { status: 200 }, text: () => '' }),
          { uploadProgress: jest.fn() },
        ),
      );

      await echoApiService.uploadEchoMedia(
        'echo-1',
        '/picker/clip.mp4',
        'video/mp4',
      );

      expect(mockUnlink).toHaveBeenCalledWith('/cache/clip.compressed.mp4');
    });

    it('also unlinks the compressed temp file on upload failure', async () => {
      const Video = jest.requireMock('react-native-compressor').Video as {
        compress: jest.Mock;
      };
      Video.compress.mockClear();
      mockUnlink.mockClear();
      mockStat.mockReset();
      mockUnlink.mockResolvedValue(undefined);

      mockStat.mockResolvedValueOnce({ size: '50000000' });
      mockStat.mockResolvedValue({ size: '5000000' });
      Video.compress.mockResolvedValueOnce('/cache/clip.compressed.mp4');

      (global.fetch as jest.Mock).mockImplementation(async () => ({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            upload_url: 'https://s3.example.com/signed',
            key: 'echoes/u-1/echo-1.mp4',
            media_url: 'x',
          },
        }),
      }));
      // Make the S3 PUT fail so the upload throws AFTER the temp file
      // was written.
      mockFetch.mockReturnValue(
        Object.assign(
          Promise.resolve({
            respInfo: { status: 500 },
            text: () => 'oops',
          }),
          { uploadProgress: jest.fn() },
        ),
      );

      await expect(
        echoApiService.uploadEchoMedia(
          'echo-1',
          '/picker/clip.mp4',
          'video/mp4',
        ),
      ).rejects.toThrow();

      expect(mockUnlink).toHaveBeenCalledWith('/cache/clip.compressed.mp4');
    });

    it('returns a clear retry message when finalize fails', async () => {
      const Video = jest.requireMock('react-native-compressor').Video as {
        compress: jest.Mock;
      };
      mockStat.mockReset();
      mockStat.mockResolvedValue(null);  // small file — skip compression
      Video.compress.mockImplementation(async (uri: string) => uri);

      mockFetch.mockReturnValue(
        Object.assign(
          Promise.resolve({ respInfo: { status: 200 }, text: () => '' }),
          { uploadProgress: jest.fn() },
        ),
      );
      (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
        if (url.includes('/finalize-media')) {
          return {
            ok: false,
            status: 500,
            json: async () => ({ success: false, error: '' }),
          };
        }
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              upload_url: 'https://s3.example.com/signed',
              key: 'echoes/u-1/echo-1.mp4',
              media_url: 'x',
            },
          }),
        };
      });

      const result = await echoApiService.uploadEchoMedia(
        'echo-1',
        '/picker/clip.mp4',
        'video/mp4',
      );

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/could not be confirmed/i);
    });

    it('skips compression entirely for audio files', async () => {
      const Video = jest.requireMock('react-native-compressor').Video as {
        compress: jest.Mock;
      };
      const Image = jest.requireMock('react-native-compressor').Image as {
        compress: jest.Mock;
      };
      Video.compress.mockClear();
      Image.compress.mockClear();

      (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
        if (url.includes('/finalize-media')) {
          return {
            ok: true,
            json: async () => ({ success: true, data: { echo_id: 'echo-1' } }),
          };
        }
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              upload_url: 'https://s3.example.com/signed',
              key: 'echoes/u-1/echo-1.m4a',
              media_url: 'x',
            },
          }),
        };
      });

      await echoApiService.uploadEchoMedia(
        'echo-1',
        '/local/voice.m4a',
        'audio/m4a',
      );

      expect(Video.compress).not.toHaveBeenCalled();
      expect(Image.compress).not.toHaveBeenCalled();
    });
  });
});
