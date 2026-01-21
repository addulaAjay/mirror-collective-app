import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { useSession } from '@context/SessionContext';

import SignUpScreen from './SignUpScreen';

// Mock the contexts
jest.mock('@context/SessionContext', () => ({
  useSession: jest.fn(),
}));

describe('SignUpScreen', () => {
  const mockSignUp = jest.fn();
  const mockNavigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue({
      signUp: mockSignUp,
    });
  });

  it('renders correctly', () => {
    const { getByTestId } = render(
      <SignUpScreen navigation={mockNavigation as any} />
    );

    expect(getByTestId('fullname-input')).toBeTruthy();
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(getByTestId('confirm-password-input')).toBeTruthy();
    expect(getByTestId('signup-button')).toBeTruthy();
  });

  it('navigates to Login when link is pressed', () => {
    const { getByTestId } = render(<SignUpScreen navigation={mockNavigation as any} />);
    const loginLink = getByTestId('login-link');

    fireEvent.press(loginLink);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
  });

  it('validates empty fields', async () => {
    const { getByTestId } = render(
      <SignUpScreen navigation={mockNavigation as any} />
    );

    const signUpButton = getByTestId('signup-button');
    fireEvent.press(signUpButton);

    const { Alert } = require('react-native');
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'common.error',
        'auth.validation.missingFullName'
      );
    });
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('validates password mismatch', async () => {
    const { getByTestId } = render(
      <SignUpScreen navigation={mockNavigation as any} />
    );

    fireEvent.changeText(getByTestId('fullname-input'), 'Test User');
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    // Meets complexity: 8+ chars, upper, lower, number, special
    fireEvent.changeText(getByTestId('password-input'), 'Password123!'); 
    fireEvent.changeText(getByTestId('confirm-password-input'), 'Mismatch123!');

    fireEvent.press(getByTestId('signup-button'));

    const { Alert } = require('react-native');
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'common.error',
        'auth.validation.passwordMismatch'
      );
    });
  });

  it('validates password complexity', async () => {
    const { getByTestId } = render(
      <SignUpScreen navigation={mockNavigation as any} />
    );

    fireEvent.changeText(getByTestId('fullname-input'), 'Test User');
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'weak'); // Too short, missing complexity

    fireEvent.press(getByTestId('signup-button'));

    const { Alert } = require('react-native');
    await waitFor(() => {
      // It should hit length check first
      expect(Alert.alert).toHaveBeenCalledWith(
        'common.error',
        'auth.validation.passwordTooShort'
      );
    });
  });

  it('calls signUp with correct credentials and shows welcome alert', async () => {
    const { getByTestId } = render(
      <SignUpScreen navigation={mockNavigation as any} />
    );

    fireEvent.changeText(getByTestId('fullname-input'), 'Test User');
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'Password123!');
    fireEvent.changeText(getByTestId('confirm-password-input'), 'Password123!');

    fireEvent.press(getByTestId('signup-button'));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('Test User', 'test@example.com', 'Password123!');
    });

    const { Alert } = require('react-native');
    expect(Alert.alert).toHaveBeenCalledWith(
      'auth.signup.alerts.welcomeTitle',
      'auth.signup.alerts.welcomeMessage',
      expect.any(Array) 
    );
     // Note: Testing the alert button callback requires more complex mock or trigger
  });

  it('displays error message when signUp fails', async () => {
    mockSignUp.mockRejectedValueOnce({ error: 'EmailAlreadyExists' });

    const { getByTestId } = render(
      <SignUpScreen navigation={mockNavigation as any} />
    );

    fireEvent.changeText(getByTestId('fullname-input'), 'Test User');
    fireEvent.changeText(getByTestId('email-input'), 'existing@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'Password123!');
    fireEvent.changeText(getByTestId('confirm-password-input'), 'Password123!');

    fireEvent.press(getByTestId('signup-button'));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalled();
    });

    const { Alert } = require('react-native');
    await waitFor(() => {
       // Should translate specific error
       // If t(k) => k, and apiErrorUtils uses t, we expect key if mocked t returns key
      expect(Alert.alert).toHaveBeenCalledWith(
        'auth.signup.alerts.failedTitle',
        'apiErrors.EmailAlreadyExists'
      );
    });
  });
});
