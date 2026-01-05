import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import EnterMirrorScreen from './EnterMirrorScreen';

// Mocks
jest.mock('@components/LogoHeader', () => 'LogoHeader');
jest.mock('@components/StarIcon', () => 'StarIcon');
jest.mock('@components/AuthenticatedRoute', () => {
  return ({ children }: any) => children;
});

describe('EnterMirrorScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(<EnterMirrorScreen navigation={mockNavigation} />);

    expect(getByText(/YOU ARE SEEN/)).toBeTruthy();
    expect(getByText(/YOU ARE HOME/)).toBeTruthy();
    expect(getByText('ENTER')).toBeTruthy();
  });

  it('navigates to MirrorChat on enter press', () => {
    const { getByText } = render(<EnterMirrorScreen navigation={mockNavigation} />);
    
    fireEvent.press(getByText('ENTER'));
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('MirrorChat');
  });
});
