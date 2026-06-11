// Production API gateway (production stage → production APNs). Release builds —
// including TestFlight and the App Store — ALWAYS talk to this host so a
// production push token never gets registered against a sandbox/staging
// backend (and vice-versa). See docs/SOUL_PINGS_PRD.md / iOS APNs notes.
const PROD_HOST = 'https://ct3onxgeol.execute-api.us-east-1.amazonaws.com';

// Debug-only override for local / staging work (e.g. MIRROR_API_BASE_URL set in
// a .env consumed at build time). Ignored in release builds on purpose.
const HOST_OVERRIDE =
  process.env.MIRROR_API_BASE_URL || process.env.API_BASE_URL;

// __DEV__ is false in Release/TestFlight/App Store builds, true under Metro.
const DEFAULT_HOST = __DEV__ ? HOST_OVERRIDE || PROD_HOST : PROD_HOST;

export const API_CONFIG = {
  HOST: DEFAULT_HOST,
  ENDPOINTS: {
    // Updated chat endpoint to match MirrorGPT API
    MIRROR_CHAT: '/api/mirrorgpt/chat',
    AUTH: {
      LOGIN: '/api/auth/login',
      SIGNUP: '/api/auth/register',
      VERIFY_EMAIL: '/api/auth/confirm-email',
      FORGOT_PASSWORD: '/api/auth/forgot-password',
      RESET_PASSWORD: '/api/auth/reset-password',
      RESEND_VERIFICATION_CODE: '/api/auth/resend-verification-code',
      REFRESH: '/api/auth/refresh',
    },
    QUIZ: {
      SUBMIT: '/api/mirrorgpt/quiz/submit',
      QUESTIONS: '/api/mirrorgpt/quiz/questions',
    },
    SESSION: {
      GREETING: '/api/mirrorgpt/session/greeting',
    },
    // QUIZ: {
    //   SUBMIT: '/api/quiz/submit',
    // },
    REGISTER_DEVICE: {
      REGISTER: '/api/register-device',
      UNREGISTER: '/api/unregister-device',
    },
    REFLECTION_ROOM: {
      QUIZ: '/api/reflection/quiz',
      SNAPSHOT: '/api/echo/snapshot',
      RECOMMEND_PRACTICE: '/api/echo/recommend-practice',
      PRACTICE_COMPLETE: '/api/practice/complete',
      PRACTICE_HELPFUL: '/api/practice/complete/{completion_id}/helpful',
      ROOM_OVERRIDE: '/api/me/reflection/room',
      TELEMETRY_EVENT: '/api/telemetry/event',
    },
  },
  TIMEOUT: 10000,
};

/**
 * Reflection Room V1 feature flag.
 * Default: true (existing screens already shipping; flag is for safe rollback).
 * Override via env: REFLECTION_ROOM_ENABLED=false
 */
export const REFLECTION_ROOM_ENABLED =
  String(process.env.REFLECTION_ROOM_ENABLED ?? 'true').toLowerCase() !== 'false';

/**
 * Reflection Room mock-API mode. When true, the FE talks to an in-memory
 * mock client instead of staging. Flipped to false in Phase 8 backend wiring.
 * Override via env: REFLECTION_ROOM_USE_MOCK=false
 */
export const REFLECTION_ROOM_USE_MOCK =
  String(process.env.REFLECTION_ROOM_USE_MOCK ?? 'true').toLowerCase() !== 'false';

export const APP_CONFIG = {
  CHAT: {
    MAX_MESSAGE_LENGTH: 1000,
    MESSAGE_DEBOUNCE_MS: 300,
    AUTO_SCROLL_DELAY_MS: 100,
  },
  ANIMATION: {
    SPLASH_DURATION_MS: 3000,
    TRANSITION_DURATION_MS: 300,
  },
};
