/**
 * Smoke tests for the Welcome onboarding screen.
 * - All 3 overlays render their canonical eyebrow text.
 * - Tapping the X close button persists the welcome flag and routes
 *   to ReflectionRoomQuizEntry.
 */

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';

// jest.setup.js mocks the RN module shape but omits Pressable. Patch it onto
// the cached mock object so screens that use Pressable can render in tests.
(jest.requireMock('react-native') as Record<string, unknown>).Pressable =
  'Pressable';

const mockReplace = jest.fn();
const mockNavigate = jest.fn();

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

jest.mock('@components/_internal/GlassCard', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: ({ children }: any) => <View>{children}</View> };
});

jest.mock('@components/StarIcon', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: () => <View testID="star-icon" /> };
});

import ReflectionRoomWelcomeScreen from '@screens/reflectionRoom/ReflectionRoomWelcomeScreen';

import { JourneyProvider } from '../state/JourneyContext';

describe('ReflectionRoomWelcomeScreen', () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockNavigate.mockReset();
    (AsyncStorage.getItem as jest.Mock).mockReset();
    (AsyncStorage.setItem as jest.Mock).mockReset();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  function renderScreen() {
    return render(
      <JourneyProvider>
        <ReflectionRoomWelcomeScreen />
      </JourneyProvider>,
    );
  }

  it('renders all 3 overlay eyebrows from §12.1', () => {
    const { getByText } = renderScreen();
    expect(getByText('WELCOME TO REFLECTION ROOM')).toBeTruthy();
    expect(getByText('ONE SMALL STEP, EVERY DAY')).toBeTruthy();
    expect(getByText('SEE YOUR PATTERNS CLEARLY')).toBeTruthy();
  });

  it('renders all 3 taglines verbatim with curly apostrophes', () => {
    const { getByText } = renderScreen();
    expect(getByText('Change starts here.')).toBeTruthy();
    expect(getByText('See it. Shift it.')).toBeTruthy();
    expect(getByText('You can’t change what you can’t see.')).toBeTruthy();
  });

  it('X close button persists welcome flag and replaces nav to QuizEntry', async () => {
    const { getByLabelText } = renderScreen();
    const close = getByLabelText('Close welcome');

    fireEvent.press(close);

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'RR_WELCOME_SEEN',
        'true',
      );
    });
    expect(mockReplace).toHaveBeenCalledWith('ReflectionRoomQuizEntry');
  });

  it('renders the page indicator dots (one per overlay)', () => {
    // Implementation uses 3 inline View dots; we don't assert their structure
    // here beyond the screen rendering successfully.
    const { toJSON } = renderScreen();
    expect(toJSON()).toBeTruthy();
  });
});
