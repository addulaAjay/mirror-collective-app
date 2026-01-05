import { renderHook, act } from '@testing-library/react-native';

import { chatApiService } from '@services/api';

import { useChat } from './useChat';


// Mock the chat API service
jest.mock('../../services/api', () => ({
  chatApiService: {
    sendMessage: jest.fn(),
  },
  sessionApiService: {
    getGreeting: jest.fn().mockResolvedValue({ success: true, data: { greeting_message: 'The Mirror reflects…' } }),
  },
}));

jest.mock('../../services/sessionManager', () => ({
  SessionManager: {
    generateNewSession: jest.fn(),
    getCurrentSessionId: jest.fn().mockResolvedValue('test-session-id'),
    getConversationId: jest.fn().mockResolvedValue('test-conversation-id'),
    setConversationId: jest.fn(),
  },
}));

describe('useChat', () => {
  const mockChatApiService = chatApiService as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with default system message', async () => {
    const { result } = renderHook(() => useChat());
    
    // Trigger initialization manually if it's not in useEffect, or wait for it
    await act(async () => {
      await result.current.initializeSession();
    });

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
    await act(async () => { await result.current.initializeSession(); });
    
    await act(async () => {
      await result.current.sendMessage();
    });
    
    expect(mockChatApiService.sendMessage).not.toHaveBeenCalled();
    expect(result.current.messages).toHaveLength(1); // Only initial message
  });

  it('does not send message with only whitespace', async () => {
    const { result } = renderHook(() => useChat());
    await act(async () => { await result.current.initializeSession(); });
    
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
      data: { response: 'API response', session_metadata: { conversation_id: 'cid' } },
    };
    
    mockChatApiService.sendMessage.mockResolvedValue(mockResponse);
    
    const { result } = renderHook(() => useChat());
    await act(async () => { await result.current.initializeSession(); });
    
    act(() => {
      result.current.setDraft('Hello');
    });
    
    await act(async () => {
      await result.current.sendMessage();
    });
    
    expect(mockChatApiService.sendMessage).toHaveBeenCalledWith({
      message: 'Hello',
      session_id: 'test-session-id',
      conversation_id: 'test-conversation-id',
      include_archetype_analysis: true,
      use_enhanced_response: true,
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
    await act(async () => { await result.current.initializeSession(); });
    
    act(() => {
      result.current.setDraft('Hello');
    });
    
    await act(async () => {
      await result.current.sendMessage();
    });
    
    expect(result.current.messages).toHaveLength(3);
    // Expect key because of mocked t function
    expect(result.current.messages[2].text).toBe('apiErrors.Server error'); 
    expect(result.current.messages[2].sender).toBe('system');
    expect(result.current.loading).toBe(false);
  });

  it('handles network error', async () => {
    mockChatApiService.sendMessage.mockRejectedValue(new Error('Network error'));
    
    const { result } = renderHook(() => useChat());
    await act(async () => { await result.current.initializeSession(); });
    
    act(() => {
      result.current.setDraft('Hello');
    });
    
    await act(async () => {
      await result.current.sendMessage();
    });
    
    expect(result.current.messages).toHaveLength(3);
    // Expect key because of mocked t function and apiErrorUtils logic
    expect(result.current.messages[2].text).toBe('apiErrors.NetworkError');
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
    
    // Start sending message but don't await the promise inside act yet
    // to allow checking intermediate state
    let sendPromise: Promise<void>;
    await act(async () => {
      sendPromise = result.current.sendMessage();
    });
    
    // Check loading state is true during API call
    expect(result.current.loading).toBe(true);
    
    // Resolve the promise
    await act(async () => {
      resolvePromise!({ success: true, data: { reply: 'Response' } });
      await sendPromise;
    });
    
    expect(result.current.loading).toBe(false);
  });

  it('clears all messages', async () => {
    const { result } = renderHook(() => useChat());
    await act(async () => { await result.current.initializeSession(); });
    
    // Add some messages first
    act(() => {
      result.current.setDraft('Hello');
    });
    
    // We don't need to send, just clear local state?
    // But clearMessages resets to greeting.
    act(() => {
      result.current.clearMessages();
    });
    
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].text).toBe('The Mirror reflects…');
    expect(result.current.messages[0].sender).toBe('system');
  });
});