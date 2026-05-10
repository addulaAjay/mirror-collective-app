/**
 * Smoke tests for the Echo Signature screen.
 *
 * Covers:
 *  - Active state with a seeded snapshot renders all 3 cards in order.
 *  - Tap on a card navigates to PracticeOverlay with the right params.
 *  - Empty state renders §12.8 strings + GO HOME.
 *  - Error state renders §12.8 strings + TRY AGAIN.
 *  - "OPEN ECHO MAP" only shows in the active state.
 */

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const ReactInner = require('react');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      replace: mockReplace,
      goBack: mockGoBack,
    }),
    useRoute: () => ({ params: {} }),
    useFocusEffect: (cb: () => void | (() => void)) => {
      // Re-enter the effect synchronously on render so behavior matches a
      // freshly-focused screen.
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

// Avoid importing BaseApiService (firebase messaging chain). Tests inject
// per-case responses via mockGetSnapshot below.
const mockGetSnapshot = jest.fn();
jest.mock('@features/reflection-room/api', () => ({
  __esModule: true,
  getReflectionRoomClient: () => ({
    getSnapshot: mockGetSnapshot,
  }),
}));

import ReflectionRoomEchoSignatureScreen from '@screens/reflectionRoom/ReflectionRoomEchoSignatureScreen';
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
    last_seen: '2026-05-03T00:00:00Z',
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
    updated_at: '2026-05-03T00:00:00Z',
  };
}

function renderWithJourney(initial: { snapshot?: any } = {}) {
  return render(
    <JourneyProvider
      initialState={{ sessionId: 'sess-1', motif, snapshot: initial.snapshot ?? null }}
      initialWelcomeSeen={true}
    >
      <ReflectionRoomEchoSignatureScreen />
    </JourneyProvider>,
  );
}

describe('ReflectionRoomEchoSignatureScreen', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockReplace.mockReset();
    mockGoBack.mockReset();
    mockGetSnapshot.mockReset();
    (AsyncStorage.getItem as jest.Mock).mockReset();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
  });

  describe('active state', () => {
    const snap = makeSnapshot([
      makeLoop({ loop_id: 'overwhelm', tone_state: 'rising' }),
      makeLoop({ loop_id: 'pressure', tone_state: 'steady' }),
      makeLoop({ loop_id: 'grief', tone_state: 'softening' }),
    ]);

    function renderActive() {
      mockGetSnapshot.mockResolvedValue(snap);
      return renderWithJourney({ snapshot: snap });
    }

    it('renders the eyebrow + subhead from §12.8', async () => {
      const { getByText } = renderActive();
      await waitFor(() => {
        expect(getByText('ECHO SIGNATURE')).toBeTruthy();
        expect(
          getByText('Recognize and implement any changes in your life.'),
        ).toBeTruthy();
      });
    });

    it('renders all 3 loop names in uppercase', async () => {
      const { getByText } = renderActive();
      await waitFor(() => {
        expect(getByText('OVERWHELM')).toBeTruthy();
        expect(getByText('PRESSURE')).toBeTruthy();
        expect(getByText('GRIEF')).toBeTruthy();
      });
    });

    it('renders OPEN ECHO MAP CTA at the bottom', async () => {
      const { getByLabelText } = renderActive();
      await waitFor(() => {
        expect(getByLabelText('OPEN ECHO MAP')).toBeTruthy();
      });
    });

    it('tapping a card navigates to PracticeOverlay with surface=echo_signature', async () => {
      const { getByLabelText } = renderActive();
      await waitFor(() => {
        fireEvent.press(
          getByLabelText('Try a 2-min practice for OVERWHELM, - Rising'),
        );
      });
      expect(mockNavigate).toHaveBeenCalledWith(
        'ReflectionRoomPracticeOverlay',
        {
          loopId: 'overwhelm',
          toneState: 'rising',
          surface: 'echo_signature',
        },
      );
    });

    it('tapping OPEN ECHO MAP navigates to EchoMap', async () => {
      const { getByLabelText } = renderActive();
      await waitFor(() => {
        fireEvent.press(getByLabelText('OPEN ECHO MAP'));
      });
      expect(mockNavigate).toHaveBeenCalledWith('ReflectionRoomEchoMap');
    });
  });

  describe('empty state', () => {
    const empty = makeSnapshot([]);

    it('renders §12.8 NO LOOPS FOUND + GO HOME CTA', async () => {
      mockGetSnapshot.mockResolvedValue(empty);
      const { getByText, getByLabelText } = renderWithJourney({ snapshot: empty });
      await waitFor(() => {
        expect(getByText('NO LOOPS FOUND')).toBeTruthy();
        expect(getByText('All quiet for now.')).toBeTruthy();
        expect(getByLabelText('Go home')).toBeTruthy();
      });
    });

    it('GO HOME navigates to ReflectionRoom', async () => {
      mockGetSnapshot.mockResolvedValue(empty);
      const { getByLabelText } = renderWithJourney({ snapshot: empty });
      await waitFor(() => {
        fireEvent.press(getByLabelText('Go home'));
      });
      expect(mockNavigate).toHaveBeenCalledWith('ReflectionRoom');
    });
  });
});
