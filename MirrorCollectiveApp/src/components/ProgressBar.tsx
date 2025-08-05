// components/ProgressBar.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';

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
    width: 352.27,
    height: 8.77,
    marginBottom: 20,
    alignItems: 'center',
  },
  track: {
    width: '100%',
    height: 8.77,
    borderRadius: 365,
    borderWidth: 0.73,
    borderColor: '#9BAAC2',
    backgroundColor: 'rgba(155,170,194,0.10)',
    overflow: 'hidden',
  },
  fill: {
    height: 7.31,
    marginTop: 0.73,
    marginLeft: 0.73,
    borderRadius: 5.85,
    backgroundColor: '#DCC79E', // fallback
  },
});
