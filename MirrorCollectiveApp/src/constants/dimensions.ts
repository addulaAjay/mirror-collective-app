import { Dimensions, Platform, StatusBar } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const SCREEN_DIMENSIONS = {
  WIDTH: screenWidth,
  HEIGHT: screenHeight,
} as const;

export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 20,
  XXL: 24,
  XXXL: 32,
  LARGE: 40,
  XLARGE: 48,
} as const;

export const BORDER_RADIUS = {
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 20,
  FULL: 9999,
} as const;

export const CHAT_DIMENSIONS = {
  CONTAINER_WIDTH_OFFSET: 84,
  MAX_HEIGHT_RATIO: 0.65,
  MESSAGE_MAX_WIDTH_PERCENTAGE: 80,
  INPUT_BORDER_RADIUS: 13,
} as const;

export const PLATFORM_SPECIFIC = {
  STATUS_BAR_HEIGHT: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
} as const;