/**
 * Every request must announce the app version.
 *
 * The server uses `X-App-Version` to decide whether this client can safely
 * receive a `subscription_required` 403. Builds before 2026-11-01 crash on it
 * (they alert while the paywall redirect is mid-transition), so the server
 * fails closed and sends a plain string to anything that doesn't identify
 * itself as new enough.
 *
 * That makes the header load-bearing: if it stops being sent, paywall routing
 * silently degrades to a dead-end error message for everyone, with no crash
 * and no error to notice. Hence these tests.
 *
 * See src/app/core/entitlements.py (`_client_can_handle_subscription_code`).
 */

import { APP_VERSION } from '@constants/config';

import { BaseApiService } from './base';

/**
 * Subclass exposing the protected makeRequest, matching base.test.ts.
 * Calling the protected member directly compiles under ts-jest but fails
 * `tsc --noEmit`, which CI should be able to run clean.
 */
class TestApiService extends BaseApiService {
  public call<T = any>(
    endpoint: string,
    requiresAuth = true,
    extraHeaders?: Record<string, string>,
  ) {
    return this.makeRequest<T>(endpoint, 'GET', undefined, requiresAuth, extraHeaders);
  }
}

jest.mock('@services/tokenManager', () => ({
  tokenManager: { getValidToken: jest.fn().mockResolvedValue('tok') },
}));
jest.mock('@services/authEvents', () => ({
  authEvents: {
    emitSessionExpired: jest.fn(),
    emitSubscriptionRequired: jest.fn(),
    isSubscriptionRedirectInFlight: jest.fn(() => false),
  },
}));

global.fetch = jest.fn();

const okResponse = () => ({
  ok: true,
  status: 200,
  json: async () => ({ success: true }),
  headers: { get: () => null },
});

/** Headers from the most recent fetch call, lower-cased for comparison. */
const sentHeaders = (): Record<string, string> => {
  const calls = (global.fetch as jest.Mock).mock.calls;
  const init = calls[calls.length - 1][1] ?? {};
  const out: Record<string, string> = {};
  Object.entries(init.headers ?? {}).forEach(([k, v]) => {
    out[k.toLowerCase()] = String(v);
  });
  return out;
};

describe('X-App-Version header', () => {
  let service: TestApiService;

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue(okResponse());
    service = new TestApiService();
  });

  it('is sent on an authenticated request', async () => {
    await service.call('/api/anything');

    expect(sentHeaders()['x-app-version']).toBe(APP_VERSION);
  });

  it('is sent on an unauthenticated request too', async () => {
    // The entitlement guard is auth-only today, but the header is about
    // identifying the build, not the user — it should never depend on login.
    await service.call('/api/public', false);

    expect(sentHeaders()['x-app-version']).toBe(APP_VERSION);
  });

  it('is a non-empty version string', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+/);
  });

  it('does not clobber Content-Type', async () => {
    await service.call('/api/anything');

    expect(sentHeaders()['content-type']).toBe('application/json');
  });

  it('can still be overridden by an explicit extra header', async () => {
    // Keeps the escape hatch open for tooling that needs to impersonate a
    // version, without special-casing it in the service.
    await service.call('/api/anything', true, { 'X-App-Version': '9.9.9' });

    expect(sentHeaders()['x-app-version']).toBe('9.9.9');
  });
});
