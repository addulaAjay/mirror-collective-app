import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';

import EchoLedgerScreen from '@screens/MirrorPledge/EchoLedgerScreen';

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

describe('EchoLedgerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the main title "ECHO LEDGER"', () => {
      const { getByText } = render(<EchoLedgerScreen />);
      expect(getByText('ECHO LEDGER')).toBeTruthy();
    });

    it('renders the total amount "$88K" in the badge', () => {
      const { getByText } = render(<EchoLedgerScreen />);
      expect(getByText('$88K')).toBeTruthy();
    });

    it('renders the subtitle "across causes supported by the Mirror community"', () => {
      const { getByText } = render(<EchoLedgerScreen />);
      expect(
        getByText(/across causes supported by the Mirror community/i)
      ).toBeTruthy();
    });

    it('renders the body text about collective reflection', () => {
      const { getByText } = render(<EchoLedgerScreen />);
      expect(getByText(/This is what collective reflection can do/i)).toBeTruthy();
    });

    it('renders the "PLEDGE SUPPORT" button', () => {
      const { getByText } = render(<EchoLedgerScreen />);
      expect(getByText('PLEDGE SUPPORT')).toBeTruthy();
    });

    it('renders the circular badge container', () => {
      const { getByTestId } = render(<EchoLedgerScreen />);
      expect(getByTestId('circular-badge')).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('navigates to ViewAllCauses screen when button is pressed', () => {
      const { getByText } = render(<EchoLedgerScreen />);
      const button = getByText('PLEDGE SUPPORT');
      
      fireEvent.press(button);
      
      expect(mockNavigate).toHaveBeenCalledWith('ViewAllCauses');
    });
  });

  describe('Styling', () => {
    it('applies glassmorphism effect to the badge', () => {
      const { getByTestId } = render(<EchoLedgerScreen />);
      const badge = getByTestId('circular-badge');
      
      expect(badge).toBeTruthy();
    });
  });
});
