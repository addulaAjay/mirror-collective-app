import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Linking } from 'react-native';

import { LEGAL_LINKS } from '@constants/config';

import TermsAndConditionsScreen from './TermsAndConditionsScreen';

// Stub context-heavy children so the screen renders in isolation.
jest.mock('@components/LogoHeader', () => 'LogoHeader');
jest.mock('@components/BackgroundWrapper', () => {
  const react = require('react');
  return ({ children }: { children: React.ReactNode }) =>
    react.createElement('BackgroundWrapper', null, children);
});
jest.mock('@context/SessionContext', () => ({
  useSession: () => ({ signUp: jest.fn() }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({
    params: {
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'secret123',
      phoneNumber: '',
    },
  }),
}));

describe('TermsAndConditionsScreen legal links', () => {
  beforeEach(() => jest.clearAllMocks());

  it('opens the Terms of Service URL when the Terms link is tapped', () => {
    const { getByText } = render(<TermsAndConditionsScreen />);

    fireEvent.press(getByText('• Terms of Service'));

    expect(Linking.openURL).toHaveBeenCalledWith(LEGAL_LINKS.TERMS);
  });

  it('opens the Privacy Policy URL when the Privacy link is tapped', () => {
    const { getByText } = render(<TermsAndConditionsScreen />);

    fireEvent.press(getByText('• Privacy Policy'));

    expect(Linking.openURL).toHaveBeenCalledWith(LEGAL_LINKS.PRIVACY);
  });

  it('points the legal links at the marketing site', () => {
    expect(LEGAL_LINKS.TERMS).toBe(
      'https://www.themirrorcollective.com/termsandconditions',
    );
    expect(LEGAL_LINKS.PRIVACY).toBe(
      'https://www.themirrorcollective.com/privacy',
    );
  });
});
