/**
 * Tests for the RR telemetry helpers.
 *  - firePracticeExpand POSTs the right shape to /api/telemetry/event.
 *  - Failures don't throw (fire-and-forget).
 *  - Body is IDs/enums only (no PII / free text).
 */

import { firePracticeExpand, fireTelemetry } from '../api/telemetry';

const originalFetch = global.fetch;

afterAll(() => {
  (global as any).fetch = originalFetch;
});

describe('Reflection Room telemetry', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({ ok: true });
    (global as any).fetch = fetchMock;
  });

  it('firePracticeExpand POSTs the expected JSON body', async () => {
    firePracticeExpand('pressure', 'echo_signature');
    // Allow the fire-and-forget promise to settle.
    await new Promise(r => setTimeout(r, 0));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/api/telemetry/event');
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    const body = JSON.parse(init.body);
    expect(body).toEqual({
      event: 'practice_expand',
      body: { loop_id: 'pressure', surface: 'echo_signature' },
    });
  });

  it('fireTelemetry never throws — even when fetch rejects', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'));
    // Should resolve, not reject.
    await expect(
      fireTelemetry({
        event: 'practice_expand',
        body: { loop_id: 'overwhelm', surface: 'mirror_moment' },
      }),
    ).resolves.toBeUndefined();
  });

  it('echo_map_refresh body is empty per UI handoff §8', async () => {
    await fireTelemetry({ event: 'echo_map_refresh', body: {} });
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body).toEqual({ event: 'echo_map_refresh', body: {} });
  });

  it('nudge_opened carries only nudge_type (no PII)', async () => {
    await fireTelemetry({
      event: 'nudge_opened',
      body: { nudge_type: 'morning_quiz' },
    });
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(Object.keys(body.body)).toEqual(['nudge_type']);
  });
});
