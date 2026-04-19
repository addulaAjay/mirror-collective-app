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
    // TODO: confirm with designer — card gradient border end colour (no Figma token yet)
    border: '#C79E48',   // Code-defined: glass card gradient border end stop
    // NOTE: #F5E6B8 (old accent) replaced by palette.gold.DEFAULT (#f2e2b1) — Figma Colour.Text.Paragraph-1
  },
  navy: {
    DEFAULT: '#1a2238',  // Colour.Text.Inverse
    deep: '#0b0f1c',     // Code-defined: deepest dark background (add to Figma — Phase 8 follow-up)
    card: '#1a1f2e',     // Code-defined: popup/card background dark navy (add to Figma — Phase 8 follow-up)
    // TODO: confirm with designer — glass card inner background (no Figma token yet); consolidating #191A23/#191B24 variants
    cardInner: '#191A23',  // Code-defined: glass card inner fill (slightly darker than navy.card)
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
    overlay: 'rgba(0, 0, 0, 0.25)',        // 25% black overlay/scrim
    overlayLight: 'rgba(0, 0, 0, 0.15)',   // 15% light overlay
    overlayHeavy: 'rgba(0, 0, 0, 0.40)',   // 40% heavy overlay
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
// Border width (from Figma Design System)
// ---------------------------------------------------------------------------

export const borderWidth = {
  hairline: 0.25,
  thin: 0.5,
  regular: 1,
  medium: 1.5,
  thick: 2,
} as const;

// ---------------------------------------------------------------------------
// Text shadows (from Figma Design System)
// Note: React Native Text doesn't support separate shadow opacity,
// so colors must include opacity in rgba() format
// Figma "Glow Drop Shadow" variable properties:
//   - X:0 Y:0 Blur:10 Spread:3 #F0D4A8 · 30% (primary shadow)
//   - Second shadow (Blur:60) omitted due to React Native limitation
// ---------------------------------------------------------------------------

export const textShadow = {
  // Figma "Glow Drop Shadow" — standard text glow for headings/titles
  // Used across all screens for consistent branded typography
  glow: {
    color: 'rgba(240, 212, 168, 0.3)',    // palette.gold.glow (#f0d4a8) @ 30%
    offset: { width: 0, height: 0 },
    radius: 10,                            // Blur:10 from Figma
  },
  // Stronger glow variant — for hero text or emphasized content
  glowStrong: {
    color: 'rgba(240, 212, 168, 0.6)',    // palette.gold.glow (#f0d4a8) @ 60%
    offset: { width: 0, height: 0 },
    radius: 16,
  },
  // Subtle glow variant — for secondary text that needs slight emphasis
  glowSubtle: {
    color: 'rgba(240, 212, 168, 0.3)',    // palette.gold.glow (#f0d4a8) @ 30%
    offset: { width: 0, height: 0 },
    radius: 8,
  },
  // Warm glow variant — alternative aesthetic using warm gold
  warmGlow: {
    color: 'rgba(229, 214, 176, 0.5)',    // palette.gold.warm (#e5d6b0) @ 50%
    offset: { width: 0, height: 0 },
    radius: 9,
  },
} as const;

// ---------------------------------------------------------------------------
// Glass morphism gradients (from Figma Design System)
// Used for glass button and card effects
// ---------------------------------------------------------------------------

export const glassGradient = {
  button: {
    start: 'rgba(253, 253, 249, 0.04)',  // palette.gold.subtlest (#fdfdf9) @ 4%
    end: 'rgba(253, 253, 249, 0.01)',    // palette.gold.subtlest (#fdfdf9) @ 1%
  },
  card: {
    start: 'rgba(253, 253, 249, 0.08)',  // palette.gold.subtlest (#fdfdf9) @ 8%
    end: 'rgba(253, 253, 249, 0.02)',    // palette.gold.subtlest (#fdfdf9) @ 2%
  },
  // Figma node 767:2849 — Echo Vault home CTA buttons (exact Figma stops)
  echoPrimary: {
    start: 'rgba(253, 253, 249, 0.03)', // palette.gold.subtlest @ 3%
    end:   'rgba(253, 253, 249, 0.20)', // palette.gold.subtlest @ 20%
  },
  echoSecondary: {
    start: 'rgba(253, 253, 249, 0.01)', // palette.gold.subtlest @ 1%
    end:   'rgba(253, 253, 249, 0)',    // transparent
  },
  // TODO: confirm exact gradient stops with designer — border glow treatment
  border: {
    start: '#ffffff',   // palette.neutral.white — gradient border start
    end: '#C79E48',     // palette.gold.border — gradient border end
    // Figma "Glow Drop Shadow" variable: #F0D4A899 = palette.gold.glow (#f0d4a8) @ 60%
    // Previously used palette.gold.DEFAULT (#f2e2b1) — corrected to match Figma spec exactly
    shadowColor: 'rgba(240, 212, 168, 0.6)',  // palette.gold.glow (#f0d4a8) @ 60%
  },
} as const;

// ---------------------------------------------------------------------------
// Modal / overlay colours
// Opacity variants of palette colours used for modal backgrounds and cards.
// Defined here so screens don't contain inline rgba literals.
// ---------------------------------------------------------------------------
export const modalColors = {
  // Full-screen backdrop — palette.navy.deep @ 92%
  backdrop: 'rgba(11, 15, 28, 0.92)',
  // Modal card background — palette.navy.card @ 95%
  card: 'rgba(26, 31, 46, 0.95)',
  // Edge-blend mid-stop for image gradients — palette.navy.deep @ 60%
  navyDeep60: 'rgba(11, 15, 28, 0.6)',
  // Close button background — palette.gold.subtlest @ 8% (same as glassGradient.card.start)
  closeButtonBg: 'rgba(253, 253, 249, 0.08)',
  // Border/divider colours derived from palette.gold.warm (#e5d6b0)
  borderSubtle: 'rgba(229, 214, 176, 0.15)',  // @ 15% — section dividers
  borderDefault: 'rgba(229, 214, 176, 0.25)', // @ 25% — card/button borders
  // Text at reduced opacity
  textGoldMuted: 'rgba(242, 226, 177, 0.85)', // palette.gold.DEFAULT @ 85%
  textWhiteMuted: 'rgba(253, 253, 249, 0.85)', // palette.gold.subtlest @ 85%
} as const;

// ---------------------------------------------------------------------------
// Typography primitives (from Figma Typography collection)
// ---------------------------------------------------------------------------

export const fontFamily = {
  // Cormorant Garamond — Figma: Heading family
  // PostScript names verified via fc-query 2026-04-12
  heading: 'CormorantGaramond-Regular',
  headingLight: 'CormorantGaramond-Light',
  headingLightItalic: 'CormorantGaramond-LightItalic',
  headingMedium: 'CormorantGaramond-Medium',
  headingMediumItalic: 'CormorantGaramond-MediumItalic',
  headingItalic: 'CormorantGaramond-Italic',
  headingSemiBold: 'CormorantGaramond-SemiBold',
  headingSemiBoldItalic: 'CormorantGaramond-SemiBoldItalic',
  headingBold: 'CormorantGaramond-Bold',
  headingBoldItalic: 'CormorantGaramond-BoldItalic',
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
  // PostScript names from font files (fc-query verified 2026-04-12): Inter18pt-*
  body: 'Inter18pt-Regular',
  bodyLight: 'Inter18pt-Light',
  bodyMedium: 'Inter18pt-Medium',
  bodySemiBold: 'Inter18pt-SemiBold',
  bodyBold: 'Inter18pt-Bold',
  bodyItalic: 'Inter18pt-Italic',
  bodyMediumItalic: 'Inter18pt-MediumItalic',
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
// Elevation System (from Figma Design System - node 266:680)
// Extracted from Figma API on 2026-04-12
// Note: React Native doesn't support spread on shadows, so these values
// are flattened into individual properties
// ---------------------------------------------------------------------------

export const elevation = {
  // Surface/Default - Subtle black shadow for base elevation
  // Figma: rgba(0, 0, 0, 0.29) blur:20 spread:3
  surfaceDefault: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.29,
    shadowRadius: 20,
    // Android elevation approximation
    elevation: 8,
  },

  // Surface/Raised - Gold glow for elevated/focused elements
  // Figma: rgba(0.95, 0.89, 0.69, 0.50) = #F2E2B1 50% blur:24 spread:8
  surfaceRaised: {
    shadowColor: palette.gold.DEFAULT,  // #F2E2B1
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    // Android elevation approximation
    elevation: 16,
  },

  // Surface/Overlay - No shadow (transparent overlay)
  surfaceOverlay: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  // Shadow/Overlay - No shadow (for overlay backgrounds)
  shadowOverlay: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
} as const;

// Legacy shadows kept for backward compatibility
// TODO: Migrate all usages to elevation.* and remove this
export const shadows = {
  LIGHT: elevation.surfaceDefault,
  MEDIUM: elevation.surfaceDefault,
  HEAVY: elevation.surfaceRaised,
  CONTAINER: elevation.surfaceRaised,
  GLOW: elevation.surfaceRaised,
} as const;
