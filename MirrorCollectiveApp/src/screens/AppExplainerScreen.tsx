import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { useAuthGuard } from '../hooks/useAuthGuard';
import LogoHeader from '../components/LogoHeader';
import { typography, shadows } from '../styles/typography';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AppExplanation'>;
};
const AppExplainerScreen: React.FC<Props> = ({ navigation }) => {
  const { isAuthenticated, hasValidToken, isLoading } = useAuthGuard();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        // If still checking auth state, wait a bit longer
        return;
      }

      // Check authentication state and route accordingly
      if (isAuthenticated && hasValidToken) {
        // User is authenticated, go to main app
        navigation.replace('EnterMirror');
      } else {
        // User needs to login or sign up
        navigation.replace('Login');
      }
    }, 5000); // Show explainer for 5 seconds

    return () => clearTimeout(timer);
  }, [navigation, isAuthenticated, hasValidToken, isLoading]);
  return (
    <ImageBackground
      source={require('../../assets/dark_mode_shimmer_bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <LogoHeader />

      {/* Video Section */}
      <View style={styles.videoFrame}>
        <Text style={styles.videoText}>App explainer video</Text>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 120, // Space for LogoHeader (48 + 46 + 26 margin)
    paddingHorizontal: 42,
    gap: 40,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: shadows.container.color,
    shadowOffset: shadows.container.offset,
    shadowOpacity: shadows.container.opacity,
    shadowRadius: shadows.container.radius,
    elevation: 10,
  },
  videoFrame: {
    width: 309,
    height: 600,
    backgroundColor: 'rgba(255, 255, 255, 0.40)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingVertical: 236,
    paddingHorizontal: 70,
  },
  videoText: {
    ...typography.styles.title,
    fontStyle: 'italic',
    color: '#000000',
    textAlign: 'center',
    width: 169,
  },
});

export default AppExplainerScreen;
