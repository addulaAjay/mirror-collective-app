/**
 * Device timezone helper for the X-User-Timezone header
 * (UI handoff §2.1).
 *
 * Returns the IANA timezone the device's `Intl` API reports
 * (e.g., `America/Los_Angeles`, `Asia/Tokyo`). Falls back to
 * `America/New_York` — the same default the backend uses if
 * the user record has no tz attached (UI handoff §2 prelude).
 */

const FALLBACK_TZ = 'America/New_York';

export function getDeviceTimezone(): string {
  try {
    const tz =
      // intl is widely available in modern RN, but defensive in case the
      // runtime hasn't loaded the polyfill yet.
      typeof Intl !== 'undefined' &&
      typeof Intl.DateTimeFormat === 'function'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : null;
    if (tz && typeof tz === 'string' && tz.length > 0) {
      return tz;
    }
    return FALLBACK_TZ;
  } catch {
    return FALLBACK_TZ;
  }
}
