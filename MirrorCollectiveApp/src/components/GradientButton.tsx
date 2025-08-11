import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  View,
  Dimensions,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

const GradientButton = ({ title, onPress, disabled, style }: Props) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[style, disabled && { opacity: 0.6 }]}
    >
      <View style={styles.button}>
        {/* subtle inner highlight */}
        <View pointerEvents="none" style={styles.innerGlow} />
        <Text style={styles.text}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minWidth: Math.max(120, screenWidth * 0.3),
    height: Math.max(48, screenWidth * 0.12),
    borderRadius: Math.max(12, screenWidth * 0.03),
    paddingVertical: Math.max(8, screenWidth * 0.02),
    paddingHorizontal: Math.max(20, screenWidth * 0.05),
    justifyContent: 'center',
    alignItems: 'center',

    // border
    borderWidth: 0.25,
    borderColor: '#9BAAC2',

    // shadow (iOS) + elevation (Android)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 19,
    elevation: 6,
    overflow: 'hidden', // keeps innerGlow inside rounded corners
  },

  // soft center glow to mimic frosted/blurred highlight
  innerGlow: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: 11,
    backgroundColor: 'rgba(229,214,176,0.12)',
  },

  text: {
    // Figma: Cormorant Garamond, 24/32, gold with slight shadow
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 24,
    lineHeight: 32,
    color: '#F2E2B1',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
});

export default GradientButton;
