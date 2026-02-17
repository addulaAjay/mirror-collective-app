import AsyncStorage from '@react-native-async-storage/async-storage';

import { tokenManager } from './tokenManager';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock authApiService
jest.mock('./api', () => ({
  authApiService: {
    refreshToken: jest.fn(),
  },
}));

describe('tokenManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAccessToken', () => {
    it('returns token from AsyncStorage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('test-access-token');
      
      const token = await tokenManager.getAccessToken();
      
      expect(token).toBe('test-access-token');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('accessToken');
    });

    it('returns null if no token stored', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      
      const token = await tokenManager.getAccessToken();
      
      expect(token).toBeNull();
    });
  });

  describe('storeTokens', () => {
    it('stores tokens in AsyncStorage', async () => {
      await tokenManager.storeTokens({
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        expiresIn: 3600,
      });

      expect(AsyncStorage.multiSet).toHaveBeenCalledWith([
        ['accessToken', 'access-123'],
        ['refreshToken', 'refresh-456'],
        expect.arrayContaining([expect.stringContaining('tokenExpiry')]),
        ['isAuthenticated', 'true'],
      ]);
    });
  });

  describe('clearTokens', () => {
    it('removes all tokens from AsyncStorage', async () => {
      await tokenManager.clearTokens();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        'accessToken',
        'refreshToken',
        'tokenExpiry',
        'isAuthenticated',
      ]);
    });
  });

  describe('isTokenExpired', () => {
    it('returns true if no expiry set', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      
      const expired = await tokenManager.isTokenExpired();
      
      expect(expired).toBe(true);
    });

    it('returns true if token expires within 5 minutes', async () => {
      const nearFuture = Date.now() + (4 * 60 * 1000); // 4 minutes from now
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(nearFuture.toString());
      
      const expired = await tokenManager.isTokenExpired();
      
      expect(expired).toBe(true);
    });

    it('returns false if token expires after 5 minutes', async () => {
      const farFuture = Date.now() + (10 * 60 * 1000); // 10 minutes from now
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(farFuture.toString());
      
      const expired = await tokenManager.isTokenExpired();
      
      expect(expired).toBe(false);
    });
  });

  describe('isAuthenticated', () => {
    it('returns false if not authenticated', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      
      const isAuth = await tokenManager.isAuthenticated();
      
      expect(isAuth).toBe(false);
    });

    it('returns true with valid unexpired token', async () => {
      const farFuture = Date.now() + (30 * 60 * 1000); // 30 minutes from now
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce('true') // isAuthenticated
        .mockResolvedValueOnce('valid-token') // accessToken
        .mockResolvedValueOnce(farFuture.toString()); // tokenExpiry
      
      const isAuth = await tokenManager.isAuthenticated();
      
      expect(isAuth).toBe(true);
    });
  });

  describe('getAuthHeaders', () => {
    it('returns headers with bearer token', async () => {
      const farFuture = Date.now() + (30 * 60 * 1000);
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce('valid-token-123')
        .mockResolvedValueOnce(farFuture.toString());
      
      const headers = await tokenManager.getAuthHeaders();
      
      expect(headers).toEqual({
        Authorization: 'Bearer valid-token-123',
        'Content-Type': 'application/json',
      });
    });

    it('returns basic headers without token', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      
      const headers = await tokenManager.getAuthHeaders();
      
      expect(headers).toEqual({
        'Content-Type': 'application/json',
      });
    });
  });
});
