import type { Message } from '@types';
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { chatApiService, sessionApiService } from '@services/api';
import { SessionManager } from '@services/sessionManager';
import { getApiErrorMessage } from '@utils/apiErrorUtils';

/**
 * Custom hook for managing chat functionality with MirrorGPT integration
 */
const createMessage = (text: string, sender: 'user' | 'system'): Message => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  text,
  sender,
  timestamp: new Date(),
});

export const useChat = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [greetingLoaded, setGreetingLoaded] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  /**
   * Initialize a new session and get greeting message
   */
  const initializeSession = async () => {
    if (greetingLoaded) return;

    try {
      setLoading(true);

      // Generate new session
      await SessionManager.generateNewSession();

      // Get greeting message
      const response = await sessionApiService.getGreeting();

      if (response.success && response.data?.greeting_message) {
        const greetingMessage = createMessage(
          response.data.greeting_message,
          'system',
        );
        setMessages([greetingMessage]);
        setGreetingLoaded(true);
      } else {
        // Fallback greeting
        const fallbackMessage = createMessage(
          '🌜 The Mirror reflects…',
          'system',
        );
        setMessages([fallbackMessage]);
        setGreetingLoaded(true);
      }
    } catch (error) {
      console.error('Session initialization error:', error);
      // Fallback greeting
      const fallbackMessage = createMessage(
        '🌜 The Mirror reflects…',
        'system',
      );
      setMessages([fallbackMessage]);
      setGreetingLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send a message to the chat API using MirrorGPT format
   */
  const sendMessage = async () => {
    const text = draft.trim();
    if (!text) return;

    // 1) Create and add user message optimistically
    const userMessage = createMessage(text, 'user');
    setMessages(msgs => [...msgs, userMessage]);
    setDraft('');
    setLoading(true);

    try {
      // 2) Get current session and conversation IDs
      const sessionId = await SessionManager.getCurrentSessionId();
      const conversationId = await SessionManager.getConversationId();

      // Ensure we have a session ID
      if (!sessionId) {
        console.error('No session ID available');
        const errorMessage = createMessage(
          t('apiErrors.SessionError'),
          'system',
        );
        setMessages(msgs => [...msgs, errorMessage]);
        return;
      }

      // 3) Send message to API
      const response = await chatApiService.sendMessage({
        message: text,
        session_id: sessionId,
        conversation_id: conversationId,
        include_archetype_analysis: true,
        use_enhanced_response: true,
      });

      // 4) Handle API response
      if (response.success && response.data) {
        const chatResponse = response.data;

        // Store conversation_id from first response if not set
        if (chatResponse.session_metadata?.conversation_id && !conversationId) {
          await SessionManager.setConversationId(
            chatResponse.session_metadata.conversation_id,
          );
        }

        // Create system message with main response
        const systemMessage = createMessage(chatResponse.response, 'system');
        setMessages(msgs => [...msgs, systemMessage]);

        // Add archetype analysis if available
        if (chatResponse.archetype_analysis?.signal_3_archetype_blend) {
          const archetype =
            chatResponse.archetype_analysis.signal_3_archetype_blend;
          const archetypeText = `🔮 Archetype Insights: ${
            archetype.primary
          } (${Math.round(archetype.confidence * 100)}%)${
            archetype.secondary ? `, ${archetype.secondary}` : ''
          }`;
          const archetypeMessage = createMessage(archetypeText, 'system');
          setMessages(msgs => [...msgs, archetypeMessage]);
        }

        // Add suggested practice if available
        if (chatResponse.suggested_practice) {
          const practiceMessage = createMessage(
            `✨ Suggested Practice: ${chatResponse.suggested_practice}`,
            'system',
          );
          setMessages(msgs => [...msgs, practiceMessage]);
        }
      } else {
        // Handle API error response
        const errorMessage = createMessage(
          getApiErrorMessage(response, t),
          'system',
        );
        setMessages(msgs => [...msgs, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Handle network/unexpected errors
      const errorMessage = createMessage(
        getApiErrorMessage(error, t),
        'system',
      );
      setMessages(msgs => [...msgs, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Scroll to the bottom of the chat
   */
  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  /**
   * Clear the draft message
   */
  const clearDraft = () => {
    setDraft('');
  };

  /**
   * Clear all messages (if needed for future functionality)
   */
  const clearMessages = () => {
    setMessages([createMessage('The Mirror reflects…', 'system')]);
  };

  return {
    // State
    messages,
    draft,
    loading,
    greetingLoaded,
    scrollViewRef,

    // Actions
    initializeSession,
    sendMessage,
    setDraft,
    scrollToBottom,
    clearDraft,
    clearMessages,
  };
};
