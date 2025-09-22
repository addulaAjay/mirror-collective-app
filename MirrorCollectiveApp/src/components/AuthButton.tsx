import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { COLORS, TEXT_STYLES, SPACING, BORDERS } from '../styles';

interface Props {
  onPress: () => void;
  title: string;
}

const AuthButton = ({ onPress, title }: Props) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.container}
    activeOpacity={0.8}
  >
    <View style={styles.dot} />
    <Text style={styles.text}>{title}</Text>
    <View style={styles.dot} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: SPACING.S,
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
    marginVertical: SPACING.XL,
  },
  text: {
    ...TEXT_STYLES.button,
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 28,
    color: COLORS.PRIMARY.GOLD_LIGHT,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(229, 214, 176, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
    fontWeight: undefined,
  },
  dot: {
    width: SPACING.M,
    height: SPACING.M,
    borderRadius: BORDERS.RADIUS.FULL,
    backgroundColor: COLORS.PRIMARY.GOLD_LIGHT,
    shadowColor: COLORS.PRIMARY.GOLD_LIGHT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default AuthButton;
