export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'system';
  timestamp?: Date;
}

// ChatRequest and ChatResponse are now defined in api.ts
// Keeping only the Message interface here for UI components
