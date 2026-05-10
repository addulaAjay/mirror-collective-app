/**
 * Tests for EchoSignatureCard.
 * Asserts:
 *  - Renders LOOP_NAME (uppercase) + " - Tone" + reflection line.
 *  - Tap fires onPress with the LoopState.
 *  - Accessible label includes "Try a 2-min practice" + the loop name.
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

(jest.requireMock('react-native') as Record<string, unknown>).Pressable =
  'Pressable';
(jest.requireMock('react-native-svg') as Record<string, unknown>).SvgXml =
  'SvgXml';

import EchoSignatureCard from '../components/EchoSignatureCard';
import type { LoopState } from '../api/types';

const overwhelmRising: LoopState = {
  loop_id: 'overwhelm',
  tone_state: 'rising',
  intensity_score: 0.82,
  intensity_label: 'High',
  last_seen: '2026-05-03T00:00:00Z',
  recently_changed: false,
  narrative_stage: null,
  icon: '🌊',
  reflection_line: 'Everything feels like too much at once — start with one breath.',
};

const selfSilencingSoftening: LoopState = {
  ...overwhelmRising,
  loop_id: 'self_silencing',
  tone_state: 'softening',
  intensity_score: 0.4,
  intensity_label: 'Medium',
  reflection_line: 'Your voice is finding its way back.',
};

describe('EchoSignatureCard', () => {
  it('renders LOOP_NAME in uppercase', () => {
    const { getByText } = render(
      <EchoSignatureCard loop={overwhelmRising} onPress={() => {}} />,
    );
    expect(getByText('OVERWHELM')).toBeTruthy();
  });

  it('renders "- Tone" with leading dash + space and capitalized state', () => {
    const { getByText } = render(
      <EchoSignatureCard loop={overwhelmRising} onPress={() => {}} />,
    );
    // The tone is rendered with a leading space within the heading line.
    expect(getByText(' - Rising')).toBeTruthy();
  });

  it('renders the reflection line italic body', () => {
    const { getByText } = render(
      <EchoSignatureCard loop={overwhelmRising} onPress={() => {}} />,
    );
    expect(
      getByText(
        'Everything feels like too much at once — start with one breath.',
      ),
    ).toBeTruthy();
  });

  it('renders Self-silencing as SELF-SILENCING (no space after hyphen)', () => {
    const { getByText } = render(
      <EchoSignatureCard
        loop={selfSilencingSoftening}
        onPress={() => {}}
      />,
    );
    expect(getByText('SELF-SILENCING')).toBeTruthy();
    expect(getByText(' - Softening')).toBeTruthy();
  });

  it('tap fires onPress with the provided loop', () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(
      <EchoSignatureCard loop={overwhelmRising} onPress={onPress} />,
    );
    fireEvent.press(
      getByLabelText('Try a 2-min practice for OVERWHELM, - Rising'),
    );
    expect(onPress).toHaveBeenCalledWith(overwhelmRising);
  });
});
