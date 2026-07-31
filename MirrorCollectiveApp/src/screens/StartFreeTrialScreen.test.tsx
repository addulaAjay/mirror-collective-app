import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import StartFreeTrialScreen from './StartFreeTrialScreen';

jest.mock('@components/LogoHeader', () => 'LogoHeader');
jest.mock('@components/Button/Button', () => {
  const react = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ title, onPress, disabled }: any) =>
      react.createElement(
        TouchableOpacity,
        { onPress, disabled, accessibilityRole: 'button' },
        react.createElement(Text, null, title),
      ),
  };
});
jest.mock('@components/BackgroundWrapper', () => {
  const react = require('react');
  return ({ children }: { children: React.ReactNode }) =>
    react.createElement('BackgroundWrapper', null, children);
});
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    canGoBack: () => false,
    goBack: jest.fn(),
    navigate: jest.fn(),
  }),
}));

const CORE_MONTHLY = 'com.themirrorcollective.mirror.monthly';
const CORE_YEARLY = 'com.themirrorcollective.mirror.yearly';
const mockPurchase = jest.fn().mockResolvedValue(undefined);
const mockRefresh = jest.fn().mockResolvedValue(undefined);
const mockSetAuthenticated = jest.fn();
// Holder (mock-prefixed so the jest.mock factory may reference it) that captures
// the onPurchaseVerified callback the screen hands to the hook.
const mockHook: { onVerified?: () => void | Promise<void> } = {};
jest.mock('@/hooks/useInAppPurchase', () => ({
  useInAppPurchase: (opts?: { onPurchaseVerified?: () => void | Promise<void> }) => {
    mockHook.onVerified = opts?.onPurchaseVerified;
    return {
      purchaseSubscription: mockPurchase,
      purchasing: false,
      PRODUCT_IDS: {
        CORE_MONTHLY: 'com.themirrorcollective.mirror.monthly',
        CORE_YEARLY: 'com.themirrorcollective.mirror.yearly',
        STORAGE_MONTHLY: 'com.themirrorcollective.mirror.storage.monthly',
        STORAGE_YEARLY: 'com.themirrorcollective.mirror.storage.yearly',
      },
    };
  },
}));
// Trial already used + no active sub → button is "SUBSCRIBE NOW" (purchase path).
jest.mock('@/context/SubscriptionContext', () => ({
  useSubscription: () => ({
    hasUsedTrial: true,
    hasActiveSubscription: false,
    refreshSubscriptionStatus: mockRefresh,
  }),
}));
jest.mock('@/context/SessionContext', () => ({
  useSession: () => ({ setAuthenticated: mockSetAuthenticated }),
}));
jest.mock('@/services/api/subscriptionApi', () => ({
  subscriptionApiService: { startTrial: jest.fn() },
}));

describe('StartFreeTrialScreen — monthly/yearly toggle', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders both Monthly and Yearly options', () => {
    const { getByText } = render(<StartFreeTrialScreen />);
    expect(getByText('Monthly')).toBeTruthy();
    expect(getByText('Yearly')).toBeTruthy();
  });

  it('purchases the monthly product by default', async () => {
    const { getByText } = render(<StartFreeTrialScreen />);
    fireEvent.press(getByText('SUBSCRIBE NOW'));
    await waitFor(() =>
      expect(mockPurchase).toHaveBeenCalledWith(CORE_MONTHLY),
    );
  });

  it('purchases the yearly product after selecting Yearly', async () => {
    const { getByText } = render(<StartFreeTrialScreen />);
    fireEvent.press(getByText('Yearly'));
    fireEvent.press(getByText('SUBSCRIBE NOW'));
    await waitFor(() =>
      expect(mockPurchase).toHaveBeenCalledWith(CORE_YEARLY),
    );
  });

  it('refreshes status and enters the app once a purchase is verified', async () => {
    render(<StartFreeTrialScreen />);
    // The hook fires this after StoreKit + backend verification complete.
    expect(mockHook.onVerified).toBeDefined();
    await mockHook.onVerified?.();
    expect(mockRefresh).toHaveBeenCalled();
    expect(mockSetAuthenticated).toHaveBeenCalled();
  });
});
