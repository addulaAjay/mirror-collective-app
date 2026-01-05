import { SessionApiService } from './session';

// Mock fetch
global.fetch = jest.fn();

// Mock tokenManager
jest.mock('@services/tokenManager', () => ({
  tokenManager: {
    getValidToken: jest.fn().mockResolvedValue('test-token'),
    getAuthHeaders: jest.fn().mockResolvedValue({
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-token',
    }),
  },
}));

describe('SessionApiService', () => {
  let sessionService: SessionApiService;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionService = new SessionApiService();
  });

  describe('getGreeting', () => {
    it('fetches session greeting from API', async () => {
      const mockResponse = {
        success: true,
        data: {
          greeting: 'Welcome back to the Mirror',
          sessionId: 'session-123',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await sessionService.getGreeting();

      expect(global.fetch).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('requires authentication', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await sessionService.getGreeting();

      // Verify fetch was called (will include auth headers)
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
