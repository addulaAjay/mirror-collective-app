import { render } from '@testing-library/react-native';
import React from 'react';

import { TypingIndicator } from './TypingIndicator';

describe('TypingIndicator', () => {
  it('renders the typing bubble with three dots', () => {
    const { getByTestId } = render(<TypingIndicator />);

    expect(getByTestId('typing-indicator')).toBeTruthy();
    expect(getByTestId('typing-dot-0')).toBeTruthy();
    expect(getByTestId('typing-dot-1')).toBeTruthy();
    expect(getByTestId('typing-dot-2')).toBeTruthy();
  });

  it('exposes an accessible label for screen readers', () => {
    const { getByLabelText } = render(<TypingIndicator />);

    expect(getByLabelText('MirrorGPT is thinking')).toBeTruthy();
  });
});
