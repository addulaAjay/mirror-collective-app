# Mirror Chat Architecture

This document describes the clean architecture implementation for the Mirror Chat functionality.

## File Structure

```
src/
├── screens/
│   └── MirrorChatScreen.tsx     # Clean UI component
├── hooks/
│   └── useChat.ts               # Chat state and logic hook
└── services/
    └── chatService.ts           # API communication service
```

## Architecture Overview

### 1. **MirrorChatScreen.tsx**

- **Purpose**: Pure UI component focused only on rendering
- **Responsibilities**:
  - Display chat interface
  - Handle user interactions
  - Delegate business logic to custom hook
- **Dependencies**: `useChat` hook

### 2. **useChat.ts**

- **Purpose**: Custom hook managing chat state and user interactions
- **Responsibilities**:
  - Manage chat messages state
  - Handle user input state
  - Coordinate with chat service
  - Provide UI state (loading, etc.)
- **Dependencies**: `chatService`

### 3. **chatService.ts**

- **Purpose**: API communication and data transformation service
- **Responsibilities**:
  - Handle HTTP requests to chat API
  - Transform data between UI and API formats
  - Error handling and retry logic
  - Message utilities (ID generation, formatting)

## Key Benefits

### ✅ **Separation of Concerns**

- UI logic separated from business logic
- API calls isolated in dedicated service
- State management centralized in custom hook

### ✅ **Testability**

- Each layer can be unit tested independently
- Mock services for testing UI components
- Test hook logic without UI dependencies

### ✅ **Reusability**

- `chatService` can be used in other chat features
- `useChat` hook can be reused in different chat UIs
- Clean, composable architecture

### ✅ **Maintainability**

- Clear responsibilities for each file
- Easy to locate and fix issues
- Consistent error handling patterns

### ✅ **Type Safety**

- Full TypeScript support
- Shared interfaces between layers
- Compile-time error checking

## API Integration

### Environment Configuration

The service automatically detects the environment:

- **Development**: Uses localhost with platform-specific URLs
- **Production**: Configurable production API endpoint

### Error Handling

- Network errors are caught and display user-friendly messages
- Server errors are handled gracefully
- Optimistic UI updates with rollback on failure

### Message Format

```typescript
interface ChatMessage {
  id: string; // Unique message identifier
  text: string; // Message content
  sender: 'user' | 'system'; // Message sender type
}
```

## Usage Example

```tsx
import { useChat } from '../hooks/useChat';

function ChatComponent() {
  const { messages, draft, loading, sendMessage, setDraft } = useChat();

  return (
    // Your chat UI here
  );
}
```

## Future Enhancements

- [ ] Message persistence (local storage)
- [ ] Real-time messaging (WebSocket support)
- [ ] Message reactions and editing
- [ ] File attachments support
- [ ] Chat history pagination
- [ ] Typing indicators
- [ ] Message delivery status
