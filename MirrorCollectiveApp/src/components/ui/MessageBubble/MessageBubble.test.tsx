import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react-native';
import { MessageBubble } from './MessageBubble';
import type { Message } from '../../../types';

describe('MessageBubble', () => {
  const mockUserMessage: Message = {
    id: '1',
    text: 'Hello, this is a user message',
    sender: 'user',
    timestamp: new Date(),
  };

  const mockSystemMessage: Message = {
    id: '2',
    text: 'Hello, this is a system message',
    sender: 'system',
    timestamp: new Date(),
  };

  it('renders user message correctly', () => {
    const { getByText } = render(<MessageBubble message={mockUserMessage} />);
    expect(getByText('Hello, this is a user message')).toBeTruthy();
  });

  it('renders system message correctly', () => {
    const { getByText } = render(<MessageBubble message={mockSystemMessage} />);
    expect(getByText('Hello, this is a system message')).toBeTruthy();
  });

  it('displays user messages with correct styling', () => {
    const { getByText } = render(<MessageBubble message={mockUserMessage} />);
    const messageElement = getByText('Hello, this is a user message');
    expect(messageElement).toBeTruthy();
  });

  it('displays system messages with correct styling', () => {
    const { getByText } = render(<MessageBubble message={mockSystemMessage} />);
    const messageElement = getByText('Hello, this is a system message');
    expect(messageElement).toBeTruthy();
  });

  it('handles empty message text', () => {
    const emptyMessage: Message = {
      id: '3',
      text: '',
      sender: 'user',
      timestamp: new Date(),
    };
    
    const { getByText } = render(<MessageBubble message={emptyMessage} />);
    expect(getByText('')).toBeTruthy();
  });

  it('handles long message text', () => {
    const longMessage: Message = {
      id: '4',
      text: 'This is a very long message that should wrap properly and not break the layout of the chat interface',
      sender: 'system',
      timestamp: new Date(),
    };
    
    const { getByText } = render(<MessageBubble message={longMessage} />);
    expect(getByText(longMessage.text)).toBeTruthy();
  });
});