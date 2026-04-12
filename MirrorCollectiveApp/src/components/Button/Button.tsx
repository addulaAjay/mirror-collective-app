import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { moderateScale, scaleCap, useTheme, palette } from '@theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ButtonVariant = 'gradient' | 'auth';

interface BaseProps {
  onPress: () => void;
  title: string;
  disabled?: boolean;
}

interface GradientProps extends BaseProps {
  variant: 'gradient';
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  buttonStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  textStyle?: TextStyle;
  gradientColors?: string[];
}

interface AuthProps extends BaseProps {
  variant: 'auth';
}

export type ButtonProps = GradientProps | AuthProps;

// ---------------------------------------------------------------------------
// Gradient variant internals
// ---------------------------------------------------------------------------

const DEFAULT_GRADIENT = [
  'rgba(253, 253, 249, 0.03)',
  'rgba(253, 253, 249, 0.20)',
];

const GradientButton = ({
  title,
  onPress,
  disabled,
  style,
  containerStyle,
  buttonStyle,
  contentStyle,
  textStyle,
  gradientColors = DEFAULT_GRADIENT,
}: Omit<GradientProps, 'variant'>) => {
  const theme = useTheme();

  return (
    <View style={[styles.gradientShadow, style, disabled && styles.gradientDisabled]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        disabled={disabled}
        style={[styles.gradientContainer, containerStyle]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.gradientBackground, buttonStyle]}
          pointerEvents="none"
        />
        <View style={[styles.gradientContent, contentStyle]} pointerEvents="none">
          <Text style={[styles.gradientText, { color: theme.colors.text.paragraph2 }, textStyle]}>
            {title}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Auth variant internals
// ---------------------------------------------------------------------------

const AuthButtonInner = ({ title, onPress }: Omit<AuthProps, 'variant'>) => {
  const theme = useTheme();

  return (
    <TouchableOpacity onPress={onPress} style={styles.authContainer} activeOpacity={0.8}>
      <View style={[styles.authDot, { backgroundColor: theme.colors.text.accent }]} />
      <Text style={[styles.authText, { color: theme.colors.text.accent }]}>{title}</Text>
      <View style={[styles.authDot, { backgroundColor: theme.colors.text.accent }]} />
    </TouchableOpacity>
  );
};

// ---------------------------------------------------------------------------
// Public Button component
// ---------------------------------------------------------------------------

const Button = (props: ButtonProps) => {
  if (props.variant === 'auth') {
    return <AuthButtonInner {...props} />;
  }
  return <GradientButton {...props} />;
};

export default Button;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // Gradient variant
  gradientShadow: {
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.01)',
    shadowColor: palette.gold.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 12,
  },
  gradientDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  gradientContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 0.25,
    borderColor: palette.navy.light,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  gradientContent: {
    paddingVertical: moderateScale(14),
    paddingHorizontal: scaleCap(48, 60),
    minWidth: moderateScale(120),
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: moderateScale(20),
    fontWeight: '400',
    textAlign: 'center',
    textTransform: 'uppercase',
    includeFontPadding: false,
  },

  // Auth variant
  authContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
    marginVertical: 30,
  },
  authText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 28,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(229, 214, 176, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  authDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    shadowColor: palette.gold.warm,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
});
