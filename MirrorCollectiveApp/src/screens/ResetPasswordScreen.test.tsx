import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ResetPasswordScreen from './ResetPasswordScreen';
import { useNavigation } from '@react-navigation/native';
import { useSession } from '@context/SessionContext';
import { Alert } from 'react-native';

// Mocks
jest.mock('@components/LogoHeader', () => 'LogoHeader');
jest.mock('@components/StarIcon', () => 'StarIcon');
jest.mock('@components/TextInputField', () => {
  const { TextInput } = require('react-native');
  return (props: any) => <TextInput {...props} />;
});

// Mock Navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
    useRoute: () => ({
      params: { email: 'test@example.com' },
    }),
  };
});

// Mock Session
jest.mock('@context/SessionContext', () => ({
  useSession: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('ResetPasswordScreen', () => {
  const mockResetPassword = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue({
      resetPassword: mockResetPassword,
      state: { error: null },
    });
  });

  it('renders correctly with email', () => {
    const { getByText, getByTestId, getByPlaceholderText } = render(<ResetPasswordScreen />);

    expect(getByText('auth.resetPassword.title')).toBeTruthy();
    expect(getByText('test@example.com')).toBeTruthy();
    expect(getByPlaceholderText('6-digit reset code')).toBeTruthy();
    expect(getByTestId('reset-password-button')).toBeTruthy();
  });

  it('navigates to login on back press', () => {
    const { getByTestId } = render(<ResetPasswordScreen />);
    
    fireEvent.press(getByTestId('back-to-login-button'));
    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });

  it('validates missing fields', () => {
    const { getByTestId } = render(<ResetPasswordScreen />);
    
    fireEvent.press(getByTestId('reset-password-button'));
    
    expect(Alert.alert).toHaveBeenCalledWith(
        'common.error',
        'Please enter the reset code'
    );
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('validates code length', () => {
    const { getByTestId } = render(<ResetPasswordScreen />);
    
    fireEvent.changeText(getByTestId('reset-code-input'), '123');
    fireEvent.press(getByTestId('reset-password-button'));
    
    expect(Alert.alert).toHaveBeenCalledWith(
        'common.error',
        'Reset code must be 6 digits'
    );
  });

  it('validates password match', () => {
    const { getByTestId } = render(<ResetPasswordScreen />);
    
    fireEvent.changeText(getByTestId('reset-code-input'), '123456');
    fireEvent.changeText(getByTestId('new-password-input'), 'Password123!');
    fireEvent.changeText(getByTestId('confirm-password-input'), 'Password123?');
    
    fireEvent.press(getByTestId('reset-password-button'));
    
    expect(Alert.alert).toHaveBeenCalledWith(
        'common.error',
        'auth.validation.passwordMismatch'
    );
  });

  it('calls resetPassword on valid input', async () => {
    const { getByTestId } = render(<ResetPasswordScreen />);
    
    fireEvent.changeText(getByTestId('reset-code-input'), '123456');
    fireEvent.changeText(getByTestId('new-password-input'), 'Password123!');
    fireEvent.changeText(getByTestId('confirm-password-input'), 'Password123!');
    
    fireEvent.press(getByTestId('reset-password-button'));
    
    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('test@example.com', '123456', 'Password123!');
    });
    
    expect(Alert.alert).toHaveBeenCalledWith(
        'auth.resetPassword.successTitle',
        'auth.resetPassword.successMessage',
        expect.any(Array)
    );
  });
});
