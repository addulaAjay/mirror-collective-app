import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { useSession } from '@context/SessionContext';

import LoginScreen from './LoginScreen';

// Mock the contexts
jest.mock('@context/SessionContext', () => ({
  useSession: jest.fn(),
}));

jest.mock('@context/UserContext', () => ({
  useUser: jest.fn(),
}));
import { useUser } from '@context/UserContext';


describe('LoginScreen', () => {
  const mockSignIn = jest.fn();
  const mockSetUser = jest.fn();
  const mockNavigation = {
    navigate: jest.fn(),
    replace: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue({
      signIn: mockSignIn,
      state: { isLoading: false, error: null },
    });
    (useUser as jest.Mock).mockReturnValue({
      setUser: mockSetUser,
      user: null
    });
  });

  it('renders correctly', () => {
    const { getByText, getByTestId } = render(
      <LoginScreen navigation={mockNavigation as any} />
    );

    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(getByText('auth.login.enterButton')).toBeTruthy();
  });

  it('navigates to SignUp when link is pressed', () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation as any} />);
    const signUpLink = getByText('auth.login.signUpLink');

    fireEvent.press(signUpLink);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('SignUp');
  });

  it('calls signIn with correct credentials when Login is pressed', async () => {
    const { getByTestId, getByText } = render(
      <LoginScreen navigation={mockNavigation as any} />
    );

    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');
    const loginButton = getByText('auth.login.enterButton');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('displays error message when signIn fails', async () => {
    // Mock signIn to reject
    mockSignIn.mockRejectedValueOnce({ error: 'AuthenticationError' });

    const { getByTestId, getByText, findByText } = render(
      <LoginScreen navigation={mockNavigation as any} />
    );

    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');
    const loginButton = getByText('auth.login.enterButton');

    fireEvent.changeText(emailInput, 'wrong@example.com');
    fireEvent.changeText(passwordInput, 'wrongpass');
    fireEvent.press(loginButton);

    // Verify Alert was shown with correct error
    const { Alert } = require('react-native');
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'auth.login.loginFailed', // Title translated
        'apiErrors.AuthenticationError' // Message translated
      );
    });
  });
});
