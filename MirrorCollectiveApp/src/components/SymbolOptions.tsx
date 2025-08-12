import React from 'react';
import { TouchableOpacity, Image, StyleSheet, ViewStyle } from 'react-native';

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
    borderRadius: 44,
    borderWidth: 1,
    borderColor: '#E5D6B0',
    backgroundColor: 'rgba(253, 253, 249, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selected: {
    shadowColor: '#E5D6B0',
    shadowOpacity: 0.9,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  icon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
});
