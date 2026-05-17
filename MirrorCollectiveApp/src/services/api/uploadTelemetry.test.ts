/**
 * Tests for the upload-telemetry helper + accumulator.
 */

import {
  UploadMetricsAccumulator,
  fireUploadTelemetry,
  scrubErrorMessage,
} from './uploadTelemetry';

jest.mock('@services/tokenManager', () => ({
  tokenManager: {
    getValidToken: jest.fn().mockResolvedValue('mock-token'),
  },
}));

jest.mock('@constants/config', () => ({
  API_CONFIG: {
    HOST: 'https://api.example.test',
    TIMEOUT: 5000,
  },
}));

describe('scrubErrorMessage', () => {
  it.each([
    ['Cannot read /var/mobile/Cache/clip.mp4', '/var/mobile'],
    ['Open file:///Users/jane/Documents/x.jpg failed', '/Users/jane'],
    ['content://media/external/video/1 not found', 'content://media'],
  ])('replaces %s with [path]', (raw, sentinel) => {
    const out = scrubErrorMessage(raw);
    expect(out).toContain('[path]');
    expect(out).not.toContain(sentinel);
  });

  it('passes through messages without paths', () => {
    expect(scrubErrorMessage('S3 upload failed (403)')).toBe('S3 upload failed (403)');
  });

  it('truncates at 200 chars', () => {
    expect(scrubErrorMessage('x'.repeat(500))).toHaveLength(200);
  });

  it('returns empty string for falsy input', () => {
    expect(scrubErrorMessage('')).toBe('');
  });
});

describe('UploadMetricsAccumulator', () => {
  function freezeTime(ms: number) {
    jest.spyOn(Date, 'now').mockReturnValue(ms);
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('records per-stage durations', () => {
    freezeTime(1000);
    const acc = new UploadMetricsAccumulator('e-1', 'video/mp4', 1_000_000, 'single-put');

    freezeTime(1100);
    acc.markStageStart('compress');
    freezeTime(1500); // 400ms compress
    acc.markStageEnd('compress');

    freezeTime(1600);
    acc.markStageStart('upload');
    freezeTime(3600); // 2000ms upload
    acc.markStageEnd('upload');

    freezeTime(3700);
    acc.markStageStart('finalize');
    freezeTime(3850); // 150ms finalize
    acc.markStageEnd('finalize');

    freezeTime(4000); // build time
    const event = acc.build({
      status: 'success',
      backgroundedDuringUpload: false,
      appStateAtCompletion: 'active',
    });

    expect(event.duration_compress_ms).toBe(400);
    expect(event.duration_upload_ms).toBe(2000);
    expect(event.duration_finalize_ms).toBe(150);
    expect(event.duration_total_ms).toBe(3000); // 4000 - 1000
  });

  it('exposes lastEnteredStage for failure classification', () => {
    const acc = new UploadMetricsAccumulator('e', 'video/mp4', 1, 'single-put');
    acc.markStageStart('compress');
    expect(acc.lastEnteredStage).toBe('compress');
    acc.markStageEnd('compress');
    expect(acc.lastEnteredStage).toBeNull();
    acc.markStageStart('upload');
    expect(acc.lastEnteredStage).toBe('upload');
  });

  it('scrubs error_message via scrubErrorMessage when building', () => {
    const acc = new UploadMetricsAccumulator('e', 'video/mp4', 1, 'single-put');
    const event = acc.build({
      status: 'failed',
      failureStage: 'upload',
      errorMessage: 'Failed to open /var/mobile/Cache/x.mp4',
      backgroundedDuringUpload: false,
      appStateAtCompletion: 'active',
    });
    expect(event.error_message).toContain('[path]');
    expect(event.error_message).not.toContain('/var/mobile');
  });

  it('flips upload_path mid-pipeline (single-put → multipart)', () => {
    const acc = new UploadMetricsAccumulator('e', 'video/mp4', 1, 'single-put');
    acc.setUploadPath('multipart');
    acc.setPartsCount(12);
    const event = acc.build({
      status: 'success',
      backgroundedDuringUpload: false,
      appStateAtCompletion: 'active',
    });
    expect(event.upload_path).toBe('multipart');
    expect(event.parts_count).toBe(12);
  });

  it('treats partsCount as null when not set (single-put path)', () => {
    const acc = new UploadMetricsAccumulator('e', 'video/mp4', 1, 'single-put');
    const event = acc.build({
      status: 'success',
      backgroundedDuringUpload: false,
      appStateAtCompletion: 'active',
    });
    expect(event.parts_count).toBeNull();
  });
});

describe('fireUploadTelemetry', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({ ok: true });
  });

  it('POSTs to /api/telemetry/echo-upload with the event body', async () => {
    const acc = new UploadMetricsAccumulator(
      'e-1',
      'video/mp4',
      1_000,
      'single-put',
    );
    await fireUploadTelemetry(
      acc.build({
        status: 'success',
        backgroundedDuringUpload: false,
        appStateAtCompletion: 'active',
      }),
    );
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/telemetry/echo-upload');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer mock-token');
    const parsed = JSON.parse(init.body);
    expect(parsed.echo_id).toBe('e-1');
    expect(parsed.status).toBe('success');
  });

  it('drops silently when no token is available', async () => {
    const tokenManager =
      jest.requireMock('@services/tokenManager').tokenManager;
    tokenManager.getValidToken.mockResolvedValueOnce(null);

    const acc = new UploadMetricsAccumulator('e', 'video/mp4', 1, 'single-put');
    await fireUploadTelemetry(
      acc.build({
        status: 'success',
        backgroundedDuringUpload: false,
        appStateAtCompletion: 'active',
      }),
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('never throws on network failure (fire-and-forget contract)', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network'));
    const acc = new UploadMetricsAccumulator('e', 'video/mp4', 1, 'single-put');
    // Should resolve, not reject.
    await expect(
      fireUploadTelemetry(
        acc.build({
          status: 'success',
          backgroundedDuringUpload: false,
          appStateAtCompletion: 'active',
        }),
      ),
    ).resolves.toBeUndefined();
  });
});
