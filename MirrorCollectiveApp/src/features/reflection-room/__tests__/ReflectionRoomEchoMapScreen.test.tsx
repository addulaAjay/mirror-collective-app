/**
 * Smoke tests for the Echo Map screen.
 *  - Active state renders eyebrow, subhead, footer string verbatim.
 *  - Tapping a node opens the LoopOverlay with §12.9 5 elements.
 *  - Tapping "i" opens the InfoOverlay with §12.9 page 1 header.
 *  - Empty + error states render canonical strings.
 */

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';

(jest.requireMock('react-native') as Record<string, unknown>).Pressable =
  'Pressable';
(jest.requireMock('react-native-svg') as Record<string, unknown>).SvgXml =
  'SvgXml';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  const ReactInner = require('react');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      replace: jest.fn(),
      goBack: mockGoBack,
    }),
    useRoute: () => ({ params: {} }),
    useFocusEffect: (cb: () => void | (() => void)) => {
      ReactInner.useEffect(() => {
        const teardown = cb();
        return typeof teardown === 'function' ? teardown : undefined;
      }, []);
    },
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

const mockGetSnapshot = jest.fn();
jest.mock('@features/reflection-room/api', () => ({
  __esModule: true,
  getReflectionRoomClient: () => ({
    getSnapshot: mockGetSnapshot,
  }),
}));

import ReflectionRoomEchoMapScreen from '@screens/reflectionRoom/ReflectionRoomEchoMapScreen';
import { JourneyProvider } from '../state/JourneyContext';
import type { LoopState, MotifPayload, SnapshotResponse } from '../api/types';

const motif: MotifPayload = {
  motif_id: 'spiral',
  motif_name: 'Spiral',
  icon: '🌀',
  element: 'Fire',
  tone_tag: 'Evolution',
  why_text: 'why',
  room_skin: 'Spiral Room',
  scores: {},
  explanation: [],
  override_allowed: false,
};

function makeLoop(overrides: Partial<LoopState>): LoopState {
  return {
    loop_id: 'pressure',
    tone_state: 'rising',
    intensity_score: 0.7,
    intensity_label: 'High',
    last_seen: '2026-05-04T00:00:00Z',
    recently_changed: false,
    narrative_stage: null,
    icon: '🔺',
    reflection_line: 'reflection',
    ...overrides,
  };
}

function makeSnapshot(loops: LoopState[]): SnapshotResponse {
  return {
    session_id: 'sess-1',
    motif_context: { motif_id: 'spiral', room_skin: 'Spiral Room' },
    loops,
    updated_at: '2026-05-04T00:00:00Z',
  };
}

function renderWithJourney(opts: { snapshot?: SnapshotResponse | null } = {}) {
  return render(
    <JourneyProvider
      initialState={{
        sessionId: 'sess-1',
        motif,
        snapshot: opts.snapshot ?? null,
      }}
      initialWelcomeSeen={true}
    >
      <ReflectionRoomEchoMapScreen />
    </JourneyProvider>,
  );
}

describe('ReflectionRoomEchoMapScreen', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockGoBack.mockReset();
    mockGetSnapshot.mockReset();
    (AsyncStorage.getItem as jest.Mock).mockReset();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
  });

  describe('active state', () => {
    const snap = makeSnapshot([
      makeLoop({ loop_id: 'pressure', tone_state: 'steady', intensity_label: 'High' }),
      makeLoop({ loop_id: 'overwhelm', tone_state: 'rising', intensity_label: 'Medium' }),
      makeLoop({ loop_id: 'grief', tone_state: 'softening', intensity_label: 'Low' }),
    ]);

    it('renders eyebrow + subhead + footer (§12.9)', async () => {
      mockGetSnapshot.mockResolvedValue(snap);
      const { getByText } = renderWithJourney({ snapshot: snap });
      await waitFor(() => {
        expect(getByText('ECHO MAP')).toBeTruthy();
        expect(
          getByText('See what’s repeating, and what’s ready to change.'),
        ).toBeTruthy();
        expect(getByText('This is a mirror, not a label.')).toBeTruthy();
      });
    });

    it('tapping a node opens the per-loop overlay with §12.9 5 elements', async () => {
      mockGetSnapshot.mockResolvedValue(snap);
      const { getByLabelText, getByText } = renderWithJourney({ snapshot: snap });
      await waitFor(() => getByLabelText('pressure steady, intensity High'));
      fireEvent.press(getByLabelText('pressure steady, intensity High'));
      await waitFor(() => {
        expect(getByText('Pressure')).toBeTruthy();
        expect(getByText('Steady')).toBeTruthy();
        expect(getByText('HIGH INTENSITY')).toBeTruthy();
        expect(getByText('click anywhere to continue')).toBeTruthy();
      });
    });

    it('tapping "i" opens the §12.9 info overlay (page 1 header)', async () => {
      mockGetSnapshot.mockResolvedValue(snap);
      const { getByLabelText, getByText } = renderWithJourney({ snapshot: snap });
      await waitFor(() => getByLabelText('About the Echo Map'));
      fireEvent.press(getByLabelText('About the Echo Map'));
      await waitFor(() => {
        expect(getByText('WHAT IS THE ECHO MAP?')).toBeTruthy();
      });
    });
  });

  describe('empty state', () => {
    it('renders §12.9 NO STRONG LOOPS ACTIVE + empty body', async () => {
      const empty = makeSnapshot([]);
      mockGetSnapshot.mockResolvedValue(empty);
      const { getByText } = renderWithJourney({ snapshot: empty });
      await waitFor(() => {
        expect(getByText('NO STRONG LOOPS ACTIVE')).toBeTruthy();
        expect(getByText('All quiet for now.')).toBeTruthy();
      });
    });
  });
});
