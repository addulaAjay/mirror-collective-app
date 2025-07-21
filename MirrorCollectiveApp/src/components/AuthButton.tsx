import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { typography, shadows } from '../styles/typography';

interface Props {
  onPress: () => void;
  title: string;
  isLoading?: boolean;
  disabled?: boolean;
}

const AuthButton = ({ onPress, title, isLoading = false, disabled = false }: Props) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.container, (disabled || isLoading) && styles.disabled]}
    activeOpacity={0.8}
    disabled={disabled || isLoading}
  >
    <View style={[styles.dot, (disabled || isLoading) && styles.dotDisabled]} />
    {isLoading ? (
      <ActivityIndicator size="small" color="#E5D6B0" />
    ) : (
      <Text style={[styles.text, (disabled || isLoading) && styles.textDisabled]}>{title}</Text>
    )}
    <View style={[styles.dot, (disabled || isLoading) && styles.dotDisabled]} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
    marginVertical: 30,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    ...typography.styles.button,
    textShadowColor: shadows.text.color,
    textShadowOffset: shadows.text.offset,
    textShadowRadius: shadows.text.radius,
  },
  textDisabled: {
    color: 'rgba(229, 214, 176, 0.6)',
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E5D6B0',
    shadowColor: shadows.button.color,
    shadowOffset: shadows.button.offset,
    shadowOpacity: shadows.button.opacity,
    shadowRadius: shadows.button.radius,
    elevation: 4,
  },
  dotDisabled: {
    backgroundColor: 'rgba(229, 214, 176, 0.6)',
    shadowColor: 'rgba(229, 214, 176, 0.6)',
  },
});

export default AuthButton;
