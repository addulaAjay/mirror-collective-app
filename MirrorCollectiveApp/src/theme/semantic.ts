/**
 * Semantic design tokens — maps primitive tokens to usage intent.
 * This is the layer that would swap to enable light mode / theming.
 * Do NOT import this file directly in components — use theme/index.ts.
 */

import { moderateScale } from './responsive';
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
      // TODO: designer confirmation needed — 0.01 opacity looks like a Figma decimal
      // precision error (1% → 0.01). Functionally invisible on Android. Should this
      // be fully transparent or have a visible tint? Track in Phase 8 follow-up.
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
      shadowColor: 'rgba(229, 214, 176, 0.5)',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1 as const,
      shadowRadius: 4,
      elevation: 4,
    },
    button: {
      shadowColor: palette.gold.warm,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1 as const,
      shadowRadius: 4,
      elevation: 4,
    },
    input: {
      shadowColor: palette.neutral.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25 as const,
      shadowRadius: 12,
      elevation: 12,
    },
    container: {
      shadowColor: palette.neutral.black,
      shadowOffset: { width: -1, height: 5 },
      shadowOpacity: 0.25 as const,
      shadowRadius: 26,
      elevation: 26,
    },
  },

  // Spacing
  spacing,

  // Border radius
  borderRadius: radius,

  // Typography
  typography: {
    fontFamily: {
      heading: fontFamily.heading,
      title: fontFamily.title,
      body: fontFamily.body,
      fallback: fontFamily.bodyFallback,
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
      xs: lineHeight.xxs,   // 16 — Figma XXS
      sm: lineHeight.xs,    // 18 — Figma XS
      base: lineHeight.s,   // 20 — Figma S
      lg: lineHeight.m,     // 24 — Figma M
      xl: lineHeight.l,     // 28 — Figma L
      '2xl': lineHeight.xl, // 32 — Figma XL
      '3xl': lineHeight.xxl, // 40 — Figma XXL
      '4xl': lineHeight['3xl'], // 48 — Figma 3XL
    },

    weights: fontWeight,

    // Composite text styles — fontSize uses moderateScale(size, 0.3) for gentle
    // phone scaling (~±3px across iPhone SE → Pro Max). Baseline: 393px (iPhone 14 Pro).
    styles: {
      // --- Heading family (Cormorant Garamond) ---
      headline: {
        fontFamily: fontFamily.headingMediumItalic,
        fontStyle: 'italic' as const,  // Required on iOS: fontFamily alone doesn't trigger italic rendering
        fontSize: moderateScale(fontSize['3xl'], 0.3),   // 32 base
        lineHeight: lineHeight['3xl'],                   // 48
        color: palette.gold.DEFAULT,
        letterSpacing: 0.5,
      },
      subtitle: {
        fontFamily: fontFamily.heading,
        fontSize: moderateScale(fontSize.l, 0.3),        // 20 base
        lineHeight: lineHeight.l,                        // 28
        color: palette.neutral.offWhite,
      },
      logoText: {
        fontFamily: fontFamily.heading,
        fontSize: moderateScale(fontSize.xs, 0.3),       // 14 base
        lineHeight: lineHeight.xs,                       // 18
        color: palette.gold.DEFAULT,
        textTransform: 'uppercase' as const,
        letterSpacing: 1.5,
      },
      button: {
        fontFamily: fontFamily.headingSemiBold,
        fontSize: moderateScale(fontSize.m, 0.3),        // 18 base
        lineHeight: lineHeight.s,                        // 20
        color: palette.gold.DEFAULT,
        textTransform: 'uppercase' as const,
        letterSpacing: 2,
      },
      // --- Title family (Playfair Display) ---
      title: {
        fontFamily: fontFamily.title,
        fontSize: moderateScale(fontSize.xl, 0.3),       // 24 base
        lineHeight: lineHeight.xxl,                      // 40
        color: palette.gold.DEFAULT,
        letterSpacing: 0.3,
      },
      // --- Body family (Inter) ---
      welcome: {
        fontFamily: fontFamily.body,
        fontSize: moderateScale(fontSize.m, 0.3),        // 18 base
        lineHeight: lineHeight.m,                        // 24
        color: palette.neutral.offWhite,
      },
      body: {
        fontFamily: fontFamily.body,
        fontSize: moderateScale(fontSize.s, 0.3),        // 16 base
        lineHeight: lineHeight.m,                        // 24
        color: palette.neutral.cream,
      },
      bodySmall: {
        fontFamily: fontFamily.body,
        fontSize: moderateScale(fontSize.xs, 0.3),       // 14 base
        lineHeight: lineHeight.s,                        // 20
        color: palette.neutral.cream,
      },
      bodyItalic: {
        fontFamily: fontFamily.bodyItalic,
        fontStyle: 'italic' as const,  // Required on iOS: fontFamily alone doesn't trigger italic rendering
        fontSize: moderateScale(fontSize.s, 0.3),        // 16 base
        lineHeight: lineHeight.m,                        // 24
        color: palette.neutral.cream,
      },
      input: {
        fontFamily: fontFamily.body,
        fontSize: moderateScale(fontSize.s, 0.3),        // 16 base
        lineHeight: lineHeight.s,                        // 20
        color: palette.neutral.offWhite,
      },
      inputPlaceholder: {
        fontFamily: fontFamily.body,                     // Inter Regular (Body)
        fontSize: moderateScale(fontSize.s, 0.3),        // 16 base — Figma: Input/Size M
        lineHeight: lineHeight.m,                        // 24 — Figma: font/line-height/M
        color: palette.navy.light,                       // Figma: Text/Inverse Paragraph-2 (#a3b3cc)
      },
      link: {
        fontFamily: fontFamily.body,
        fontSize: moderateScale(fontSize.xs, 0.3),       // 14 base
        lineHeight: lineHeight.s,                        // 20
        color: palette.gold.DEFAULT,
        textDecorationLine: 'underline' as const,
      },
      linkSmall: {
        fontFamily: fontFamily.body,
        fontSize: moderateScale(fontSize.xs, 0.3),       // 14 base
        lineHeight: lineHeight.xs,                       // 18
        color: palette.gold.DEFAULT,
        textDecorationLine: 'underline' as const,
      },
      linkLarge: {
        fontFamily: fontFamily.bodyMedium,
        fontSize: moderateScale(fontSize.m, 0.3),        // 18 base
        lineHeight: lineHeight.s,                        // 20
        color: palette.gold.DEFAULT,
        textDecorationLine: 'underline' as const,
      },
      label: {
        fontFamily: fontFamily.bodyItalic,
        fontStyle: 'italic' as const,
        fontSize: moderateScale(fontSize.xs, 0.3),       // 14 base
        lineHeight: lineHeight.s,                        // 20
        color: palette.neutral.offWhite,
      },
      caption: {
        fontFamily: fontFamily.body,
        fontSize: moderateScale(fontSize.xxs, 0.3),      // 12 base
        lineHeight: lineHeight.xs,                       // 18
        color: palette.neutral.caption,
      },
    },
  },
} as const;

export type Semantic = typeof semantic;
