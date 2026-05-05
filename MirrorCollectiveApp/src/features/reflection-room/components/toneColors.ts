/**
 * Tone-state → color mapping for the Echo Map (UI handoff §5.1):
 *   rising    = amber
 *   softening = aqua
 *   steady    = lavender
 *
 * Sources where possible from existing palette tokens. Where Figma
 * doesn't yet carry a token at the right hue, we use a code-defined
 * value documented inline so the Phase 9 design-system audit can
 * promote it to a Figma variable.
 */

import { palette } from '@theme';

import type { ToneState } from '../types/ids';

/** Aqua hue used for `softening`. No Figma token yet. */
const AQUA = '#7fcfd1';

const TONE_COLORS: Record<ToneState, string> = {
  // Amber — palette.gold.active is the closest hex (#d9a766).
  rising: palette.gold.active,
  // Lavender — palette.secondary["secondary-color-1"] (#d8c8f6).
  steady: palette.secondary['secondary-color-1'],
  // Aqua — code-defined; flagged for Figma promotion in Phase 9.
  softening: AQUA,
};

export function toneColor(tone: ToneState): string {
  return TONE_COLORS[tone];
}
