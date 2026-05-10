/**
 * Smoke tests for the Quiz screen.
 *  - Q1 prompt renders verbatim (§12.4).
 *  - Selecting an answer enables NEXT.
 *  - On Q4 finish, navigates to ReflectionRoomLoading with the answers.
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

(jest.requireMock('react-native') as Record<string, unknown>).Pressable =
  'Pressable';
(jest.requireMock('react-native-svg') as Record<string, unknown>).SvgXml =
  'SvgXml';

const mockNavigate = jest.fn();
const mockReplace = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      replace: mockReplace,
      goBack: mockGoBack,
    }),
    useRoute: () => ({ params: {} }),
    useFocusEffect: jest.fn(),
  };
});

jest.mock('@components/BackgroundWrapper', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: ({ children }: any) => <View>{children}</View> };
});

jest.mock('@components/LogoHeader', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: () => <View testID="logo-header" /> };
});

jest.mock('@components/ProgressBar', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: () => <View testID="progress-bar" /> };
});

import ReflectionRoomQuizScreen from '@screens/reflectionRoom/ReflectionRoomQuizScreen';

describe('ReflectionRoomQuizScreen', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockReplace.mockReset();
    mockGoBack.mockReset();
  });

  it('renders the canonical Q1 prompt verbatim', () => {
    const { getByText } = render(<ReflectionRoomQuizScreen />);
    expect(getByText('How are you arriving today?')).toBeTruthy();
  });

  it('renders Q1 footer microcopy ("the word that resonates")', () => {
    const { getByText } = render(<ReflectionRoomQuizScreen />);
    expect(
      getByText('Choose the word that resonates. There’s no right answer.'),
    ).toBeTruthy();
  });

  it('NEXT is disabled until an option is selected', () => {
    const { getByLabelText } = render(<ReflectionRoomQuizScreen />);
    const next = getByLabelText('Next question');
    expect(next.props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('selecting an answer enables NEXT', () => {
    const { getByLabelText } = render(<ReflectionRoomQuizScreen />);
    fireEvent.press(getByLabelText('CURIOUS'));
    const next = getByLabelText('Next question');
    expect(next.props.accessibilityState).toMatchObject({ disabled: false });
  });

  it('back button on Q1 calls navigation.goBack', () => {
    const { getByLabelText } = render(<ReflectionRoomQuizScreen />);
    fireEvent.press(getByLabelText('Back'));
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('walks through all 4 questions and finishes with a replace to Loading', () => {
    const { getByLabelText, getByText } = render(<ReflectionRoomQuizScreen />);

    // Q1 — pick CURIOUS
    fireEvent.press(getByLabelText('CURIOUS'));
    fireEvent.press(getByLabelText('Next question'));

    // Q2 — pick CLARITY
    expect(
      getByText(
        'What intention would you like to bring into your Reflection Room today?',
      ),
    ).toBeTruthy();
    fireEvent.press(getByLabelText('CLARITY'));
    fireEvent.press(getByLabelText('Next question'));

    // Q3 — pick SPIRAL (motif)
    expect(getByText('Which of these speaks to you the most today?')).toBeTruthy();
    fireEvent.press(getByLabelText('SPIRAL'));
    fireEvent.press(getByLabelText('Next question'));

    // Q4 — pick REFLECTIVE INSIGHT
    expect(getByText('What kind of message would help right now?')).toBeTruthy();
    fireEvent.press(getByLabelText('REFLECTIVE INSIGHT'));
    fireEvent.press(getByLabelText('Finish quiz'));

    expect(mockReplace).toHaveBeenCalledWith('ReflectionRoomLoading', {
      answers: {
        q1: 'curious',
        q2: 'clarity',
        q3: 'spiral',
        q4: 'insight',
      },
    });
  });
});
