import { render } from '@testing-library/react-native';
import React from 'react';

import QuizTuningScreen from './QuizTuningScreen';

// Mocks
jest.mock('@components/LogoHeader', () => 'LogoHeader');
jest.mock('@components/StarIcon', () => 'StarIcon');

// Mock Navigation
const mockNavigate = jest.fn();
const mockReplace = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    replace: mockReplace,
  }),
  useRoute: () => ({ params: {} }),
}));

describe('QuizTuningScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(<QuizTuningScreen />);

    expect(getByText('quiz.quizTuning.title')).toBeTruthy();
    expect(getByText('quiz.quizTuning.message')).toBeTruthy();
    expect(getByText('quiz.quizTuning.subMessage')).toBeTruthy();
  });

  it('auto-navigates to Archetype after the tuning delay', () => {
    jest.useFakeTimers();

    render(<QuizTuningScreen />);

    jest.advanceTimersByTime(2000);

    expect(mockReplace).toHaveBeenCalledWith('Archetype', expect.any(Object));

    jest.useRealTimers();
  });
});
