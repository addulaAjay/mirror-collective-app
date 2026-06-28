import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { TextInput } from 'react-native';

import { useSession } from '@context/SessionContext';
import { useUser } from '@context/UserContext';

import LoginScreen from './LoginScreen';

// Mock the contexts
jest.mock('@context/SessionContext', () => ({
  useSession: jest.fn(),
}));

jest.mock('@context/UserContext', () => ({
  useUser: jest.fn(),
}));


describe('LoginScreen', () => {
  const mockSignIn = jest.fn();
  const mockSetUser = jest.fn();
  const mockNavigation = {
    navigate: jest.fn(),
    replace: jest.fn(),
    goBack: jest.fn(),
    canGoBack: jest.fn(),
    setParams: jest.fn(),
    dispatch: jest.fn(),
    reset: jest.fn(),
    getParent: jest.fn(),
    getState: jest.fn(),
    getId: jest.fn(),
    isFocused: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    setOptions: jest.fn(),
  };

  const mockRoute = {
    key: 'Login',
    name: 'Login',
    params: undefined,
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
    const { getByText, UNSAFE_getAllByType } = render(
      <LoginScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    // LoginScreen renders two TextInputField inputs (email + password) with
    // no testIDs; the custom placeholder overlay renders the i18n key text.
    expect(UNSAFE_getAllByType(TextInput)).toHaveLength(2);
    expect(getByText('auth.login.usernamePlaceholder')).toBeTruthy();
    expect(getByText('auth.login.passwordPlaceholder')).toBeTruthy();
    expect(getByText('auth.login.enterButton')).toBeTruthy();
  });

  it('navigates to SignUp when link is pressed', () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation as any} route={mockRoute as any} />);
    const signUpLink = getByText('auth.login.signUpLink');

    fireEvent.press(signUpLink);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('SignUp');
  });

  it('calls signIn with correct credentials when Login is pressed', async () => {
    const { UNSAFE_getAllByType, getByText } = render(
      <LoginScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    const [emailInput, passwordInput] = UNSAFE_getAllByType(TextInput);
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

    const { UNSAFE_getAllByType, getByText, findByText } = render(
      <LoginScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    const [emailInput, passwordInput] = UNSAFE_getAllByType(TextInput);
    const loginButton = getByText('auth.login.enterButton');

    fireEvent.changeText(emailInput, 'wrong@example.com');
    fireEvent.changeText(passwordInput, 'wrongpass');
    fireEvent.press(loginButton);

    // The screen renders the resolved API error inline (setErrorMessage),
    // it does not show an Alert on a failed sign-in.
    expect(await findByText('apiErrors.AuthenticationError')).toBeTruthy();
  });
});
