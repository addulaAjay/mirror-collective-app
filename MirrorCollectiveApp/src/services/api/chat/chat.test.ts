import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatApiService } from '../chat';
import type { ChatRequest } from '../../../types';

// Mock fetch
global.fetch = vi.fn();

describe('ChatApiService', () => {
  let chatService: ChatApiService;
  const mockFetch = fetch as any;

  beforeEach(() => {
    chatService = new ChatApiService();
    vi.clearAllMocks();
  });

  it('sends chat message successfully', async () => {
    const mockRequest: ChatRequest = {
      message: 'Hello',
      conversationHistory: [
        { role: 'user', content: 'Previous message' },
        { role: 'system', content: 'Previous response' },
      ],
    };

    const mockResponse = {
      success: true,
      data: { reply: 'Hello! How can I help you?' },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await chatService.sendMessage(mockRequest);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/mirror-chat'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(mockRequest),
      })
    );

    expect(result.success).toBe(true);
    expect(result.data?.reply).toBe('Hello! How can I help you?');
  });

  it('handles API error response', async () => {
    const mockRequest: ChatRequest = {
      message: 'Hello',
      conversationHistory: [],
    };

    const mockErrorResponse = {
      success: false,
      error: 'Server error',
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => mockErrorResponse,
    });

    await expect(chatService.sendMessage(mockRequest)).rejects.toThrow();
  });

  it('handles network error', async () => {
    const mockRequest: ChatRequest = {
      message: 'Hello',
      conversationHistory: [],
    };

    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(chatService.sendMessage(mockRequest)).rejects.toThrow('Network error');
  });

  it('handles timeout', async () => {
    const mockRequest: ChatRequest = {
      message: 'Hello',
      conversationHistory: [],
    };

    // Mock a hanging request
    mockFetch.mockImplementationOnce(() => new Promise(() => {}));

    await expect(chatService.sendMessage(mockRequest)).rejects.toThrow();
  });

  it('includes correct headers in request', async () => {
    const mockRequest: ChatRequest = {
      message: 'Hello',
      conversationHistory: [],
    };

    const mockResponse = {
      success: true,
      data: { reply: 'Response' },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await chatService.sendMessage(mockRequest);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });
});