import { AuthApiService } from './auth';
import { tokenManager } from '@services/tokenManager';

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
});
