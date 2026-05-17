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
import { tokenManager } from '@services/tokenManager';

import type { LoopId, PracticeSurface } from '../types/ids';

export type RRTelemetryEvent =
  | { event: 'practice_expand'; body: { loop_id: LoopId; surface: PracticeSurface } }
  | { event: 'nudge_opened'; body: { nudge_type: string } }
  | { event: 'echo_map_refresh'; body: Record<string, never> };

/**
 * POSTs a telemetry event to the backend's `/telemetry/event` endpoint.
 *
 * Authentication: Reflection Room is post-signup, so a JWT exists by
 * the time any of these events fire. The API Gateway authorizer rejects
 * unauthenticated requests with 401, so we must include the bearer
 * token. We fetch it via tokenManager (same path the rest of the API
 * client uses) — if no token is present we skip the call entirely
 * rather than firing an event we know will 401.
 *
 * Fire-and-forget by design — any thrown error (network, 4xx, 5xx) is
 * swallowed so the UI flow never breaks because telemetry hiccuped.
 */
export async function fireTelemetry(payload: RRTelemetryEvent): Promise<void> {
  try {
    const token = await tokenManager.getValidToken();
    if (!token) {
      // No session = no user to attribute the event to. Drop silently
      // (vs. firing an anonymous request that the authorizer will 401).
      return;
    }
    await fetch(
      `${API_CONFIG.HOST}${API_CONFIG.ENDPOINTS.REFLECTION_ROOM.TELEMETRY_EVENT}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
