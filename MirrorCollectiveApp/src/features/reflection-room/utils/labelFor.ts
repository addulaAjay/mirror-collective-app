/**
 * Mirror Moment button-label matrix.
 *
 * Source: 03_UI_DEVELOPER_HANDOFF.md §6.2 (mandatory matrix).
 *
 * Hard prohibitions from §6.2:
 *  - No static buttons like "Agency", "Flow", "Crossing", "Generic".
 *  - No buttons that match (loop, tone) pairs not in this matrix.
 *  - Labels MUST be regenerated each session from the snapshot — never
 *    cached across sessions.
 *
 * Implemented as a pure function so it's trivially unit-testable and
 * impossible to hardcode mistakenly elsewhere.
 */

import type { LoopId, ToneState } from '../types/ids';

const MATRIX: Record<LoopId, Record<ToneState, string>> = {
  overwhelm: {
    rising: 'Ease Overwhelm',
    steady: 'Reclaim Calm',
    softening: 'Soften Overwhelm',
  },
  pressure: {
    rising: 'Ease Pressure',
    steady: 'Reclaim Balance',
    softening: 'Soften Pressure',
  },
  grief: {
    rising: 'Face Grief',
    steady: 'Reclaim Presence',
    softening: 'Soften Grief',
  },
  self_silencing: {
    rising: 'Speak Up',
    steady: 'Reclaim Voice',
    softening: 'Soften Silence',
  },
  agency: {
    rising: 'Ignite Agency',
    steady: 'Reclaim Agency',
    softening: 'Rest in Agency',
  },
  transition: {
    rising: 'Enter Transition',
    steady: 'Reclaim Clarity',
    softening: 'Soften Change',
  },
};

/**
 * Returns the canonical Mirror Moment button label for a given (loop, tone).
 * The full matrix is exhaustively defined; both args are typed unions so
 * callers cannot pass an invalid combination at compile time.
 */
export function labelFor(loopId: LoopId, toneState: ToneState): string {
  return MATRIX[loopId][toneState];
}
