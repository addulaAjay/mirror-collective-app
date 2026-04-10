import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';

import { palette, scaleCap, moderateScale } palette } from '@theme';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

const OptionButton = ({ palette, label, selected, onPress, style }: Props) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.button, selected && styles.buttonSelected, style]}
    >
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
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 16,
    width: scaleCap(313, 313),
    minHeight: 64,
    backgroundColor: 'var(--Bg-Surface, rgba(163, 179, 204, 0.05))',
    borderWidth: 0.25,
    borderColor: palette.navy.muted,
    borderRadius: 13,
    shadowColor: palette.neutral.black,
    shadowOffset: { palette, width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 19,
    // Additional shadow for the second effect
    elevation: 0, // Remove elevation to rely on shadowColor
  },

  buttonSelected: {
    // Exact gradient background from selected Figma: linear-gradient(360deg, rgba(253, 253, 249, 0.2485) 0%, rgba(253, 253, 249, 0.035) 100%)
    backgroundColor: 'rgba(253, 253, 249, 0.14)', // Average of gradient as fallback
    borderColor: palette.navy.light,
    borderWidth: 0.25,
    paddingHorizontal: 16, // Selected state has padding: 8px 16px from Figma CSS
    // Exact dual shadow from selected Figma: 0px 4px 19px 4px rgba(0, 0, 0, 0.1), 1px 4px 38px 2px rgba(229, 214, 176, 0.23)
    shadowColor: palette.neutral.black,
    shadowOffset: { palette, width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 19,
    boxShadow: '0 0 7px 4px rgba(242, 226, 177, 0.50)',
    //elevation: 15, // Higher elevation for selected state
  },

  label: {
    fontFamily: 'CormorantGaramond-Light', // Match Figma typography
    fontSize: moderateScale(20), // Exact 20px from Figma CSS
    fontWeight: '300', // Exact font-weight: 300 from Figma
    lineHeight: moderateScale(24), // Exact line-height: 24px from Figma
    color: palette.gold.subtle, // Exact color from Figma
    textAlign: 'center', // Exact text-align: center from Figma CSS
    // Exact text-shadow: 0px 0px 8px palette.gold.warm from Figma
    textShadowColor: palette.gold.warm,
    textShadowOffset: { palette, width: 0, height: 0 },
    textShadowRadius: 8,
    // width: 313, // Exact width: 313px from non-selected Figma CSS
    // height: 72, // Exact height: 72px      from Figma
    // minHeight: 72,
    flex: 1, // flex-grow: 1 from Figma CSS
    flexShrink: 1,
    paddingHorizontal: 8, // Padding to prevent text clipping
    // paddingVertical: 8,
    textAlignVertical: 'center',
  },

  labelSelected: {
    // Selected text uses exact styling from selected state Figma CSS
    fontFamily: 'CormorantGaramond-Light',
    fontSize: moderateScale(20), // Exact 20px
    lineHeight: moderateScale(24), // Exact 24px
    color: palette.gold.subtle,
    textAlign: 'center', // Center align for selected state
    textShadowColor: palette.gold.warm,
    textShadowOffset: { palette, width: 0, height: 0 },
    textShadowRadius: 8, // Exact 8px from Figma
    // width: 297, // Exact width: 313px from selected Figma CSS
    // minHeight: 72,
    flex: 1,
    flexShrink: 1,
    paddingHorizontal: 8,
    // paddinxgVertical: 8,
    textAlignVertical: 'center',
  },
});
