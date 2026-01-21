import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';

import AppVideoScreen from './AppVideoScreen';

// Mocks
jest.mock('@components/LogoHeader', () => 'LogoHeader');

describe('AppVideoScreen', () => {
  const mockNavigation = {
    reset: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(<AppVideoScreen navigation={mockNavigation} />);

    expect(getByText(/App explainer/)).toBeTruthy();
  });

  it('navigates to EmailConfirmation on video press', () => {
    const { getByText } = render(<AppVideoScreen navigation={mockNavigation} />);
    
    // Press the video placeholder area
    fireEvent.press(getByText(/App explainer/));
    
    expect(mockNavigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'EmailConfirmation' }],
    });
  });
});
