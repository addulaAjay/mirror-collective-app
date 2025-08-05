// ImageOptionButton.tsx
import React from 'react';
import { TouchableOpacity, Image, StyleSheet } from 'react-native';

interface Props {
  image: any;
  selected: boolean;
  onPress: () => void;
}

const ImageOptionButton = ({ image, selected, onPress }: Props) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.9}
    style={[styles.container, selected && styles.selected]}
  >
    <Image source={image} style={styles.image} />
  </TouchableOpacity>
);

export default ImageOptionButton;

const styles = StyleSheet.create({
  container: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)', // subtle background
    alignItems: 'center',
    justifyContent: 'center',
    margin: 12,
  },
  selected: {
    transform: [{ scale: 1.05 }],
    shadowColor: '#FFD700',
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  image: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  label: {
    color: '#F2E2B1',
    fontSize: 16,
    fontFamily: 'CormorantGaramond-Regular',
  },
});
