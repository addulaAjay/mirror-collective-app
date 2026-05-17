import { tokenManager } from '@services/tokenManager';

import { AuthApiService } from './auth';

// Mock dependencies
jest.mock('@services/tokenManager', () => ({
  tokenManager: {
    storeTokens: jest.fn(),
    clearTokens: jest.fn(),
    isAuthenticated: jest.fn(),
    getValidToken: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('AuthApiService', () => {
  let authService: AuthApiService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthApiService();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  describe('storeTokens', () => {
    it('delegates to tokenManager', async () => {
      const tokens = { accessToken: 'access', refreshToken: 'refresh' };
      
      await authService.storeTokens(tokens);
      
      expect(tokenManager.storeTokens).toHaveBeenCalledWith(tokens);
    });
  });

  describe('clearTokens', () => {
    it('delegates to tokenManager', async () => {
      await authService.clearTokens();
      
      expect(tokenManager.clearTokens).toHaveBeenCalled();
    });
  });

  describe('isAuthenticated', () => {
    it('delegates to tokenManager', async () => {
      (tokenManager.isAuthenticated as jest.Mock).mockResolvedValueOnce(true);

      const result = await authService.isAuthenticated();

      expect(result).toBe(true);
      expect(tokenManager.isAuthenticated).toHaveBeenCalled();
    });
  });

  describe('signOut', () => {
    it('POSTs to /api/auth/logout (not the legacy /auth/logout path)', async () => {
      (tokenManager.getValidToken as jest.Mock).mockResolvedValueOnce(
        'mock-jwt-token',
      );

      await authService.signOut();

      // Verify the URL includes the /api prefix that matches the backend
      // router mount (app.include_router(api_router, prefix="/api")).
      // The prior /auth/logout was a 404 — tokens cleared client-side but
      // Cognito session never invalidated server-side.
      expect(global.fetch).toHaveBeenCalled();
      const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
      expect(String(url)).toContain('/api/auth/logout');
      // Regression guard for the previous bare /auth/logout path —
      // strip the base URL first, then check the remainder starts
      // with /api/.
      const path = String(url).replace(/^https?:\/\/[^/]+/, '');
      expect(path.startsWith('/api/auth/logout')).toBe(true);
      expect(init.method).toBe('POST');
    });

    it('clears tokens even when the server call fails', async () => {
      (tokenManager.getValidToken as jest.Mock).mockResolvedValueOnce(
        'mock-jwt-token',
      );
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'boom' }),
      });

      await authService.signOut();

      // Client-side cleanup must run regardless of server outcome — a
      // user tapping "Log out" should ALWAYS see the auth stack again,
      // even if the network is down.
      expect(tokenManager.clearTokens).toHaveBeenCalled();
    });
  });
});
