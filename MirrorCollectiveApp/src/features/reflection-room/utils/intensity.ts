/**
 * Intensity numeric → label conversion per 03_UI_DEVELOPER_HANDOFF.md §12.11.
 *
 * Per §12.11 footnote: "FE should rely on the backend's `intensity_label`
 * field if/when it ships rather than recomputing client-side."
 *
 * V1 contract: backend returns `intensity_label` directly on each loop.
 * This util is a fallback for offline/legacy snapshots only — prefer the
 * server field whenever it's present.
 */

import type { IntensityLabel } from '../types/ids';

export function intensityLabelFromScore(score: number): IntensityLabel {
  if (score >= 0.66) return 'High';
  if (score >= 0.33) return 'Medium';
  return 'Low';
}
