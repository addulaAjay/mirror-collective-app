import { SoulPingApiService } from './soulPing';

global.fetch = jest.fn();

jest.mock('@services/tokenManager', () => ({
  tokenManager: {
    getValidToken: jest.fn().mockResolvedValue('test-token'),
    getAuthHeaders: jest.fn().mockResolvedValue({
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-token',
    }),
  },
}));

describe('SoulPingApiService', () => {
  let service: SoulPingApiService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SoulPingApiService();
  });

  it('POSTs to the mark-read endpoint with the ping id', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, ping_id: 'ping-123' }),
    });

    const result = await service.markRead('ping-123');

    expect(global.fetch).toHaveBeenCalled();
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(String(url)).toContain('/api/soul-pings/ping-123/read');
    expect(init.method).toBe('POST');
    expect(result.success).toBe(true);
  });

  it('encodes the ping id in the path', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    await service.markRead('a/b');

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(String(url)).toContain('/api/soul-pings/a%2Fb/read');
  });

  it('sends an authenticated request', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    await service.markRead('ping-123');

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer test-token');
  });
});
