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
}

export type ButtonProps = GradientProps | AuthProps | MCButtonBaseProps;

// ---------------------------------------------------------------------------
// Figma design tokens — MC Component Library Button (node 125:440)
// Corner/M = 8px, Spacing/M = 16px, Spacing/S = 12px, Spacing/XS = 8px
// Border/Subtle = #a3b3cc (palette.navy.light)
// Glow Drop Shadow: color #F0D4A84D, blur:10, spread:3
// ---------------------------------------------------------------------------

// Figma: RoundedButton auto-generated (node 125:440) confirms borderRadius: 16
const MC_BORDER_RADIUS = radius.m; // 16px — from Figma node inspection

// Size specs derived from Figma metadata (L: 155×52, S: 138×42)
const SIZE = {
  L: {
    paddingVertical: spacing.s,      // 12px → 12+28+12 = 52px total
    paddingHorizontal: spacing.m,    // 16px — Figma: Spacing/M
    minHeight: 52,
    gap: spacing.xs,                 // 8px between icon and label
    fontSize: fontSize.s,            // 16px — Figma: font/size/S
    lineHeight: 24,
  },
  S: {
    paddingVertical: spacing.xs,     // 8px → 8+26+8 = 42px total
    paddingHorizontal: spacing.s,    // 12px — Figma: Spacing/S
    minHeight: 42,
    gap: spacing.xs,                 // 8px
    fontSize: fontSize.xs,           // 14px — Figma: font/size/XS
    lineHeight: 20,
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
// Figma: background = "Transparent White Gradient" (glassGradient.button 4%→1%)
//        border = 0.5px Border/Subtle (#a3b3cc), borderRadius = Radius/M (16px)
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
        {/* Figma: Transparent White Gradient — top→bottom 4%→1% white over navy.card base */}
        <LinearGradient
          colors={[glassGradient.button.start, glassGradient.button.end]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
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
// Figma: background = "Translucent White Gradient" (glassGradient.card 8%→2%)
//        shadow = Background Blur 60 (no glow)
//        border = 0.5px Border/Subtle (#a3b3cc), borderRadius = Radius/M (16px)
// ---------------------------------------------------------------------------

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
        {/* Figma: Translucent White Gradient — top→bottom 8%→2% white over navy.card base */}
        <LinearGradient
          colors={[glassGradient.card.start, glassGradient.card.end]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
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
}: Omit<MCButtonBaseProps, 'variant' | 'active'>) => {
  const sz = SIZE[size];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
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
}: Omit<GradientProps, 'variant'>) => {
  const theme = useTheme();

  return (
    <View style={[styles.gradientShadow, style, disabled && styles.gradientDisabled]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        disabled={disabled}
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
// Legacy: Auth variant
// ---------------------------------------------------------------------------

const AuthButtonInner = ({ title, onPress }: Omit<AuthProps, 'variant'>) => {
  const theme = useTheme();

  return (
    <TouchableOpacity onPress={onPress} style={styles.authContainer} activeOpacity={0.8}>
      <View style={[styles.authDot, { backgroundColor: theme.colors.text.accent }]} />
      <Text style={[styles.authText, { color: theme.colors.text.accent }]}>{title}</Text>
      <View style={[styles.authDot, { backgroundColor: theme.colors.text.accent }]} />
    </TouchableOpacity>
  );
};

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
  // Figma auto-gen confirmed: borderWidth:0.5, borderRadius:16, gap:8
  mcBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidth.thin,             // Figma: 0.5px
    borderColor: palette.navy.light,           // Figma: Border/Subtle = #a3b3cc
    backgroundColor: palette.navy.card,        // Figma: dark glass base (#1a1f2e) — gradient overlaid on top
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

  // Shared label style for primary + secondary
  mcLabel: {
    fontFamily: fontFamily.body,               // Figma: Inter Regular
    fontWeight: '400',
    color: palette.gold.DEFAULT,              // Figma: Bg/Brand = #f2e1b0
    textAlign: 'center',
    includeFontPadding: false,
    textShadowColor: textShadow.warmGlow.color,
    textShadowOffset: textShadow.warmGlow.offset,
    textShadowRadius: textShadow.warmGlow.radius,
  },

  // Link container — no background/border; Figma: Link L:122×40, Link S:114×40
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },

  // Link label — same gold, no underline (matches Figma screenshot)
  linkLabel: {
    fontFamily: fontFamily.body,               // Figma: Inter Regular
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

  // ── Legacy: Auth variant ───────────────────────────────────────────────────
  authContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
    marginVertical: 30,
  },
  authText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 28,
    textTransform: 'uppercase',
    textShadowColor: textShadow.glowSubtle.color,
    textShadowOffset: textShadow.glowSubtle.offset,
    textShadowRadius: 4,
  },
  authDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    shadowColor: palette.gold.warm,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
});
