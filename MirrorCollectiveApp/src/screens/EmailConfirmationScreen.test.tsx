import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import EmailConfirmationScreen from './EmailConfirmationScreen';

// Mocks
jest.mock('@components/LogoHeader', () => 'LogoHeader');

describe('EmailConfirmationScreen', () => {
  const mockReset = jest.fn();
  const mockNavigation = { reset: mockReset } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByTestId } = render(
      <EmailConfirmationScreen navigation={mockNavigation} />
    );

    expect(getByText('auth.emailConfirmation.title')).toBeTruthy();
    expect(getByText('auth.emailConfirmation.body')).toBeTruthy();
    expect(getByTestId('resend-button')).toBeTruthy();
  });

  it('navigates to EnterMirror on button press', () => {
    const { getByTestId } = render(
      <EmailConfirmationScreen navigation={mockNavigation} />
    );
    
    fireEvent.press(getByTestId('resend-button'));
    
    expect(mockReset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'EnterMirror' }],
    });
  });
});
