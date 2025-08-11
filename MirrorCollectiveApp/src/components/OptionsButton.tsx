import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  View,
  ViewStyle,
  Dimensions,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
    alignItems: 'center',
    padding: Math.max(12, screenWidth * 0.03),
    gap: Math.max(12, screenWidth * 0.03),
    width: Math.min(screenWidth * 0.85, 400),
    minHeight: Math.max(60, screenHeight * 0.07),
    backgroundColor: 'rgba(253, 253, 249, 0.01)',
    borderWidth: 0.25,
    borderColor: '#9BAAC2',
    borderRadius: Math.max(12, screenWidth * 0.03),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 19,
    elevation: 4,
  },

  circle: {
    width: Math.max(18, screenWidth * 0.045),
    height: Math.max(18, screenWidth * 0.045),
    borderRadius: Math.max(9, screenWidth * 0.0225),
    borderWidth: 1.5,
    borderColor: '#F4EFE4',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  radio: {
    width: Math.max(8, screenWidth * 0.02),
    height: Math.max(8, screenWidth * 0.02),
    borderRadius: Math.max(4, screenWidth * 0.01),
    backgroundColor: 'transparent',
  },

  radioSelected: {
    backgroundColor: '#F4EFE4',
  },

  label: {
    flex: 1,
    flexWrap: 'wrap',
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: Math.min(Math.max(18, screenWidth * 0.045), 22),
    lineHeight: Math.min(Math.max(22, screenWidth * 0.055), 28),
    color: '#F4EFE4',
  },
});
