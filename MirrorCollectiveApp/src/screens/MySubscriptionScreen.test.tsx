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
  useInAppPurchase: () => ({ restorePurchases: mockRestore }),
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

  it('renders the Mirror Core subscription details', () => {
    const { getByText } = render(
      <MySubscriptionScreen navigation={nav as never} route={{} as never} />,
    );
    expect(getByText('SUBSCRIPTION')).toBeTruthy();
    expect(getByText('Mirror Core')).toBeTruthy();
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
});
