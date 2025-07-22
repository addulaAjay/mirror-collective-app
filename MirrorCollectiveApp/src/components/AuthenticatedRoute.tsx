import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { typography, colors } from '../styles/typography';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

interface AuthenticatedRouteProps {
  children: React.ReactNode;
  fallbackScreen?: keyof RootStackParamList;
  showLoader?: boolean;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Wrapper component that protects routes requiring authentication
 * Automatically redirects to login if user is not authenticated
 * Handles token refresh and validation
 */
export const AuthenticatedRoute: React.FC<AuthenticatedRouteProps> = ({
  children,
  fallbackScreen = 'Login',
  showLoader = true,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { isAuthenticated, isLoading, hasValidToken } = useAuthGuard();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !hasValidToken) {
        // Clear navigation stack and redirect to login
        navigation.reset({
          index: 0,
          routes: [{ name: fallbackScreen }],
        });
      }
    }
  }, [isAuthenticated, hasValidToken, isLoading, navigation, fallbackScreen]);

  // Show loading screen while checking authentication
  if (isLoading && showLoader) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.text.accent} />
        <Text style={styles.loadingText}>Verifying authentication...</Text>
      </View>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated || !hasValidToken) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.redirectText}>Redirecting to login...</Text>
      </View>
    );
  }

  // Render the protected content
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1B1B1D',
    gap: 20,
  },
  loadingText: {
    ...typography.styles.body,
    textAlign: 'center',
  },
  redirectText: {
    ...typography.styles.body,
    textAlign: 'center',
    color: colors.text.secondary,
  },
});

export default AuthenticatedRoute;
