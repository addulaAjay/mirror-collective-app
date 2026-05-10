/**
 * Tests for LoopOverlay — the §12.9 5-element per-loop tap overlay.
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

(jest.requireMock('react-native') as Record<string, unknown>).Pressable =
  'Pressable';

import LoopOverlay from '../components/LoopOverlay';
import type { LoopState } from '../api/types';

const pressureSteady: LoopState = {
  loop_id: 'pressure',
  tone_state: 'steady',
  intensity_score: 0.78,
  intensity_label: 'High',
  last_seen: '2026-05-04T00:00:00Z',
  recently_changed: false,
  narrative_stage: null,
  icon: '🔺',
  reflection_line:
    'You’re pushing toward perfection again — breathe before the next move.',
};

describe('LoopOverlay (§12.9 tap overlay)', () => {
  it('renders all 5 elements in spec order', () => {
    const { getByText } = render(
      <LoopOverlay loop={pressureSteady} onDismiss={() => {}} />,
    );
    expect(getByText('Pressure')).toBeTruthy();
    expect(getByText('Steady')).toBeTruthy();
    expect(
      getByText(
        'You’re pushing toward perfection again — breathe before the next move.',
      ),
    ).toBeTruthy();
    expect(getByText('HIGH INTENSITY')).toBeTruthy();
    expect(getByText('click anywhere to continue')).toBeTruthy();
  });

  it('renders the tone in bare title-case (no leading dash)', () => {
    const { queryByText } = render(
      <LoopOverlay loop={pressureSteady} onDismiss={() => {}} />,
    );
    // Echo Map uses bare tone — must not render the Echo-Signature "- Steady" form.
    expect(queryByText('- Steady')).toBeNull();
  });

  it('uses the correct INTENSITY label for medium intensity', () => {
    const medium: LoopState = { ...pressureSteady, intensity_label: 'Medium' };
    const { getByText } = render(
      <LoopOverlay loop={medium} onDismiss={() => {}} />,
    );
    expect(getByText('MEDIUM INTENSITY')).toBeTruthy();
  });

  it('tap fires onDismiss', () => {
    const onDismiss = jest.fn();
    const { getByLabelText } = render(
      <LoopOverlay loop={pressureSteady} onDismiss={onDismiss} />,
    );
    fireEvent.press(
      getByLabelText(
        'Pressure Steady, HIGH INTENSITY. You’re pushing toward perfection again — breathe before the next move.. Tap anywhere to continue.',
      ),
    );
    expect(onDismiss).toHaveBeenCalled();
  });
});
