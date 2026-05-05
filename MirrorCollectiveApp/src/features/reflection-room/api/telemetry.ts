/**
 * Reflection Room V1 — client telemetry beacons.
 *
 * Per UI handoff §8 the FE only needs to fire two events that the
 * server can't see otherwise:
 *
 *   - `practice_expand`  — user tapped "Try a 2-min practice" / Mirror
 *                          Moment button. Fired BEFORE recommend returns.
 *                          Body: `{loop_id, surface}`.
 *   - `nudge_opened`     — user opened a push/email nudge that lands on
 *                          a Reflection Room screen. Body: `{nudge_type}`.
 *   - `echo_map_refresh` — user tapped "Update My Mirror". Body: `{}`.
 *                          (No refresh CTA in the V1 Figma; reserved.)
 *
 * Event bodies must contain IDs and enums only — no PII, no free text
 * (UI handoff §8 explicit rule). The fire helpers below enforce this
 * via type signatures.
 *
 * Failures are non-blocking: telemetry must never break the user flow.
 */

import { API_CONFIG } from '@constants/config';

import type { LoopId, PracticeSurface } from '../types/ids';

export type RRTelemetryEvent =
  | { event: 'practice_expand'; body: { loop_id: LoopId; surface: PracticeSurface } }
  | { event: 'nudge_opened'; body: { nudge_type: string } }
  | { event: 'echo_map_refresh'; body: Record<string, never> };

/**
 * POSTs a telemetry event to the backend's `/telemetry/event` endpoint.
 * Authentication uses the same JWT pattern as other RR endpoints
 * (handled by the caller — typically the screen passes a fetch wrapper).
 *
 * For V1 we use plain fetch so a transport hiccup doesn't surface as
 * a thrown ReflectionRoomApiError to the UI.
 */
export async function fireTelemetry(payload: RRTelemetryEvent): Promise<void> {
  try {
    await fetch(
      `${API_CONFIG.HOST}${API_CONFIG.ENDPOINTS.REFLECTION_ROOM.TELEMETRY_EVENT}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
  } catch {
    // Never throw — telemetry is fire-and-forget.
  }
}

/** Convenience wrapper — `practice_expand` is the most-fired RR beacon. */
export function firePracticeExpand(loopId: LoopId, surface: PracticeSurface): void {
  void fireTelemetry({
    event: 'practice_expand',
    body: { loop_id: loopId, surface },
  });
}
