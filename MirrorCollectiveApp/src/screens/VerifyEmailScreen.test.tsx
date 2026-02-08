import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import VerifyEmailScreen from './VerifyEmailScreen';
import { useNavigation } from '@react-navigation/native';
import { authApiService } from '@services/api';
import { QuizStorageService } from '@services/quizStorageService';
import { Alert } from 'react-native';

// Mocks
jest.mock('@components/LogoHeader', () => 'LogoHeader');

// Mock Navigation
const mockNavigate = jest.fn();
const mockReset = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      reset: mockReset,
    }),
    useRoute: () => ({
      params: { email: 'test@example.com' },
    }),
  };
});

// Mock API
jest.mock('@services/api', () => ({
  authApiService: {
    verifyEmail: jest.fn(),
    resendVerificationCode: jest.fn(),
  },
}));

// Mock QuizStorageService
jest.mock('@services/quizStorageService', () => ({
  QuizStorageService: {
    retryPendingSubmissions: jest.fn(),
    getAnonymousId: jest.fn().mockResolvedValue('test-anon-id'),
  },
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('VerifyEmailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByTestId } = render(<VerifyEmailScreen />);

    expect(getByText('auth.verifyEmail.title')).toBeTruthy();
    expect(getByTestId('verification-code-input')).toBeTruthy();
    expect(getByTestId('verify-button')).toBeTruthy();
    expect(getByTestId('resend-button')).toBeTruthy();
  });

  it('disables verify button with incomplete code', () => {
    const { getByTestId } = render(<VerifyEmailScreen />);
    
    // Enter less than 6 digits
    fireEvent.changeText(getByTestId('verification-code-input'), '12345');
    
    // Button should be disabled
    const button = getByTestId('verify-button');
    expect(button.props.disabled).toBe(true);
  });

  it('calls verifyEmail on valid code', async () => {
    (authApiService.verifyEmail as jest.Mock).mockResolvedValueOnce({ success: true });
    (QuizStorageService.retryPendingSubmissions as jest.Mock).mockResolvedValueOnce(undefined);

    const { getByTestId } = render(<VerifyEmailScreen />);
    
    fireEvent.changeText(getByTestId('verification-code-input'), '123456');
    fireEvent.press(getByTestId('verify-button'));

    await waitFor(() => {
      expect(authApiService.verifyEmail).toHaveBeenCalledWith({
        email: 'test@example.com',
        verificationCode: '123456',
      });
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'auth.verifyEmail.successTitle',
      'auth.verifyEmail.successMessage',
      expect.any(Array)
    );
  });

  it('handles verification failure', async () => {
    (authApiService.verifyEmail as jest.Mock).mockResolvedValueOnce({ success: false, error: 'Invalid code' });

    const { getByTestId } = render(<VerifyEmailScreen />);
    
    fireEvent.changeText(getByTestId('verification-code-input'), '123456');
    fireEvent.press(getByTestId('verify-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'auth.verifyEmail.failedTitle',
        expect.anything()
      );
    });
  });

  it('handles resend code', async () => {
    (authApiService.resendVerificationCode as jest.Mock).mockResolvedValueOnce({ success: true });

    const { getByTestId } = render(<VerifyEmailScreen />);
    
    fireEvent.press(getByTestId('resend-button'));

    await waitFor(() => {
      expect(authApiService.resendVerificationCode).toHaveBeenCalledWith('test@example.com');
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'auth.forgotPassword.successTitle',
      'auth.verifyEmail.title'
    );
  });
});
