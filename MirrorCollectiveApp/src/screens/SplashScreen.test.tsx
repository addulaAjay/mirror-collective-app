import { render, act } from '@testing-library/react-native';
import React from 'react';

import SplashScreen from './SplashScreen';

describe('SplashScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockNavigation = {
    replace: jest.fn(),
    navigate: jest.fn(),
  } as any;

  it('renders correctly', () => {
    const { toJSON } = render(<SplashScreen navigation={mockNavigation} />);

    // Splash shows only the circular logo mark + header text SVG (no copy text).
    expect(toJSON()).toBeTruthy();
  });

  it('navigates to MirrorAnimation after timer', () => {
    render(<SplashScreen navigation={mockNavigation} />);

    // Fast-forward the 3s splash timer synchronously
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(mockNavigation.replace).toHaveBeenCalledWith('MirrorAnimation');
  });
});
