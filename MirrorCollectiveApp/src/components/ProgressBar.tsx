import React from 'react';
import { View, StyleSheet } from 'react-native';

interface Props {
  progress: number; // 0.0 to 1.0
}

const ProgressBar = ({ progress }: Props) => {
  return (
    <View style={styles.track}>
      <View
        style={[styles.bar, { width: `${Math.min(progress * 100, 100)}%` }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
    marginVertical: 16,
  },
  bar: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
});

export default ProgressBar;
