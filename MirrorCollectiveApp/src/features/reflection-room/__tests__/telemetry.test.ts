/**
 * Tests for the RR telemetry helpers.
 *  - firePracticeExpand POSTs the right shape to /api/telemetry/event.
 *  - Failures don't throw (fire-and-forget).
 *  - Body is IDs/enums only (no PII / free text).
 *  - Authorization header carries the user's JWT (post-Cognito-authorizer
 *    fix — without this, RR telemetry events 401 silently).
 *  - No fetch fires when there's no session.
 */

import { firePracticeExpand, fireTelemetry } from '../api/telemetry';

jest.mock('@services/tokenManager', () => ({
  tokenManager: {
    getValidToken: jest.fn().mockResolvedValue('mock-jwt-token'),
  },
}));

const originalFetch = global.fetch;

// Pull in the mocked tokenManager so individual tests can override the
// getValidToken return for the "no session" / "expired session" paths.
import { tokenManager } from '@services/tokenManager';

afterAll(() => {
  (global as any).fetch = originalFetch;
});

describe('Reflection Room telemetry', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({ ok: true });
    (global as any).fetch = fetchMock;
    (tokenManager.getValidToken as jest.Mock).mockResolvedValue('mock-jwt-token');
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

  it('includes the JWT bearer token in the Authorization header', async () => {
    await fireTelemetry({
      event: 'practice_expand',
      body: { loop_id: 'pressure', surface: 'echo_signature' },
    });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer mock-jwt-token');
  });

  it('skips the request entirely when there is no session', async () => {
    (tokenManager.getValidToken as jest.Mock).mockResolvedValueOnce(null);

    await fireTelemetry({
      event: 'echo_map_refresh',
      body: {},
    });

    // No session = no fetch. Better to drop silently than to fire a
    // request we know the API Gateway authorizer will 401.
    expect(fetchMock).not.toHaveBeenCalled();
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

  it('fireTelemetry never throws — even when tokenManager rejects', async () => {
    (tokenManager.getValidToken as jest.Mock).mockRejectedValueOnce(
      new Error('keychain unavailable'),
    );
    await expect(
      fireTelemetry({ event: 'echo_map_refresh', body: {} }),
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
