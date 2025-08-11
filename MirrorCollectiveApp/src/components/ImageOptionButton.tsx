// ImageOptionButton.tsx
import React from 'react';
import { TouchableOpacity, Image, StyleSheet, View } from 'react-native';

interface Props {
  image: any;
  selected: boolean;
  onPress: () => void;
}

const ImageOptionButton = ({ image, selected, onPress }: Props) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.9}
    style={styles.touchable}
  >
    <View style={[styles.container, selected && styles.selected]}>
      <View style={[styles.background, selected && styles.selectedBackground]} />
      <Image source={image} style={styles.image} />
    </View>
  </TouchableOpacity>
);

export default ImageOptionButton;

const styles = StyleSheet.create({
  touchable: {
    width: 120,
    height: 120,
  },
  container: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  background: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'transparent',
    borderWidth: 0.25,
    borderColor: '#9BAAC2',
    shadowColor: 'rgba(0, 0, 0, 0.29)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 5,
  },
  selectedBackground: {
    backgroundColor: 'rgba(217, 217, 217, 0.05)',
    borderWidth: 2,
    borderColor: '#E5D6B0',
    shadowColor: '#E5D6B0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 15,
  },
  selected: {
    // Additional selected state styling if needed
  },
  image: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    zIndex: 1,
  },
});
