export const COLORS = {
  // Primary Colors
  PRIMARY: {
    GOLD: '#C59D5F',
    GOLD_LIGHT: '#E5D6B0',
    GOLD_DARK: '#9F7D4B',
    GOLD_SHIMMER: '#F4E8D0',
  },

  // Background Colors
  BACKGROUND: {
    PRIMARY: '#1A1A1A',
    SECONDARY: '#0D0D0D',
    TERTIARY: '#2D2D2D',
    OVERLAY: 'rgba(0, 0, 0, 0.8)',
    GRADIENT_START: 'rgba(0, 0, 0, 0)',
    GRADIENT_MID: 'rgba(20, 13, 13, 0.41)',
    GRADIENT_END: 'rgba(48, 31, 31, 1)',
  },

  // Text Colors
  TEXT: {
    PRIMARY: '#FFFFFF',
    SECONDARY: '#E5D6B0',
    TERTIARY: '#9BAAC2',
    MUTED: '#777777',
    ACCENT: '#C59D5F',
    LOADING: '#E5D6B0',
    ERROR: '#FF6B6B',
    SUCCESS: '#4ECDC4',
  },

  // UI Elements
  UI: {
    BORDER: '#3A3A3A',
    BORDER_LIGHT: '#4A4A4A',
    INPUT_BG: 'rgba(255, 255, 255, 0.05)',
    BUTTON_PRIMARY: '#C59D5F',
    BUTTON_SECONDARY: 'rgba(197, 157, 95, 0.2)',
    DISABLED: '#666666',
  },

  // Semantic Colors
  SEMANTIC: {
    ERROR: '#FF4444',
    WARNING: '#FFB444',
    SUCCESS: '#44FF44',
    INFO: '#4444FF',
  },
};

export const TYPOGRAPHY = {
  // Font Families
  FONTS: {
    REGULAR: 'System',
    MEDIUM: 'System',
    BOLD: 'System',
    LIGHT: 'System',
  },

  // Font Sizes
  SIZES: {
    XXXL: 32,
    XXL: 28,
    XL: 24,
    L: 20,
    M: 16,
    S: 14,
    XS: 12,
    XXS: 10,
  },

  // Line Heights
  LINE_HEIGHTS: {
    TIGHT: 1.2,
    NORMAL: 1.5,
    RELAXED: 1.8,
  },

  // Letter Spacing
  LETTER_SPACING: {
    TIGHT: -0.5,
    NORMAL: 0,
    WIDE: 0.5,
    WIDER: 1,
    WIDEST: 2,
  },
};

export const SPACING = {
  XXXS: 2,
  XXS: 4,
  XS: 8,
  S: 12,
  M: 16,
  L: 24,
  XL: 32,
  XXL: 48,
  XXXL: 64,
};

export const LAYOUT = {
  SCREEN_PADDING: 20,
  CONTAINER_PADDING: 16,
  CARD_PADDING: 16,
  BUTTON_HEIGHT: 48,
  INPUT_HEIGHT: 48,
  HEADER_HEIGHT: 64,
  TAB_BAR_HEIGHT: 80,
};

export const SHADOWS = {
  SMALL: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  MEDIUM: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  LARGE: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  GLOW: {
    shadowColor: COLORS.PRIMARY.GOLD,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 0,
  },
};

export const BORDERS = {
  RADIUS: {
    NONE: 0,
    SMALL: 4,
    MEDIUM: 8,
    LARGE: 16,
    XLARGE: 24,
    FULL: 9999,
  },
  WIDTH: {
    THIN: 1,
    MEDIUM: 2,
    THICK: 3,
  },
};

// Common Text Styles
export const TEXT_STYLES = {
  h1: {
    fontSize: TYPOGRAPHY.SIZES.XXXL,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    lineHeight: TYPOGRAPHY.SIZES.XXXL * TYPOGRAPHY.LINE_HEIGHTS.TIGHT,
    letterSpacing: TYPOGRAPHY.LETTER_SPACING.TIGHT,
  },
  h2: {
    fontSize: TYPOGRAPHY.SIZES.XXL,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    lineHeight: TYPOGRAPHY.SIZES.XXL * TYPOGRAPHY.LINE_HEIGHTS.TIGHT,
    letterSpacing: TYPOGRAPHY.LETTER_SPACING.TIGHT,
  },
  h3: {
    fontSize: TYPOGRAPHY.SIZES.XL,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    lineHeight: TYPOGRAPHY.SIZES.XL * TYPOGRAPHY.LINE_HEIGHTS.NORMAL,
  },
  h4: {
    fontSize: TYPOGRAPHY.SIZES.L,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    lineHeight: TYPOGRAPHY.SIZES.L * TYPOGRAPHY.LINE_HEIGHTS.NORMAL,
  },
  body: {
    fontSize: TYPOGRAPHY.SIZES.M,
    fontWeight: 'normal',
    color: COLORS.TEXT.PRIMARY,
    lineHeight: TYPOGRAPHY.SIZES.M * TYPOGRAPHY.LINE_HEIGHTS.NORMAL,
  },
  bodySecondary: {
    fontSize: TYPOGRAPHY.SIZES.M,
    fontWeight: 'normal',
    color: COLORS.TEXT.SECONDARY,
    lineHeight: TYPOGRAPHY.SIZES.M * TYPOGRAPHY.LINE_HEIGHTS.NORMAL,
  },
  caption: {
    fontSize: TYPOGRAPHY.SIZES.S,
    fontWeight: 'normal',
    color: COLORS.TEXT.TERTIARY,
    lineHeight: TYPOGRAPHY.SIZES.S * TYPOGRAPHY.LINE_HEIGHTS.NORMAL,
  },
  button: {
    fontSize: TYPOGRAPHY.SIZES.M,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    letterSpacing: TYPOGRAPHY.LETTER_SPACING.WIDER,
    textTransform: 'uppercase' as const,
  },
  link: {
    fontSize: TYPOGRAPHY.SIZES.M,
    fontWeight: 'normal',
    color: COLORS.TEXT.ACCENT,
    textDecorationLine: 'underline' as const,
  },
};

// Common Component Styles
export const COMPONENT_STYLES = {
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  screenPadding: {
    paddingHorizontal: LAYOUT.SCREEN_PADDING,
  },
  card: {
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderRadius: BORDERS.RADIUS.MEDIUM,
    padding: LAYOUT.CARD_PADDING,
    ...SHADOWS.MEDIUM,
  },
  button: {
    height: LAYOUT.BUTTON_HEIGHT,
    borderRadius: BORDERS.RADIUS.LARGE,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: SPACING.L,
  },
  buttonPrimary: {
    backgroundColor: COLORS.UI.BUTTON_PRIMARY,
  },
  buttonSecondary: {
    backgroundColor: COLORS.UI.BUTTON_SECONDARY,
    borderWidth: BORDERS.WIDTH.THIN,
    borderColor: COLORS.PRIMARY.GOLD,
  },
  input: {
    height: LAYOUT.INPUT_HEIGHT,
    backgroundColor: COLORS.UI.INPUT_BG,
    borderRadius: BORDERS.RADIUS.MEDIUM,
    paddingHorizontal: SPACING.M,
    fontSize: TYPOGRAPHY.SIZES.M,
    color: COLORS.TEXT.PRIMARY,
    borderWidth: BORDERS.WIDTH.THIN,
    borderColor: COLORS.UI.BORDER,
  },
  divider: {
    height: BORDERS.WIDTH.THIN,
    backgroundColor: COLORS.UI.BORDER,
    marginVertical: SPACING.M,
  },
};

// Gradient Configurations
export const GRADIENTS = {
  PRIMARY: {
    colors: [COLORS.PRIMARY.GOLD_DARK, COLORS.PRIMARY.GOLD_LIGHT],
    start: { x: 0.5, y: 1 },
    end: { x: 0.5, y: 0 },
  },
  RADIAL: {
    colors: [
      COLORS.BACKGROUND.GRADIENT_START,
      COLORS.BACKGROUND.GRADIENT_MID,
      COLORS.BACKGROUND.GRADIENT_END,
    ],
    locations: [0.29, 0.7, 1],
  },
};

// Animation Configurations
export const ANIMATIONS = {
  DURATION: {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500,
  },
  EASING: {
    IN: 'ease-in',
    OUT: 'ease-out',
    IN_OUT: 'ease-in-out',
  },
};

// Z-Index Levels
export const Z_INDEX = {
  BACKGROUND: -1,
  DEFAULT: 0,
  CARD: 10,
  DROPDOWN: 50,
  MODAL: 100,
  OVERLAY: 200,
  TOAST: 300,
  TOOLTIP: 400,
};

// Utility function for responsive dimensions
export const responsive = (value: number, scaleFactor: number = 1) => {
  // You can add more sophisticated responsive logic here
  return value * scaleFactor;
};

// Export legacy color support
export const colors_old = {
  text: {
    accent: COLORS.TEXT.ACCENT,
  },
};

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  LAYOUT,
  SHADOWS,
  BORDERS,
  TEXT_STYLES,
  COMPONENT_STYLES,
  GRADIENTS,
  ANIMATIONS,
  Z_INDEX,
  responsive,
  colors_old,
};
