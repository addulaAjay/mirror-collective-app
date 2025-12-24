import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle;
  gradientColors?: string[];
}

const defaultGradient = ['rgba(253, 253, 249, 0.04)', 'rgba(253, 253, 249, 0.01)'];

const GradientButton = ({
  title,
  onPress,
  disabled,
  style,
  buttonStyle,
  textStyle,
  gradientColors = defaultGradient,
}: Props) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[styles.container, style, disabled && styles.disabled]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.button, buttonStyle]}
      >
        <Text style={[styles.text, textStyle]} numberOfLines={1}>
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#A3B3CC',
    minWidth: 0,
    minHeight: 0,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#F2E2B1',
    textAlign: 'center',
    textShadowColor: 'rgba(229, 214, 176, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 9,
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 24,
    fontWeight: '400',
    lineHeight: 31.2,
    textTransform: 'none',
  },
  disabled: {
    opacity: 0.6,
  },
});

export default GradientButton;
