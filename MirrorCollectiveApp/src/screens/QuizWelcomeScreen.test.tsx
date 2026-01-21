import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';

import QuizWelcomeScreen from './QuizWelcomeScreen';

// Mocks
jest.mock('@components/GradientButton', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return ({ title, onPress }: any) => (
    <TouchableOpacity testID="gradient-button" onPress={onPress}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
});
jest.mock('react-native-linear-gradient', () => 'LinearGradient');

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

describe('QuizWelcomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByTestId } = render(<QuizWelcomeScreen />);

    expect(getByText('WELCOME')).toBeTruthy();
    expect(getByText("This isn't a quiz.")).toBeTruthy();
    expect(getByTestId('gradient-button')).toBeTruthy();
  });

  it('navigates to QuizQuestions on button press', () => {
    const { getByTestId } = render(<QuizWelcomeScreen />);
    
    fireEvent.press(getByTestId('gradient-button'));
    
    expect(mockNavigate).toHaveBeenCalledWith('QuizQuestions');
  });
});
