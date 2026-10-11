import { TranscribeApiService } from './transcribe';

describe('TranscribeApiService', () => {
  const service = new TranscribeApiService();

  const spyOnRequest = (result: unknown) =>
    jest
      .spyOn(
        TranscribeApiService.prototype as unknown as {
          makeRequest: (...args: unknown[]) => Promise<unknown>;
        },
        'makeRequest',
      )
      .mockResolvedValue(result as never);

  afterEach(() => jest.restoreAllMocks());

  it('posts to the transcribe endpoint with auth', async () => {
    const spy = spyOnRequest({ success: true, data: { text: 'hello' } });

    await service.transcribe({
      mime_type: 'audio/m4a',
      data_base64: 'QUJD',
    });

    const [endpoint, method, body, requiresAuth] = spy.mock.calls[0];
    expect(endpoint).toBe('/api/mirrorgpt/transcribe');
    expect(method).toBe('POST');
    expect(body).toEqual({ mime_type: 'audio/m4a', data_base64: 'QUJD' });
    expect(requiresAuth).toBe(true);
  });

  it('allows longer than the 10s default but stays under the gateway ceiling', async () => {
    // Transcribing a 120s recording legitimately takes longer than a chat
    // reply, but API Gateway caps the integration at 30s — past that the
    // gateway 504s and the real error never surfaces.
    const spy = spyOnRequest({ success: true, data: { text: 'hi' } });

    await service.transcribe({ mime_type: 'audio/m4a', data_base64: 'QUJD' });

    const options = spy.mock.calls[0][5] as { timeoutMs: number };
    expect(options.timeoutMs).toBeGreaterThan(10_000);
    expect(options.timeoutMs).toBeLessThanOrEqual(30_000);
  });

  it('returns the transcript on success', async () => {
    spyOnRequest({
      success: true,
      data: { text: 'I keep circling the same door.', duration_ms: 12500 },
    });

    const result = await service.transcribe({
      mime_type: 'audio/m4a',
      data_base64: 'QUJD',
    });

    expect(result.success).toBe(true);
    expect(result.data?.text).toBe('I keep circling the same door.');
  });

  it('surfaces a failure as an unsuccessful response rather than throwing', async () => {
    spyOnRequest({ success: false, error: 'TranscriptionError' });

    const result = await service.transcribe({
      mime_type: 'audio/m4a',
      data_base64: 'QUJD',
    });

    expect(result.success).toBe(false);
  });
});
