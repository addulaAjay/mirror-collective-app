export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'system';
  timestamp?: Date;
}

export interface ChatResponse {
  success: boolean;
  data?: {
    reply: string;
  };
  error?: string;
}

export interface ConversationHistoryItem {
  role: 'user' | 'system';
  content: string;
}

export interface ChatRequest {
  message: string;
  conversationHistory: ConversationHistoryItem[];
}