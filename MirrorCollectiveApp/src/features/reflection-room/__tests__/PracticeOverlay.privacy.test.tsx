/**
 * Tests for the PracticeOverlay privacy + no-breathwork behaviors
 * added in Phase 9.
 *  - private_mode=true: practice content is hidden behind a Reveal gate.
 *  - private_mode=false: practice content shows immediately.
 *  - no_breathwork=true + breath practice slips through: warns in __DEV__.
 */

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

(jest.requireMock('react-native') as Record<string, unknown>).Pressable =
  'Pressable';

const mockRecommend = jest.fn();
jest.mock('@features/reflection-room/api', () => ({
  __esModule: true,
  getReflectionRoomClient: () => ({
    recommendPractice: mockRecommend,
  }),
}));

const mockPrefs = jest.fn();
jest.mock('@features/reflection-room/state/useReflectionRoomPrefs', () => ({
  __esModule: true,
  useReflectionRoomPrefs: () => mockPrefs(),
}));

import PracticeOverlay from '../components/PracticeOverlay';

const breathPractice = {
  id: 'breath_4_6',
  title: 'Ease Pressure',
  type: 'breath' as const,
  duration_sec: 60,
  steps: ['Inhale for 4.', 'Exhale for 6.', 'Repeat three more times.'],
};

const cognitivePractice = {
  ...breathPractice,
  id: 'name_and_need',
  type: 'cognitive' as const,
  title: 'Name and Need',
};

const pattern = {
  loop_id: 'pressure' as const,
  strength: 0.7,
  trend: 'rising' as const,
  last_seen: '2026-05-04T00:00:00Z',
};

describe('PracticeOverlay privacy + no_breathwork (Phase 9)', () => {
  beforeEach(() => {
    mockRecommend.mockReset();
    mockPrefs.mockReset();
  });

  it('private_mode=true hides practice content behind a Reveal gate', async () => {
    mockPrefs.mockReturnValue({
      no_breathwork: false,
      reduced_motion: false,
      private_mode: true,
    });
    mockRecommend.mockResolvedValue({
      practice: cognitivePractice,
      pattern,
      rule_id: 'pressure_loop_v1',
    });

    const { getByLabelText, queryByText } = render(
      <PracticeOverlay
        sessionId="sess-1"
        loopId="pressure"
        toneState="rising"
        surface="echo_signature"
        onDone={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );

    await waitFor(() => getByLabelText('Reveal practice content'));
    expect(queryByText('Inhale for 4.')).toBeNull();

    fireEvent.press(getByLabelText('Reveal practice content'));

    await waitFor(() => {
      expect(queryByText('Inhale for 4.')).toBeTruthy();
    });
  });

  it('private_mode=false shows practice content immediately', async () => {
    mockPrefs.mockReturnValue({
      no_breathwork: false,
      reduced_motion: false,
      private_mode: false,
    });
    mockRecommend.mockResolvedValue({
      practice: cognitivePractice,
      pattern,
      rule_id: 'pressure_loop_v1',
    });

    const { getByText, queryByLabelText } = render(
      <PracticeOverlay
        sessionId="sess-1"
        loopId="pressure"
        toneState="rising"
        surface="echo_signature"
        onDone={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(getByText('Inhale for 4.')).toBeTruthy();
    });
    expect(queryByLabelText('Reveal practice content')).toBeNull();
  });

  it('warns (in __DEV__) when no_breathwork=true and a breath practice slips through', async () => {
    mockPrefs.mockReturnValue({
      no_breathwork: true,
      reduced_motion: false,
      private_mode: false,
    });
    mockRecommend.mockResolvedValue({
      practice: breathPractice,
      pattern,
      rule_id: 'pressure_loop_v1',
    });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { getByText } = render(
      <PracticeOverlay
        sessionId="sess-1"
        loopId="pressure"
        toneState="rising"
        surface="echo_signature"
        onDone={jest.fn()}
        onDismiss={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(getByText('Ease Pressure')).toBeTruthy();
    });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('breath practice returned'),
      expect.objectContaining({ practice_id: 'breath_4_6' }),
    );

    warnSpy.mockRestore();
  });
});
