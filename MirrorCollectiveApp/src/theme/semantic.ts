/**
 * Semantic design tokens — maps primitive tokens to usage intent.
 * This is the layer that would swap to enable light mode / theming.
 * Do NOT import this file directly in components — use theme/index.ts.
 */

import {
  palette,
  spacing,
  radius,
  fontFamily,
  fontSize,
  lineHeight,
  fontWeight,
  shadows,
} from './tokens';

export const semantic = {
  colors: {
    // Text
    text: {
      primary: palette.gold.subtlest,          // Figma: Colour.Text.Paragraph-2 (#fdfdf9)
      secondary: palette.neutral.cream,         // code-defined — no Figma token yet (#E5E5E5)
      accent: palette.gold.DEFAULT,             // Figma: Colour.Text.Paragraph-1 (#f2e2b1)
      headline: palette.gold.DEFAULT,           // Figma: Colour.Text.Paragraph-1 (#f2e2b1)
      link: palette.gold.DEFAULT,               // Figma: Colour.Text.Paragraph-1 (#f2e2b1)
      muted: 'rgba(240, 240, 240, 0.5)',        // code-defined — no Figma token yet
      placeholder: palette.neutral.placeholder, // code-defined — no Figma token yet
      error: palette.status.error,              // Figma: Colour.Text.Error
      success: palette.status.success,          // Figma: Colour.Text.Success
      heading: palette.gold.dark,               // Figma: Colour.Text.Heading (#c59e5f)
      paragraph1: palette.gold.DEFAULT,         // Figma: Colour.Text.Paragraph-1
      paragraph2: palette.gold.subtlest,        // Figma: Colour.Text.Paragraph-2
      inverse: palette.navy.DEFAULT,            // Figma: Colour.Text.Inverse
      inverseParagraph1: palette.navy.medium,   // Figma: Colour.Text.Inverse-Paragraph-1
      inverseParagraph2: palette.navy.light,    // Figma: Colour.Text.Inverse-Paragraph-2
    },

    // Backgrounds
    background: {
      primary: palette.neutral.transparent,
      input: 'rgba(217, 217, 217, 0.01)',
      surface: palette.surface.DEFAULT,
      surfaceActive: palette.surface.active,
      surfaceRaised: palette.surface.raised,
      overlay: palette.surface.overlay,
      brand: palette.gold.DEFAULT,
      brandActive: palette.gold.active,
      chatContainer: palette.neutral.chatContainer,
      userBubble: palette.gold.chat,
      systemBubble: palette.neutral.transparent,
    },

    // Borders
    border: {
      primary: palette.neutral.offWhite,
      input: palette.neutral.offWhite,
      brand: palette.gold.DEFAULT,
      brandActive: palette.gold.active,
      brandSubtle: palette.gold.subtle,
      subtle: palette.navy.light,
      subtlest: palette.navy.lighter,
      inverse: palette.navy.DEFAULT,
      'inverse-1': palette.navy.medium,        // Figma: Colour.Border.Inverse-1 (#60739f)
      gold: palette.gold.chat,
    },

    // Buttons
    button: {
      primary: palette.gold.DEFAULT,           // Figma: Colour.Bg.Brand (#f2e2b1)
      disabled: 'rgba(245, 230, 184, 0.6)',    // code-defined — no Figma token yet
    },

    // Icons
    icon: {
      brand: palette.gold.DEFAULT,
      brandActive: palette.gold.active,
      subtle: palette.navy.lighter,
      subtleActive: palette.navy.light,
      inverse: palette.navy.DEFAULT,
      error: palette.status.error,
      success: palette.status.success,
    },

    // Status
    status: {
      error: palette.status.error,
      errorHover: palette.status.errorHover,
      errorActive: palette.status.errorActive,
      success: palette.status.success,
      successHover: palette.status.successHover,
      successActive: palette.status.successActive,
    },

    // Secondary palette (for special use cases)
    secondary: palette.secondary,
  },

  // Shadows
  shadows: {
    ...shadows,
    text: {
      color: 'rgba(229, 214, 176, 0.5)',
      offset: { width: 0, height: 0 },
      radius: 4,
    },
    button: {
      color: palette.gold.warm,
      offset: { width: 0, height: 0 },
      opacity: 1,
      radius: 4,
    },
    input: {
      color: palette.neutral.black,
      offset: { width: 0, height: 4 },
      opacity: 0.25,
      radius: 12,
    },
    container: {
      color: palette.neutral.black,
      offset: { width: -1, height: 5 },
      opacity: 0.25,
      radius: 26,
    },
  },

  // Spacing
  spacing,

  // Border radius
  borderRadius: radius,

  // Typography
  typography: {
    fontFamily: {
      primary: fontFamily.heading,
      secondary: fontFamily.heading,
      fallback: fontFamily.fallback,
    },

    // Scale — matches existing code API (xs/sm/base/lg...)
    // Maps to Figma scale (XXS/XS/S/M/L/XL/2XL/3XL)
    sizes: {
      xs: fontSize.xxs,    // 12 — Figma XXS
      sm: fontSize.xs,     // 14 — Figma XS
      base: fontSize.s,    // 16 — Figma S
      lg: fontSize.m,      // 18 — Figma M
      xl: fontSize.l,      // 20 — Figma L
      '2xl': fontSize.xl,  // 24 — Figma XL
      '3xl': fontSize['2xl'], // 28 — Figma 2XL
      '4xl': fontSize['3xl'], // 32 — Figma 3XL
    },

    lineHeights: {
      xs: lineHeight.xxs,    // 16
      sm: lineHeight.xs,     // 18 (assumed)
      base: 24,              // kept from existing code — body text needs more breathing room
      lg: 26,
      xl: 28,
      '2xl': 32,
      '3xl': 36,
      '4xl': 42,
    },

    weights: fontWeight,

    // Composite text styles
    styles: {
      headline: {
        fontFamily: fontFamily.headingMediumItalic,
        fontSize: fontSize['3xl'],   // 32
        lineHeight: 42,
        color: palette.gold.DEFAULT,  // Figma: Colour.Text.Paragraph-1
        letterSpacing: 0.5,
      },
      title: {
        fontFamily: fontFamily.heading,
        fontSize: fontSize.xl,       // 24
        lineHeight: 32,
        color: palette.gold.DEFAULT,  // Figma: Colour.Text.Paragraph-1
        letterSpacing: 0.3,
      },
      subtitle: {
        fontFamily: fontFamily.heading,
        fontSize: fontSize.l,        // 20
        lineHeight: 26,
        color: palette.neutral.offWhite,
      },
      welcome: {
        fontFamily: fontFamily.heading,
        fontSize: fontSize.m,        // 18
        lineHeight: 24,
        color: palette.neutral.offWhite,
      },
      body: {
        fontFamily: fontFamily.heading,
        fontSize: fontSize.s,        // 16
        lineHeight: 24,
        color: palette.neutral.cream,
      },
      bodySmall: {
        fontFamily: fontFamily.heading,
        fontSize: fontSize.xs,       // 14
        lineHeight: 22,
        color: palette.neutral.cream,
      },
      bodyItalic: {
        fontFamily: fontFamily.headingItalic,
        fontSize: fontSize.s,        // 16
        lineHeight: 24,
        color: palette.neutral.cream,
      },
      logoText: {
        fontFamily: fontFamily.heading,
        fontSize: fontSize.xs,       // 14
        lineHeight: 18,
        color: palette.gold.DEFAULT,  // Figma: Colour.Text.Paragraph-1
        textTransform: 'uppercase' as const,
        letterSpacing: 1.5,
      },
      button: {
        fontFamily: fontFamily.headingSemiBold,
        fontSize: fontSize.m,        // 18
        lineHeight: 22,
        color: palette.gold.DEFAULT,  // Figma: Colour.Text.Paragraph-1
        textTransform: 'uppercase' as const,
        letterSpacing: 2,
      },
      input: {
        fontFamily: fontFamily.heading,
        fontSize: fontSize.s,        // 16
        lineHeight: 20,
        color: palette.neutral.offWhite,
      },
      inputPlaceholder: {
        fontFamily: fontFamily.headingItalic,
        fontSize: fontSize.l,        // 20
        lineHeight: 20,
        color: '#E8F1F2',
      },
      link: {
        fontFamily: fontFamily.heading,
        fontSize: fontSize.xs,       // 14
        lineHeight: 20,
        color: palette.gold.DEFAULT,  // Figma: Colour.Text.Paragraph-1
        textDecorationLine: 'underline' as const,
      },
      linkSmall: {
        fontFamily: fontFamily.heading,
        fontSize: fontSize.xs,       // 14
        lineHeight: 18,
        color: palette.gold.DEFAULT,  // Figma: Colour.Text.Paragraph-1
        textDecorationLine: 'underline' as const,
      },
      linkLarge: {
        fontFamily: fontFamily.headingMedium,
        fontSize: fontSize.m,        // 18
        lineHeight: 22,
        color: palette.gold.DEFAULT,  // Figma: Colour.Text.Paragraph-1
        textDecorationLine: 'underline' as const,
      },
      label: {
        fontFamily: fontFamily.headingItalic,
        fontSize: fontSize.xs,       // 14
        lineHeight: 20,
        color: palette.neutral.offWhite,
      },
      caption: {
        fontFamily: fontFamily.heading,
        fontSize: fontSize.xxs,      // 12
        lineHeight: 18,
        color: palette.neutral.caption,
      },
    },
  },
} as const;

export type Semantic = typeof semantic;
