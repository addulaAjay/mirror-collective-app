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
