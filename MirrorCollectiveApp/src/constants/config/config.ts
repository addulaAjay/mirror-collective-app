import { Platform } from 'react-native';

export const API_CONFIG = {
  HOST:
    Platform.OS === 'android'
      ? 'http://10.0.2.2:3000'
      : 'http://localhost:3000',
  ENDPOINTS: {
    MIRROR_CHAT: '/api/mirror-chat',
    AUTH: {
      LOGIN: '/api/auth/login',
      SIGNUP: '/api/auth/register',
      VERIFY_EMAIL: '/api/auth/confirm-email',
      FORGOT_PASSWORD: '/api/auth/forgot-password',
      RESET_PASSWORD: '/api/auth/reset-password',
      RESEND_VERIFICATION_CODE: '/api/auth/resend-verification-code',
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
