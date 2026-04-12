/**
 * Design token primitives — single source of truth.
 * Values are verified against the generated Figma output in src/theme/generated/tokens.ts.
 * To update: edit design/figma-tokens/tokens.json → run `npm run tokens:build`.
 * Do NOT import this file directly in components — use theme/index.ts.
 */

// Figma-generated token constants — imported to catch drift between Figma and
// the hand-maintained primitives below at build time.
import { figmaColour, figmaSpacingRadius, figmaTypography } from './generated/tokens';
export { figmaColour, figmaSpacingRadius, figmaTypography };

// ---------------------------------------------------------------------------
// Colour palette (from Figma Colour collection)
// ---------------------------------------------------------------------------

export const palette = {
  gold: {
    DEFAULT: '#f2e2b1',  // Colour.Text.Paragraph-1, Colour.Bg.Brand
    dark: '#c59e5f',     // Colour.Text.Heading
    mid: '#d7c08a',      // Code-defined: mid warm gold used in UI accents (add to Figma — Phase 8 follow-up)
    active: '#d9a766',   // Colour.Bg.Brand-Active
    subtle: '#f9f2dc',   // Colour.Bg.Brand-Subtle
    subtlest: '#fdfdf9', // Colour.Bg.Brand-Subtlest, Colour.Text.Paragraph-2
    warm: '#e5d6b0',     // Secondary-Color-2 (existing app warm gold)
    glow: '#f0d4a8',     // Code-defined: gold glow/shadow tint (add to Figma — Phase 8 follow-up)
    rich: '#cfa64f',     // Code-defined: rich amber gold used in gradient stops (add to Figma — Phase 8 follow-up)
    amber: '#e2ae5a',    // Code-defined: amber gold gradient stop (add to Figma — Phase 8 follow-up)
    chat: '#D8C278',     // Chat bubble gold (existing app)
    bronze: '#9F8B61',   // MC logo SVG fill — used in MCLogo component
    // NOTE: #F5E6B8 (old accent) replaced by palette.gold.DEFAULT (#f2e2b1) — Figma Colour.Text.Paragraph-1
  },
  navy: {
    DEFAULT: '#1a2238',  // Colour.Text.Inverse
    deep: '#0b0f1c',     // Code-defined: deepest dark background (add to Figma — Phase 8 follow-up)
    card: '#1a1f2e',     // Code-defined: popup/card background dark navy (add to Figma — Phase 8 follow-up)
    medium: '#60739f',   // Colour.Text.Inverse-Paragraph-1
    muted: '#9baac2',    // Code-defined: muted border/icon blue (add to Figma — Phase 8 follow-up)
    border: '#808fb2',   // Code-defined: toggle/UI border blue (add to Figma — Phase 8 follow-up)
    light: '#a3b3cc',    // Colour.Text.Inverse-Paragraph-2
    lighter: '#dfe3ec',  // Colour.Icon.Subtlest
  },
  surface: {
    DEFAULT: 'rgba(163, 179, 204, 0.05)',  // Colour.Bg.Surface
    active: 'rgba(197, 158, 95, 0.05)',    // Colour.Bg.Surface-Active
    raised: 'rgba(253, 253, 249, 0.05)',   // Colour.Bg.Surface-Raised
    overlay: 'rgba(191, 199, 217, 0.05)', // Colour.Bg.Surface-Overlay
    inverse: 'rgba(26, 34, 56, 0.05)',    // Colour.Bg.Surface-Inverse
  },
  status: {
    error: '#f83b3d',
    errorHover: '#ff6668',
    errorActive: '#e51d20',
    success: '#23a671',
    successHover: '#44c08a',
    successActive: '#16855b',
    link: '#3b82f6',
    linkHover: '#60a5fa',
    linkActive: '#2563eb',
  },
  secondary: {
    'secondary-color-1': '#d8c8f6',  // Figma: Colour.Secondary.Secondary-Color-1 (purple)
    'secondary-color-2': '#e5d6b0',  // Figma: Colour.Secondary.Secondary-Color-2 (gold)
    'secondary-color-3': '#7b3f45',  // Figma: Colour.Secondary.Secondary-Color-3 (burgundy)
    'secondary-color-4': '#f1d2c9',  // Figma: Colour.Secondary.Secondary-Color-4 (blush)
    'secondary-color-5': '#a3b3cc',  // Figma: Colour.Secondary.Secondary-Color-5 (steel)
    'secondary-color-6': '#424242',  // Figma: Colour.Secondary.Secondary-Color-6 (charcoal)
  },
  neutral: {
    white: '#ffffff',
    offWhite: '#F0F0F0',
    cream: '#E5E5E5',
    dark: '#2c2c2c',     // Code-defined: dark charcoal for text on light/gold backgrounds (add to Figma — Phase 8 follow-up)
    placeholder: '#A0A0A0',
    caption: '#C0C0C0',
    inputBg: '#d9d9d9',
    chatContainer: 'rgba(155, 170, 194, 0.15)',
    black: '#000000',
    transparent: 'transparent',
  },
} as const;

// ---------------------------------------------------------------------------
// Spacing (from Figma Radius and Spacing collection)
// ---------------------------------------------------------------------------

export const spacing = {
  none: 0,
  negativeS: -4,
  negativeM: -8,
  negativeL: -16,
  xxs: 4,
  xs: 8,
  s: 12,
  m: 16,
  l: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

// ---------------------------------------------------------------------------
// Border radius (from Figma Radius and Spacing collection)
// ---------------------------------------------------------------------------

export const radius = {
  none: 0,
  xxs: 4,
  xs: 8,
  s: 12,
  m: 16,
  l: 20,
  xl: 24,
  full: 100,
} as const;

// ---------------------------------------------------------------------------
// Typography primitives (from Figma Typography collection)
// ---------------------------------------------------------------------------

export const fontFamily = {
  // Cormorant Garamond — Figma: Heading family
  heading: 'CormorantGaramond-Regular',
  headingLight: 'CormorantGaramond-Light',
  headingLightItalic: 'CormorantGaramond-LightItalic',
  headingMedium: 'CormorantGaramond-Medium',
  headingMediumItalic: 'CormorantGaramond-MediumItalic',
  headingItalic: 'CormorantGaramond-Italic',
  headingSemiBold: 'CormorantGaramond-SemiBold',
  headingFallback: 'Georgia',
  // Playfair Display — Figma: Title family
  title: 'PlayfairDisplay-Regular',
  titleMedium: 'PlayfairDisplay-Medium',
  titleMediumItalic: 'PlayfairDisplay-MediumItalic',
  titleSemiBold: 'PlayfairDisplay-SemiBold',
  titleBold: 'PlayfairDisplay-Bold',
  titleItalic: 'PlayfairDisplay-Italic',
  titleFallback: 'Georgia',
  // Inter — Figma: Body family
  body: 'Inter-Regular',
  bodyLight: 'Inter-Light',
  bodyMedium: 'Inter-Medium',
  bodySemiBold: 'Inter-SemiBold',
  bodyBold: 'Inter-Bold',
  bodyItalic: 'Inter-Italic',
  bodyMediumItalic: 'Inter-MediumItalic',
  bodyFallback: 'System',
} as const;

export const fontSize = {
  xxs: 12, // Figma XXS
  xs: 14,  // Figma XS
  s: 16,   // Figma S
  m: 18,   // Figma M
  l: 20,   // Figma L
  xl: 24,  // Figma XL
  '2xl': 28, // Figma 2XL
  '3xl': 32, // Figma 3XL
  '4xl': 36, // Figma 4XL
  '5xl': 48, // Figma 5XL
} as const;

export const lineHeight = {
  xxs: 16, // Figma XXS
  xs: 18,  // Figma XS
  s: 20,   // Figma S
  m: 24,   // Figma M
  l: 28,   // Figma L
  xl: 32,  // Figma XL
  xxl: 40, // Figma XXL
  '3xl': 48, // Figma 3XL
} as const;

export const fontWeight = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;

// ---------------------------------------------------------------------------
// Shadows (code-defined — not yet in Figma, see Phase 8 follow-up)
// ---------------------------------------------------------------------------

export const shadows = {
  LIGHT: {
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1 as const,
    shadowRadius: 4,
    elevation: 4,
  },
  MEDIUM: {
    shadowColor: 'rgba(0, 0, 0, 0.21)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1 as const,
    shadowRadius: 12,
    elevation: 12,
  },
  HEAVY: {
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1 as const,
    shadowRadius: 19,
    elevation: 19,
  },
  CONTAINER: {
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: -1, height: 5 },
    shadowOpacity: 1 as const,
    shadowRadius: 26,
    elevation: 26,
  },
  GLOW: {
    shadowColor: palette.gold.warm,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1 as const,
    shadowRadius: 4,
    elevation: 4,
  },
} as const;
