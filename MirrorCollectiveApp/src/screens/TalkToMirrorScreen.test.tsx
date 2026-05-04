import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

jest.mock('@components/LogoHeader', () => 'LogoHeader');
jest.mock('@components/StarIcon', () => 'StarIcon');
jest.mock('@components/icons/MirrorPledgeIcon', () => 'MirrorPledgeIcon');
jest.mock('@components/BackgroundWrapper', () => 'BackgroundWrapper');
// SVG transformer pipeline isn't active in jest — mock each .svg as a string component.
jest.mock('@assets/talk-to-mirror/icon-mirror-echo.svg', () => 'IconMirrorEcho');
jest.mock('@assets/talk-to-mirror/icon-reflection-room.svg', () => 'IconReflectionRoom');
jest.mock('@assets/talk-to-mirror/icon-code-library.svg', () => 'IconCodeLibrary');
jest.mock('@assets/talk-to-mirror/oval-mirror.svg', () => 'OvalMirrorSvg');
jest.mock('@context/UserContext', () => ({
  useUser: jest.fn(),
}));
jest.mock('@services', () => ({
  OnboardingService: { markOnboardingComplete: jest.fn().mockResolvedValue(undefined) },
}));

import { useUser } from '@context/UserContext';

import TalkToMirrorScreen from './TalkToMirrorScreen';

describe('TalkToMirrorScreen', () => {
  const mockNavigation = { navigate: jest.fn() } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (useUser as jest.Mock).mockReturnValue({ user: null });
  });

  it('renders greeting, talk button, and all four categories', () => {
    const { getByText } = render(<TalkToMirrorScreen navigation={mockNavigation} />);

    expect(getByText('Welcome back, Friend')).toBeTruthy();
    expect(getByText('TALK TO MIRROR')).toBeTruthy();
    expect(getByText('MIRROR ECHO')).toBeTruthy();
    expect(getByText('REFLECTION ROOM')).toBeTruthy();
    expect(getByText('CODE LIBRARY')).toBeTruthy();
    expect(getByText('MIRROR PLEDGE')).toBeTruthy();
  });

  it('navigates to MirrorChat when TALK TO MIRROR is pressed', () => {
    const { getByText } = render(<TalkToMirrorScreen navigation={mockNavigation} />);

    fireEvent.press(getByText('TALK TO MIRROR'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('MirrorChat');
  });

  it.each([
    ['MIRROR ECHO',     'MirrorEchoVaultHome'],
    ['REFLECTION ROOM', 'ReflectionRoom'],
    ['CODE LIBRARY',    'MirrorCodeLibrary'],
    ['MIRROR PLEDGE',   'MirrorPledgeIntro'],
  ])('navigates to the correct route when %s is pressed', (label, route) => {
    const { getByText } = render(<TalkToMirrorScreen navigation={mockNavigation} />);

    fireEvent.press(getByText(label));

    expect(mockNavigation.navigate).toHaveBeenCalledWith(route);
  });
});
