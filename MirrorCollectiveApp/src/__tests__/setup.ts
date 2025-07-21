import { vi } from 'vitest';

// Mock React Native modules
vi.mock('react-native', async () => {
  const RN = await vi.importActual('react-native');
  return {
    ...RN,
    Platform: {
      OS: 'ios',
      select: vi.fn((options) => options.ios),
    },
    Dimensions: {
      get: vi.fn(() => ({ width: 375, height: 667 })),
    },
    StatusBar: {
      currentHeight: 0,
    },
  };
});

// Mock @react-navigation modules
vi.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: any) => children,
  useNavigation: () => ({
    navigate: vi.fn(),
    goBack: vi.fn(),
    reset: vi.fn(),
  }),
  useFocusEffect: vi.fn(),
}));

vi.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    multiGet: vi.fn(),
    multiRemove: vi.fn(),
  },
}));

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};