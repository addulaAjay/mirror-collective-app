import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import QuizQuestionsScreen from './QuizQuestionsScreen';
import { QuizStorageService } from '@services/quizStorageService';

// Mocks
jest.mock('@components/LogoHeader', () => 'LogoHeader');
jest.mock('@components/ProgressBar', () => 'ProgressBar');
jest.mock('@components/GradientButton', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return ({ title, onPress, disabled }: any) => (
    <TouchableOpacity testID="gradient-button" onPress={onPress} disabled={disabled}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
});
jest.mock('@components/OptionsButton', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return ({ label, onPress, selected }: any) => (
    <TouchableOpacity 
      testID={`option-${label.replace(/\s+/g, '-').toLowerCase()}`} 
      onPress={onPress}
      accessibilityState={{ selected }}
    >
      <Text>{label}</Text>
    </TouchableOpacity>
  );
});
jest.mock('@components/ImageOptionButton', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return ({ symbolType, onPress, selected }: any) => (
    <TouchableOpacity 
      testID={`image-option-${symbolType}`} 
      onPress={onPress}
      accessibilityState={{ selected }}
    >
      <Text>{symbolType}</Text>
    </TouchableOpacity>
  );
});

// Mock QuizStorageService
jest.mock('@services/quizStorageService', () => ({
  QuizStorageService: {
    resetQuizState: jest.fn(),
    storePendingQuizResults: jest.fn(),
  },
}));

// Mock questions.json
jest.mock('@assets/questions.json', () => ({
  questions: [
    {
      id: 1,
      question: 'Test Question 1',
      type: 'text',
      options: [
        { text: 'Option A', archetype: 'seeker' },
        { text: 'Option B', archetype: 'guardian' },
      ],
    },
    {
      id: 2,
      question: 'Test Question 2',
      type: 'text',
      options: [
        { text: 'Option C', archetype: 'flamebearer' },
        { text: 'Option D', archetype: 'weaver' },
      ],
    },
  ],
  archetypes: {
    seeker: { id: 'seeker', name: 'Seeker', title: 'The Seeker', imagePath: 'seeker-archetype.png' },
    guardian: { id: 'guardian', name: 'Guardian', title: 'The Guardian', imagePath: 'guardian-archetype.png' },
    flamebearer: { id: 'flamebearer', name: 'Flamebearer', title: 'The Flamebearer', imagePath: 'flamebearer-archetype.png' },
    weaver: { id: 'weaver', name: 'Weaver', title: 'The Weaver', imagePath: 'weaver-archetype.png' },
  },
}));

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

describe('QuizQuestionsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the first question', () => {
    const { getByText } = render(<QuizQuestionsScreen />);

    expect(getByText('Test Question 1')).toBeTruthy();
  });

  it('resets quiz state on mount', async () => {
    render(<QuizQuestionsScreen />);
    
    await waitFor(() => {
      expect(QuizStorageService.resetQuizState).toHaveBeenCalled();
    });
  });

  it('button is disabled initially', () => {
    const { getByTestId } = render(<QuizQuestionsScreen />);
    
    // Button should be disabled without selection
    const nextButton = getByTestId('gradient-button');
    expect(nextButton.props.disabled).toBe(true);
  });
});
