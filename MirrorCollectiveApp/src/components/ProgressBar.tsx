// components/ProgressBar.tsx
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');
const TRACK_WIDTH = Math.min(screenWidth * 0.796, 313);
const TRACK_HEIGHT = 5;
const TRACK_GLOW_HEIGHT = 29;
const POINTER_GLOW_SIZE = 30;
const POINTER_RING_WIDTH = 14.3;
const POINTER_RING_HEIGHT = 16;
const POINTER_STROKE_WIDTH = 3;
const POINTER_CORE_WIDTH = POINTER_RING_WIDTH - POINTER_STROKE_WIDTH * 2; // ≈14px
const POINTER_CORE_HEIGHT = POINTER_RING_HEIGHT - POINTER_STROKE_WIDTH * 2; // ≈16px
const trackGradient = ['#C59D5F', '#D5BA88', '#E5D6B0'];
const pointerGradient = ['#E5D6B0', '#D5BA88', '#C59D5F'];

interface ProgressBarProps {
  progress?: number;
  style?: any;
}

export default function ProgressBar({ progress = 0, style }: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(progress, 1));
  const pointerLeft = Math.min(
    Math.max(clampedProgress * TRACK_WIDTH - POINTER_GLOW_SIZE / 2, 0),
    TRACK_WIDTH - POINTER_GLOW_SIZE,
  );
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.trackWrapper}>
        <LinearGradient
          colors={trackGradient}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.track}
        />
        {clampedProgress > 0 && (
          <View style={[styles.pointerContainer, { left: pointerLeft }]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={pointerGradient}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.pointerRing}
            >
              <View style={styles.pointerCore} />
            </LinearGradient>
          </View>
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
  trackWrapper: {
    width: TRACK_WIDTH,
    height: TRACK_GLOW_HEIGHT,
    justifyContent: 'center',
    shadowColor: 'rgba(229, 214, 176, 1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 6,
  },
  track: {
    width: '100%',
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: 'transparent',
  },
  pointerContainer: {
    position: 'absolute',
    top: -((POINTER_GLOW_SIZE - TRACK_HEIGHT) / 2) + 12,
    width: POINTER_GLOW_SIZE,
    height: POINTER_GLOW_SIZE,
    borderRadius: POINTER_GLOW_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(229, 214, 176, 1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 8,
  },
  pointerRing: {
    width: POINTER_RING_WIDTH,
    height: POINTER_RING_HEIGHT,
    borderRadius: POINTER_RING_HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: POINTER_STROKE_WIDTH,
    paddingHorizontal: POINTER_STROKE_WIDTH,
  },
  pointerCore: {
    width: POINTER_CORE_WIDTH,
    height: POINTER_CORE_HEIGHT,
    borderRadius: POINTER_CORE_HEIGHT / 2,
    backgroundColor: '#C59D5F',
  },
});
