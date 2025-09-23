// components/ProgressBar.tsx
import React from 'react';
import { View, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import { COLORS, BORDERS } from '../styles';

const { width: screenWidth } = Dimensions.get('window');

interface ProgressBarProps {
  progress?: number; // 0..1
  style?: ViewStyle;
}

export default function ProgressBar({ progress = 0, style }: ProgressBarProps) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const progressWidth = clamped * 100;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.track}>
        {/* Fill */}
        {progressWidth > 0 && <View style={[styles.fill, { width: `100%` }]} />}

        {/* Flare */}
        {progressWidth > 0 && (
          <View
            style={[
              styles.progressIndicatorWrapper,
              { left: `${Math.min(progressWidth, 99)}%` },
            ]}
          >
            {/* soft bloom */}
            <View style={styles.progressGlow} />
            {/* bright core */}
            <View style={styles.progressDot} />
          </View>
        )}
      </View>
    </View>
  );
}

const BAR_HEIGHT = 9;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  track: {
    width: Math.min(screenWidth * 0.796, 313),
    height: BAR_HEIGHT,
    borderRadius: BORDERS.RADIUS.FULL,
    borderWidth: 0.5,
    borderColor: COLORS.PRIMARY.GOLD_LIGHT,
    backgroundColor: 'rgba(155,170,194,0.15)', // soft cool base
    position: 'relative',
    overflow: 'visible', // allow the flare to bloom outside
  },

  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: BORDERS.RADIUS.FULL,
    backgroundColor: COLORS.PRIMARY.GOLD_LIGHT,
    // soft inner glow along the fill
    shadowColor: COLORS.PRIMARY.GOLD_LIGHT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    minWidth: 8,
    // Android softening
    elevation: 1,
  },

  progressIndicatorWrapper: {
    position: 'absolute',
    top: BAR_HEIGHT / 2,
    transform: [{ translateY: -32 }], // sit slightly above the bar center
    alignItems: 'center',
    justifyContent: 'center',
  },

  // wide, subtle bloom (sits under the core dot)
  progressGlow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.PRIMARY.GOLD_LIGHT,
    opacity: 0.32,
    // iOS glow
    shadowColor: COLORS.PRIMARY.GOLD_LIGHT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 30,
    // Android “fake” glow via size/opacity
    elevation: 2,
  },

  // bright core
  progressDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.PRIMARY.GOLD_LIGHT,
    // sharper glow around the core
    shadowColor: COLORS.PRIMARY.GOLD_LIGHT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 4,
  },
});
