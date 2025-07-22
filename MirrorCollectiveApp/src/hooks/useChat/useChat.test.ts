import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-native';
import { useChat } from './useChat';
import { chatApiService } from '../../services/api';

// Mock the chat API service
vi.mock('../../services/api', () => ({
  chatApiService: {
    sendMessage: vi.fn(),
  },
}));

describe('useChat', () => {
  const mockChatApiService = chatApiService as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default system message', () => {
    const { result } = renderHook(() => useChat());
    
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].text).toBe('The Mirror reflects…');
    expect(result.current.messages[0].sender).toBe('system');
    expect(result.current.draft).toBe('');
    expect(result.current.loading).toBe(false);
  });

  it('updates draft message when setDraft is called', () => {
    const { result } = renderHook(() => useChat());
    
    act(() => {
      result.current.setDraft('Hello world');
    });
    
    expect(result.current.draft).toBe('Hello world');
  });

  it('clears draft message', () => {
    const { result } = renderHook(() => useChat());
    
    act(() => {
      result.current.setDraft('Hello');
      result.current.clearDraft();
    });
    
    expect(result.current.draft).toBe('');
  });

  it('does not send empty message', async () => {
    const { result } = renderHook(() => useChat());
    
    await act(async () => {
      await result.current.sendMessage();
    });
    
    expect(mockChatApiService.sendMessage).not.toHaveBeenCalled();
    expect(result.current.messages).toHaveLength(1); // Only initial message
  });

  it('does not send message with only whitespace', async () => {
    const { result } = renderHook(() => useChat());
    
    act(() => {
      result.current.setDraft('   ');
    });
    
    await act(async () => {
      await result.current.sendMessage();
    });
    
    expect(mockChatApiService.sendMessage).not.toHaveBeenCalled();
    expect(result.current.messages).toHaveLength(1);
  });

  it('sends message and handles successful response', async () => {
    const mockResponse = {
      success: true,
      data: { reply: 'API response' },
    };
    
    mockChatApiService.sendMessage.mockResolvedValue(mockResponse);
    
    const { result } = renderHook(() => useChat());
    
    act(() => {
      result.current.setDraft('Hello');
    });
    
    await act(async () => {
      await result.current.sendMessage();
    });
    
    expect(mockChatApiService.sendMessage).toHaveBeenCalledWith({
      message: 'Hello',
      conversationHistory: [{
        role: 'system',
        content: '🌜The Mirror reflects…',
      }],
    });
    
    expect(result.current.messages).toHaveLength(3); // Initial + user + system response
    expect(result.current.messages[1].text).toBe('Hello');
    expect(result.current.messages[1].sender).toBe('user');
    expect(result.current.messages[2].text).toBe('API response');
    expect(result.current.messages[2].sender).toBe('system');
    expect(result.current.draft).toBe('');
    expect(result.current.loading).toBe(false);
  });

  it('handles API error response', async () => {
    const mockResponse = {
      success: false,
      error: 'Server error',
    };
    
    mockChatApiService.sendMessage.mockResolvedValue(mockResponse);
    
    const { result } = renderHook(() => useChat());
    
    act(() => {
      result.current.setDraft('Hello');
    });
    
    await act(async () => {
      await result.current.sendMessage();
    });
    
    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[2].text).toBe('❗️ Unexpected response from the server.');
    expect(result.current.messages[2].sender).toBe('system');
    expect(result.current.loading).toBe(false);
  });

  it('handles network error', async () => {
    mockChatApiService.sendMessage.mockRejectedValue(new Error('Network error'));
    
    const { result } = renderHook(() => useChat());
    
    act(() => {
      result.current.setDraft('Hello');
    });
    
    await act(async () => {
      await result.current.sendMessage();
    });
    
    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[2].text).toBe('❗️ Network error, please try again.');
    expect(result.current.messages[2].sender).toBe('system');
    expect(result.current.loading).toBe(false);
  });

  it('sets loading state during API call', async () => {
    let resolvePromise: (value: any) => void;
    const mockPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    mockChatApiService.sendMessage.mockReturnValue(mockPromise);
    
    const { result } = renderHook(() => useChat());
    
    act(() => {
      result.current.setDraft('Hello');
    });
    
    const sendPromise = act(async () => {
      await result.current.sendMessage();
    });
    
    // Check loading state is true during API call
    expect(result.current.loading).toBe(true);
    
    // Resolve the promise
    act(() => {
      resolvePromise!({ success: true, data: { reply: 'Response' } });
    });
    
    await sendPromise;
    
    expect(result.current.loading).toBe(false);
  });

  it('clears all messages', () => {
    const { result } = renderHook(() => useChat());
    
    // Add some messages first
    act(() => {
      result.current.setDraft('Hello');
    });
    
    act(() => {
      result.current.clearMessages();
    });
    
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].text).toBe('The Mirror reflects…');
    expect(result.current.messages[0].sender).toBe('system');
  });
});