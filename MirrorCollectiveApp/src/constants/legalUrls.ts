/**
 * Hosted legal URLs surfaced on the in-app paywall + onboarding flows.
 *
 * App Store Review requires tappable Terms of Service and Privacy Policy
 * links inside any subscription-purchase flow (Guideline 3.1.2(a)).
 * Both URLs MUST be reachable, must describe the actual subscription
 * terms, and must remain stable through the review process.
 *
 * Update these to the canonical Mirror Collective URLs before
 * submitting to App Review. The current values are deliberate
 * placeholders so they fail visibly in a sandbox test rather than
 * silently 404 in production.
 *
 * Source-of-truth for sub disclosure copy (price + period + cancel
 * terms) lives in the paywall screens themselves; this file is just
 * the long-form hosted documents.
 */

export const TERMS_OF_SERVICE_URL =
  'https://themirrorcollective.com/terms-of-service';

export const PRIVACY_POLICY_URL =
  'https://themirrorcollective.com/privacy-policy';
