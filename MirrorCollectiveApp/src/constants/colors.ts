export const COLORS = {
  // Primary brand colors
  PRIMARY: {
    GOLD: '#e5d6b0',
    GOLD_DARK: '#c59d5f',
    GOLD_LIGHT: '#e5e3dd',
  },
  
  // Background colors
  BACKGROUND: {
    PRIMARY: '#000',
    CHAT_CONTAINER: 'rgba(155, 170, 194, 0.15)',
    INPUT: '#d9d9d9',
    USER_BUBBLE: '#D8C278',
    SYSTEM_BUBBLE: 'transparent',
    OVERLAY: 'rgba(0, 0, 0, 0.3)',
  },
  
  // Text colors
  TEXT: {
    PRIMARY: '#1a2238',
    SECONDARY: '#9baac2',
    TERTIARY: 'rgba(186, 194, 207, 0.5)',
    WHITE: '#ffffff',
    TITLE: '#e2e0daff',
    USER_MESSAGE: '#070707ff',
    SYSTEM_MESSAGE: '#D8C278',
    LOADING: '#ccc',
  },
  
  // Border colors
  BORDER: {
    PRIMARY: '#1a2238',
    SECONDARY: '#9baac2',
    GOLD: '#D8C278'
  },
  
  // Status colors
  STATUS: {
    SUCCESS: '#4CAF50',
    ERROR: '#F44336',
    WARNING: '#FF9800',
    INFO: '#2196F3',
  },
} as const;

export type ColorKey = keyof typeof COLORS;