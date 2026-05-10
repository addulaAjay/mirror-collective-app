/**
 * Tests for the reusable PracticeOverlay component.
 * Asserts:
 *  - On mount, calls recommendPractice with the right params.
 *  - Renders TWO MINUTE PRACTICE eyebrow + practice.title + each step.
 *  - Done tap fires onDone with the practice payload + rule_id.
 *  - On recommend error, shows §12.10 PRACTICE UNAVAILABLE + retry.
 *  - X close fires onDismiss.
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

import PracticeOverlay from '../components/PracticeOverlay';
import { ReflectionRoomApiError } from '../api/types';

const mockPractice = {
  id: 'breath_4_6',
  title: 'Ease Pressure',
  type: 'breath' as const,
  duration_sec: 90,
  steps: [
    'Inhale for 4.',
    'Exhale for 6.',
    'Repeat three more times.',
  ],
};

const mockPattern = {
  loop_id: 'pressure' as const,
  strength: 0.74,
  trend: 'rising' as const,
  last_seen: '2026-05-04T00:00:00Z',
};

describe('PracticeOverlay', () => {
  beforeEach(() => {
    mockRecommend.mockReset();
  });

  function renderOverlay(overrides: Partial<React.ComponentProps<typeof PracticeOverlay>> = {}) {
    const onDone = overrides.onDone ?? jest.fn();
    const onDismiss = overrides.onDismiss ?? jest.fn();
    const props: React.ComponentProps<typeof PracticeOverlay> = {
      sessionId: 'sess-1',
      loopId: 'pressure',
      toneState: 'rising',
      surface: 'echo_signature',
      onDone,
      onDismiss,
      ...overrides,
    };
    return { ...render(<PracticeOverlay {...props} />), onDone, onDismiss };
  }

  it('calls recommendPractice with the supplied params on mount', async () => {
    mockRecommend.mockResolvedValue({
      practice: mockPractice,
      pattern: mockPattern,
      rule_id: 'pressure_loop_v1',
    });
    renderOverlay();
    await waitFor(() => {
      expect(mockRecommend).toHaveBeenCalledWith({
        session_id: 'sess-1',
        selected_loop: 'pressure',
        surface: 'echo_signature',
      });
    });
  });

  it('renders TWO MINUTE PRACTICE header and the practice title + steps', async () => {
    mockRecommend.mockResolvedValue({
      practice: mockPractice,
      pattern: mockPattern,
      rule_id: 'pressure_loop_v1',
    });
    const { getByText } = renderOverlay();
    await waitFor(() => {
      expect(getByText('TWO MINUTE PRACTICE')).toBeTruthy();
      expect(getByText('Ease Pressure')).toBeTruthy();
      expect(getByText('Inhale for 4.')).toBeTruthy();
      expect(getByText('Exhale for 6.')).toBeTruthy();
      expect(getByText('Repeat three more times.')).toBeTruthy();
    });
  });

  it('Done tap fires onDone with the practice payload + rule_id', async () => {
    mockRecommend.mockResolvedValue({
      practice: mockPractice,
      pattern: mockPattern,
      rule_id: 'pressure_loop_v1',
    });
    const onDone = jest.fn().mockResolvedValue(undefined);
    const { getByLabelText } = renderOverlay({ onDone });
    await waitFor(() => getByLabelText('Done'));
    fireEvent.press(getByLabelText('Done'));
    await waitFor(() => {
      expect(onDone).toHaveBeenCalledWith({
        practice: mockPractice,
        pattern: mockPattern,
        ruleId: 'pressure_loop_v1',
      });
    });
  });

  it('renders §12.10 PRACTICE UNAVAILABLE on recommend error', async () => {
    mockRecommend.mockRejectedValue(
      new ReflectionRoomApiError('FALLBACK_ON_COOLDOWN', 'cooldown', 409, 3600),
    );
    const { getByText } = renderOverlay();
    await waitFor(() => {
      expect(getByText('PRACTICE UNAVAILABLE')).toBeTruthy();
      expect(
        getByText(
          'We weren’t able to finish your practice. Would you like to try again?',
        ),
      ).toBeTruthy();
    });
  });

  it('TRY AGAIN refetches on error', async () => {
    mockRecommend
      .mockRejectedValueOnce(
        new ReflectionRoomApiError('UNKNOWN', 'oops', 500),
      )
      .mockResolvedValueOnce({
        practice: mockPractice,
        pattern: mockPattern,
        rule_id: 'pressure_loop_v1',
      });
    const { getByLabelText, getByText } = renderOverlay();
    await waitFor(() => getByLabelText('Try again'));
    fireEvent.press(getByLabelText('Try again'));
    await waitFor(() => {
      expect(getByText('Ease Pressure')).toBeTruthy();
    });
    expect(mockRecommend).toHaveBeenCalledTimes(2);
  });

  it('X close fires onDismiss', async () => {
    mockRecommend.mockResolvedValue({
      practice: mockPractice,
      pattern: mockPattern,
      rule_id: 'pressure_loop_v1',
    });
    const onDismiss = jest.fn();
    const { getByLabelText } = renderOverlay({ onDismiss });
    fireEvent.press(getByLabelText('Close practice'));
    expect(onDismiss).toHaveBeenCalled();
  });
});
