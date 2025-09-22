import React, { Component, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { COLORS, TEXT_STYLES, SPACING, BORDERS, SHADOWS } from '../styles';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: error.stack || null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo: errorInfo.componentStack || null,
    });
  }

  handleRestart = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            The app encountered an unexpected error. Please restart the app.
          </Text>

          {__DEV__ && this.state.error && (
            <ScrollView
              style={styles.errorContainer}
              contentContainerStyle={{ padding: SPACING.S }}
              nestedScrollEnabled
            >
              <Text style={styles.errorTitle}>Error Details:</Text>
              <Text style={styles.errorText}>{this.state.error.message}</Text>
              {this.state.errorInfo && (
                <Text style={styles.errorStack}>{this.state.errorInfo}</Text>
              )}
            </ScrollView>
          )}

          <TouchableOpacity
            style={styles.restartButton}
            onPress={this.handleRestart}
            activeOpacity={0.8}
          >
            <Text style={styles.restartButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.L,
  },
  title: {
    ...TEXT_STYLES.h2,
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.M,
    textAlign: 'center',
    fontWeight: undefined,
  },
  message: {
    ...TEXT_STYLES.bodySecondary,
    textAlign: 'center',
    marginBottom: SPACING.XL,
    lineHeight: 24,
    fontWeight: undefined,
  },
  errorContainer: {
    backgroundColor: COLORS.BACKGROUND.SECONDARY,
    borderRadius: BORDERS.RADIUS.MEDIUM,
    marginBottom: SPACING.L,
    maxHeight: 200,
    width: '100%',
    ...SHADOWS.SMALL,
  },
  errorTitle: {
    ...TEXT_STYLES.body,
    fontWeight: '600',
    color: COLORS.SEMANTIC.ERROR,
    marginBottom: SPACING.XS,
  },
  errorText: {
    ...TEXT_STYLES.caption,
    color: COLORS.TEXT.ERROR,
    marginBottom: SPACING.XXS,
    fontWeight: undefined,
  },
  errorStack: {
    ...TEXT_STYLES.caption,
    color: COLORS.TEXT.TERTIARY,
    fontFamily: 'monospace',
    fontWeight: undefined,
  },
  restartButton: {
    ...SHADOWS.MEDIUM,
    backgroundColor: COLORS.UI.BUTTON_PRIMARY,
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.M,
    borderRadius: BORDERS.RADIUS.MEDIUM,
  },
  restartButtonText: {
    ...TEXT_STYLES.button,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: undefined,
  },
});

export default ErrorBoundary;
