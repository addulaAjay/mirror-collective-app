// components/ProgressBar.tsx
import React from 'react';
import { View, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import { COLORS, BORDERS, SHADOWS } from '../styles';

const { width: screenWidth } = Dimensions.get('window');

interface ProgressBarProps {
  progress?: number;
  style?: ViewStyle;
}

export default function ProgressBar({ progress = 0, style }: ProgressBarProps) {
  const progressWidth = Math.min(progress * 100, 100);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.track}>
        {progressWidth > 0 && (
          <View style={[styles.fill, { width: `${progressWidth}%` }]} />
        )}
        {progressWidth > 5 && (
          <View
            style={[
              styles.progressIndicator,
              { left: `${Math.min(progressWidth - 1, 99)}%` },
            ]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    width: Math.min(screenWidth * 0.796, 313),
    height: 9,
    borderRadius: BORDERS.RADIUS.FULL, // Rounded capsule shape
    borderWidth: BORDERS.WIDTH.THIN,
    borderColor: COLORS.TEXT.TERTIARY,
    backgroundColor: COLORS.BACKGROUND.TERTIARY + '1A', // subtle transparency
    position: 'relative',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 9 - BORDERS.WIDTH.THIN * 2,
    borderRadius: BORDERS.RADIUS.FULL,
    backgroundColor: COLORS.PRIMARY.GOLD_LIGHT,
    minWidth: 8,
    ...SHADOWS.GLOW,
  },
  progressIndicator: {
    position: 'absolute',
    top: -2,
    width: 12,
    height: 12,
    borderRadius: BORDERS.RADIUS.FULL,
    backgroundColor: COLORS.TEXT.PRIMARY,
    shadowColor: COLORS.PRIMARY.GOLD_LIGHT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
    zIndex: 2,
  },
});
