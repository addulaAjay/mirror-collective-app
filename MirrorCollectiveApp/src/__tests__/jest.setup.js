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
      parallel: jest.fn(() => ({ start: jest.fn() })),
      sequence: jest.fn(() => ({ start: jest.fn() })),
      delay: jest.fn(() => ({ start: jest.fn() })),
      loop: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
      View: 'View',
      Text: 'Text',
    },
    Easing: {
      out: jest.fn(fn => fn),
      in: jest.fn(fn => fn),
      inOut: jest.fn(fn => fn),
      cubic: jest.fn(),
      ease: jest.fn(),
      linear: jest.fn(),
      bezier: jest.fn(() => jest.fn()),
    },
    View: 'View',
    Text: 'Text',
    Image: 'Image',
    ImageBackground: 'ImageBackground',
    TouchableOpacity: 'TouchableOpacity',
    TouchableWithoutFeedback: 'TouchableWithoutFeedback',
    Pressable: 'Pressable',
    Modal: 'Modal',
    TextInput: 'TextInput',
    ScrollView: 'ScrollView',
    FlatList: 'FlatList',
    SafeAreaView: 'SafeAreaView',
    KeyboardAvoidingView: 'KeyboardAvoidingView',
    ActivityIndicator: 'ActivityIndicator',
    Switch: 'Switch',
    Alert: { alert: jest.fn() },
    // openSettings is what a denied-permission flow sends the user to
    // (src/utils/permissions/media.ts). Without it here, any code path that
    // handles a permission denial throws on an undefined function.
    Linking: { openURL: jest.fn(), openSettings: jest.fn() },
    // Android runtime permissions. Absent from this mock until now, so any
    // code touching PermissionsAndroid crashed in tests. Shapes mirror the
    // real module closely enough for assertions on grant results.
    PermissionsAndroid: {
      PERMISSIONS: {
        RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
        CAMERA: 'android.permission.CAMERA',
        READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
        WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
        READ_MEDIA_IMAGES: 'android.permission.READ_MEDIA_IMAGES',
        READ_MEDIA_VIDEO: 'android.permission.READ_MEDIA_VIDEO',
        READ_MEDIA_AUDIO: 'android.permission.READ_MEDIA_AUDIO',
      },
      RESULTS: {
        GRANTED: 'granted',
        DENIED: 'denied',
        NEVER_ASK_AGAIN: 'never_ask_again',
      },
      check: jest.fn(() => Promise.resolve(true)),
      request: jest.fn(() => Promise.resolve('granted')),
      requestMultiple: jest.fn(() => Promise.resolve({})),
    },
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
      // The real module also exposes these. Omitting them meant any code
      // referencing DocumentPicker.types.audio/images/video got `undefined`
      // in tests and the assertion silently passed against undefined.
      audio: 'audio',
      images: 'images',
      video: 'video',
      allFiles: 'allFiles',
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
  KeyboardToolbar: 'KeyboardToolbar',
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
        // Chat media reads a prepared photo as base64 at send time
        // (src/features/chat-media/prepareChatPhoto.ts). Default to a tiny
        // valid payload; override per-test to assert on the path or to
        // simulate a read failure.
        readFile: jest.fn().mockResolvedValue('QUJD'),
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

// Mock react-native-image-picker — native module. Defaults to the
// user-cancelled shape (`didCancel: true`) so a test that doesn't opt in
// never gets a surprise asset. Override per-test:
//   jest.requireMock('react-native-image-picker').launchImageLibrary
//     .mockResolvedValue({ assets: [{ uri: 'file:///p.jpg', type: 'image/jpeg' }] })
jest.mock('react-native-image-picker', () => ({
  __esModule: true,
  launchImageLibrary: jest.fn(() => Promise.resolve({ didCancel: true })),
  launchCamera: jest.fn(() => Promise.resolve({ didCancel: true })),
}));

// Mock react-native-audio-recorder-player.
//
// IMPORTANT: the default export must be an OBJECT, not a function. The
// library ships a singleton *instance*, and consumers do
// `useRef(AudioRecorderPlayer).current` — a function default would be
// treated as a lazy initialiser by useRef and produce a broken ref.
// (Same reasoning as the local mock in NewEchoComposeScreen.test.tsx.)
jest.mock('react-native-audio-recorder-player', () => ({
  __esModule: true,
  default: {
    startRecorder: jest.fn(() => Promise.resolve('file:///cache/rec.m4a')),
    stopRecorder: jest.fn(() => Promise.resolve('file:///cache/rec.m4a')),
    addRecordBackListener: jest.fn(),
    removeRecordBackListener: jest.fn(),
    startPlayer: jest.fn(() => Promise.resolve()),
    stopPlayer: jest.fn(() => Promise.resolve()),
    pausePlayer: jest.fn(() => Promise.resolve()),
    resumePlayer: jest.fn(() => Promise.resolve()),
    addPlaybackEndListener: jest.fn(),
    removePlaybackEndListener: jest.fn(),
    addPlayBackListener: jest.fn(),
    removePlayBackListener: jest.fn(),
  },
}));

// Mock react-native-vision-camera. Used in this codebase as much for its
// cross-platform permission statics (src/utils/permissions/media.ts) as for
// the camera view itself, so both the statics and the hooks are stubbed.
// Defaults to granted so permission-indifferent tests don't have to care;
// permission-specific tests mock the module locally instead.
jest.mock('react-native-vision-camera', () => ({
  __esModule: true,
  Camera: Object.assign('Camera', {
    getCameraPermissionStatus: jest.fn(() => 'granted'),
    requestCameraPermission: jest.fn(() => Promise.resolve('granted')),
    getMicrophonePermissionStatus: jest.fn(() => 'granted'),
    requestMicrophonePermission: jest.fn(() => Promise.resolve('granted')),
  }),
  useCameraPermission: jest.fn(() => ({
    hasPermission: true,
    requestPermission: jest.fn(() => Promise.resolve(true)),
  })),
  useMicrophonePermission: jest.fn(() => ({
    hasPermission: true,
    requestPermission: jest.fn(() => Promise.resolve(true)),
  })),
  useCameraDevice: jest.fn(() => ({ id: 'mock-back', position: 'back' })),
  useCameraFormat: jest.fn(() => undefined),
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
