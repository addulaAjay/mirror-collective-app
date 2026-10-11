/**
 * Chat media feature flags.
 *
 * Follows the two patterns already in this codebase rather than inventing a
 * third: a build-time const consumed at the call sites (like
 * `TTS_FEATURE_ENABLED` in src/services/speech/featureFlag.ts) whose value
 * comes from an env var with a default (like `REFLECTION_ROOM_ENABLED` in
 * src/constants/config/config.ts). There is no remote config in this app.
 *
 * Both default to **off** so this branch can merge before the backend is
 * deployed to a given stage — the affordance simply doesn't render.
 *
 * Note these only gate the *client* affordance. The backend has its own
 * independent switch, which is what lets the feature be disabled without an
 * App Store release. A client that has the flag on must therefore still
 * handle a rejection from the server gracefully.
 */

/** Photo attachment in MirrorGPT chat (V1). */
export const CHAT_PHOTO_ENABLED =
  String(process.env.CHAT_PHOTO_ENABLED ?? 'false').toLowerCase() === 'true';

/** Voice input in MirrorGPT chat (V2 — not yet implemented client-side). */
export const CHAT_VOICE_ENABLED =
  String(process.env.CHAT_VOICE_ENABLED ?? 'false').toLowerCase() === 'true';
