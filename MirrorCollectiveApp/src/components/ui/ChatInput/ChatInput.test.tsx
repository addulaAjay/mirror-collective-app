import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';


import { ChatInput } from './ChatInput';

describe('ChatInput', () => {
  const mockOnChangeText = jest.fn();
  const mockOnSend = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default placeholder', () => {
    const { getByPlaceholderText } = render(
      <ChatInput
        value=""
        onChangeText={mockOnChangeText}
        onSend={mockOnSend}
      />
    );
    
    expect(getByPlaceholderText('Ask me anything...')).toBeTruthy();
  });

  it('renders with custom placeholder', () => {
    const { getByPlaceholderText } = render(
      <ChatInput
        value=""
        onChangeText={mockOnChangeText}
        onSend={mockOnSend}
        placeholder="Type your message..."
      />
    );
    
    expect(getByPlaceholderText('Type your message...')).toBeTruthy();
  });

  it('displays the input value correctly', () => {
    const { getByDisplayValue } = render(
      <ChatInput
        value="Hello world"
        onChangeText={mockOnChangeText}
        onSend={mockOnSend}
      />
    );
    
    expect(getByDisplayValue('Hello world')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const { getByPlaceholderText } = render(
      <ChatInput
        value=""
        onChangeText={mockOnChangeText}
        onSend={mockOnSend}
      />
    );
    
    const input = getByPlaceholderText('Ask me anything...');
    fireEvent.changeText(input, 'New message');
    
    expect(mockOnChangeText).toHaveBeenCalledWith('New message');
  });

  it('calls onSend when send button is pressed', () => {
    const { getByTestId } = render(
      <ChatInput
        value="Test message"
        onChangeText={mockOnChangeText}
        onSend={mockOnSend}
      />
    );
    
    const sendButton = getByTestId('send-button');
    fireEvent.press(sendButton);
    
    expect(mockOnSend).toHaveBeenCalled();
  });

  it('keeps the input editable while disabled (only send button blocks)', () => {
    // Intentional contract: when the parent screen is loading a response,
    // it sets disabled=true to block duplicate submits. The TextInput stays
    // editable so the user can type their next message — toggling editable
    // on a focused TextInput dismisses the iOS keyboard, which broke the
    // chat UX (keyboard closed on every send). Matches the ChatGPT /
    // Claude / iMessage pattern.
    const { getByPlaceholderText, getByTestId } = render(
      <ChatInput
        value="some draft"
        onChangeText={mockOnChangeText}
        onSend={mockOnSend}
        disabled={true}
      />
    );

    const input = getByPlaceholderText('Ask me anything...');
    // editable is undefined by default (no longer toggled by disabled);
    // RN TextInput treats undefined as truthy / editable.
    expect(input.props.editable).not.toBe(false);

    // The send button still blocks submits while disabled (TouchableOpacity
    // with disabled={true} won't fire onPress at runtime — testing-library's
    // fireEvent.press bypasses the disabled gate, so we assert on the prop
    // directly instead).
    const sendButton = getByTestId('send-button');
    expect(sendButton.props.accessibilityState?.disabled ?? sendButton.props.disabled).toBe(true);
  });

  it('disables send button when input is empty', () => {
    const { getByTestId } = render(
      <ChatInput
        value=""
        onChangeText={mockOnChangeText}
        onSend={mockOnSend}
      />
    );
    
    const sendButton = getByTestId('send-button');
    expect(sendButton.props.disabled).toBe(true);
  });

  it('enables send button when input has text', () => {
    const { getByTestId } = render(
      <ChatInput
        value="Hello"
        onChangeText={mockOnChangeText}
        onSend={mockOnSend}
      />
    );
    
    const sendButton = getByTestId('send-button');
    expect(sendButton.props.disabled).toBe(false);
  });

  it('disables send button when input only has whitespace', () => {
    const { getByTestId } = render(
      <ChatInput
        value="   "
        onChangeText={mockOnChangeText}
        onSend={mockOnSend}
      />
    );
    
    const sendButton = getByTestId('send-button');
    expect(sendButton.props.disabled).toBe(true);
  });
});