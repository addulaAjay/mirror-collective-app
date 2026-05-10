/**
 * Unit tests for the Mirror Moment button-label matrix.
 * Source of truth: 03_UI_DEVELOPER_HANDOFF.md §6.2.
 *
 * The full matrix is exhaustively asserted — if any cell drifts from the
 * spec, this test fails.
 */

import { labelFor } from '../utils/labelFor';
import { LOOP_IDS, TONE_STATES } from '../types/ids';

describe('labelFor — Mirror Moment matrix (UI handoff §6.2)', () => {
  it.each([
    ['overwhelm', 'rising', 'Ease Overwhelm'],
    ['overwhelm', 'steady', 'Reclaim Calm'],
    ['overwhelm', 'softening', 'Soften Overwhelm'],
    ['pressure', 'rising', 'Ease Pressure'],
    ['pressure', 'steady', 'Reclaim Balance'],
    ['pressure', 'softening', 'Soften Pressure'],
    ['grief', 'rising', 'Face Grief'],
    ['grief', 'steady', 'Reclaim Presence'],
    ['grief', 'softening', 'Soften Grief'],
    ['self_silencing', 'rising', 'Speak Up'],
    ['self_silencing', 'steady', 'Reclaim Voice'],
    ['self_silencing', 'softening', 'Soften Silence'],
    ['agency', 'rising', 'Ignite Agency'],
    ['agency', 'steady', 'Reclaim Agency'],
    ['agency', 'softening', 'Rest in Agency'],
    ['transition', 'rising', 'Enter Transition'],
    ['transition', 'steady', 'Reclaim Clarity'],
    ['transition', 'softening', 'Soften Change'],
  ] as const)('returns "%s" + "%s" → "%s"', (loop, tone, expected) => {
    expect(labelFor(loop, tone)).toBe(expected);
  });

  it('covers every (loop, tone) pair without gaps', () => {
    for (const loop of LOOP_IDS) {
      for (const tone of TONE_STATES) {
        const label = labelFor(loop, tone);
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      }
    }
  });

  it('does NOT contain the §6.2 hard-prohibited static labels', () => {
    const PROHIBITED = ['Agency', 'Flow', 'Crossing', 'Generic'];
    for (const loop of LOOP_IDS) {
      for (const tone of TONE_STATES) {
        expect(PROHIBITED).not.toContain(labelFor(loop, tone));
      }
    }
  });
});
