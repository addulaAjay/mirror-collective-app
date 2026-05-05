/**
 * Smoke test for the Quiz Entry screen — verifies canonical copy from §12.2
 * (REFLECTION ROOM eyebrow) and §12.3 (body + Ambient Sounds toggle).
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

(jest.requireMock('react-native') as Record<string, unknown>).Pressable =
  'Pressable';

const mockNavigate = jest.fn();
const mockReplace = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: mockNavigate, replace: mockReplace, goBack: jest.fn() }),
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

import ReflectionRoomQuizEntryScreen from '@screens/reflectionRoom/ReflectionRoomQuizEntryScreen';

describe('ReflectionRoomQuizEntryScreen', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockReplace.mockReset();
  });

  it('renders the REFLECTION ROOM eyebrow (§12.2)', () => {
    const { getByText } = render(<ReflectionRoomQuizEntryScreen />);
    expect(getByText('REFLECTION ROOM')).toBeTruthy();
  });

  it('renders the §12.3 quiz-entry body verbatim', () => {
    const { getByText } = render(<ReflectionRoomQuizEntryScreen />);
    expect(
      getByText(
        /Where awareness turns into real change\. Small moments\. Real change\. Over time\./,
      ),
    ).toBeTruthy();
  });

  it('renders the Ambient Sounds toggle label', () => {
    const { getByText } = render(<ReflectionRoomQuizEntryScreen />);
    expect(getByText('Ambient Sounds')).toBeTruthy();
  });

  it('START button navigates to ReflectionRoomQuiz', () => {
    const { getByLabelText } = render(<ReflectionRoomQuizEntryScreen />);
    fireEvent.press(getByLabelText('Start reflection'));
    expect(mockNavigate).toHaveBeenCalledWith('ReflectionRoomQuiz');
  });
});
