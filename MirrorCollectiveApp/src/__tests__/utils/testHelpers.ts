import { vi } from 'vitest';
import type { Message } from '../../types';

// Test data factories
export const createMockMessage = (overrides: Partial<Message> = {}): Message => ({
  id: Math.random().toString(36),
  text: 'Test message',
  sender: 'user',
  timestamp: new Date(),
  ...overrides,
});

export const createMockMessages = (count: number): Message[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockMessage({
      id: index.toString(),
      text: `Message ${index + 1}`,
      sender: index % 2 === 0 ? 'user' : 'system',
    })
  );
};

// Mock API responses
export const mockApiResponses = {
  chatSuccess: {
    success: true,
    data: { reply: 'Test response from API' },
  },
  chatError: {
    success: false,
    error: 'API Error',
  },
  authSuccess: {
    success: true,
    data: {
      user: { 
        id: '1', 
        email: 'test@example.com', 
        fullName: 'Test User',
        isVerified: true,
      },
      tokens: { 
        accessToken: 'token123', 
        refreshToken: 'refresh123',
      },
    },
  },
  authError: {
    success: false,
    error: 'Authentication failed',
  },
};

// Mock navigation object
export const createMockNavigation = () => ({
  navigate: vi.fn(),
  goBack: vi.fn(),
  reset: vi.fn(),
  setParams: vi.fn(),
  dispatch: vi.fn(),
  addListener: vi.fn(() => vi.fn()),
  removeListener: vi.fn(),
  canGoBack: vi.fn(() => false),
  isFocused: vi.fn(() => true),
  push: vi.fn(),
  replace: vi.fn(),
  pop: vi.fn(),
  popToTop: vi.fn(),
  setOptions: vi.fn(),
  getParent: vi.fn(),
  getId: vi.fn(),
  getState: vi.fn(),
});

// Wait for async operations to complete
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock fetch response
export const createMockFetchResponse = (data: any, ok = true, status = 200) => ({
  ok,
  status,
  json: vi.fn().mockResolvedValue(data),
  text: vi.fn().mockResolvedValue(JSON.stringify(data)),
});

// Common test utilities
export const testUtils = {
  createMockMessage,
  createMockMessages,
  createMockNavigation,
  createMockFetchResponse,
  waitForAsync,
  mockApiResponses,
};