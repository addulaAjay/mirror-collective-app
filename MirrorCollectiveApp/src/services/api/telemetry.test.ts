/**
 * Tests for the paywall_view beacon helper.
 *
 * Covers the contract the screens depend on:
 *   - Posts to /api/telemetry/paywall-view with auth
 *   - Sends the surface tag when provided
 *   - Swallows errors silently (fire-and-forget — must never bubble
 *     out of useEffect into the screen render)
 *
 * Mocks follow the same shape as src/services/api/echo.test.ts so
 * BaseApiService can construct cleanly under jest (its real
 * dependencies — tokenManager, authEvents — pull in native modules
 * that don't run in the test env).
 */

jest.mock('@services/tokenManager', () => ({
  tokenManager: {
    storeTokens: jest.fn(),
    clearTokens: jest.fn(),
    isAuthenticated: jest.fn(),
    getValidToken: jest.fn().mockResolvedValue('mock-token'),
  },
}));

jest.mock('@services/authEvents', () => ({
  authEvents: {
    emitSessionExpired: jest.fn(),
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

global.fetch = jest.fn();

import { telemetryApiService } from './telemetry';

beforeEach(() => {
  jest.clearAllMocks();
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    status: 204,
    json: async () => ({}),
    text: async () => '',
  });
});

describe('telemetryApiService.firePaywallView', () => {
  it('POSTs to /api/telemetry/paywall-view with the surface tag', async () => {
    await telemetryApiService.firePaywallView('start_trial');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/telemetry/paywall-view');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ surface: 'start_trial' });
    // BaseApiService.makeRequest with requiresAuth=true attaches the
    // bearer token — the mocked tokenManager returns 'mock-token'.
    expect(init.headers.Authorization).toBe('Bearer mock-token');
  });

  it('POSTs an empty body when no surface is provided', async () => {
    await telemetryApiService.firePaywallView();
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    // Empty body lets the backend default ('start_trial') apply.
    expect(JSON.parse(init.body)).toEqual({});
  });

  it('supports the echo_vault_upsell surface', async () => {
    await telemetryApiService.firePaywallView('echo_vault_upsell');
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ surface: 'echo_vault_upsell' });
  });

  it('never throws when the request fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network down'));
    // Must not throw — telemetry is fire-and-forget; a transport hiccup
    // would otherwise propagate out of the screen's useEffect.
    await expect(
      telemetryApiService.firePaywallView('start_trial'),
    ).resolves.toBeUndefined();
  });
});
