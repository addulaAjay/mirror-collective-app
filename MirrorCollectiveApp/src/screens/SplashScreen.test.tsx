import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import SplashScreen from './SplashScreen';
import { authApiService } from '@services/api';

// Mocks
jest.mock('@services/api', () => ({
  authApiService: {
    clearTokens: jest.fn(),
  },
}));

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
    const { getByText } = render(<SplashScreen navigation={mockNavigation} />);

    expect(getByText('The MIRROR COLLECTIVE')).toBeTruthy();
  });

  it('clears tokens on mount', async () => {
    render(<SplashScreen navigation={mockNavigation} />);
    
    await waitFor(() => {
      expect(authApiService.clearTokens).toHaveBeenCalled();
    });
  });

  it('navigates to MirrorAnimation after timer', async () => {
    render(<SplashScreen navigation={mockNavigation} />);
    
    // Wait for async initialization to complete
    await waitFor(() => {
      expect(authApiService.clearTokens).toHaveBeenCalled();
    });
    
    // Fast-forward timer synchronously
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    expect(mockNavigation.replace).toHaveBeenCalledWith('MirrorAnimation');
  });
});
