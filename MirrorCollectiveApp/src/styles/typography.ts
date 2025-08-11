export const typography = {
  fontFamily: {
    primary: 'CormorantGaramond-Regular', // Primary elegant serif
    secondary: 'CormorantGaramond-Regular', // Secondary serif
    fallback: 'Georgia', // System fallback
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
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  styles: {
    // Main Headlines - Large elegant serif italic
    headline: {
      fontFamily: 'CormorantGaramond-MediumItalic',
      fontSize: 32,
      lineHeight: 42,
      color: '#F5E6B8', // Warm gold/cream
      letterSpacing: 0.5,
    },

    // Page Titles - Elegant serif regular
    title: {
      fontFamily: 'CormorantGaramond-Regular',
      fontSize: 24,
      lineHeight: 32,
      color: '#F5E6B8',
      letterSpacing: 0.3,
    },

    // Subheadings - Same serif family, regular
    subtitle: {
      fontFamily: 'CormorantGaramond-Regular',
      fontSize: 20,
      lineHeight: 26,
      color: '#F0F0F0', // Light cream/off-white
    },

    // Subheading for welcome messages
    welcome: {
      fontFamily: 'CormorantGaramond-Regular',
      fontSize: 18,
      lineHeight: 24,
      color: '#F0F0F0',
    },

    // Body text - Clean serif
    body: {
      fontFamily: 'CormorantGaramond-Regular',
      fontSize: 16,
      lineHeight: 24,
      color: '#E5E5E5', // Light gray/cream
    },

    // Body text small
    bodySmall: {
      fontFamily: 'CormorantGaramond-Regular',
      fontSize: 14,
      lineHeight: 22,
      color: '#E5E5E5',
    },

    // Italic body text
    bodyItalic: {
      fontFamily: 'CormorantGaramond-Italic',
      fontSize: 16,
      lineHeight: 24,
      color: '#E5E5E5',
    },

    // Header logo text - Small caps style
    logoText: {
      fontFamily: 'CormorantGaramond-Regular',
      fontSize: 14,
      lineHeight: 18,
      color: '#F5E6B8',
      textTransform: 'uppercase' as const,
      letterSpacing: 1.5,
    },

    // Call-to-action buttons
    button: {
      fontFamily: 'CormorantGaramond-SemiBold',
      fontSize: 18,
      lineHeight: 22,
      color: '#F5E6B8', // Bright gold/yellow
      textTransform: 'uppercase' as const,
      letterSpacing: 2,
    },

    // Input fields
    input: {
      fontFamily: 'CormorantGaramond-Regular',
      fontSize: 16,
      lineHeight: 20,
      color: '#F0F0F0',
    },

    // Input placeholders
    inputPlaceholder: {
      fontFamily: 'CormorantGaramond-MediumItalic',
      fontSize: 16,
      lineHeight: 20,
      color: '#A0A0A0',
    },

    // Links
    link: {
      fontFamily: 'CormorantGaramond-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: '#F5E6B8',
      textDecorationLine: 'underline' as const,
    },

    // Large links
    linkLarge: {
      fontFamily: 'CormorantGaramond-Medium',
      fontSize: 18,
      lineHeight: 22,
      color: '#F5E6B8',
      textDecorationLine: 'underline' as const,
    },

    // Labels
    label: {
      fontFamily: 'CormorantGaramond-Italic',
      fontSize: 14,
      lineHeight: 20,
      color: '#F0F0F0',
    },

    // Caption text
    caption: {
      fontFamily: 'CormorantGaramond-Regular',
      fontSize: 12,
      lineHeight: 18,
      color: '#C0C0C0',
    },
  },
};

export const colors = {
  text: {
    primary: '#F0F0F0', // Light cream/off-white
    secondary: '#E5E5E5', // Light gray/cream
    accent: '#F5E6B8', // Warm gold/cream
    headline: '#F5E6B8', // Warm gold for headlines
    link: '#F5E6B8', // Golden links
    muted: 'rgba(240, 240, 240, 0.5)',
    placeholder: '#A0A0A0',
  },

  background: {
    primary: 'transparent',
    input: 'rgba(217, 217, 217, 0.01)',
  },

  border: {
    primary: '#F0F0F0',
    input: '#F0F0F0',
  },

  button: {
    primary: '#F5E6B8', // Bright gold/yellow for buttons
    disabled: 'rgba(245, 230, 184, 0.6)',
  },
};

export const shadows = {
  text: {
    color: 'rgba(229, 214, 176, 0.5)',
    offset: { width: 0, height: 0 },
    radius: 4,
  },

  button: {
    color: '#E5D6B0',
    offset: { width: 0, height: 0 },
    opacity: 1,
    radius: 4,
  },

  input: {
    color: '#000',
    offset: { width: 0, height: 4 },
    opacity: 0.25,
    radius: 12,
  },

  container: {
    color: '#000',
    offset: { width: -1, height: 5 },
    opacity: 0.25,
    radius: 26,
  },
};
