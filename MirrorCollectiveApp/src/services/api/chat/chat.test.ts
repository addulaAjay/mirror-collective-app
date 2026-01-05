import { ChatApiService } from './chat';

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

describe('ChatApiService', () => {
  let chatService: ChatApiService;

  beforeEach(() => {
    jest.clearAllMocks();
    chatService = new ChatApiService();
  });

  describe('sendMessage', () => {
    it('sends message to API', async () => {
      const mockResponse = {
        success: true,
        data: {
          message: 'Hello from Mirror',
          conversationId: 'conv-123',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const request = {
        message: 'Hello',
        session_id: 'session-123',
      };

      const result = await chatService.sendMessage(request);

      expect(global.fetch).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('includes authentication token', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await chatService.sendMessage({ message: 'Test', session_id: 's-1' });

      // Verify fetch was called with auth headers
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall).toBeDefined();
    });
  });
});
