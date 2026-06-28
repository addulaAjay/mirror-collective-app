import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { useSession } from '@context/SessionContext';

import SignUpScreen from './SignUpScreen';

// LogoHeader pulls in UserContext/SessionContext via hooks; stub it out so the
// screen under test renders in isolation (mirrors VerifyEmailScreen.test).
jest.mock('@components/LogoHeader', () => 'LogoHeader');

// Mock the contexts
jest.mock('@context/SessionContext', () => ({
  useSession: jest.fn(),
}));

describe('SignUpScreen', () => {
  const mockSignUp = jest.fn();
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
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

  it('navigates back when the back button is pressed', () => {
    const { getByTestId } = render(<SignUpScreen navigation={mockNavigation as any} />);

    fireEvent.press(getByTestId('back-button'));
    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it('validates empty fields', () => {
    const { getByTestId } = render(
      <SignUpScreen navigation={mockNavigation as any} />
    );

    fireEvent.press(getByTestId('signup-button'));

    // The screen surfaces validation inline via per-field error Text nodes,
    // not an Alert, and does not advance navigation.
    expect(getByTestId('fullname-error').props.children).toBe(
      'auth.validation.missingFullName'
    );
    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });

  it('validates password mismatch', () => {
    const { getByTestId } = render(
      <SignUpScreen navigation={mockNavigation as any} />
    );

    fireEvent.changeText(getByTestId('fullname-input'), 'Test User');
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    // Meets complexity: 8+ chars, upper, lower, number, special
    fireEvent.changeText(getByTestId('password-input'), 'Password123!');
    fireEvent.changeText(getByTestId('confirm-password-input'), 'Mismatch123!');

    fireEvent.press(getByTestId('signup-button'));

    expect(getByTestId('confirm-password-error').props.children).toBe(
      'auth.validation.passwordMismatch'
    );
    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });

  it('validates password complexity', () => {
    const { getByTestId } = render(
      <SignUpScreen navigation={mockNavigation as any} />
    );

    fireEvent.changeText(getByTestId('fullname-input'), 'Test User');
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'weak'); // Too short, missing complexity

    fireEvent.press(getByTestId('signup-button'));

    // Length check fires first.
    expect(getByTestId('password-error').props.children).toBe(
      'auth.validation.passwordTooShort'
    );
    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });

  it('navigates to TermsAndConditions with valid credentials', () => {
    const { getByTestId } = render(
      <SignUpScreen navigation={mockNavigation as any} />
    );

    fireEvent.changeText(getByTestId('fullname-input'), 'Test User');
    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('phone-input'), '5551234567');
    fireEvent.changeText(getByTestId('password-input'), 'Password123!');
    fireEvent.changeText(getByTestId('confirm-password-input'), 'Password123!');

    fireEvent.press(getByTestId('signup-button'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('TermsAndConditions', {
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      phoneNumber: '+15551234567',
    });
  });

  it('validates invalid email format', () => {
    const { getByTestId } = render(
      <SignUpScreen navigation={mockNavigation as any} />
    );

    fireEvent.changeText(getByTestId('fullname-input'), 'Test User');
    fireEvent.changeText(getByTestId('email-input'), 'not-an-email');
    fireEvent.changeText(getByTestId('phone-input'), '5551234567');
    fireEvent.changeText(getByTestId('password-input'), 'Password123!');
    fireEvent.changeText(getByTestId('confirm-password-input'), 'Password123!');

    fireEvent.press(getByTestId('signup-button'));

    expect(getByTestId('email-error').props.children).toBe(
      'auth.validation.invalidEmail'
    );
    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });
});
