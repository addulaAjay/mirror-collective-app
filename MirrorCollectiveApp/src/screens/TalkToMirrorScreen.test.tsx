import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

jest.mock('@components/LogoHeader', () => 'LogoHeader');
jest.mock('@components/StarIcon', () => 'StarIcon');
jest.mock('@components/icons/MirrorPledgeIcon', () => 'MirrorPledgeIcon');
jest.mock('@components/BackgroundWrapper', () => 'BackgroundWrapper');
// SVG transformer pipeline isn't active in jest — mock each .svg as a string component.
jest.mock('@assets/talk-to-mirror/icon-mirror-echo.svg', () => 'IconMirrorEcho');
jest.mock('@assets/talk-to-mirror/icon-reflection-room.svg', () => 'IconReflectionRoom');
// icon-code-library is now a raster PNG (see Figma 7537:2242) — RN's
// default jest preset handles require()'d raster assets via the asset
// transformer, no per-file mock needed.
jest.mock('@assets/talk-to-mirror/oval-mirror.svg', () => 'OvalMirrorSvg');
jest.mock('@context/UserContext', () => ({
  useUser: jest.fn(),
}));
jest.mock('@services', () => ({
  OnboardingService: { markOnboardingComplete: jest.fn().mockResolvedValue(undefined) },
}));
// Render UpgradePrompt as a visibility marker so we can assert it appears.
jest.mock('@components/UpgradePrompt', () => {
  const react = require('react');
  const { Text } = require('react-native');
  return ({ visible, reason }: { visible: boolean; reason?: string }) =>
    visible ? react.createElement(Text, null, `UPGRADE_PROMPT:${reason}`) : null;
});
// Drive subscription status per-test.
let mockSubscription: any = {
  status: 'active',
  loading: false,
  isInTrial: false,
  trialDaysRemaining: 0,
};
jest.mock('@context/SubscriptionContext', () => ({
  useSubscription: () => mockSubscription,
}));

import { useUser } from '@context/UserContext';

import TalkToMirrorScreen from './TalkToMirrorScreen';

describe('TalkToMirrorScreen', () => {
  const mockNavigation = { navigate: jest.fn() } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (useUser as jest.Mock).mockReturnValue({ user: null });
    mockSubscription = {
      status: 'active',
      loading: false,
      isInTrial: false,
      trialDaysRemaining: 0,
      // Reflection Room visibility is decided server-side; most tests here
      // predate it and assume the category is present.
      features: { reflection_room_enabled: true },
    };
  });

  describe('Reflection Room server flag', () => {
    // TestFlight and the App Store ship the identical binary, so nothing
    // compiled in can be on for testers and off for everyone else. The server
    // decides per user — see src/app/core/feature_flags.py.
    // The card is ALWAYS rendered. Filtering it out meant that when the gate
    // shipped in 1.1.0, an entry users had been looking at since launch simply
    // disappeared — which is what got reported. Non-flagged users now land on
    // the same Coming Soon screen they saw before the real one was built, so a
    // rollout changes where the card leads, never whether it is there.
    it('still shows REFLECTION ROOM when the server flag is off', () => {
      mockSubscription = {
        ...mockSubscription,
        features: { reflection_room_enabled: false },
      };

      const { queryByText } = render(
        <TalkToMirrorScreen navigation={mockNavigation} />,
      );

      expect(queryByText('REFLECTION ROOM')).toBeTruthy();
    });

    it('sends a non-flagged user to Coming Soon', () => {
      mockSubscription = {
        ...mockSubscription,
        features: { reflection_room_enabled: false },
      };

      const { getByText } = render(
        <TalkToMirrorScreen navigation={mockNavigation} />,
      );
      fireEvent.press(getByText('REFLECTION ROOM'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        'ReflectionRoomCommingsoon',
      );
    });

    it('sends a flagged user to the real Reflection Room', () => {
      mockSubscription = {
        ...mockSubscription,
        features: { reflection_room_enabled: true },
      };

      const { getByText } = render(
        <TalkToMirrorScreen navigation={mockNavigation} />,
      );
      fireEvent.press(getByText('REFLECTION ROOM'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('ReflectionRoom');
    });

    it('falls back to Coming Soon when the server sends no features', () => {
      // Status call failed, or an older backend. Still fail closed — but to
      // the placeholder, not to nothing.
      mockSubscription = { ...mockSubscription, features: undefined };

      const { getByText } = render(
        <TalkToMirrorScreen navigation={mockNavigation} />,
      );
      fireEvent.press(getByText('REFLECTION ROOM'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        'ReflectionRoomCommingsoon',
      );
    });

    it('leaves the other categories alone', () => {
      mockSubscription = {
        ...mockSubscription,
        features: { reflection_room_enabled: false },
      };

      const { getByText } = render(
        <TalkToMirrorScreen navigation={mockNavigation} />,
      );

      expect(getByText('ECHO VAULT')).toBeTruthy();
      expect(getByText('MIRROR PLEDGE')).toBeTruthy();
    });
  });

  it('renders greeting, talk button, and all three categories', () => {
    const { getByText } = render(<TalkToMirrorScreen navigation={mockNavigation} />);

    expect(getByText('Welcome back, Friend')).toBeTruthy();
    expect(getByText('TALK TO MIRROR')).toBeTruthy();
    expect(getByText('ECHO VAULT')).toBeTruthy();
    expect(getByText('REFLECTION ROOM')).toBeTruthy();
    expect(getByText('MIRROR PLEDGE')).toBeTruthy();
  });

  it('navigates to MirrorChat when TALK TO MIRROR is pressed', () => {
    const { getByText } = render(<TalkToMirrorScreen navigation={mockNavigation} />);

    fireEvent.press(getByText('TALK TO MIRROR'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('MirrorChat');
  });

  it.each([
    ['ECHO VAULT',      'MirrorEchoVaultHome'],
    ['REFLECTION ROOM', 'ReflectionRoom'],
    ['MIRROR PLEDGE',   'TheMirrorPledge'],
  ])('navigates to the correct route when %s is pressed', (label, route) => {
    const { getByText } = render(<TalkToMirrorScreen navigation={mockNavigation} />);

    fireEvent.press(getByText(label));

    expect(mockNavigation.navigate).toHaveBeenCalledWith(route);
  });

  it.each(['trial_expired', 'expired'])(
    'shows the upgrade prompt on landing when status is %s',
    status => {
      mockSubscription = { ...mockSubscription, status };
      const { getByText } = render(<TalkToMirrorScreen navigation={mockNavigation} />);
      expect(getByText('UPGRADE_PROMPT:trial_expired')).toBeTruthy();
    },
  );

  it.each(['active', 'trial', 'none'])(
    'does NOT show the upgrade prompt when status is %s',
    status => {
      mockSubscription = { ...mockSubscription, status };
      const { queryByText } = render(<TalkToMirrorScreen navigation={mockNavigation} />);
      expect(queryByText('UPGRADE_PROMPT:trial_expired')).toBeNull();
    },
  );

  it('does not show the prompt until the subscription status has loaded', () => {
    mockSubscription = { ...mockSubscription, status: 'trial_expired', loading: true };
    const { queryByText } = render(<TalkToMirrorScreen navigation={mockNavigation} />);
    expect(queryByText('UPGRADE_PROMPT:trial_expired')).toBeNull();
  });
});
