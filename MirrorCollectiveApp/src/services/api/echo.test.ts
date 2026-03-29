import { echoApiService, EchoResponse } from './echo';

// Mock dependencies
jest.mock('@services/tokenManager', () => ({
  tokenManager: {
    storeTokens: jest.fn(),
    clearTokens: jest.fn(),
    isAuthenticated: jest.fn(),
    getValidToken: jest.fn().mockResolvedValue('mock-token'),
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

// Mock fetch
global.fetch = jest.fn();

describe('EchoApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });
  });

  describe('getEchoes', () => {
    it('fetches user created echoes from /api/echoes', async () => {
      const mockEchoes: EchoResponse[] = [
        {
          echo_id: '1',
          title: 'My Echo',
          category: 'Memory',
          echo_type: 'TEXT',
          created_at: '2026-03-29T00:00:00Z',
          content: 'Test content',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockEchoes }),
      });

      const result = await echoApiService.getEchoes();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/echoes'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('getInboxEchoes', () => {
    it('fetches received echoes from /api/echoes/inbox', async () => {
      const mockInboxEchoes: EchoResponse[] = [
        {
          echo_id: '1',
          title: 'From Mom',
          category: 'Memory',
          echo_type: 'TEXT',
          created_at: '2026-03-29T00:00:00Z',
          content: 'Love you',
          recipient: {
            recipient_id: 'r1',
            name: 'Me',
            email: 'me@example.com',
            motif: '❤️',
          },
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockInboxEchoes }),
      });

      await echoApiService.getInboxEchoes();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/echoes/inbox'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('handles empty inbox', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await echoApiService.getInboxEchoes();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/echoes/inbox'),
        expect.any(Object)
      );
    });

    it('handles API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      await echoApiService.getInboxEchoes();

      expect(global.fetch).toHaveBeenCalled();
    });

    it('requires authentication', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await echoApiService.getInboxEchoes();

      // Verify that the request includes authentication header
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Bearer'),
          }),
        })
      );
    });
  });
});
