import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';

interface OptionButtonProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

const OptionButton = ({
  label,
  selected,
  onPress,
  style,
}: OptionButtonProps) => {
  return (
    <TouchableOpacity
      style={[styles.button, selected && styles.selected, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderColor: '#FFD700',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  selected: {
    backgroundColor: '#FFD70022',
    borderColor: '#FFD700',
  },
  text: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
  },
  textSelected: {
    fontWeight: '600',
    color: '#FFD700',
  },
});

export default OptionButton;
