import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../../../constants';
import { theme } from '../../../theme';

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
          color={COLORS.TEXT.LOADING}
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
    marginVertical: SPACING.XS,
  },

  spinner: {
    marginRight: SPACING.SM,
  },

  text: {
    ...theme.typography.styles.body,
    color: COLORS.TEXT.LOADING,
  },
});
