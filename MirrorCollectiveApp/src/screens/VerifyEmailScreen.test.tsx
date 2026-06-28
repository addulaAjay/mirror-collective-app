import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import { authApiService } from '@services/api';
import { QuizStorageService } from '@services/quizStorageService';

import VerifyEmailScreen from './VerifyEmailScreen';




// Mocks
jest.mock('@components/LogoHeader', () => 'LogoHeader');

// The shared react-native mock (src/__tests__/jest.setup.js) does not expose
// `Pressable`, which VerifyEmailScreen uses for the "back to sign up" link.
// Provide a host stub on this file's module instance so the screen renders.
// (Local-only; the shared setup file is intentionally left untouched.)
const ReactNative = require('react-native');
if (!ReactNative.Pressable) {
  ReactNative.Pressable = 'Pressable';
}

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
    // The Verify/Resend buttons have no testID — they are identified by label.
    expect(getByText('auth.verifyEmail.verifyButton')).toBeTruthy();
    expect(getByText('auth.verifyEmail.resendButton')).toBeTruthy();
  });

  it('disables verify button with incomplete code', () => {
    const { getByText, getByTestId } = render(<VerifyEmailScreen />);

    // Enter less than 6 digits
    fireEvent.changeText(getByTestId('verification-code-input'), '12345');

    // The Button's TouchableOpacity (the label's parent) should be disabled.
    const button = getByText('auth.verifyEmail.verifyButton').parent;
    expect(button?.props.disabled).toBe(true);
  });

  it('calls verifyEmail on valid code', async () => {
    (authApiService.verifyEmail as jest.Mock).mockResolvedValueOnce({ success: true });
    (QuizStorageService.retryPendingSubmissions as jest.Mock).mockResolvedValueOnce(undefined);

    const { getByText, getByTestId } = render(<VerifyEmailScreen />);

    fireEvent.changeText(getByTestId('verification-code-input'), '123456');
    fireEvent.press(getByText('auth.verifyEmail.verifyButton'));

    await waitFor(() => {
      expect(authApiService.verifyEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          verificationCode: '123456',
          anonymousId: 'test-anon-id',
        })
      );
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'auth.verifyEmail.successTitle',
      'auth.verifyEmail.successMessage',
      expect.any(Array)
    );
  });

  it('handles verification failure', async () => {
    (authApiService.verifyEmail as jest.Mock).mockResolvedValueOnce({ success: false, error: 'Invalid code' });

    const { getByText, getByTestId } = render(<VerifyEmailScreen />);

    fireEvent.changeText(getByTestId('verification-code-input'), '123456');
    fireEvent.press(getByText('auth.verifyEmail.verifyButton'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'auth.verifyEmail.failedTitle',
        expect.anything()
      );
    });
  });

  it('handles resend code', async () => {
    (authApiService.resendVerificationCode as jest.Mock).mockResolvedValueOnce({ success: true });

    const { getByText } = render(<VerifyEmailScreen />);

    fireEvent.press(getByText('auth.verifyEmail.resendButton'));

    await waitFor(() => {
      expect(authApiService.resendVerificationCode).toHaveBeenCalledWith('test@example.com');
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'auth.verifyEmail.resendSuccessTitle',
      'auth.verifyEmail.resendSuccessBody'
    );
  });
});
