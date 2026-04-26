import {
  palette,
  radius,
  fontFamily,
  fontSize,
  fontWeight,
  textShadow,
  glassGradient,
  scale,
  scaleCap,
  moderateScale,
  verticalScale,
} from '@theme';
import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';


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
      style={[styles.button, selected && styles.buttonSelected, style]}
    >
      {/* Figma: Translucent White Gradient for selected state (iOS-compatible) */}
      {selected && (
        <LinearGradient
          colors={[glassGradient.card.start, glassGradient.card.end]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default OptionButton;
const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(8),    // Figma: py spacing/xs = 8px
    paddingHorizontal: scale(16),         // Figma: px spacing/m = 16px
    width: scaleCap(313, 313),
    minHeight: verticalScale(72),         // Figma: h-72px
    backgroundColor: palette.surface.DEFAULT, // Figma: rgba(163,179,204,0.05)
    borderWidth: 0.25,                    // Figma: 0.25px hairline
    borderColor: palette.navy.border,     // Figma: #808fb2 border/bold
    borderRadius: radius.s,               // Figma: rounded-12px
    overflow: 'hidden',                   // Clips LinearGradient to borderRadius
    shadowColor: palette.neutral.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 19,
    elevation: 0,
  },

  buttonSelected: {
    backgroundColor: 'transparent',       // Figma: Blur + Gradient only
    borderColor: palette.navy.light,      // Figma: Border/Subtle (#a3b3cc)
    borderWidth: 0.25,
    // Figma: Glow Drop Shadow X:0 Y:0 Blur:10 Spread:3 #F0D4A8 · 30%
    shadowColor: textShadow.glow.color,   // #F0D4A8 · 30%
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,                     // Color already has opacity
    shadowRadius: 10,                     // Blur:10
    elevation: 8,
  },

  label: {
    fontFamily: fontFamily.body,                        // Figma: Inter Regular
    fontSize: moderateScale(fontSize.s),                // Figma: font/size/S = 16px
    fontWeight: fontWeight.regular,                     // Figma: 400
    lineHeight: moderateScale(fontSize.s * 1.5),        // Figma: lineHeight 1.5
    letterSpacing: 0,
    color: palette.gold.subtlest,                       // Figma: text/paragraph-2 = #fdfdf9
    textAlign: 'center',
    // Same warmGlow values used on NEXT button — proven visible without boxy artifacts
    textShadowColor: textShadow.warmGlow.color,         // rgba(229,214,176,0.5)
    textShadowOffset: textShadow.warmGlow.offset,       // {0,0}
    textShadowRadius: textShadow.warmGlow.radius,       // 9
    flex: 1,
    flexShrink: 1,
    textAlignVertical: 'center',
  },

  labelSelected: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.s),
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(fontSize.s * 1.5),
    letterSpacing: 0,
    color: palette.gold.subtlest,
    textAlign: 'center',
    textShadowColor: textShadow.warmGlow.color,
    textShadowOffset: textShadow.warmGlow.offset,
    textShadowRadius: textShadow.warmGlow.radius,
    flex: 1,
    flexShrink: 1,
    textAlignVertical: 'center',
  },
});
