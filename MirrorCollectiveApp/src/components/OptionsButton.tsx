/**
 * OptionsButton — text answer card for quiz screens.
 * Figma: Design-Master-File → MC Component Library → Component (248:2655)
 *
 * Two states match Figma exactly:
 *   Unselected (Frame 247):
 *     - 0.25px border #808fb2  (border/bold)
 *     - 8px padding all sides
 *     - bg gradient: rgba(253,253,249,0.01) → rgba(253,253,249,0)
 *     - no shadow
 *
 *   Selected (Frame 248):
 *     - 0.25px border #a3b3cc  (border/subtle)
 *     - 16h / 8v padding
 *     - bg gradient: rgba(253,253,249,0.03) → rgba(253,253,249,0.2)
 *     - Glow Drop Shadow: X:0 Y:0 Blur:10 Spread:3 rgba(240,212,168,0.3)
 *
 * Structure: an OUTER wrapper View owns the drop shadow (no overflow), an
 * INNER TouchableOpacity owns the visible button with overflow:hidden so
 * the gradient clips to rounded corners. The Text is a direct child of the
 * TouchableOpacity (single-level flex), which is the working RN pattern
 * for `<Text flex={1}>` to wrap correctly inside a flexDirection:'row'
 * parent. Wrapping the Text in another View breaks iOS auto-wrap.
 */

import {
  fontFamily,
  fontSize,
  fontWeight,
  moderateScale,
  palette,
  radius,
  scale,
  textShadow,
  verticalScale,
} from '@theme';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';


interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

const UNSELECTED_GRADIENT = ['rgba(253,253,249,0.01)', 'rgba(253,253,249,0)'];
const SELECTED_GRADIENT   = ['rgba(253,253,249,0.03)', 'rgba(253,253,249,0.2)'];

const OptionButton: React.FC<Props> = ({ label, selected, onPress, style }) => (
  <View style={[styles.shadowWrap, selected && styles.shadowWrapSelected, style]}>
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.button, selected && styles.buttonSelected]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <LinearGradient
        colors={selected ? SELECTED_GRADIENT : UNSELECTED_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  </View>
);

export default OptionButton;

const styles = StyleSheet.create({
  // Outer shadow wrapper — owns the glow on selected state. NO overflow:hidden
  // so the shadow can extend beyond the visible button. The borderRadius is
  // mirrored on the inner button for the shadow path to follow corners.
  shadowWrap: {
    width:        '100%',
    borderRadius: radius.s,            // 12 — mirrors button for shadow path
  },
  shadowWrapSelected: {
    boxShadow:     '0px 0px 10px 3px rgba(240, 212, 168, 0.3)',
    shadowColor:   palette.gold.glow,  // #f0d4a8
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius:  13,                 // blur 10 + spread 3 ≈ 13 fallback
    elevation:     8,
  },

  // Inner button — single flex-row container (the working RN pattern for
  // `<Text flex={1}>` text wrapping). overflow:'hidden' here clips the
  // gradient to the rounded corners.
  // Border: Figma spec is 0.25px but that renders as <1 device-pixel and
  // is invisible on retina displays. Bumping to 0.5px (still hairline)
  // for actual visibility — design intent is preserved, sub-pixel rendering
  // is fixed.
  button: {
    flexDirection:    'row',
    justifyContent:   'center',
    alignItems:       'center',
    width:            '100%',
    minHeight:        verticalScale(72),
    borderRadius:     radius.s,        // 12
    borderWidth:      0.5,
    paddingVertical:  verticalScale(8),
    paddingHorizontal: scale(8),       // Frame 247 — 8px all sides
    borderColor:      palette.navy.border,  // #808fb2 (border/bold)
    overflow:         'hidden',
  },
  // Frame 248 overrides — wider horizontal padding + lighter border.
  buttonSelected: {
    paddingHorizontal: scale(16),
    borderColor:       palette.navy.light,  // #a3b3cc (border/subtle)
  },

  // Inter Regular 16/24, paragraph-2 (#fdfdf9), gold glow text-shadow.
  // Direct child of flex-row TouchableOpacity → flex:1 + flexShrink:1
  // wraps long copy correctly (this was the original working pattern).
  label: {
    fontFamily:        fontFamily.body,
    fontSize:          moderateScale(fontSize.s),     // 16
    fontWeight:        fontWeight.regular,
    lineHeight:        moderateScale(24),
    letterSpacing:     0,
    color:             palette.gold.subtlest,         // #fdfdf9
    textAlign:         'center',
    textShadowColor:   textShadow.glow.color,         // rgba(240,212,168,0.3)
    textShadowOffset:  textShadow.glow.offset,
    textShadowRadius:  textShadow.glow.radius,
    flex:              1,
    flexShrink:        1,
    textAlignVertical: 'center',
  },
});
