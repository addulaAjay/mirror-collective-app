import { BlurView } from '@react-native-community/blur';
import { effects } from '@theme';
import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

/**
 * Internal frosted-glass surface — a single-source wrapper around
 * `@react-native-community/blur` so we can swap blur libraries (expo-blur,
 * Skia BackdropFilter, etc.) in one place if needed.
 *
 * Defaults read from `effects.backgroundBlur` in `@theme`. Override per-call
 * site only when a specific surface needs to deviate (e.g. modal overlay
 * uses lower amount than glass cards).
 *
 * Layer contract — this component is meant to sit at the bottom of a
 * stack inside a parent with `overflow: 'hidden'` and a `borderRadius`,
 * with the gradient tint and content layered on top. It uses
 * `StyleSheet.absoluteFill` by default and ignores its own `borderRadius`
 * (BlurView does not honour it on iOS).
 */
type BlurType =
  | 'xlight'
  | 'light'
  | 'dark'
  | 'extraDark'
  | 'regular'
  | 'prominent';

interface BlurSurfaceProps {
  /** Override the default blur amount (0–100). Default: effects.backgroundBlur.amount. */
  amount?: number;
  /** Override the default blur material. Default: effects.backgroundBlur.type. */
  type?: BlurType;
  /** Override the default solid tint shown when iOS Reduce Transparency is on. */
  fallbackColor?: string;
  /** Additional style overrides. Default fills the parent via absoluteFill. */
  style?: StyleProp<ViewStyle>;
}

const BlurSurface: React.FC<BlurSurfaceProps> = ({
  amount = effects.backgroundBlur.amount,
  type = effects.backgroundBlur.type,
  fallbackColor = effects.backgroundBlur.fallbackColor,
  style,
}) => (
  <BlurView
    style={[StyleSheet.absoluteFill, style]}
    blurType={type}
    blurAmount={amount}
    reducedTransparencyFallbackColor={fallbackColor}
  />
);

export default BlurSurface;
