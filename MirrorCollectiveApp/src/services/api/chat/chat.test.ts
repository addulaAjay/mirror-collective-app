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
      session_id: 'test-session-123',
      conversation_id: null,
      include_archetype_analysis: true,
      use_enhanced_response: true,
    };

    const mockResponse = {
      success: true,
      data: {
        response: 'Hello! How can I help you?',
        session_id: 'test-session-123',
        conversation_id: 'conv-456',
        archetype_analysis: null,
        confidence_breakdown: null,
      },
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
      }),
    );

    expect(result.success).toBe(true);
    expect(result.data?.response).toBe('Hello! How can I help you?');
  });

  it('handles API error response', async () => {
    const mockRequest: ChatRequest = {
      message: 'Hello',
      session_id: 'test-session-123',
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
      session_id: 'test-session-123',
    };

    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(chatService.sendMessage(mockRequest)).rejects.toThrow(
      'Network error',
    );
  });

  it('handles timeout', async () => {
    const mockRequest: ChatRequest = {
      message: 'Hello',
      session_id: 'test-session-123',
    };

    // Mock a hanging request
    mockFetch.mockImplementationOnce(() => new Promise(() => {}));

    await expect(chatService.sendMessage(mockRequest)).rejects.toThrow();
  });

  it('includes correct headers in request', async () => {
    const mockRequest: ChatRequest = {
      message: 'Hello',
      session_id: 'test-session-123',
    };

    const mockResponse = {
      success: true,
      data: {
        response: 'Response',
        session_id: 'test-session-123',
        conversation_id: 'conv-456',
        archetype_analysis: null,
        confidence_breakdown: null,
      },
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
      }),
    );
  });
});
