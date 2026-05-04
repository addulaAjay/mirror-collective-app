/**
 * Theme entry point — re-exports the composed theme from semantic tokens.
 * All existing consumers using `import { theme } from '@theme'` continue to work unchanged.
 */

import { semantic } from './semantic';

export const theme = {
  colors: semantic.colors,
  shadows: semantic.shadows,
  spacing: semantic.spacing,
  borderRadius: semantic.borderRadius,
  typography: semantic.typography,
} as const;

export type Theme = typeof theme;

// Re-export primitives for advanced use cases
export { palette, spacing, radius, borderWidth, textShadow, glassGradient, modalColors, fontFamily, fontSize, lineHeight, fontWeight, shadows, elevation, effects } from './tokens';
export { semantic } from './semantic';
export { ThemeProvider, useTheme } from './ThemeContext';
export {
  scale,
  verticalScale,
  moderateScale,
  scaleMin,
  scaleCap,
  useResponsive,
} from './responsive';
export type { ResponsiveUtils } from './responsive';
