import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Dimensions,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { theme } from '@theme';

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle;
  gradientColors?: string[];
}

const { width: screenWidth } = Dimensions.get('window');

// Responsive font size helper
const responsiveFontSize = (baseSize: number, minSize: number, maxSize: number) => {
  const scale = screenWidth / 375;
  const size = baseSize * scale;
  return Math.max(minSize, Math.min(maxSize, size));
};

// Exact gradient from Figma: var(--Translucent-White-Gradient)
const defaultGradient = [
  'rgba(253, 253, 249, 0.03)', // 0% - start
  'rgba(253, 253, 249, 0.20)', // 100% - end
];

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
    <View style={[styles.shadowWrapper, style, disabled && styles.disabled]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        disabled={disabled}
        style={styles.container}
      >
        {/* Gradient background layer */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.buttonContent, buttonStyle]}
          pointerEvents="none"
        />

        {/* Text layer on top */}
        <View style={styles.textContainer} pointerEvents="none">
          <Text style={[styles.text, textStyle]}>
            {title}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowWrapper: {
    // Exact from Figma: box-shadow: 0 0 16px 4px #F0D4A8
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.01)', // Required for iOS shadow rendering (nearly invisible)
    shadowColor: '#F0D4A8', // Exact glow color from Figma
    shadowOffset: { width: 0, height: 0 }, // 0 0 in CSS
    shadowOpacity: 1,
    shadowRadius: 20, // blur-radius (16px) + spread-radius (4px) = 20px to simulate spread
    elevation: 12, // Android shadow (slightly higher to match spread)
  },
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12, // Exact from Figma: 12px
    borderWidth: 0.25, // Exact from Figma: 0.25px
    borderColor: '#A3B3CC', // Exact from Figma: var(--Border-Subtle, #A3B3CC)
    backgroundColor: 'transparent',
    overflow: 'hidden', // Clip gradient to border radius
  },
  buttonContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  textContainer: {
    paddingVertical: responsiveFontSize(14, 12, 16),
    paddingHorizontal: responsiveFontSize(48, 40, 60),
    minWidth: responsiveFontSize(120, 100, 150),
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: 'CormorantGaramond-Regular', // Regular from Figma
    fontSize: responsiveFontSize(20, 18, 22), // 20px from Figma (font/size/L)
    fontWeight: '400',
    color: '#FDFDF9', // Exact white from Figma (text/paragraph-2)
    textAlign: 'center',
    letterSpacing: 0,
    textTransform: 'uppercase',
    includeFontPadding: false,
    // No text shadow - glow is on button border only
  },
  disabled: {
    opacity: 0.6,
    backgroundColor: 'transparent', // Remove background so no glow
    shadowOpacity: 0, // Remove glow when disabled
    elevation: 0, // Remove Android shadow when disabled
  },
});

export default GradientButton;
