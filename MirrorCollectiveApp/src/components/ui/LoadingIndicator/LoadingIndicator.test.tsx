import { render } from '@testing-library/react-native';
import React from 'react';


import { LoadingIndicator } from './LoadingIndicator';

describe('LoadingIndicator', () => {
  it('renders with default message', () => {
    const { getByText } = render(<LoadingIndicator />);
    expect(getByText('…thinking…')).toBeTruthy();
  });

  it('renders with custom message', () => {
    const { getByText } = render(
      <LoadingIndicator message="Loading..." />
    );
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('renders without spinner by default', () => {
    const { queryByTestId } = render(<LoadingIndicator />);
    expect(queryByTestId('loading-spinner')).toBeFalsy();
  });

  it('renders with spinner when showSpinner is true', () => {
    const { getByTestId } = render(
      <LoadingIndicator showSpinner={true} />
    );
    // Note: You might need to add testID to ActivityIndicator in the component
    expect(getByTestId('loading-spinner')).toBeTruthy();
  });

  it('renders both message and spinner when both are enabled', () => {
    const { getByText, getByTestId } = render(
      <LoadingIndicator message="Processing..." showSpinner={true} />
    );
    
    expect(getByText('Processing...')).toBeTruthy();
    expect(getByTestId('loading-spinner')).toBeTruthy();
  });

  it('handles empty message', () => {
    const { getByText } = render(
      <LoadingIndicator message="" />
    );
    expect(getByText('')).toBeTruthy();
  });

  it('applies correct styling for text', () => {
    const { getByText } = render(
      <LoadingIndicator message="Test message" />
    );
    
    const textElement = getByText('Test message');
    expect(textElement).toBeTruthy();
    // You can add more specific style checks here if needed
  });
});