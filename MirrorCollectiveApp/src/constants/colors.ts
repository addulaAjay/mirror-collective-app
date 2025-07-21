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
    USER_BUBBLE: '#d9d9d9',
    SYSTEM_BUBBLE: '#c59d5f',
    OVERLAY: 'rgba(0, 0, 0, 0.3)',
  },
  
  // Text colors
  TEXT: {
    PRIMARY: '#1a2238',
    SECONDARY: '#9baac2',
    TERTIARY: 'rgba(163, 179, 204, 0.50)',
    WHITE: '#ffffff',
    TITLE: '#e5e3dd',
    USER_MESSAGE: '#e5d6b0',
    SYSTEM_MESSAGE: '#1a2238',
    LOADING: '#ccc',
  },
  
  // Border colors
  BORDER: {
    PRIMARY: '#1a2238',
    SECONDARY: '#9baac2',
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