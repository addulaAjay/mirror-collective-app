import React from 'react';
import { render } from '@testing-library/react-native';
import MirrorAnimationScreen from './MirrorAnimationScreen';
import { useAuthGuard } from '@hooks/useAuthGuard';

jest.mock('@hooks/useAuthGuard', () => ({
  useAuthGuard: jest.fn(),
}));

describe('MirrorAnimationScreen', () => {
  const mockNavigation = {
    replace: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthGuard as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      hasValidToken: false,
    });
  });

  it('renders correctly', () => {
    const { toJSON } = render(<MirrorAnimationScreen navigation={mockNavigation} />);
    expect(toJSON()).toBeTruthy();
  });

  it('checks authentication state on render', () => {
    render(<MirrorAnimationScreen navigation={mockNavigation} />);
    expect(useAuthGuard).toHaveBeenCalled();
  });
});
