import { render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { QuizStorageService } from '@services/quizStorageService';

import QuizQuestionsScreen from './QuizQuestionsScreen';

// The shared jest.setup.js react-native mock does not export `Pressable`, so it
// resolves to `undefined`. The screen's CTA row renders <Pressable>, which makes
// the loaded-question state throw "Element type is invalid ... got: undefined"
// (the loading state has no Pressable, so it renders fine). Patch the mocked RN
// module for this suite only — `Pressable` is read lazily at render time, so
// assigning it before any render is sufficient. (A cleaner global fix would be
// adding `Pressable: 'Pressable'` to src/__tests__/jest.setup.js.)
const ReactNativeMock = require('react-native');
if (!ReactNativeMock.Pressable) {
  ReactNativeMock.Pressable = 'Pressable';
}

// Mocks
jest.mock('@components/LogoHeader', () => 'LogoHeader');
jest.mock('@components/ProgressBar', () => 'ProgressBar');
jest.mock('@components/Button', () => {
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

// Mock the quiz API service. This also short-circuits a circular-import chain:
// the real quiz.ts → base.ts → tokenManager → @services/api index → auth.ts,
// which evaluates `class AuthApiService extends BaseApiService` before base.ts
// has finished exporting BaseApiService ("Super expression must either be null
// or a function"). Mocking quiz.ts means none of that chain is loaded.
jest.mock('@services/api/quiz', () => ({
  quizApiService: {
    getQuestions: jest.fn().mockResolvedValue({
      success: true,
      data: [
        {
          id: 1,
          question: 'Test Question 1',
          type: 'text',
          core: true,
          options: [
            { text: 'Option A' },
            { text: 'Option B' },
          ],
        },
      ],
    }),
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

  it('renders the first question', async () => {
    // Questions are fetched asynchronously, so the screen mounts in a loading
    // state — wait for the question to appear.
    const { findByText } = render(<QuizQuestionsScreen />);

    expect(await findByText('Test Question 1')).toBeTruthy();
  });

  it('resets quiz state on mount', async () => {
    render(<QuizQuestionsScreen />);
    
    await waitFor(() => {
      expect(QuizStorageService.resetQuizState).toHaveBeenCalled();
    });
  });

  it('button is disabled initially', async () => {
    const { findByTestId } = render(<QuizQuestionsScreen />);

    // Wait past the async loading state before asserting on the CTA.
    const nextButton = await findByTestId('gradient-button');
    expect(nextButton.props.disabled).toBe(true);
  });
});
