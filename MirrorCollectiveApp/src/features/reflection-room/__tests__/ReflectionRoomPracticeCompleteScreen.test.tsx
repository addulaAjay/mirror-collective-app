/**
 * Smoke tests for the Practice Complete screen.
 *  - Renders §12.10 complete header + body verbatim.
 *  - Three CTAs render and route correctly.
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

(jest.requireMock('react-native') as Record<string, unknown>).Pressable =
  'Pressable';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn(), replace: jest.fn() }),
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

import ReflectionRoomPracticeCompleteScreen from '@screens/reflectionRoom/ReflectionRoomPracticeCompleteScreen';

describe('ReflectionRoomPracticeCompleteScreen', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('renders the §12.10 complete header verbatim', () => {
    const { getByText } = render(<ReflectionRoomPracticeCompleteScreen />);
    expect(getByText('PRACTICE COMPLETE')).toBeTruthy();
  });

  it('renders the §12.10 complete body verbatim', () => {
    const { getByText } = render(<ReflectionRoomPracticeCompleteScreen />);
    expect(
      getByText(
        'Nice. You noticed it. You shifted it. The more you notice, the easier it gets to choose differently.',
      ),
    ).toBeTruthy();
  });

  it('renders three §12.10 post-complete CTAs', () => {
    const { getByText } = render(<ReflectionRoomPracticeCompleteScreen />);
    expect(getByText('Back to Reflection Room')).toBeTruthy();
    expect(getByText('Back Home')).toBeTruthy();
    expect(getByText('View Updated Echo Map')).toBeTruthy();
  });

  it('Back to Reflection Room navigates to ReflectionRoom', () => {
    const { getByLabelText } = render(<ReflectionRoomPracticeCompleteScreen />);
    fireEvent.press(getByLabelText('Back to Reflection Room'));
    expect(mockNavigate).toHaveBeenCalledWith('ReflectionRoom');
  });

  it('Back Home navigates to EnterMirror', () => {
    const { getByLabelText } = render(<ReflectionRoomPracticeCompleteScreen />);
    fireEvent.press(getByLabelText('Back Home'));
    expect(mockNavigate).toHaveBeenCalledWith('EnterMirror');
  });

  it('View Updated Echo Map navigates to ReflectionRoomEchoMap', () => {
    const { getByLabelText } = render(<ReflectionRoomPracticeCompleteScreen />);
    fireEvent.press(getByLabelText('View Updated Echo Map'));
    expect(mockNavigate).toHaveBeenCalledWith('ReflectionRoomEchoMap');
  });
});
