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
    };
  });

  it('renders the Mirror Basic subscription details', () => {
    const { getByText } = render(
      <MySubscriptionScreen navigation={nav as never} route={{} as never} />,
    );
    expect(getByText('SUBSCRIPTION')).toBeTruthy();
    expect(getByText('Mirror Basic')).toBeTruthy();
    expect(getByText('END SUBSCRIPTION')).toBeTruthy();
    expect(getByText('Active subscription')).toBeTruthy();
  });

  it('shows the trial status line while in trial', () => {
    mockSub = { ...mockSub, isInTrial: true, trialDaysRemaining: 10, status: 'trial' };
    const { getByText } = render(
      <MySubscriptionScreen navigation={nav as never} route={{} as never} />,
    );
    expect(getByText('10-day free trial')).toBeTruthy();
  });

  it('END SUBSCRIPTION opens a confirm to manage in the App Store', () => {
    const { getByText } = render(
      <MySubscriptionScreen navigation={nav as never} route={{} as never} />,
    );
    fireEvent.press(getByText('END SUBSCRIPTION'));
    expect(Alert.alert).toHaveBeenCalled();
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
