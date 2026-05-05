/**
 * User preference hook for Reflection Room V1 — currently returns the
 * defaults. Phase 9 will populate from the user record (or a future user
 * prefs endpoint) per UI handoff §7.1.
 *
 * Consumers MUST use this hook rather than reading flags off other
 * services, so Phase 9 has a single integration point.
 */

export interface ReflectionRoomPrefs {
  /** Backend filters out breath practices. FE may surface an indicator. */
  no_breathwork: boolean;
  /** Disable orbit / pulse animations across Map and Map-tap overlays. */
  reduced_motion: boolean;
  /** Blanket-blur practice content until the user taps "Reveal." */
  private_mode: boolean;
}

const DEFAULTS: ReflectionRoomPrefs = {
  no_breathwork: false,
  reduced_motion: false,
  private_mode: false,
};

export function useReflectionRoomPrefs(): ReflectionRoomPrefs {
  return DEFAULTS;
}
