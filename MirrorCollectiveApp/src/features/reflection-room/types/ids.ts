/**
 * Backend snake_case IDs for Reflection Room V1.
 * Source: 03_UI_DEVELOPER_HANDOFF.md §12.11 + 01_BACKEND_IMPLEMENTATION_SPEC.md §5.
 *
 * Treat these as a closed set — never accept other values from the wire.
 */

export const LOOP_IDS = [
  'pressure',
  'overwhelm',
  'grief',
  'self_silencing',
  'agency',
  'transition',
] as const;

export type LoopId = (typeof LOOP_IDS)[number];

export const TONE_STATES = ['rising', 'steady', 'softening'] as const;

export type ToneState = (typeof TONE_STATES)[number];

export const INTENSITY_LABELS = ['High', 'Medium', 'Low'] as const;

export type IntensityLabel = (typeof INTENSITY_LABELS)[number];

export const MOTIF_IDS = [
  'compass',
  'mirror',
  'blocks',
  'spiral',
  'feather',
  'radiant_burst',
  'waves',
  'pyramid',
  'water_drop',
  'brick_stack',
  'sprout',
] as const;

export type MotifId = (typeof MOTIF_IDS)[number];

export const PRACTICE_SURFACES = [
  'echo_signature',
  'mirror_moment',
  'chat',
] as const;

export type PracticeSurface = (typeof PRACTICE_SURFACES)[number];
