import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import QuizTuningScreen from './QuizTuningScreen';

// Mocks
jest.mock('@components/LogoHeader', () => 'LogoHeader');
jest.mock('@components/StarIcon', () => 'StarIcon');

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

describe('QuizTuningScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(<QuizTuningScreen />);

    expect(getByText('quiz.quizTuning.title')).toBeTruthy();
    expect(getByText('quiz.quizTuning.message')).toBeTruthy();
    expect(getByText('quiz.quizTuning.enterButton')).toBeTruthy();
  });

  it('navigates to MirrorChat on enter press', () => {
    const { getByText } = render(<QuizTuningScreen />);
    
    fireEvent.press(getByText('quiz.quizTuning.enterButton'));
    
    expect(mockNavigate).toHaveBeenCalledWith('MirrorChat');
  });
});
