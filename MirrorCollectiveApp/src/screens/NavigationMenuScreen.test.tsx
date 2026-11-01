import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import MirrorSideMenu from './NavigationMenuScreen';

jest.mock('@components/CircularLogoMark', () => 'CircularLogoMark');

let mockSubscription: any;
jest.mock('@context/SubscriptionContext', () => ({
  useSubscription: () => mockSubscription,
}));

describe('MirrorSideMenu — Reflection Room server flag', () => {
  // Visibility is a rollout decision made server-side: TestFlight and the App
  // Store ship the identical binary, so nothing compiled in can be on for
  // testers and off for everyone else. See src/app/core/feature_flags.py.
  const baseProps = {
    isOpen: true,
    userName: 'Sarah Collins',
    onClose: jest.fn(),
    onNavigate: jest.fn(),
    onLogout: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscription = { features: { reflection_room_enabled: true } };
  });

  it('shows Reflection Room when the server flag is on', () => {
    const { queryByText } = render(<MirrorSideMenu {...baseProps} />);

    expect(queryByText('Reflection Room')).toBeTruthy();
  });

  it('hides Reflection Room when the server flag is off', () => {
    mockSubscription = { features: { reflection_room_enabled: false } };

    const { queryByText } = render(<MirrorSideMenu {...baseProps} />);

    expect(queryByText('Reflection Room')).toBeNull();
  });

  it('hides it when the server sends no features at all', () => {
    // Status call failed, or an older backend. Fail closed.
    mockSubscription = { features: undefined };

    const { queryByText } = render(<MirrorSideMenu {...baseProps} />);

    expect(queryByText('Reflection Room')).toBeNull();
  });

  it('leaves the other primary items alone when hidden', () => {
    mockSubscription = { features: { reflection_room_enabled: false } };

    const { getByText } = render(<MirrorSideMenu {...baseProps} />);

    expect(getByText('Home')).toBeTruthy();
    expect(getByText('MirrorGPT')).toBeTruthy();
    expect(getByText('Echo Vault')).toBeTruthy();
    expect(getByText('Pledge')).toBeTruthy();
  });
});

describe('MirrorSideMenu — logout', () => {
  const baseProps = {
    isOpen: true,
    userName: 'Sarah Collins',
    onClose: jest.fn(),
    onNavigate: jest.fn(),
    onLogout: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscription = { features: { reflection_room_enabled: true } };
  });

  it('renders a Logout item when the menu is open', () => {
    const { getByText } = render(<MirrorSideMenu {...baseProps} />);

    expect(getByText('Logout')).toBeTruthy();
  });

  it('calls onLogout when the Logout item is pressed', () => {
    const onLogout = jest.fn();
    const { getByText } = render(
      <MirrorSideMenu {...baseProps} onLogout={onLogout} />,
    );

    fireEvent.press(getByText('Logout'));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
