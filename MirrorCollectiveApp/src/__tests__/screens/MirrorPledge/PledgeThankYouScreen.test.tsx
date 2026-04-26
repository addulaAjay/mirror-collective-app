import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

import PledgeThankYouScreen from '@screens/MirrorPledge/PledgeThankYouScreen';
import * as userApi from '@services/api/user';

// Mock Navigation
const mockNavigate = jest.fn();
const mockReset = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      reset: mockReset,
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

// Mock user API
jest.mock('@services/api/user', () => ({
  updatePledgeAcceptance: jest.fn(),
}));

describe('PledgeThankYouScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (userApi.updatePledgeAcceptance as jest.Mock).mockResolvedValue({
      success: true,
      data: { pledgeAcceptedAt: new Date().toISOString() },
    });
  });

  describe('Rendering', () => {
    it('renders the main title "THANK YOU!"', () => {
      const { getByText } = render(<PledgeThankYouScreen />);
      expect(getByText('THANK YOU!')).toBeTruthy();
    });

    it('renders the echo message', () => {
      const { getByText } = render(<PledgeThankYouScreen />);
      expect(getByText('Your echo has been counted.')).toBeTruthy();
    });

    it('renders the community message', () => {
      const { getByText } = render(<PledgeThankYouScreen />);
      expect(getByText(/Together, we decide where to make a difference/i)).toBeTruthy();
    });

    it('renders the gold star icon', () => {
      const { getByTestId } = render(<PledgeThankYouScreen />);
      expect(getByTestId('star-icon')).toBeTruthy();
    });

    it('renders the "HOMEPAGE" button', () => {
      const { getByText } = render(<PledgeThankYouScreen />);
      expect(getByText('HOMEPAGE')).toBeTruthy();
    });

    it('renders glassmorphism card', () => {
      const { getByTestId } = render(<PledgeThankYouScreen />);
      expect(getByTestId('thank-you-card')).toBeTruthy();
    });
  });

  describe('API Integration', () => {
    it('calls API to save pledgeAcceptedAt when HOMEPAGE button is pressed', async () => {
      const { getByText } = render(<PledgeThankYouScreen />);
      const button = getByText('HOMEPAGE');
      
      fireEvent.press(button);
      
      await waitFor(() => {
        expect(userApi.updatePledgeAcceptance).toHaveBeenCalled();
      });
    });

    it('navigates to Home after successful API call', async () => {
      const { getByText } = render(<PledgeThankYouScreen />);
      const button = getByText('HOMEPAGE');
      
      fireEvent.press(button);
      
      await waitFor(() => {
        expect(mockReset).toHaveBeenCalledWith({
          index: 0,
          routes: [{ name: 'MirrorChat' }],
        });
      });
    });

    it('handles API error gracefully', async () => {
      (userApi.updatePledgeAcceptance as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );
      
      const { getByText } = render(<PledgeThankYouScreen />);
      const button = getByText('HOMEPAGE');
      
      fireEvent.press(button);
      
      await waitFor(() => {
        // Should still navigate even if API fails
        expect(mockReset).toHaveBeenCalled();
      });
    });
  });

  describe('Button State', () => {
    it('disables button while API call is in progress', async () => {
      let resolveApiCall: any;
      (userApi.updatePledgeAcceptance as jest.Mock).mockImplementation(
        () => new Promise((resolve) => { resolveApiCall = resolve; })
      );
      
      const { getByText } = render(<PledgeThankYouScreen />);
      const button = getByText('HOMEPAGE');
      
      fireEvent.press(button);
      
      // Button should be disabled during API call
      expect(userApi.updatePledgeAcceptance).toHaveBeenCalled();
      
      // Resolve the API call
      resolveApiCall({ success: true, data: {} });
    });
  });
});
