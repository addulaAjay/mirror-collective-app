import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

import { theme, spacing } from '@theme';

interface LoadingIndicatorProps {
  message?: string;
  showSpinner?: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = '…thinking…',
  showSpinner = false,
}) => {
  return (
    <View style={styles.container}>
      {showSpinner && (
        <ActivityIndicator
          size="small"
          color="#ccc"
          style={styles.spinner}
          testID="loading-spinner"
        />
      )}
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: spacing.xxs,
  },

  spinner: {
    marginRight: spacing.xs,
  },

  text: {
    ...theme.typography.styles.body,
    color: '#ccc',
  },
});
