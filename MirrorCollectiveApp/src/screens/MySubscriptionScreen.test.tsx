import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import MySubscriptionScreen from './MySubscriptionScreen';

jest.mock('@components/LogoHeader', () => 'LogoHeader');
jest.mock('@components/BackgroundWrapper', () => {
  const react = require('react');
  return ({ children }: { children: React.ReactNode }) =>
    react.createElement('BackgroundWrapper', null, children);
});
const mockRestore = jest.fn().mockResolvedValue(undefined);
jest.mock('@hooks/useInAppPurchase', () => ({
  useInAppPurchase: () => ({
    restorePurchases: mockRestore,
    openManageSubscriptions: jest.fn(),
    products: [],
    PRODUCT_IDS: {
      CORE_MONTHLY: 'com.themirrorcollective.mirror.monthly',
      CORE_YEARLY: 'com.themirrorcollective.mirror.yearly',
    },
  }),
  localizedPrice: (_products: unknown, _id: string, fallback: string) => fallback,
}));
let mockSub: Record<string, unknown> = {};
jest.mock('@context/SubscriptionContext', () => ({
  useSubscription: () => mockSub,
}));

const nav = { navigate: jest.fn(), goBack: jest.fn() };

describe('MySubscriptionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSub = {
      status: 'active',
      isInTrial: false,
      trialDaysRemaining: 0,
      hasActiveSubscription: true,
      loading: false,
      refreshSubscriptionStatus: jest.fn(),
    };
  });

  it('renders the Mirror Basic subscription details', () => {
    const { getByText } = render(
      <MySubscriptionScreen navigation={nav as never} route={{} as never} />,
    );
    expect(getByText('SUBSCRIPTION')).toBeTruthy();
    expect(getByText('Mirror Basic')).toBeTruthy();
    expect(getByText('MANAGE SUBSCRIPTION')).toBeTruthy();
    expect(getByText('Active subscription')).toBeTruthy();
  });

  it('shows "Cancelled · access until <date>" when auto-renew is off', () => {
    // A cancel keeps status active; only auto_renew flips. The screen must
    // reflect that instead of the misleading "Active subscription".
    const future = new Date(Date.now() + 30 * 864e5).toISOString();
    mockSub = {
      ...mockSub,
      status: 'active',
      coreSubscription: { auto_renew_enabled: false, expiry_date: future },
    };
    const { getByText, queryByText } = render(
      <MySubscriptionScreen navigation={nav as never} route={{} as never} />,
    );
    expect(getByText(/Cancelled · access until/)).toBeTruthy();
    expect(queryByText('Active subscription')).toBeNull();
  });

  it('shows "Active · renews <date>" when auto-renew is on with a future expiry', () => {
    const future = new Date(Date.now() + 30 * 864e5).toISOString();
    mockSub = {
      ...mockSub,
      status: 'active',
      coreSubscription: { auto_renew_enabled: true, expiry_date: future },
    };
    const { getByText } = render(
      <MySubscriptionScreen navigation={nav as never} route={{} as never} />,
    );
    expect(getByText(/Active · renews/)).toBeTruthy();
  });

  it('shows the trial status line while in trial', () => {
    mockSub = { ...mockSub, isInTrial: true, trialDaysRemaining: 10, status: 'trial' };
    const { getByText } = render(
      <MySubscriptionScreen navigation={nav as never} route={{} as never} />,
    );
    expect(getByText('10-day free trial')).toBeTruthy();
  });

  it('MANAGE SUBSCRIPTION opens a confirm to change plan or cancel', () => {
    const { getByText } = render(
      <MySubscriptionScreen navigation={nav as never} route={{} as never} />,
    );
    fireEvent.press(getByText('MANAGE SUBSCRIPTION'));
    expect(Alert.alert).toHaveBeenCalled();
  });

  it('warns that cancelling Core also ends the add-on when storage is active', () => {
    mockSub = {
      ...mockSub,
      storageSubscription: { auto_renew_enabled: true },
    };
    const { getByText } = render(
      <MySubscriptionScreen navigation={nav as never} route={{} as never} />,
    );
    fireEvent.press(getByText('MANAGE SUBSCRIPTION'));
    const message = (Alert.alert as jest.Mock).mock.calls[0][1];
    expect(message).toMatch(/add-on/i);
  });

  it('shows SUBSCRIBE (not END SUBSCRIPTION) and routes to the paywall when not active', () => {
    mockSub = {
      ...mockSub,
      isInTrial: false,
      status: 'trial_expired',
      hasActiveSubscription: false,
    };
    const { getByText, queryByText } = render(
      <MySubscriptionScreen navigation={nav as never} route={{} as never} />,
    );
    expect(queryByText('END SUBSCRIPTION')).toBeNull();
    fireEvent.press(getByText('SUBSCRIBE'));
    expect(nav.navigate).toHaveBeenCalledWith('StartFreeTrial');
  });
});
