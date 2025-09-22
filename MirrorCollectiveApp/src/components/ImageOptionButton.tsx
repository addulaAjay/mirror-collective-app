// ImageOptionButton.tsx
import React from 'react';
import { TouchableOpacity, Image, StyleSheet, View } from 'react-native';
import { COLORS, BORDERS, SHADOWS } from '../styles';

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
      <View
        style={[styles.background, selected && styles.selectedBackground]}
      />
      <Image source={image} style={styles.image} />
    </View>
  </TouchableOpacity>
);

export default ImageOptionButton;

const SIZE = 120;
const RADIUS = SIZE / 2;

const styles = StyleSheet.create({
  touchable: {
    width: SIZE,
    height: SIZE,
  },
  container: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  background: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: RADIUS,
    backgroundColor: 'transparent',
    borderWidth: BORDERS.WIDTH.THIN * 0.25, // keep Figma thin border
    borderColor: COLORS.TEXT.TERTIARY,
    ...SHADOWS.SMALL,
  },
  selectedBackground: {
    backgroundColor: COLORS.UI.BUTTON_SECONDARY, // soft shimmer background
    borderWidth: BORDERS.WIDTH.THIN * 0.25,
    borderColor: COLORS.TEXT.TERTIARY,
    borderRadius: RADIUS,
    // Custom dual-shadow effect per Figma
    shadowColor: COLORS.BACKGROUND.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 19,
    elevation: 0,
  },
  selected: {
    // Future hook for animations / scaling
  },
  image: {
    width: SIZE / 2,
    height: SIZE / 2,
    resizeMode: 'contain',
    zIndex: 1,
  },
});
