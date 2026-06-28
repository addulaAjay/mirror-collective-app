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
    Switch: 'Switch',
    Alert: { alert: jest.fn() },
    Linking: { openURL: jest.fn() },
    StatusBar: Object.assign(jest.fn(() => null), { 
      currentHeight: 0, 
      setBarStyle: jest.fn(), 
      setHidden: jest.fn(), 
      setTranslucent: jest.fn(), 
      setBackgroundColor: jest.fn() 
    }),
    Keyboard: {
      dismiss: jest.fn(),
      // Real RN returns an EmitterSubscription with .remove(). Components that
      // subscribe to keyboard events (KeyboardAwareScrollView, custom hooks)
      // crash without these.
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
      scheduleLayoutAnimation: jest.fn(),
    },
    AppState: {
      // currentState is read at import time by some libs; default to
      // 'active'. Tests that care override via spyOn.
      currentState: 'active',
      // Real RN returns a Subscription with .remove(). Default mock
      // returns one with a no-op remove.
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
  // navigationRef.ts calls this at module load; return a ref-shaped stub.
  createNavigationContainerRef: () => ({
    isReady: jest.fn(() => false),
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    current: null,
  }),
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

// Mock react-native-blob-util — its index module touches a TurboModule
// registry that doesn't exist in Jest, so importing echoApiService (which
// uses it for native-streaming uploads) would otherwise crash every test
// that transitively pulls in src/services/api/echo.ts.
jest.mock('react-native-blob-util', () => {
  const uploadProgress = jest.fn();
  const task = Promise.resolve({
    respInfo: { status: 200 },
    text: () => '',
  });
  task.uploadProgress = uploadProgress;
  return {
    __esModule: true,
    default: {
      fetch: jest.fn(() => task),
      wrap: jest.fn((p) => p),
      fs: {
        // Default to "size unknown" so compress.ts gracefully falls
        // through. Individual tests can override via
        //   jest.requireMock('react-native-blob-util').default.fs.stat.mockResolvedValue({size: '12345'})
        stat: jest.fn().mockRejectedValue(new Error('not mocked')),
        // No-op cleanup so unlinkQuietly() doesn't throw.
        unlink: jest.fn().mockResolvedValue(undefined),
        // Default to "no file" so the vault library's resume scanner
        // sees an empty pending list in tests. Override per-test as
        // needed for resume-flow scenarios.
        exists: jest.fn().mockResolvedValue(false),
      },
    },
  };
});

// Mock react-native-compressor — native iOS/Android module. Default
// pass-through means tests don't need to know about compression unless
// they want to assert behavior; in that case override per-test.
jest.mock('react-native-compressor', () => ({
  __esModule: true,
  Video: { compress: jest.fn((uri) => Promise.resolve(uri)) },
  Image: { compress: jest.fn((uri) => Promise.resolve(uri)) },
  // Poster-frame extractor. Default: rejects so the poster pipeline
  // silently no-ops in tests that don't opt in. Override per-test:
  //   jest.requireMock('react-native-compressor').createVideoThumbnail
  //     .mockResolvedValue({ path: '/cache/thumb.jpg', size: 1, mime: 'image/jpeg', width: 1, height: 1 })
  createVideoThumbnail: jest.fn(() =>
    Promise.reject(new Error('not mocked')),
  ),
}));

// Mock expo-image — its native module touches a TurboModule registry
// that doesn't exist in Jest. Render as a string component so snapshot
// tests stay readable; expose the same prop surface so CachedImage's
// passthrough keeps compiling.
jest.mock('expo-image', () => ({
  __esModule: true,
  Image: 'Image',
}));

// Mock react-native-tts — its native module would crash jest at import.
// Provide a minimal stub that records calls; tests that need to assert
// on speak/stop should use the wrapper at @services/speech and let it
// drive this mock. Tests that mock the wrapper directly (most of them)
// bypass this stub entirely.
jest.mock('react-native-tts', () => ({
  __esModule: true,
  default: {
    speak: jest.fn(),
    stop: jest.fn(),
    setDefaultRate: jest.fn(),
    setDefaultLanguage: jest.fn(),
    getInitStatus: jest.fn(() => Promise.resolve('success')),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    removeAllListeners: jest.fn(),
  },
}));

// react-native-video loads a native spec (requireNativeComponent) at import
// time, which isn't available in Jest. Stub the default export as a simple
// component so screens that render <Video> can mount.
jest.mock('react-native-video', () => 'Video');

// @react-native-firebase/messaging extends a native event emitter at import
// time (RNFBNativeEventEmitter), which throws "Super expression must either be
// null or a function" under Jest. Provide a messaging() factory plus the
// AuthorizationStatus enum the push service reads.
jest.mock('@react-native-firebase/messaging', () => {
  const messaging = jest.fn(() => ({
    requestPermission: jest.fn(() => Promise.resolve(1)),
    registerDeviceForRemoteMessages: jest.fn(() => Promise.resolve()),
    getAPNSToken: jest.fn(() => Promise.resolve('apns-token')),
    getToken: jest.fn(() => Promise.resolve('fcm-token')),
    onTokenRefresh: jest.fn(() => jest.fn()),
    onMessage: jest.fn(() => jest.fn()),
    onNotificationOpenedApp: jest.fn(() => jest.fn()),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
    setBackgroundMessageHandler: jest.fn(),
  }));
  messaging.AuthorizationStatus = {
    NOT_DETERMINED: -1,
    DENIED: 0,
    AUTHORIZED: 1,
    PROVISIONAL: 2,
  };
  return { __esModule: true, default: messaging };
});
