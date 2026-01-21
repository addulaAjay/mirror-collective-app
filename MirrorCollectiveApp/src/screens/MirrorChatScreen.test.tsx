import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { useChat } from '@hooks/useChat';

import { MirrorChatContent } from './MirrorChatScreen';

// Robust mocks using functional components
jest.mock('@components/LogoHeader', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: () => <View testID="logo-header" />,
  };
});

jest.mock('react-native-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, ...props }: any) => <View testID="linear-gradient" {...props}>{children}</View>,
  };
});

// Mock child components that might have complex logic/rendering
jest.mock('@components/ui', () => {
  const { Text, TextInput, TouchableOpacity, View } = require('react-native');
  
  return {
    MessageBubble: ({ message }: { message: any }) => (
      <View testID={`message-${message.id}`}>
        <Text>{message.text}</Text>
      </View>
    ),
    ChatInput: ({ value, onChangeText, onSend, disabled }: any) => {
      return (
        <View>
          <TextInput
            testID="chat-input"
            value={value}
            onChangeText={onChangeText}
            editable={!disabled}
          />
          <TouchableOpacity testID="send-button" onPress={onSend} disabled={disabled}>
            <Text>Send</Text>
          </TouchableOpacity>
        </View>
      );
    },
    LoadingIndicator: () => <View testID="loading-indicator" />,
  };
});

// Mock dependencies
jest.mock('@hooks/useChat', () => ({
  useChat: jest.fn(),
}));

describe('MirrorChatScreen', () => {
  const mockMessages = [
    { id: '1', text: 'Hello user', sender: 'system' },
    { id: '2', text: 'Hi system', sender: 'user' },
  ];

  const mockUseChat = {
    messages: mockMessages,
    draft: '',
    loading: false,
    greetingLoaded: true,
    scrollViewRef: { current: { scrollToEnd: jest.fn() } },
    initializeSession: jest.fn(),
    sendMessage: jest.fn(),
    setDraft: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useChat as jest.Mock).mockReturnValue(mockUseChat);
  });

  it('renders messages correctly', () => {
    const { getByText } = render(<MirrorChatContent />);

    expect(getByText('Hello user')).toBeTruthy();
    expect(getByText('Hi system')).toBeTruthy();
    expect(getByText('MirrorGPT')).toBeTruthy();
  });

  it('initializes session if greeting not loaded', () => {
    (useChat as jest.Mock).mockReturnValue({
      ...mockUseChat,
      greetingLoaded: false,
    });

    render(<MirrorChatContent />);
    expect(mockUseChat.initializeSession).toHaveBeenCalled();
  });

  it('does not initialize session if greeting already loaded', () => {
    render(<MirrorChatContent />);
    expect(mockUseChat.initializeSession).not.toHaveBeenCalled();
  });

  it('handles input text change', () => {
    const { getByTestId } = render(<MirrorChatContent />);
    const input = getByTestId('chat-input');

    fireEvent.changeText(input, 'New message');
    expect(mockUseChat.setDraft).toHaveBeenCalledWith('New message');
  });

  it('sends message when send button pressed', () => {
    const { getByTestId } = render(<MirrorChatContent />);
    const button = getByTestId('send-button');

    fireEvent.press(button);
    expect(mockUseChat.sendMessage).toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    (useChat as jest.Mock).mockReturnValue({
      ...mockUseChat,
      loading: true,
    });

    const { getByTestId } = render(<MirrorChatContent />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('disables input when loading', () => {
    (useChat as jest.Mock).mockReturnValue({
      ...mockUseChat,
      loading: true,
    });

    const { getByTestId } = render(<MirrorChatContent />);
    const button = getByTestId('send-button');
    
    // In our mock, disabled prop is passed to TouchableOpacity
    expect(button.props.disabled).toBe(true);
  });
});
