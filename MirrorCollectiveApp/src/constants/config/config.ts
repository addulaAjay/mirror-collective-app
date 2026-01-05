import { Platform } from 'react-native';

export const API_CONFIG = {
  HOST:
    Platform.OS === 'android'
      ? 'http://192.168.0.16:8001'
      : 'http://127.0.0.1:8001',
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
    },
    SESSION: {
      GREETING: '/api/mirrorgpt/session/greeting',
    },
  },
  TIMEOUT: 10000,
};

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
