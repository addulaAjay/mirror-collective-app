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

  // The item is ALWAYS listed. Filtering it out meant that when the gate
  // shipped in 1.1.0, a menu entry users had been looking at since launch
  // simply disappeared — which is what got reported. Non-flagged users now go
  // to the Coming Soon screen they saw before the real one was built, so a
  // rollout changes where the item leads, never whether it is there.
  it('still shows Reflection Room when the server flag is off', () => {
    mockSubscription = { features: { reflection_room_enabled: false } };

    const { queryByText } = render(<MirrorSideMenu {...baseProps} />);

    expect(queryByText('Reflection Room')).toBeTruthy();
  });

  it('sends a non-flagged user to Coming Soon', () => {
    mockSubscription = { features: { reflection_room_enabled: false } };

    const { getByText } = render(<MirrorSideMenu {...baseProps} />);
    fireEvent.press(getByText('Reflection Room'));

    expect(baseProps.onNavigate).toHaveBeenCalledWith(
      'ReflectionRoomCommingsoon',
    );
  });

  it('sends a flagged user to the real Reflection Room', () => {
    mockSubscription = { features: { reflection_room_enabled: true } };

    const { getByText } = render(<MirrorSideMenu {...baseProps} />);
    fireEvent.press(getByText('Reflection Room'));

    expect(baseProps.onNavigate).toHaveBeenCalledWith('ReflectionRoom');
  });

  it('falls back to Coming Soon when the server sends no features', () => {
    // Status call failed, or an older backend. Still fail closed — but to the
    // placeholder, not to nothing.
    mockSubscription = { features: undefined };

    const { getByText } = render(<MirrorSideMenu {...baseProps} />);
    fireEvent.press(getByText('Reflection Room'));

    expect(baseProps.onNavigate).toHaveBeenCalledWith(
      'ReflectionRoomCommingsoon',
    );
  });

  it('leaves the other primary items alone', () => {
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
