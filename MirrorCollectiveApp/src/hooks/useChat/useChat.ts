import { useState, useRef } from 'react';
import { ScrollView } from 'react-native';
import { chatApiService } from '../../services/api';
import type { Message, ConversationHistoryItem } from '../../types';

/**
 * Custom hook for managing chat functionality
 */
const createMessage = (text: string, sender: 'user' | 'system'): Message => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  text,
  sender,
  timestamp: new Date(),
});

const messagesToConversationHistory = (messages: Message[]): ConversationHistoryItem[] =>
  messages.map(m => ({
    role: m.sender === 'user' ? 'user' : 'system',
    content: m.text,
  }));

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    createMessage('The Mirror reflects…', 'system'),
  ]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  /**
   * Send a message to the chat API
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
      // 2) Convert messages to conversation history and send to API
      const conversationHistory = messagesToConversationHistory(messages);
      const response = await chatApiService.sendMessage({
        message: text,
        conversationHistory,
      });

      // 3) Handle API response
      if (response.success && response.data?.reply) {
        const systemMessage = createMessage(response.data.reply, 'system');
        setMessages(msgs => [...msgs, systemMessage]);
      } else {
        // Handle API error response
        const errorMessage = createMessage(
          '❗️ Unexpected response from the server.',
          'system'
        );
        setMessages(msgs => [...msgs, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Handle network/unexpected errors
      const errorMessage = createMessage(
        '❗️ Network error, please try again.',
        'system'
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
    scrollViewRef,

    // Actions
    sendMessage,
    setDraft,
    scrollToBottom,
    clearDraft,
    clearMessages,
  };
};
