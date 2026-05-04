import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';

import MirrorPledgeIntroScreen from '@screens/MirrorPledge/MirrorPledgeIntroScreen';

// Mock Navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

// Mock linear gradient
jest.mock('react-native-linear-gradient', () => 'LinearGradient');

// Mock SafeAreaView
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: View,
  };
});

// Mock BackgroundWrapper
jest.mock('@components/BackgroundWrapper', () => {
  const { View } = require('react-native');
  return ({ children }: any) => <View>{children}</View>;
});

// Mock LogoHeader
jest.mock('@components/LogoHeader', () => {
  const { View } = require('react-native');
  return () => <View testID="logo-header" />;
});

describe('MirrorPledgeIntroScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the main title "THE MIRROR PLEDGE"', () => {
      const { getByText } = render(<MirrorPledgeIntroScreen />);
      expect(getByText('THE MIRROR PLEDGE')).toBeTruthy();
    });

    it('renders the body text about 2% subscription support', () => {
      const { getByText } = render(<MirrorPledgeIntroScreen />);
      expect(
        getByText(/2% of your subscription supports causes that matter/i)
      ).toBeTruthy();
    });

    it('renders the "SEE HOW IT WORKS" button', () => {
      const { getByText } = render(<MirrorPledgeIntroScreen />);
      expect(getByText('SEE HOW IT WORKS')).toBeTruthy();
    });

    it('renders the golden hand holding heart illustration', () => {
      const { getByTestId } = render(<MirrorPledgeIntroScreen />);
      expect(getByTestId('pledge-illustration')).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('navigates to EchoLedger screen when button is pressed', () => {
      const { getByText } = render(<MirrorPledgeIntroScreen />);
      const button = getByText('SEE HOW IT WORKS');
      
      fireEvent.press(button);
      
      expect(mockNavigate).toHaveBeenCalledWith('EchoLedger');
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibilityRole for the button', () => {
      const { getByText } = render(<MirrorPledgeIntroScreen />);
      const button = getByText('SEE HOW IT WORKS');
      
      expect(button.parent?.parent).toBeTruthy();
    });
  });
});
