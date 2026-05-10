/**
 * Tests for TodaysMotif screen.
 *  - Renders motif name uppercase + why_text from JourneyContext.
 *  - In error mode, renders §12.7 RESULTS NOT AVAILABLE state with retry CTA.
 */

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';

(jest.requireMock('react-native') as Record<string, unknown>).Pressable =
  'Pressable';
(jest.requireMock('react-native-svg') as Record<string, unknown>).SvgXml =
  'SvgXml';

const mockReplace = jest.fn();
let mockRouteParams: { error?: boolean } | undefined = {};

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ replace: mockReplace, goBack: jest.fn(), navigate: jest.fn() }),
    useRoute: () => ({ params: mockRouteParams }),
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

import ReflectionRoomTodaysMotifScreen from '@screens/reflectionRoom/ReflectionRoomTodaysMotifScreen';
import { JourneyProvider, useJourney } from '../state/JourneyContext';
import type { MotifPayload } from '../api/types';

const mockMotif: MotifPayload = {
  motif_id: 'spiral',
  motif_name: 'Spiral',
  icon: '🌀',
  element: 'Fire',
  tone_tag: 'Evolution / Integration',
  why_text: 'You’re growing. Even if it feels like you’ve been here before.',
  room_skin: 'Spiral Room',
  scores: { evolution: 4 },
  explanation: ['Q3=spiral'],
  override_allowed: false,
};

const Seed: React.FC<{ motif: MotifPayload | null; children: React.ReactNode }> = ({
  motif,
  children,
}) => {
  const j = useJourney();
  React.useEffect(() => {
    if (motif) j.setSession({ sessionId: 'sess-1', motif });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motif]);
  return <>{children}</>;
};

describe('ReflectionRoomTodaysMotifScreen', () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockRouteParams = {};
    (AsyncStorage.getItem as jest.Mock).mockReset();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
  });

  it('renders TODAY’S MOTIF eyebrow', async () => {
    const { getByText } = render(
      <JourneyProvider>
        <Seed motif={mockMotif}>
          <ReflectionRoomTodaysMotifScreen />
        </Seed>
      </JourneyProvider>,
    );
    await waitFor(() => {
      expect(getByText('TODAY’S MOTIF')).toBeTruthy();
    });
  });

  it('renders the motif name in UPPERCASE and the why_text verbatim', async () => {
    const { getByText } = render(
      <JourneyProvider>
        <Seed motif={mockMotif}>
          <ReflectionRoomTodaysMotifScreen />
        </Seed>
      </JourneyProvider>,
    );
    await waitFor(() => {
      expect(getByText('SPIRAL')).toBeTruthy();
      expect(
        getByText(
          'You’re growing. Even if it feels like you’ve been here before.',
        ),
      ).toBeTruthy();
    });
  });

  it('VIEW SIGNATURE button replaces nav with EchoSignature', async () => {
    const { getByLabelText } = render(
      <JourneyProvider>
        <Seed motif={mockMotif}>
          <ReflectionRoomTodaysMotifScreen />
        </Seed>
      </JourneyProvider>,
    );
    await waitFor(() => {
      fireEvent.press(getByLabelText('View Signature'));
    });
    expect(mockReplace).toHaveBeenCalledWith('ReflectionRoomEchoSignature');
  });

  describe('error state (§12.7)', () => {
    beforeEach(() => {
      mockRouteParams = { error: true };
    });

    it('renders RESULTS NOT AVAILABLE header and §12.7 body', () => {
      const { getByText } = render(
        <JourneyProvider>
          <ReflectionRoomTodaysMotifScreen />
        </JourneyProvider>,
      );
      expect(getByText('RESULTS NOT AVAILABLE')).toBeTruthy();
      expect(
        getByText(
          'We weren’t able to shape your results this time. Let’s try again to uncover your patterns.',
        ),
      ).toBeTruthy();
    });

    it('RETAKE QUIZ replaces nav with QuizEntry', () => {
      const { getByLabelText } = render(
        <JourneyProvider>
          <ReflectionRoomTodaysMotifScreen />
        </JourneyProvider>,
      );
      fireEvent.press(getByLabelText('Retake Quiz'));
      expect(mockReplace).toHaveBeenCalledWith('ReflectionRoomQuizEntry');
    });
  });
});
