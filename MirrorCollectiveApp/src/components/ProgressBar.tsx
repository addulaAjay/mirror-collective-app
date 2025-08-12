// components/ProgressBar.tsx
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface ProgressBarProps {
  progress?: number;
  style?: any;
}

export default function ProgressBar({ progress = 0, style }: ProgressBarProps) {
  const progressWidth = Math.min(progress * 100, 100);
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.track}>
        {progressWidth > 0 && (
          <View
            style={[styles.fill, { width: `${progressWidth}%` }]}
          />
        )}
        {progressWidth > 5 && (
          <View
            style={[
              styles.progressIndicator,
              { left: `${Math.min(progressWidth - 1, 99)}%` }
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
    width: Math.min(screenWidth * 0.796, 313), // Match Figma width exactly
    height: 9, // Exact height from Figma
    borderRadius: 730.85, // Exact border radius from Figma
    borderWidth: 0.73, // Exact stroke width from Figma
    borderColor: '#9BAAC2', // Exact stroke color from Figma
    backgroundColor: 'rgba(155, 170, 194, 0.10)', // Exact background from Figma
    position: 'relative',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0.36,
    top: 0.36,
    height: 7.28,
    borderRadius: 5.85,
    backgroundColor: '#E5D6B0',
    minWidth: 8,
    shadowColor: '#E5D6B0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  progressIndicator: {
    position: 'absolute',
    top: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    shadowColor: '#E5D6B0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
    zIndex: 2,
  },
});
