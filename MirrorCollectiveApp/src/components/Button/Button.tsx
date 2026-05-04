import React, { type ReactNode } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import {
  moderateScale,
  scaleCap,
  useTheme,
  palette,
  textShadow,
  fontSize,
  fontFamily,
  spacing,
  radius,
  borderWidth,
  glassGradient,
} from '@theme';

import StarIcon from '../StarIcon';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Figma: MC Component Library — Button (node 125:440) */
export type ButtonVariant = 'gradient' | 'auth' | 'primary' | 'secondary' | 'link';

/** Figma: Size=L (52px height) | Size=S (42px height) */
export type ButtonSize = 'L' | 'S';

interface BaseProps {
  onPress: () => void;
  title: string;
  disabled?: boolean;
  testID?: string;
}

// MC Component Library variants (Figma node 125:440)
interface MCButtonBaseProps extends BaseProps {
  variant: 'primary' | 'secondary' | 'link';
  size?: ButtonSize;
  /** Active state — adds Glow Drop Shadow (#F0D4A84D blur:10 spread:3) */
  active?: boolean;
  /** Optional icon rendered to the left of the label */
  leftIcon?: ReactNode;
  /** Optional icon rendered to the right of the label */
  rightIcon?: ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

interface GradientProps extends BaseProps {
  variant: 'gradient';
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  buttonStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  textStyle?: TextStyle;
  gradientColors?: string[];
}

interface AuthProps extends BaseProps {
  variant: 'auth';
  /** Optional star size override (px). Default 20px to match auth screen designs. */
  iconSize?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export type ButtonProps = GradientProps | AuthProps | MCButtonBaseProps;

// ---------------------------------------------------------------------------
// Figma design tokens — MC Component Library Button (node 125:440)
// Corner/M = 8px, Spacing/M = 16px, Spacing/S = 12px, Spacing/XS = 8px
// Border/Subtle = #a3b3cc (palette.navy.light)
// Glow Drop Shadow: color #F0D4A84D, blur:10, spread:3
// ---------------------------------------------------------------------------

// Verified against Figma node 125:435 (Primary-L-Inactive symbol — the actual
// button instance, not the parent component frame). Variable bound to the
// button surface is `Radius/M:16`. The parent frame also exposes `Corner/M:8`
// but that variable is not applied to the button itself; it's a sibling token
// used elsewhere in the design system.
const MC_BORDER_RADIUS = radius.m; // 16px — Figma: Radius/M (bound to node 125:435)

// Size specs derived from Figma metadata (L: 155×52, S: 138×42)
// Typography: Cormorant Garamond Regular per Figma "Heading S/XS (Cormorant)" tokens.
//   Heading S  → font/size/XL (24) / lineHeight font/size/2XL (28) — used at size L
//   Heading XS → font/size/L  (20) / lineHeight 1.3 ≈ 26 — used at size S
const SIZE = {
  L: {
    paddingVertical: spacing.s,      // 12px → 12+28+12 = 52px total
    paddingHorizontal: spacing.m,    // 16px — Figma: Spacing/M
    minHeight: 52,
    gap: spacing.xs,                 // 8px between icon and label
    fontSize: fontSize.xl,           // 24px — Figma: font/size/XL (Heading S)
    lineHeight: fontSize['2xl'],     // 28px — Figma: font/size/2XL
  },
  S: {
    paddingVertical: spacing.xs,     // 8px → 8+26+8 = 42px total
    paddingHorizontal: spacing.s,    // 12px — Figma: Spacing/S
    minHeight: 42,
    gap: spacing.xs,                 // 8px
    fontSize: fontSize.l,            // 20px — Figma: font/size/L (Heading XS)
    lineHeight: 26,                  // Figma: 1.3 × 20 ≈ 26
  },
} as const;

// Active state glow — Figma: Glow Drop Shadow X:0 Y:0 Blur:10 Spread:3 #F0D4A8·30%
// Glow layer is flush with the button (no negative insets) so no gap appears between
// the layer background and the button border. Spread:3 is absorbed into shadowRadius
// (blur:10 + spread:3 → shadowRadius:13), which is the standard RN approximation.
const ACTIVE_GLOW_SHADOW = {
  shadowColor: palette.gold.glow,            // Figma: #F0D4A8 (palette.gold.glow)
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.3,                // Figma: 30%
  shadowRadius: 13,                  // Figma blur:10 + spread:3 absorbed
  elevation: 10,
} as const;

// ---------------------------------------------------------------------------
// MC Primary Button
// Solid `palette.navy.card` fill with hairline `Border/Subtle` and
// `Radius/M (16px)`. Active state adds a gold drop shadow.
//
// Earlier iterations tried to render Figma's "BACKGROUND_BLUR radius:60" +
// "Transparent White Gradient" literally via BlurView + LinearGradient. On
// real iOS hardware that read as nearly transparent — the blur captures the
// underlying screen content (stars/sky), and the 4%→1% white overlay isn't
// strong enough to mask it. The QuizWelcomeScreen card pattern (solid navy
// fill) matches Figma's mockup intent and renders consistently.
//
// Layer contract:
//   <View mcGlowWrapper>             ← shadow lives here, no clipping
//     <View activeGlowLayer/>        ← solid bg triggers iOS shadow render (active only)
//     <TouchableOpacity mcBase>      ← border + solid navy fill
//       icon + label + icon
//     </TouchableOpacity>
//   </View>
// ---------------------------------------------------------------------------

const PrimaryButton = ({
  title,
  onPress,
  disabled,
  size = 'L',
  active = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  testID,
}: Omit<MCButtonBaseProps, 'variant'>) => {
  const sz = SIZE[size];
  return (
    <View style={[styles.mcGlowWrapper, disabled && styles.disabled, style]}>
      {active && (
        <View style={styles.activeGlowLayer} pointerEvents="none" />
      )}
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.85}
        testID={testID}
        style={[
          styles.mcBase,
          {
            paddingVertical: sz.paddingVertical,
            paddingHorizontal: sz.paddingHorizontal,
            minHeight: sz.minHeight,
            gap: sz.gap,
            borderRadius: MC_BORDER_RADIUS,
          },
        ]}
      >
        {leftIcon}
        <Text
          style={[
            styles.mcLabel,
            { fontSize: moderateScale(sz.fontSize, 0.3), lineHeight: sz.lineHeight },
            textStyle,
          ]}
        >
          {title}
        </Text>
        {rightIcon}
      </TouchableOpacity>
    </View>
  );
};

// ---------------------------------------------------------------------------
// MC Secondary Button
// Figma node 125:436 — Style=Secondary, Size=L, State=Inactive
//
// Differs from Primary in two ways:
//   1. Background: "Translucent White Gradient" rgba(253,253,249,0.03)→0.20
//      (Primary uses "Transparent White Gradient" 0.01→0 which is near-invisible)
//   2. Text: NO warm-glow shadow (Primary has 0px 0px 9px rgba(229,214,176,0.5))
//
// Layer contract (mirrors OptionsButton shell/frame pattern):
//   <View mcGlowWrapper>          ← shadow lives here, no clipping
//     <View activeGlowLayer/>     ← active-state glow (optional)
//     <TouchableOpacity mcBase>   ← border, radius, overflow:hidden
//       <LinearGradient>          ← Translucent White Gradient (clipped by overflow)
//       icon + label + icon
//     </TouchableOpacity>
//   </View>
// ---------------------------------------------------------------------------

const SECONDARY_GRADIENT = [
  glassGradient.echoPrimary.start,  // rgba(253,253,249,0.03)
  glassGradient.echoPrimary.end,    // rgba(253,253,249,0.20)
];

const SecondaryButton = ({
  title,
  onPress,
  disabled,
  size = 'L',
  active = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  testID,
}: Omit<MCButtonBaseProps, 'variant'>) => {
  const sz = SIZE[size];
  return (
    <View style={[styles.mcGlowWrapper, disabled && styles.disabled, style]}>
      {active && (
        <View style={styles.activeGlowLayer} pointerEvents="none" />
      )}
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.85}
        testID={testID}
        style={[
          styles.mcBase,
          styles.mcSecondaryBase,
          {
            paddingVertical: sz.paddingVertical,
            paddingHorizontal: sz.paddingHorizontal,
            minHeight: sz.minHeight,
            gap: sz.gap,
            borderRadius: MC_BORDER_RADIUS,
          },
        ]}
      >
        <LinearGradient
          colors={SECONDARY_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {leftIcon}
        <Text
          style={[
            styles.mcSecondaryLabel,
            { fontSize: moderateScale(sz.fontSize, 0.3), lineHeight: sz.lineHeight },
            textStyle,
          ]}
        >
          {title}
        </Text>
        {rightIcon}
      </TouchableOpacity>
    </View>
  );
};

// ---------------------------------------------------------------------------
// MC Link Button
// Figma: no background / no border — icons + label inline
//        text color = palette.gold.DEFAULT, no underline decoration
//        Size=L: 122×40px | Size=S: 114×40px
// ---------------------------------------------------------------------------

const LinkButton = ({
  title,
  onPress,
  disabled,
  size = 'L',
  leftIcon,
  rightIcon,
  style,
  textStyle,
  testID,
}: Omit<MCButtonBaseProps, 'variant' | 'active'>) => {
  const sz = SIZE[size];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      testID={testID}
      style={[
        styles.linkContainer,
        { gap: sz.gap },
        disabled && styles.disabled,
        style,
      ]}
    >
      {leftIcon}
      <Text
        style={[
          styles.linkLabel,
          { fontSize: moderateScale(sz.fontSize, 0.3), lineHeight: sz.lineHeight },
          textStyle,
        ]}
      >
        {title}
      </Text>
      {rightIcon}
    </TouchableOpacity>
  );
};

// ---------------------------------------------------------------------------
// Legacy: Gradient variant
// ---------------------------------------------------------------------------

const DEFAULT_GRADIENT = [
  glassGradient.echoPrimary.start,  // rgba(253,253,249,0.03)
  glassGradient.echoPrimary.end,    // rgba(253,253,249,0.20)
];

const GradientButton = ({
  title,
  onPress,
  disabled,
  style,
  containerStyle,
  buttonStyle,
  contentStyle,
  textStyle,
  gradientColors = DEFAULT_GRADIENT,
  testID,
}: Omit<GradientProps, 'variant'>) => {
  const theme = useTheme();

  return (
    <View style={[styles.gradientShadow, style, disabled && styles.gradientDisabled]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        disabled={disabled}
        testID={testID}
        style={[styles.gradientContainer, containerStyle]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.gradientBackground, buttonStyle]}
          pointerEvents="none"
        />
        <View style={[styles.gradientContent, contentStyle]} pointerEvents="none">
          <Text style={[styles.gradientText, { color: theme.colors.text.paragraph2 }, textStyle]}>
            {title}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

// ---------------------------------------------------------------------------
// MC Auth Button — star + Cormorant + star CTA used on Login / SignUp /
// ForgotPassword / ResetPassword screens.
// Pattern: StarIcon (20×20) — gap 16 — title (Cormorant 24px / 28 lh, warmGlow
//          shadow blur 4) — gap 16 — StarIcon (20×20). No background, border,
//          or blur — text-only with decorative icons.
// ---------------------------------------------------------------------------

const AuthButtonInner = ({
  title,
  onPress,
  disabled,
  iconSize = 20,
  style,
  textStyle,
  testID,
}: Omit<AuthProps, 'variant'>) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.8}
    testID={testID}
    style={[styles.authContainer, disabled && styles.disabled, style]}
  >
    <StarIcon width={iconSize} height={iconSize} />
    <Text style={[styles.authText, textStyle]}>{title}</Text>
    <StarIcon width={iconSize} height={iconSize} />
  </TouchableOpacity>
);

// ---------------------------------------------------------------------------
// Public Button component
// ---------------------------------------------------------------------------

const Button = (props: ButtonProps) => {
  if (props.variant === 'auth') {
    return <AuthButtonInner {...props} />;
  }
  if (props.variant === 'gradient') {
    return <GradientButton {...props} />;
  }
  if (props.variant === 'secondary') {
    return <SecondaryButton {...props} />;
  }
  if (props.variant === 'link') {
    return <LinkButton {...props} />;
  }
  // default: 'primary'
  return <PrimaryButton {...props} />;
};

export default Button;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // ── MC Component Library shared base ──────────────────────────────────────
  // Solid navy fill matching QuizWelcomeScreen card pattern. Figma's
  // BACKGROUND_BLUR + Transparent White Gradient mocks read as nearly
  // transparent on real iOS hardware; the solid fill produces the same
  // perceived appearance as the design while rendering consistently.
  mcBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidth.thin,             // Figma: 0.5px
    borderColor: palette.navy.light,           // Figma: Border/Subtle = #a3b3cc
    backgroundColor: palette.navy.card,        // Solid navy — matches QuizWelcome card
    overflow: 'hidden',
  },

  // Layout wrapper only — no overflow constraint so the glow layer's shadow bleeds outward
  mcGlowWrapper: {
    alignSelf: 'center',
  },

  // Absolutely-positioned glow layer, flush with the button (no gap).
  // Solid backgroundColor required on iOS — transparent views produce no shadow.
  // Figma: Glow Drop Shadow X:0 Y:0 Blur:10 Spread:3 #F0D4A8·30%
  activeGlowLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: MC_BORDER_RADIUS,
    backgroundColor: palette.navy.card,  // solid dark — triggers iOS shadow rendering
    ...ACTIVE_GLOW_SHADOW,
  },

  // Primary label — Cormorant Regular, gold, WITH warm-glow text shadow.
  // Figma: Primary inactive text-shadow 0px 0px 9px rgba(229,214,176,0.5)
  mcLabel: {
    fontFamily: fontFamily.heading,
    fontWeight: '400',
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    includeFontPadding: false,
    textShadowColor: textShadow.warmGlow.color,
    textShadowOffset: textShadow.warmGlow.offset,
    textShadowRadius: textShadow.warmGlow.radius,
  },

  // Secondary base — transparent so LinearGradient shows through.
  // mcBase's solid navy fill is replaced by the gradient.
  mcSecondaryBase: {
    backgroundColor: 'transparent',
  },

  // Secondary label — identical to mcLabel EXCEPT no text shadow.
  // Figma node 125:436: secondary removes the warm-glow shadow on text.
  mcSecondaryLabel: {
    fontFamily: fontFamily.heading,
    fontWeight: '400',
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    includeFontPadding: false,
  },

  // Link container — no background/border; Figma: Link L:122×40, Link S:114×40
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },

  // Link label — same gold, no underline (matches Figma screenshot)
  // Same Cormorant typography as primary/secondary labels per Figma node 125:440.
  linkLabel: {
    fontFamily: fontFamily.heading,           // Figma: Cormorant Garamond Regular
    fontWeight: '400',
    color: palette.gold.DEFAULT,              // Figma: Bg/Brand = #f2e1b0
    textAlign: 'center',
    includeFontPadding: false,
    textShadowColor: textShadow.warmGlow.color,
    textShadowOffset: textShadow.warmGlow.offset,
    textShadowRadius: textShadow.warmGlow.radius,
  },

  disabled: {
    opacity: 0.5,
  },

  // ── Legacy: Gradient variant ───────────────────────────────────────────────
  gradientShadow: {
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.01)',
    shadowColor: palette.gold.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 12,
  },
  gradientDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  gradientContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: borderWidth.hairline,
    borderColor: palette.navy.light,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  gradientContent: {
    paddingVertical: moderateScale(14),
    paddingHorizontal: scaleCap(48, 60),
    minWidth: moderateScale(120),
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientText: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize.xl),
    fontWeight: '400',
    lineHeight: moderateScale(28),
    letterSpacing: 0,
    textAlign: 'center',
    textTransform: 'uppercase',
    textShadowColor: textShadow.warmGlow.color,
    textShadowOffset: textShadow.warmGlow.offset,
    textShadowRadius: textShadow.warmGlow.radius,
    includeFontPadding: false,
  },

  // ── Auth variant — star+text+star CTA (Login/SignUp/Forgot/Reset) ─────────
  // Figma: row with 16px gap, no padding/background/border. Stars are
  // decorative; the only press target is the whole row.
  authContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.m,                            // 16px — Figma: Spacing/M
  },
  authText: {
    fontFamily: fontFamily.heading,            // Cormorant Garamond Regular
    fontWeight: '400',
    fontSize: fontSize.xl,                     // 24px — Figma: Heading S size
    lineHeight: fontSize['2xl'],               // 28px — Figma: Heading S lineHeight
    color: palette.gold.DEFAULT,               // #f2e2b1 — Text/Paragraph-1
    textShadowColor: textShadow.warmGlow.color, // #E5D6B0 · 50%
    textShadowOffset: textShadow.warmGlow.offset,
    textShadowRadius: 4,                       // Figma: blur 4
    includeFontPadding: false,
  },
});
