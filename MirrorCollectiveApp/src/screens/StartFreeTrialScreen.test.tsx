import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Linking } from 'react-native';

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
const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
const mockNav = { canGoBack: false };
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    canGoBack: () => mockNav.canGoBack,
    goBack: mockGoBack,
    navigate: mockNavigate,
  }),
}));

const CORE_MONTHLY = 'com.themirrorcollective.mirror.monthly';
const CORE_YEARLY = 'com.themirrorcollective.mirror.yearly';
const mockPurchase = jest.fn().mockResolvedValue(undefined);
const mockRestore = jest.fn().mockResolvedValue({
  success: true,
  data: { restored_count: 0, subscriptions: [] },
});
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
      restorePurchases: mockRestore,
      purchasing: false,
      products: [],
      PRODUCT_IDS: {
        CORE_MONTHLY: 'com.themirrorcollective.mirror.monthly',
        CORE_YEARLY: 'com.themirrorcollective.mirror.yearly',
        STORAGE_MONTHLY: 'com.themirrorcollective.mirror.storage.monthly',
        STORAGE_YEARLY: 'com.themirrorcollective.mirror.storage.yearly',
      },
    };
  },
  localizedPrice: (_products: unknown, _id: string, fallback: string) => fallback,
}));
// Mutable flags so individual tests can flip status / auth state.
// Defaults: status "none" + trial already used → button is "SUBSCRIBE NOW".
// hasActiveSubscription is derived from status exactly like the real context.
const mockFlags = {
  hasUsedTrial: true,
  status: 'none' as 'none' | 'trial' | 'active' | 'expired',
  isAuthenticated: false,
};
jest.mock('@/context/SubscriptionContext', () => ({
  useSubscription: () => ({
    status: mockFlags.status,
    hasUsedTrial: mockFlags.hasUsedTrial,
    hasActiveSubscription:
      mockFlags.status === 'active' || mockFlags.status === 'trial',
    refreshSubscriptionStatus: mockRefresh,
  }),
}));
jest.mock('@/context/SessionContext', () => ({
  useSession: () => ({
    setAuthenticated: mockSetAuthenticated,
    state: { isAuthenticated: mockFlags.isAuthenticated },
  }),
}));
jest.mock('@/services/api/subscriptionApi', () => ({
  subscriptionApiService: { startTrial: jest.fn() },
}));

// Reset the mutable flags/nav and mock call history before every test.
beforeEach(() => {
  jest.clearAllMocks();
  mockFlags.hasUsedTrial = true;
  mockFlags.status = 'none';
  mockFlags.isAuthenticated = false;
  mockNav.canGoBack = false;
});

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

describe('StartFreeTrialScreen — App Store compliance', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the auto-renewal disclosure (Guideline 3.1.2)', () => {
    const { getByText } = render(<StartFreeTrialScreen />);
    // Must state charge to Apple ID, auto-renew, and 24h cancellation window.
    expect(
      getByText(/Payment is charged to your Apple ID/i),
    ).toBeTruthy();
    expect(
      getByText(/automatically renews unless auto-renew is turned off/i),
    ).toBeTruthy();
  });

  it('renders a Restore Purchase control', () => {
    const { getByText } = render(<StartFreeTrialScreen />);
    expect(getByText('Restore Purchase')).toBeTruthy();
  });

  it('invokes restorePurchases when the control is pressed', async () => {
    const { getByText } = render(<StartFreeTrialScreen />);
    fireEvent.press(getByText('Restore Purchase'));
    await waitFor(() => expect(mockRestore).toHaveBeenCalled());
  });

  it('enters the app when a restore finds an active subscription', async () => {
    mockRestore.mockResolvedValueOnce({
      success: true,
      data: { restored_count: 1, subscriptions: [{ id: 'sub-1' }] },
    });
    const { getByText } = render(<StartFreeTrialScreen />);
    fireEvent.press(getByText('Restore Purchase'));
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
    expect(mockSetAuthenticated).toHaveBeenCalled();
  });

  it('does not enter the app when a restore finds nothing', async () => {
    const { getByText } = render(<StartFreeTrialScreen />);
    fireEvent.press(getByText('Restore Purchase'));
    await waitFor(() => expect(mockRestore).toHaveBeenCalled());
    expect(mockSetAuthenticated).not.toHaveBeenCalled();
  });
});

describe('StartFreeTrialScreen — entitlement handling', () => {
  it('shows an enabled START FREE TRIAL for a brand-new user (kept on the paywall)', () => {
    // New users see the trial screen after verification — they are NOT
    // auto-routed into the app; the paywall is part of onboarding.
    mockFlags.status = 'none';
    mockFlags.hasUsedTrial = false;
    const { getByText } = render(<StartFreeTrialScreen />);
    expect(mockSetAuthenticated).not.toHaveBeenCalled();
    expect(getByText('START FREE TRIAL')).toBeTruthy();
  });

  it('lets a TRIAL user subscribe (CTA enabled, purchase fires)', async () => {
    mockFlags.status = 'trial';
    const { getByText } = render(<StartFreeTrialScreen />);
    fireEvent.press(getByText('SUBSCRIBE NOW'));
    await waitFor(() => expect(mockPurchase).toHaveBeenCalledWith(CORE_MONTHLY));
  });

  it('offers Manage Subscription (not a dead button) to a PAID subscriber', async () => {
    mockFlags.status = 'active';
    const { getByText } = render(<StartFreeTrialScreen />);
    fireEvent.press(getByText('MANAGE SUBSCRIPTION'));
    await waitFor(() =>
      expect(Linking.openURL).toHaveBeenCalledWith(
        'https://apps.apple.com/account/subscriptions',
      ),
    );
    expect(mockPurchase).not.toHaveBeenCalled(); // no re-purchase from the paywall
  });
});
