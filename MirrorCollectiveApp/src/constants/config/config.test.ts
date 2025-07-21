import { describe, it, expect, vi } from 'vitest';
import { API_CONFIG, APP_CONFIG } from '../config';

// Mock Platform
vi.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

describe('API_CONFIG', () => {
  it('has correct host for iOS', () => {
    expect(API_CONFIG.HOST).toBe('http://localhost:3000');
  });

  it('has all required endpoints', () => {
    expect(API_CONFIG.ENDPOINTS.MIRROR_CHAT).toBe('/api/mirror-chat');
    expect(API_CONFIG.ENDPOINTS.AUTH.LOGIN).toBe('/api/auth/login');
    expect(API_CONFIG.ENDPOINTS.AUTH.SIGNUP).toBe('/api/auth/signup');
    expect(API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL).toBe('/api/auth/verify-email');
    expect(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD).toBe('/api/auth/forgot-password');
    expect(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD).toBe('/api/auth/reset-password');
  });

  it('has correct timeout value', () => {
    expect(API_CONFIG.TIMEOUT).toBe(10000);
  });
});

describe('APP_CONFIG', () => {
  it('has correct chat configuration', () => {
    expect(APP_CONFIG.CHAT.MAX_MESSAGE_LENGTH).toBe(1000);
    expect(APP_CONFIG.CHAT.MESSAGE_DEBOUNCE_MS).toBe(300);
    expect(APP_CONFIG.CHAT.AUTO_SCROLL_DELAY_MS).toBe(100);
  });

  it('has correct animation configuration', () => {
    expect(APP_CONFIG.ANIMATION.SPLASH_DURATION_MS).toBe(3000);
    expect(APP_CONFIG.ANIMATION.TRANSITION_DURATION_MS).toBe(300);
  });
});