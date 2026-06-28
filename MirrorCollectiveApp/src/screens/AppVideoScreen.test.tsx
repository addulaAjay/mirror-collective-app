import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';

import AppVideoScreen from './AppVideoScreen';

// Mocks
jest.mock('@components/LogoHeader', () => 'LogoHeader');

describe('AppVideoScreen', () => {
  const mockNavigation = {
    reset: jest.fn(),
    navigate: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(<AppVideoScreen navigation={mockNavigation} />);

    expect(getByText('NEXT')).toBeTruthy();
  });

  it('navigates to EnterMirror on next press', () => {
    const { getByText } = render(<AppVideoScreen navigation={mockNavigation} />);

    // Press the NEXT button to advance onboarding
    fireEvent.press(getByText('NEXT'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('EnterMirror');
  });
});
