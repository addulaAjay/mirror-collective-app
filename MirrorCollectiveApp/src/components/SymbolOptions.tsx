import React from 'react';
import { TouchableOpacity, Image, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDERS, SHADOWS } from '../styles';

interface SymbolOptionProps {
  icon: any; // require() or uri
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

const SymbolOption = ({
  icon,
  selected,
  onPress,
  style,
}: SymbolOptionProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.circle, selected && styles.selected, style]}
    >
      <Image source={icon} style={styles.icon} />
    </TouchableOpacity>
  );
};

export default SymbolOption;

const styles = StyleSheet.create({
  circle: {
    width: 88,
    height: 88,
    borderRadius: BORDERS.RADIUS.FULL, // perfectly round
    borderWidth: BORDERS.WIDTH.THIN,
    borderColor: COLORS.PRIMARY.GOLD_LIGHT,
    backgroundColor: COLORS.UI.INPUT_BG, // semi-transparent background
    justifyContent: 'center',
    alignItems: 'center',
  },
  selected: {
    ...SHADOWS.GLOW, // golden glow from theme
  },
  icon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    tintColor: COLORS.TEXT.SECONDARY, // ensures consistent color
  },
});
