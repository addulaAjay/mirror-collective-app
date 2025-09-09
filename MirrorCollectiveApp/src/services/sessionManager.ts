import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_STORAGE_KEY = 'mirrorgpt_session_id';
const CONVERSATION_STORAGE_KEY = 'mirrorgpt_conversation_id';

export class SessionManager {
  private static sessionId: string | null = null;
  private static conversationId: string | null = null;

  /**
   * Generate a new session ID when user enters MirrorGPT screen
   */
  static async generateNewSession(): Promise<string> {
    const sessionId = `session_${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    this.sessionId = sessionId;
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, sessionId);

    // Clear conversation ID when starting new session
    this.conversationId = null;
    await AsyncStorage.removeItem(CONVERSATION_STORAGE_KEY);

    return sessionId;
  }

  /**
   * Get current session ID
   */
  static async getCurrentSessionId(): Promise<string | null> {
    if (this.sessionId) {
      return this.sessionId;
    }

    const storedSessionId = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
    this.sessionId = storedSessionId;
    return storedSessionId;
  }

  /**
   * Set conversation ID (returned from first chat message)
   */
  static async setConversationId(conversationId: string): Promise<void> {
    this.conversationId = conversationId;
    await AsyncStorage.setItem(CONVERSATION_STORAGE_KEY, conversationId);
  }

  /**
   * Get current conversation ID
   */
  static async getConversationId(): Promise<string | null> {
    if (this.conversationId) {
      return this.conversationId;
    }

    const storedConversationId = await AsyncStorage.getItem(
      CONVERSATION_STORAGE_KEY,
    );
    this.conversationId = storedConversationId;
    return storedConversationId;
  }

  /**
   * Clear session data (when user leaves MirrorGPT screen)
   */
  static async clearSession(): Promise<void> {
    this.sessionId = null;
    this.conversationId = null;
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    await AsyncStorage.removeItem(CONVERSATION_STORAGE_KEY);
  }

  /**
   * Clear only conversation (keep session for new conversation)
   */
  static async clearConversation(): Promise<void> {
    this.conversationId = null;
    await AsyncStorage.removeItem(CONVERSATION_STORAGE_KEY);
  }
}

export const sessionManager = new SessionManager();
