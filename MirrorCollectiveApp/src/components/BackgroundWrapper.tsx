import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle, type ImageStyle, TouchableWithoutFeedback, Keyboard, View, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { palette } from '@theme';

interface BackgroundWrapperProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  /**
   * Set true on screens with no text inputs (e.g. Terms & Conditions).
   * Skips the TouchableWithoutFeedback wrapper so it cannot intercept
   * scroll gestures on the ScrollView inside.
   */
  scrollable?: boolean;
}

/**
 * The app background ramp, top → bottom. See palette.navy.screenTop /
 * screenBottom for why this is a gradient and not a flat colour.
 */
export const SCREEN_GRADIENT = [
  palette.navy.screenTop,
  palette.navy.screenBottom,
] as const;

/**
 * BackgroundWrapper - Centralized background component
 *
 * Wraps screen content with the dark starfield background.
 *
 * The background is drawn in two layers rather than as one baked PNG:
 *
 *   1. A `LinearGradient` painting the ramp #080911 → #1a2238 across the full
 *      height of the screen.
 *   2. A mostly-transparent star overlay composited on top.
 *
 * The baked PNG this replaced was a flat image whose gradient only lined up
 * with the app's flat fallback colour (`navy.deep`) about 18% down the screen —
 * at the bottom edge the two were off by rgb(+16,+20,+29). Any moment the
 * fallback showed (native-stack transition seam, the frame before the image
 * decoded, sub-pixel edges under `resizeMode="cover"`) it read as a
 * differently-coloured band. A GPU-interpolated gradient has no fallback to
 * mismatch, is banding-free, and anchors its stops to the real screen height
 * instead of to a cover-cropped 786x1704 bitmap.
 */
const BackgroundWrapper: React.FC<BackgroundWrapperProps> = ({
  children,
  style,
  imageStyle,
  scrollable = false,
}) => {
  const content = scrollable ? (
    // No TouchableWithoutFeedback — avoids stealing the initial touch
    // responder from nested ScrollViews (no keyboard to dismiss anyway)
    <View style={styles.inner}>{children}</View>
  ) : (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.inner}>{children}</View>
    </TouchableWithoutFeedback>
  );

  return (
    <LinearGradient
      colors={SCREEN_GRADIENT as unknown as string[]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.container, style]}
    >
      <Image
        source={require('@assets/backgrounds/starfield-stars.png')}
        style={[StyleSheet.absoluteFill, imageStyle as StyleProp<ImageStyle>]}
        resizeMode="cover"
        // Sits below `content` in z-order and `content` fills the wrapper, so
        // this never takes a touch — no pointerEvents needed.
        // Decorative — the stars carry no meaning for screen readers.
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
      {content}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
});

export default BackgroundWrapper;
