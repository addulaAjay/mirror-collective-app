import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import { COLORS, SPACING } from '@constants';
import { theme } from '@theme';

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
    padding: SPACING.XL,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  
  title: {
    ...theme.typography.styles.title,
    color: COLORS.STATUS.ERROR,
    marginBottom: SPACING.LG,
    textAlign: 'center',
  },
  
  message: {
    ...theme.typography.styles.body,
    color: COLORS.TEXT.WHITE,
    marginBottom: SPACING.XL,
    textAlign: 'center',
    lineHeight: 24,
  },
  
  button: {
    backgroundColor: COLORS.PRIMARY.GOLD,
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.MD,
    borderRadius: SPACING.SM,
  },
  
  buttonText: {
    ...theme.typography.styles.button,
    color: COLORS.TEXT.PRIMARY,
  },
});