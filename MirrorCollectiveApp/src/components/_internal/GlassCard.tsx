import {
  palette,
  radius,
  borderWidth,
  spacing,
} from '@theme';
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

/**
 * Internal "glass card" surface — solid navy fill with hairline border and a
 * subtle gold drop shadow. Matches the QuizWelcomeScreen card pattern, which
 * is the closest visual match to Figma's mocked card surfaces.
 *
 * Earlier iterations of this component layered a BlurView + LinearGradient
 * stack to mimic Figma's "Background Blur without glow" + "Transparent White
 * Gradient" variables literally. In practice the BlurView blurs whatever
 * screen content sits behind the card (the night-sky background), which made
 * cards read as nearly-transparent on real iOS hardware. Figma's mocks assume
 * a flat dark backdrop and the variables are aspirational, not functional;
 * a solid `palette.navy.card` fill produces the same perceived appearance
 * without the rendering quirks.
 *
 * If you need the frosted-glass effect for a different surface (modal
 * backdrop, etc.), use `<BlurSurface>` directly.
 */
interface GlassCardProps {
  children: React.ReactNode;
  /** Border radius. Default `radius.l` (20) — matches QuizWelcome card. */
  borderRadius?: number;
  /** Inner padding. Default `spacing.m` (16). */
  padding?: number;
  /** Style overrides applied to the outer wrapper. */
  style?: StyleProp<ViewStyle>;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  borderRadius = radius.l,
  padding = spacing.m,
  style,
}) => (
  <View
    style={[
      styles.surface,
      { borderRadius, padding },
      style,
    ]}
  >
    {children}
  </View>
);

export default GlassCard;

const styles = StyleSheet.create({
  // Solid navy fill with hairline border. No drop shadow — pledge cards in
  // Figma do NOT have a gold glow (that's a QuizWelcome-specific effect).
  surface: {
    backgroundColor: palette.navy.card,
    borderWidth: borderWidth.hairline,
    borderColor: palette.navy.light,
  },
});
