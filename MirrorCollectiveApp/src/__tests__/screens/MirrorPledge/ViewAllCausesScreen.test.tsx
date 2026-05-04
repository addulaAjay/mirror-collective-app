import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import ViewAllCausesScreen from '@screens/MirrorPledge/ViewAllCausesScreen';

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

describe('ViewAllCausesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders the main title "VIEW ALL CAUSES"', () => {
      const { getByText } = render(<ViewAllCausesScreen />);
      expect(getByText('VIEW ALL CAUSES')).toBeTruthy();
    });

    it('renders all 7 cause cards', () => {
      const { getByText } = render(<ViewAllCausesScreen />);
      
      expect(getByText("WOMEN'S CANCER")).toBeTruthy();
      expect(getByText('ANIMAL WELFARE')).toBeTruthy();
      expect(getByText('MENTAL HEALTH')).toBeTruthy();
      expect(getByText('ENVIRONMENT')).toBeTruthy();
      expect(getByText('WOMEN + CHILDREN')).toBeTruthy();
      expect(getByText('EDUCATION')).toBeTruthy();
      expect(getByText('HUMAN RIGHTS')).toBeTruthy();
    });

    it('renders cause icons for each card', () => {
      const { getAllByTestId } = render(<ViewAllCausesScreen />);
      const icons = getAllByTestId(/cause-icon-/);
      
      expect(icons.length).toBe(7);
    });
  });

  describe('Row navigation', () => {
    it('does not auto-navigate on mount (auto-nav was removed in Figma rewrite)', () => {
      render(<ViewAllCausesScreen />);
      jest.advanceTimersByTime(5000);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('navigates to CausesCarousel with the cause id when a row is tapped', () => {
      const { getByTestId } = render(<ViewAllCausesScreen />);
      fireEvent.press(getByTestId('cause-row-women-cancer'));
      expect(mockNavigate).toHaveBeenCalledWith('CausesCarousel', {
        initialCauseId: 'women-cancer',
      });
    });
  });

  describe('Card Layout', () => {
    it('displays cards in a grid layout', () => {
      const { getByTestId } = render(<ViewAllCausesScreen />);
      const cardsContainer = getByTestId('causes-grid');
      
      expect(cardsContainer).toBeTruthy();
    });
  });
});
