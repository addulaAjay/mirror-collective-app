import type { Message } from '@types';
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList } from 'react-native';

import { useUser } from '@context/UserContext';
import { useEntitlement } from '@hooks/useEntitlement';
import { chatApiService, sessionApiService } from '@services/api';
import { SessionManager } from '@services/sessionManager';
import { getApiErrorMessage } from '@utils/apiErrorUtils';

type PaywallReason = 'trial_expired' | 'quota_exceeded';

/**
 * Custom hook for managing chat functionality with MirrorGPT integration
 */
const createMessage = (text: string, sender: 'user' | 'system'): Message => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  text,
  sender,
  timestamp: new Date(),
});

const toFirstNameOnly = (text: string, fullName: string | undefined): string => {
  if (!fullName) return text;
  const firstName = fullName.trim().split(' ')[0];
  const full = fullName.trim();
  if (full === firstName) return text;
  return text.split(full).join(firstName);
};

export const useChat = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const entitlement = useEntitlement();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [greetingLoaded, setGreetingLoaded] = useState(false);
  const [paywallReason, setPaywallReason] = useState<PaywallReason | null>(
    null,
  );
  // FlatList ref. Keeping the old name (`scrollViewRef`) so existing
  // consumers don't break — the screen now uses FlatList with
  // inverted={true}, which delegates scrolling to a native ScrollView
  // anyway, so the contract on the ref (scrollToOffset, etc.) holds.
  const scrollViewRef = useRef<FlatList>(null);

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
        const greetingText = toFirstNameOnly(response.data.greeting_message, user?.fullName);
        const greetingMessage = createMessage(greetingText, 'system');
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

    // Entitlement gate: MirrorGPT is paid after the 14-day trial. We refuse
    // to call the chat API for locked users — both to enforce the paywall
    // and to avoid burning OpenAI cost on users who can't see the response.
    // (See docs/IAP_SUBSCRIPTION_REVIEW.md "Entitlement matrix".)
    //
    // Treat `loading` as locked — during the brief window when
    // SubscriptionContext is hydrating we don't yet know if the user is
    // entitled, and the conservative answer is "no". This matches the
    // fail-closed default in SubscriptionContext (mirror_gpt_enabled
    // defaults to false on mount).
    if (entitlement.loading || !entitlement.entitled) {
      setPaywallReason(entitlement.promptReason);
      return;
    }

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
        const systemMessage = createMessage(toFirstNameOnly(chatResponse.response, user?.fullName), 'system');
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
    // In inverted FlatList, offset 0 is the bottom (newest message).
    scrollViewRef.current?.scrollToOffset({ offset: 0, animated: true });
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

  const dismissPaywall = () => setPaywallReason(null);

  return {
    // State
    messages,
    draft,
    loading,
    greetingLoaded,
    scrollViewRef,
    paywallReason,
    quotaInfo:
      paywallReason === 'quota_exceeded'
        ? { usage_gb: entitlement.usedGb, quota_gb: entitlement.quotaGb }
        : undefined,

    // Actions
    initializeSession,
    sendMessage,
    setDraft,
    scrollToBottom,
    clearDraft,
    clearMessages,
    dismissPaywall,
  };
};
