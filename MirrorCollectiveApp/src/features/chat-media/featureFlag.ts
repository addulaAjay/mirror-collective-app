/**
 * Chat media feature flags.
 *
 * Follows the two patterns already in this codebase rather than inventing a
 * third: a build-time const consumed at the call sites (like
 * `TTS_FEATURE_ENABLED` in src/services/speech/featureFlag.ts) whose value
 * comes from an env var with a default (like `REFLECTION_ROOM_ENABLED` in
 * src/constants/config/config.ts). There is no remote config in this app.
 *
 * Note these only gate the *client* affordance. The backend has its own
 * independent switch, which is what lets the feature be disabled without an
 * App Store release. A client that has the flag on must therefore still
 * handle a rejection from the server gracefully.
 */

/**
 * Photo attachment in MirrorGPT chat (V1).
 *
 * **Defaulted ON for this branch**, so the feature is visible in the UI and
 * can be tracked at branch level. That is a branch-level choice, not the
 * shipping default: before this merges, decide whether it should go back to
 * `'false'` and be enabled per-build instead.
 *
 * Set `CHAT_PHOTO_ENABLED=false` in the env to turn it off without a code
 * change.
 */
export const CHAT_PHOTO_ENABLED =
  String(process.env.CHAT_PHOTO_ENABLED ?? 'true').toLowerCase() === 'true';

/** Voice input in MirrorGPT chat (V2 — not yet implemented client-side). */
export const CHAT_VOICE_ENABLED =
  String(process.env.CHAT_VOICE_ENABLED ?? 'false').toLowerCase() === 'true';
