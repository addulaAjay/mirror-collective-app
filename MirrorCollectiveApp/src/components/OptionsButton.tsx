import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SHADOWS, BORDERS, SPACING } from '../styles';

const { width: screenWidth } = Dimensions.get('window');

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
    paddingVertical: SPACING.S,
    paddingHorizontal: SPACING.S,
    gap: SPACING.M,
    width: Math.min(screenWidth * 0.796, 313),
    height: 64,
    backgroundColor: COLORS.BACKGROUND.SECONDARY + '2D', // subtle translucent fallback
    borderWidth: BORDERS.WIDTH.THIN,
    borderColor: COLORS.TEXT.TERTIARY,
    borderRadius: BORDERS.RADIUS.MEDIUM,
    ...SHADOWS.SMALL,
  },

  buttonSelected: {
    backgroundColor: COLORS.BACKGROUND.SECONDARY + '40',
    borderColor: COLORS.TEXT.TERTIARY,
    paddingHorizontal: SPACING.M, // more padding when selected
    shadowColor: COLORS.TEXT.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 19,
  },

  label: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: Math.min(screenWidth * 0.051, TYPOGRAPHY.SIZES.L),
    fontWeight: '300',
    lineHeight: Math.min(screenWidth * 0.061, 24),
    color: COLORS.TEXT.PRIMARY,
    textAlign: 'center',
    textShadowColor: COLORS.PRIMARY.GOLD_LIGHT,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    flex: 1,
  },

  labelSelected: {
    textShadowColor: COLORS.PRIMARY.GOLD_LIGHT,
    textShadowRadius: 8,
  },
});
