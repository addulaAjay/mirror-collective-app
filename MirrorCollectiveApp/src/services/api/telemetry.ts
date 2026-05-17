/**
 * Subscription / trial telemetry beacons (pricing spec 2026-05-12 §5).
 *
 * V1 covers `paywall_view` — fired by the FE on paywall mount so the
 * analytics layer can compute view→start_trial conversion. The other
 * four trial events (`start_trial`, `trial_convert`, `trial_cancel`,
 * `trial_expire`) are emitted server-side from SubscriptionService
 * lifecycle handlers, so the FE never needs to fire them.
 *
 * Fire-and-forget: telemetry must never break the user flow. Errors
 * are swallowed and logged in dev only.
 */

import { BaseApiService } from './base';

type PaywallSurface = 'start_trial' | 'echo_vault_upsell' | string;

class TelemetryApiService extends BaseApiService {
  /**
   * POST /api/telemetry/paywall-view.
   *
   * `surface` lets analytics break the funnel down by where the
   * paywall was shown (signup paywall vs upsell flow). Defaults to
   * the signup paywall on the backend if omitted.
   */
  async firePaywallView(surface?: PaywallSurface): Promise<void> {
    try {
      await this.makeRequest(
        '/api/telemetry/paywall-view',
        'POST',
        surface ? { surface } : {},
        true, // requiresAuth — same JWT as other authenticated routes
      );
    } catch (err) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('paywall_view beacon failed:', err);
      }
    }
  }
}

export const telemetryApiService = new TelemetryApiService();
