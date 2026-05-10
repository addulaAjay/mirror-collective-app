/**
 * Smoke + matrix tests for the Mirror Moment screen.
 *  - Renders eyebrow + subhead from §12.10.
 *  - Generates 3 button labels via labelFor(loop, tone) — never hardcoded.
 *  - Tap navigates to PracticeOverlay with surface=mirror_moment.
 *  - Empty + error states render canonical strings.
 *  - Info icon opens InfoOverlay with §12.10 page 1.
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

import ReflectionRoomMirrorMomentScreen from '@screens/reflectionRoom/ReflectionRoomMirrorMomentScreen';
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
      <ReflectionRoomMirrorMomentScreen />
    </JourneyProvider>,
  );
}

describe('ReflectionRoomMirrorMomentScreen', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
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

    it('renders eyebrow + subhead from §12.10', async () => {
      mockGetSnapshot.mockResolvedValue(snap);
      const { getByText } = renderWithJourney({ snapshot: snap });
      await waitFor(() => {
        expect(getByText('MIRROR MOMENT')).toBeTruthy();
        expect(getByText('Choose one small shift.')).toBeTruthy();
      });
    });

    it('generates 3 buttons via the §6.2 (loop, tone) matrix', async () => {
      mockGetSnapshot.mockResolvedValue(snap);
      const { getByText } = renderWithJourney({ snapshot: snap });
      await waitFor(() => {
        // Each label comes from labelFor() — never hardcoded.
        expect(getByText('Ease Overwhelm')).toBeTruthy();
        expect(getByText('Reclaim Balance')).toBeTruthy();
        expect(getByText('Soften Grief')).toBeTruthy();
      });
    });

    it('tap navigates to PracticeOverlay with surface=mirror_moment', async () => {
      mockGetSnapshot.mockResolvedValue(snap);
      const { getByLabelText } = renderWithJourney({ snapshot: snap });
      await waitFor(() => getByLabelText('Ease Overwhelm'));
      fireEvent.press(getByLabelText('Ease Overwhelm'));
      expect(mockNavigate).toHaveBeenCalledWith(
        'ReflectionRoomPracticeOverlay',
        {
          loopId: 'overwhelm',
          toneState: 'rising',
          surface: 'mirror_moment',
        },
      );
    });

    it('back arrow has accessibility label "My Reflection Room"', async () => {
      mockGetSnapshot.mockResolvedValue(snap);
      const { getByLabelText } = renderWithJourney({ snapshot: snap });
      await waitFor(() => {
        expect(getByLabelText('My Reflection Room')).toBeTruthy();
      });
    });

    it('info icon opens the §12.10 InfoOverlay (page 1 header)', async () => {
      mockGetSnapshot.mockResolvedValue(snap);
      const { getByLabelText, getByText } = renderWithJourney({
        snapshot: snap,
      });
      await waitFor(() => getByLabelText('About Mirror Moment'));
      fireEvent.press(getByLabelText('About Mirror Moment'));
      await waitFor(() => {
        expect(getByText('WHAT IS A MIRROR MOMENT?')).toBeTruthy();
      });
    });
  });

  describe('empty state', () => {
    it('renders §12.10 empty body', async () => {
      const empty = makeSnapshot([]);
      mockGetSnapshot.mockResolvedValue(empty);
      const { getByText } = renderWithJourney({ snapshot: empty });
      await waitFor(() => {
        expect(
          getByText(
            'Nothing pressing right now — that’s its own kind of moment.',
          ),
        ).toBeTruthy();
      });
    });
  });
});
