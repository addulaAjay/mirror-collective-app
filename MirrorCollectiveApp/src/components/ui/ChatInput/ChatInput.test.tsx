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
    
    expect(getByPlaceholderText('Ask me something')).toBeTruthy();
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
    
    const input = getByPlaceholderText('Ask me something');
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

  it('disables input when disabled prop is true', () => {
    const { getByPlaceholderText } = render(
      <ChatInput
        value=""
        onChangeText={mockOnChangeText}
        onSend={mockOnSend}
        disabled={true}
      />
    );
    
    const input = getByPlaceholderText('Ask me something');
    expect(input.props.editable).toBe(false);
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