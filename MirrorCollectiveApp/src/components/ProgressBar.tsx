// components/ProgressBar.tsx
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function ProgressBar({ progress = 0 }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <View
          style={[styles.fill, { width: `${Math.min(progress * 100, 100)}%` }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: Math.min(screenWidth * 0.9, 400),
    height: Math.max(8, screenWidth * 0.02),
    marginBottom: Math.max(16, screenWidth * 0.04),
    alignItems: 'center',
  },
  track: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#9BAAC2',
    backgroundColor: 'rgba(155,170,194,0.10)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 100,
    backgroundColor: '#DCC79E',
    marginLeft: 1,
    marginTop: 1,
    width: 'auto',
  },
});
