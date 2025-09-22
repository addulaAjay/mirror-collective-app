import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  View,
  Dimensions,
} from 'react-native';
import { COLORS, TEXT_STYLES, BORDERS, LAYOUT, SPACING } from '../styles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
      style={[styles.container, style, disabled && styles.disabled]}
    >
      <View style={styles.button}>
        <Text style={styles.text} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    minWidth: Math.max(screenWidth * 0.3, 120),
    minHeight: Math.max(screenHeight * 0.056, LAYOUT.BUTTON_HEIGHT),
    borderRadius: BORDERS.RADIUS.LARGE, // closest to 13px Figma radius
    paddingHorizontal: Math.max(SPACING.L, screenWidth * 0.051),
    paddingVertical: Math.max(SPACING.S, screenHeight * 0.009),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',

    // Stroke from Figma
    borderWidth: BORDERS.WIDTH.THIN,
    borderColor: COLORS.TEXT.TERTIARY,

    // Glow shadow from theme
    shadowColor: COLORS.PRIMARY.GOLD_LIGHT,
    shadowOffset: { width: 1, height: 4 },
    shadowOpacity: 0.23,
    shadowRadius: 38,
    elevation: 15,

    // Background with transparency
    backgroundColor: COLORS.UI.BUTTON_SECONDARY,
  },
  text: {
    ...TEXT_STYLES.button,
    fontFamily: 'CormorantGaramond-Medium',
    fontSize: Math.min(screenWidth * 0.051, 20),
    fontWeight: '500',
    lineHeight: Math.min(screenWidth * 0.061, 24),
    color: COLORS.PRIMARY.GOLD_LIGHT,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    includeFontPadding: false,
    textAlignVertical: 'center',
    flexShrink: 0,
  },
  disabled: {
    opacity: 0.6,
  },
});

export default GradientButton;
