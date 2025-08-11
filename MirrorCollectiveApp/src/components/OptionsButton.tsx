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
    paddingVertical: Math.max(8, screenHeight * 0.009), // Exact 8px padding from Figma layout7
    paddingHorizontal: Math.max(16, screenWidth * 0.041), // Exact 16px padding from Figma layout7
    gap: Math.max(16, screenWidth * 0.041), // Exact 16px gap from Figma layout7
    width: Math.min(screenWidth * 0.796, 313), // Exact 313px width from Figma
    height: Math.max(64, screenHeight * 0.075), // Exact 64px height from Figma
    // Exact gradient background from Figma fill4
    backgroundColor: 'rgba(253, 253, 249, 0.71)', // Using first stop of gradient as fallback
    borderWidth: 0.25, // Exact stroke width from Figma stroke2
    borderColor: '#9BAAC2', // Exact stroke2 color from Figma
    borderRadius: 13, // Exact border radius from Figma
    // Exact shadow effects from Figma effect6
    shadowColor: 'rgba(229, 214, 176, 0.23)',
    shadowOffset: { width: 1, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 38,
    elevation: 8,
  },

  circle: {
    width: 16, // Smaller radio button to match Figma proportions
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#F4EFE4', // Exact fill5 color from Figma
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  radio: {
    width: 8, // Inner radio circle
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },

  radioSelected: {
    backgroundColor: '#F4EFE4', // Exact fill5 color from Figma
    shadowColor: '#F4EFE4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },

  label: {
    flex: 1,
    flexWrap: 'wrap',
    fontFamily: 'CormorantGaramond-Light', // Match Figma typography
    fontSize: Math.min(screenWidth * 0.041, 16), // Proportional to text in Figma
    fontWeight: '300', // Light weight
    lineHeight: Math.min(screenWidth * 0.051, 20), // Tight line height for multi-line text
    color: '#F4EFE4', // Exact fill5 color from Figma
    textAlign: 'left',
    textShadowColor: '#E5D6B0', // Exact effect5 glow from Figma
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
