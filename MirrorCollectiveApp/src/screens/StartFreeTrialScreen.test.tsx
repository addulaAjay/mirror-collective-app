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
// Mutable flags so individual tests can flip active-sub / auth state.
// Defaults: trial already used + no active sub → button is "SUBSCRIBE NOW".
const mockFlags = {
  hasUsedTrial: true,
  hasActiveSubscription: false,
  isAuthenticated: false,
};
jest.mock('@/context/SubscriptionContext', () => ({
  useSubscription: () => ({
    hasUsedTrial: mockFlags.hasUsedTrial,
    hasActiveSubscription: mockFlags.hasActiveSubscription,
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
  mockFlags.hasActiveSubscription = false;
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

describe('StartFreeTrialScreen — never strands an entitled user', () => {
  // Regression: once a new user's status becomes "trial", hasActiveSubscription
  // is true, which disables the CTA. This screen can be the navigator root (no
  // back button), so the user would be trapped on a dead-end paywall.

  it('routes a new/onboarding user into the app when they already have a trial', async () => {
    mockFlags.hasActiveSubscription = true; // status "trial" or "active"
    mockFlags.isAuthenticated = false; // onboarding — AuthNavigator
    render(<StartFreeTrialScreen />);
    await waitFor(() => expect(mockSetAuthenticated).toHaveBeenCalled());
  });

  it('goes back when an authenticated user hits the paywall with an active sub', async () => {
    mockFlags.hasActiveSubscription = true;
    mockFlags.isAuthenticated = true;
    mockNav.canGoBack = true;
    render(<StartFreeTrialScreen />);
    await waitFor(() => expect(mockGoBack).toHaveBeenCalled());
    expect(mockSetAuthenticated).not.toHaveBeenCalled();
  });

  it('navigates home when authenticated + active sub + cannot go back', async () => {
    mockFlags.hasActiveSubscription = true;
    mockFlags.isAuthenticated = true;
    mockNav.canGoBack = false;
    render(<StartFreeTrialScreen />);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('TalkToMirror'));
  });

  it('does NOT auto-route a brand-new user with no subscription', () => {
    mockFlags.hasActiveSubscription = false;
    mockFlags.hasUsedTrial = false; // fresh account → "START FREE TRIAL"
    mockFlags.isAuthenticated = false;
    const { getByText } = render(<StartFreeTrialScreen />);
    expect(mockSetAuthenticated).not.toHaveBeenCalled();
    expect(getByText('START FREE TRIAL')).toBeTruthy();
  });
});
