// Mock React Native modules
jest.mock('react-native', () => {
  return {
    Platform: {
      OS: 'ios',
      select: jest.fn((options) => options.ios),
    },
    // Mock for react-native-linear-gradient if imported from RN?
    // Actually it's a separate package.
    StyleSheet: {
      create: (obj) => obj,
      flatten: (obj) => obj,
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 667 })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    Animated: {
      Value: jest.fn(() => ({
        interpolate: jest.fn(),
        setValue: jest.fn(),
      })),
      timing: jest.fn(() => ({ start: jest.fn() })),
      spring: jest.fn(() => ({ start: jest.fn() })),
      View: 'View',
      Text: 'Text',
    },
    View: 'View',
    Text: 'Text',
    Image: 'Image',
    ImageBackground: 'ImageBackground',
    TouchableOpacity: 'TouchableOpacity',
    TouchableWithoutFeedback: 'TouchableWithoutFeedback',
    TextInput: 'TextInput',
    ScrollView: 'ScrollView',
    FlatList: 'FlatList',
    SafeAreaView: 'SafeAreaView',
    KeyboardAvoidingView: 'KeyboardAvoidingView',
    ActivityIndicator: 'ActivityIndicator',
    Modal: 'Modal',
    Pressable: 'Pressable',
    Alert: { alert: jest.fn() },
    Linking: { openURL: jest.fn() },
    StatusBar: Object.assign(jest.fn(() => null), { 
      currentHeight: 0, 
      setBarStyle: jest.fn(), 
      setHidden: jest.fn(), 
      setTranslucent: jest.fn(), 
      setBackgroundColor: jest.fn() 
    }),
    Keyboard: { dismiss: jest.fn() },
    AppState: {
      currentState: 'active',
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
      removeEventListener: jest.fn(),
    },
  };
});

// Mock @react-navigation modules
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
  useRoute: () => ({ params: {} }),
  useFocusEffect: jest.fn(),
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  mergeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  flushGetRequests: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
  multiMerge: jest.fn(),
  default: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    mergeItem: jest.fn(),
    clear: jest.fn(),
    getAllKeys: jest.fn(),
    flushGetRequests: jest.fn(),
    multiGet: jest.fn(),
    multiSet: jest.fn(),
    multiRemove: jest.fn(),
    multiMerge: jest.fn(),
  },
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: () => new Promise(() => {}),
    },
  }),
  withTranslation: () => (Component) => {
    Component.defaultProps = { ...Component.defaultProps, t: (key) => key };
    return Component;
  },
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
}));

// Mock react-native-svg
jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: 'Svg',
  Call: 'Call',
  Circle: 'Circle',
  ClipPath: 'ClipPath',
  Defs: 'Defs',
  Ellipse: 'Ellipse',
  G: 'G',
  Image: 'Image',
  Line: 'Line',
  LinearGradient: 'LinearGradient',
  Marker: 'Marker',
  Mask: 'Mask',
  Path: 'Path',
  Pattern: 'Pattern',
  Polygon: 'Polygon',
  Polyline: 'Polyline',
  RadialGradient: 'RadialGradient',
  Rect: 'Rect',
  Stop: 'Stop',
  Svg: 'Svg',
  Symbol: 'Symbol',
  Text: 'Text',
  TextPath: 'TextPath',
  TSpan: 'TSpan',
  Use: 'Use',
  View: 'View',
  Filter: 'Filter',
  FeFlood: 'FeFlood',
  FeColorMatrix: 'FeColorMatrix',
  FeOffset: 'FeOffset',
  FeGaussianBlur: 'FeGaussianBlur',
  FeComposite: 'FeComposite',
  FeBlend: 'FeBlend',
}));

// Mock console methods
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock react-native-linear-gradient
jest.mock('react-native-linear-gradient', () => 'LinearGradient');

// Mock react-native-safe-area-context — its native module errors in jest.
// Components that import SafeAreaView render as the string 'SafeAreaView'.
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  SafeAreaProvider: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock @react-native-community/blur — native BlurView module would otherwise
// crash render(). String component name keeps snapshots readable.
jest.mock('@react-native-community/blur', () => ({
  BlurView: 'BlurView',
}));

// Mock react-native-iap. The library accesses native modules at
// import time (RNIapAmazonModule, etc.) which crash the test runtime.
// We surface the parts useInAppPurchase actually consumes as no-op
// fakes; individual tests can override with jest.mocked(...) as needed.
jest.mock('react-native-iap', () => ({
  initConnection: jest.fn(() => Promise.resolve()),
  endConnection: jest.fn(() => Promise.resolve()),
  getSubscriptions: jest.fn(() => Promise.resolve([])),
  getAvailablePurchases: jest.fn(() => Promise.resolve([])),
  requestSubscription: jest.fn(() => Promise.resolve()),
  finishTransaction: jest.fn(() => Promise.resolve()),
  purchaseUpdatedListener: jest.fn(() => ({ remove: jest.fn() })),
  purchaseErrorListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// Mock @react-native-firebase/messaging — the native bridge throws
// "Super expression must either be null or a function" inside the
// RNFBNativeEventEmitter ES5 helper in jest. PushNotificationService
// imports this at module top level, so anything pulling in UserContext
// or SubscriptionContext fails to load otherwise.
jest.mock('@react-native-firebase/messaging', () => {
  const messaging = () => ({
    requestPermission: jest.fn(() => Promise.resolve(1)),
    hasPermission: jest.fn(() => Promise.resolve(1)),
    getToken: jest.fn(() => Promise.resolve('test-token')),
    onTokenRefresh: jest.fn(),
    onMessage: jest.fn(),
    onNotificationOpenedApp: jest.fn(),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
    setBackgroundMessageHandler: jest.fn(),
    subscribeToTopic: jest.fn(() => Promise.resolve()),
    unsubscribeFromTopic: jest.fn(() => Promise.resolve()),
  });
  messaging.AuthorizationStatus = {
    NOT_DETERMINED: -1,
    DENIED: 0,
    AUTHORIZED: 1,
    PROVISIONAL: 2,
  };
  return {
    __esModule: true,
    default: messaging,
    firebase: { messaging },
  };
});

jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  default: { app: jest.fn(() => ({})) },
  firebase: { app: jest.fn(() => ({})) },
}));

// Default useEntitlement → entitled. Tests that need to exercise the
// paywall/lock paths should override this mock locally with
// `(useEntitlement as jest.MockedFunction<...>).mockReturnValue({...})`.
//
// The factory body is referentially closed — jest.mock is hoisted to
// the top of the file before the surrounding scope is evaluated, so
// any captured variable must either be inlined or prefixed with
// `mock` (per Jest's hoisting allowlist).
jest.mock('@hooks/useEntitlement', () => ({
  useEntitlement: jest.fn(() => ({
    entitled: true,
    loading: false,
    status: 'active',
    tier: 'core',
    lockReason: null,
    promptReason: 'trial_expired',
    quotaGb: 50,
    usedGb: 0,
    quotaPercent: 0,
    quotaExceeded: false,
    quotaApproaching: false,
    canUpload: () => ({ allowed: true, reason: null }),
    refresh: jest.fn(() => Promise.resolve()),
  })),
}));

// Mock react-native-document-picker — native module would crash jest.
jest.mock('react-native-document-picker', () => ({
  __esModule: true,
  default: {
    pickSingle: jest.fn(),
    pick: jest.fn(),
    types: {
      plainText: 'plainText',
      pdf: 'pdf',
      doc: 'doc',
      docx: 'docx',
    },
    isCancel: jest.fn(() => false),
  },
}));

// Mock react-native-keyboard-controller — its native module would crash
// jest. Provide stub components for Provider, KAV, KeyboardAwareScrollView.
jest.mock('react-native-keyboard-controller', () => ({
  KeyboardProvider: ({ children }) => children,
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  KeyboardAwareScrollView: 'KeyboardAwareScrollView',
  KeyboardController: {
    dismiss: jest.fn(),
    setFocusTo: jest.fn(),
    setInputMode: jest.fn(),
    setDefaultMode: jest.fn(),
  },
  useKeyboardHandler: jest.fn(),
  useKeyboardAnimation: () => ({ height: { value: 0 }, progress: { value: 0 } }),
  useKeyboardState: () => ({ isVisible: false, height: 0 }),
}));

// Mock react-native-reanimated — official jest mock from the lib.
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);
