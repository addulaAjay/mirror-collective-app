import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

const OptionButton = ({ label, selected, onPress, style }: Props) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.button, style]}
    >
      <View style={styles.circle}>
        <View style={[styles.radio, selected && styles.radioSelected]} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

export default OptionButton;
const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Aligns circle + label at top if multi-line
    padding: 8,
    gap: 16,
    width: 320,
    minHeight: 64, // Allow growth for multi-line text
    backgroundColor: 'rgba(253, 253, 249, 0.01)',
    borderWidth: 0.25,
    borderColor: '#9BAAC2',
    borderRadius: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 19,
    elevation: 4,
  },

  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#F4EFE4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  radio: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'transparent',
  },

  radioSelected: {
    backgroundColor: '#F4EFE4',
  },

  label: {
    flex: 1,
    flexWrap: 'wrap',
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    lineHeight: 24,
    color: '#F4EFE4',
  },
});
