import { COLORS } from '../constants/colors';
import { SHADOWS } from '../constants/shadows';
import { SPACING, BORDER_RADIUS } from '../constants/dimensions';

export const theme = {
  colors: COLORS,
  shadows: SHADOWS,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  
  typography: {
    fontFamily: {
      primary: 'CormorantGaramond-Regular',
      secondary: 'CormorantGaramond-Regular',
      fallback: 'Georgia',
    },
    
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 28,
      '4xl': 32,
    },
    
    lineHeights: {
      xs: 18,
      sm: 20,
      base: 24,
      lg: 26,
      xl: 28,
      '2xl': 32,
      '3xl': 36,
      '4xl': 42,
    },
    
    weights: {
      light: '300' as const,
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
    
    styles: {
      headline: {
        fontFamily: 'CormorantGaramond-MediumItalic',
        fontSize: 32,
        lineHeight: 42,
        color: COLORS.PRIMARY.GOLD,
        letterSpacing: 0.5,
      },
      
      title: {
        fontFamily: 'CormorantGaramond-Regular',
        fontSize: 24,
        lineHeight: 32,
        color: COLORS.TEXT.TITLE,
        letterSpacing: 0.3,
      },
      
      subtitle: {
        fontFamily: 'CormorantGaramond-Regular',
        fontSize: 20,
        lineHeight: 26,
        color: COLORS.TEXT.WHITE,
      },
      
      body: {
        fontFamily: 'CormorantGaramond-Regular',
        fontSize: 16,
        lineHeight: 24,
        color: COLORS.TEXT.WHITE,
      },
      
      bodySmall: {
        fontFamily: 'CormorantGaramond-Regular',
        fontSize: 14,
        lineHeight: 22,
        color: COLORS.TEXT.WHITE,
      },
      
      button: {
        fontFamily: 'CormorantGaramond-SemiBold',
        fontSize: 18,
        lineHeight: 22,
        color: COLORS.PRIMARY.GOLD,
        textTransform: 'uppercase' as const,
        letterSpacing: 2,
      },
      
      input: {
        fontFamily: 'CormorantGaramond-Regular',
        fontSize: 16,
        lineHeight: 20,
        color: COLORS.TEXT.WHITE,
      },
      
      link: {
        fontFamily: 'CormorantGaramond-Regular',
        fontSize: 14,
        lineHeight: 20,
        color: COLORS.PRIMARY.GOLD,
        textDecorationLine: 'underline' as const,
      },
    },
  },
} as const;

export type Theme = typeof theme;