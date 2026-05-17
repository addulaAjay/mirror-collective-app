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

  // -------------------------------------------------------------------------
  // Pagination contract (PR: feat/echo-pagination-contract)
  // The backend's list endpoints now accept ?limit=&cursor= and return
  // next_cursor. Legacy callers (getEchoes / getInboxEchoes / etc) keep
  // their "return one flat array" contract — internally they loop through
  // pages until next_cursor is null.
  // -------------------------------------------------------------------------
  describe('pagination — full-list helpers', () => {
    it('getEchoes loops through pages until next_cursor is null', async () => {
      const page1: EchoResponse[] = [
        { echo_id: 'e1' } as EchoResponse,
        { echo_id: 'e2' } as EchoResponse,
      ];
      const page2: EchoResponse[] = [{ echo_id: 'e3' } as EchoResponse];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: page1,
            next_cursor: 'cursor-page2',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: page2,
            next_cursor: null,
          }),
        });

      const result = await echoApiService.getEchoes();

      expect(global.fetch).toHaveBeenCalledTimes(2);
      // First call: no cursor query param, just limit
      const firstUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(firstUrl).toContain('/api/echoes');
      expect(firstUrl).toContain('limit=100');
      expect(firstUrl).not.toContain('cursor=');
      // Second call: cursor from first response
      const secondUrl = (global.fetch as jest.Mock).mock.calls[1][0] as string;
      expect(secondUrl).toContain('cursor=cursor-page2');
      // Combined data
      expect(result.data).toEqual([...page1, ...page2]);
    });

    it('getEchoes stops at the first page when next_cursor is null', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [{ echo_id: 'only-one' }],
          next_cursor: null,
        }),
      });

      const result = await echoApiService.getEchoes();
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.data).toHaveLength(1);
    });

    it('getInboxEchoes loops through pages and unwraps legacy data.echoes shape', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            // older backend may have wrapped under data.echoes — the
            // extractor still resolves this shape.
            data: { echoes: [{ echo_id: 'i1' }] },
            next_cursor: 'cur',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [{ echo_id: 'i2' }],
            next_cursor: null,
          }),
        });

      const result = await echoApiService.getInboxEchoes();
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.data).toEqual([{ echo_id: 'i1' }, { echo_id: 'i2' }]);
    });
  });

  describe('pagination — single-page helpers', () => {
    it('getEchoesPage passes limit and cursor through and returns nextCursor', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [{ echo_id: 'a' }, { echo_id: 'b' }],
          next_cursor: 'page-2-cursor',
        }),
      });

      const result = await echoApiService.getEchoesPage({
        limit: 25,
        cursor: 'prev-cursor',
      });

      const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('limit=25');
      expect(url).toContain('cursor=prev-cursor');
      expect(result.data?.items).toHaveLength(2);
      expect(result.data?.nextCursor).toBe('page-2-cursor');
    });

    it('getEchoesPage clamps limit to 100 even if caller asks for more', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [], next_cursor: null }),
      });

      await echoApiService.getEchoesPage({ limit: 500 });

      const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('limit=100');
      expect(url).not.toContain('limit=500');
    });

    it('getRecipientsPage and getGuardiansPage hit the right endpoints', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [], next_cursor: null }),
      });

      await echoApiService.getRecipientsPage({ limit: 10 });
      await echoApiService.getGuardiansPage({ limit: 10 });

      const calls = (global.fetch as jest.Mock).mock.calls;
      expect(calls[0][0]).toContain('/api/recipients');
      expect(calls[1][0]).toContain('/api/guardians');
    });
  });
});
