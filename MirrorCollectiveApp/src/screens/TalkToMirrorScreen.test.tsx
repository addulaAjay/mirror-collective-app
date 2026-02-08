import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TalkToMirrorScreen from './TalkToMirrorScreen';
import { Alert } from 'react-native';

// Mocks
jest.mock('@components/LogoHeader', () => 'LogoHeader');
jest.mock('@components/StarIcon', () => 'StarIcon');

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('TalkToMirrorScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(<TalkToMirrorScreen navigation={mockNavigation} />);

    expect(getByText('Welcome back, Friend')).toBeTruthy();
    expect(getByText('TALK TO MIRROR')).toBeTruthy();
    expect(getByText('CODE LIBRARY')).toBeTruthy();
    expect(getByText('MIRROR ECHO')).toBeTruthy();
  });

  it('navigates to MirrorChat on talk press', () => {
    const { getByText } = render(<TalkToMirrorScreen navigation={mockNavigation} />);
    
    fireEvent.press(getByText('TALK TO MIRROR'));
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('MirrorChat');
  });

  it('shows coming soon alert on menu press', () => {
    const { getByText } = render(<TalkToMirrorScreen navigation={mockNavigation} />);
    
    fireEvent.press(getByText('CODE LIBRARY'));
    
    expect(Alert.alert).toHaveBeenCalledWith('Coming Soon', 'CODE LIBRARY will be available shortly.');
  });
});
