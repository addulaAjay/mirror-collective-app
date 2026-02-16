import AsyncStorage from '@react-native-async-storage/async-storage';

import { SessionManager } from './sessionManager';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('SessionManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset static state
    (SessionManager as any).sessionId = null;
    (SessionManager as any).conversationId = null;
  });

  describe('generateNewSession', () => {
    it('generates and stores a new session ID', async () => {
      const sessionId = await SessionManager.generateNewSession();

      expect(sessionId).toMatch(/^session_\d+-[a-z0-9]+$/);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('mirrorgpt_session_id', sessionId);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('mirrorgpt_conversation_id');
    });
  });

  describe('getCurrentSessionId', () => {
    it('returns cached session ID if available', async () => {
      (SessionManager as any).sessionId = 'cached-session';

      const sessionId = await SessionManager.getCurrentSessionId();

      expect(sessionId).toBe('cached-session');
      expect(AsyncStorage.getItem).not.toHaveBeenCalled();
    });

    it('fetches from storage if not cached', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('stored-session');

      const sessionId = await SessionManager.getCurrentSessionId();

      expect(sessionId).toBe('stored-session');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('mirrorgpt_session_id');
    });
  });

  describe('setConversationId', () => {
    it('stores conversation ID', async () => {
      await SessionManager.setConversationId('conv-123');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('mirrorgpt_conversation_id', 'conv-123');
    });
  });

  describe('getConversationId', () => {
    it('returns cached conversation ID if available', async () => {
      (SessionManager as any).conversationId = 'cached-conv';

      const convId = await SessionManager.getConversationId();

      expect(convId).toBe('cached-conv');
    });

    it('fetches from storage if not cached', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('stored-conv');

      const convId = await SessionManager.getConversationId();

      expect(convId).toBe('stored-conv');
    });
  });

  describe('clearSession', () => {
    it('clears both session and conversation', async () => {
      await SessionManager.clearSession();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('mirrorgpt_session_id');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('mirrorgpt_conversation_id');
    });
  });

  describe('clearConversation', () => {
    it('clears only conversation', async () => {
      await SessionManager.clearConversation();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('mirrorgpt_conversation_id');
      expect(AsyncStorage.removeItem).not.toHaveBeenCalledWith('mirrorgpt_session_id');
    });
  });
});
