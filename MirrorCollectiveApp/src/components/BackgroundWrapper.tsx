import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle, TouchableWithoutFeedback, Keyboard, View } from 'react-native';

import { palette } from '@theme';

interface BackgroundWrapperProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Set true on screens with no text inputs (e.g. Terms & Conditions).
   * Skips the TouchableWithoutFeedback wrapper so it cannot intercept
   * scroll gestures on the ScrollView inside.
   */
  scrollable?: boolean;
}

/**
 * BackgroundWrapper - Centralized background component
 *
 * Wraps screen content with the app's flat dark background (palette.navy.screen,
 * #0c0f1a). This is a single solid colour — anything revealed behind or beside a
 * screen (nav container, native-stack transition seam, pre-decode frame) matches
 * it exactly, so there is no edge or band to mismatch.
 */
const BackgroundWrapper: React.FC<BackgroundWrapperProps> = ({
  children,
  style,
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

  return <View style={[styles.container, style]}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.navy.screen,
  },
  inner: {
    flex: 1,
  },
});

export default BackgroundWrapper;
