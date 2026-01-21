import { render } from '@testing-library/react-native';
import React from 'react';

import { useAuthGuard } from '@hooks/useAuthGuard';

import AppExplainerScreen from './AppExplainerScreen';


// Mocks
jest.mock('@components/LogoHeader', () => 'LogoHeader');
jest.mock('@hooks/useAuthGuard', () => ({
  useAuthGuard: jest.fn(),
}));

describe('AppExplainerScreen', () => {
  const mockNavigation = {
    replace: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useAuthGuard as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      hasValidToken: false,
      isLoading: false,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders correctly', () => {
    const { getByText } = render(<AppExplainerScreen navigation={mockNavigation} />);

    expect(getByText('auth.appExplainer.videoPlaceholder')).toBeTruthy();
  });

  it('navigates to Login after timer when not authenticated', () => {
    render(<AppExplainerScreen navigation={mockNavigation} />);
    
    jest.advanceTimersByTime(5000);
    
    expect(mockNavigation.replace).toHaveBeenCalledWith('Login');
  });

  it('navigates to EnterMirror after timer when authenticated', () => {
    (useAuthGuard as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      hasValidToken: true,
      isLoading: false,
    });

    render(<AppExplainerScreen navigation={mockNavigation} />);
    
    jest.advanceTimersByTime(5000);
    
    expect(mockNavigation.replace).toHaveBeenCalledWith('EnterMirror');
  });
});
