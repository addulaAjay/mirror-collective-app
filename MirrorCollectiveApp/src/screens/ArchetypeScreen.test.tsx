import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';

import ArchetypeScreen from './ArchetypeScreen';


// Mock dependencies
jest.mock('@components/LogoHeader', () => 'LogoHeader');

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

describe('ArchetypeScreen', () => {
  const mockRoute = {
    params: {
      archetype: {
        name: 'The Creator',
        title: 'The Creator Title',
        description: 'First paragraph.\n\nSecond paragraph.',
        image: { uri: 'test-image' },
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders archetype details correctly', () => {
    const { getByText, getByTestId } = render(<ArchetypeScreen route={mockRoute as any} />);

    expect(getByTestId('archetype-title')).toBeTruthy();
    expect(getByText('The Creator Title')).toBeTruthy();

    expect(getByTestId('archetype-image')).toBeTruthy();

    expect(getByTestId('archetype-description')).toBeTruthy();
    expect(getByText('First paragraph.')).toBeTruthy();
    expect(getByText('Second paragraph.')).toBeTruthy();

    expect(getByTestId('archetype-continue-text')).toBeTruthy();
    // Check for translation key if i18n mock returns key
    expect(getByText('auth.archetype.continuePrompt')).toBeTruthy();
  });

  it('navigates to QuizTuning on press', () => {
    const { getByTestId } = render(<ArchetypeScreen route={mockRoute as any} />);
    
    fireEvent.press(getByTestId('archetype-container'));
    
    expect(mockNavigate).toHaveBeenCalledWith('QuizTuning');
  });
});
