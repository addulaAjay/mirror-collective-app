import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import { theme, palette, spacing } from '@theme';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>
        {__DEV__ ? error.message : 'An unexpected error occurred. Please try again.'}
      </Text>
      
      <TouchableOpacity style={styles.button} onPress={resetError}>
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
    backgroundColor: palette.neutral.black,
  },

  title: {
    ...theme.typography.styles.title,
    color: palette.status.error,
    marginBottom: spacing.m,
    textAlign: 'center',
  },

  message: {
    ...theme.typography.styles.body,
    color: palette.neutral.white,
    marginBottom: spacing.l,
    textAlign: 'center',
    lineHeight: 24,
  },

  button: {
    backgroundColor: palette.gold.warm,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    borderRadius: spacing.xs,
  },

  buttonText: {
    ...theme.typography.styles.button,
    color: palette.navy.DEFAULT,
  },
});