import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Dimensions,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { authApiService } from '../services/api';

type SplashProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

const SplashScreen: React.FC<SplashProps> = ({ navigation }) => {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Clear all authentication tokens on app start
        // This ensures users have to login every time the app is opened
        await authApiService.clearTokens();
        console.log('Authentication tokens cleared on app start');
      } catch (error) {
        console.warn('Failed to clear tokens on app start:', error);
      }

      // Navigate after clearing tokens
      const timer = setTimeout(() => {
        try {
          navigation.replace('MirrorAnimation');
        } catch (error) {
          console.error('Navigation error in SplashScreen:', error);
          try {
            navigation.navigate('MirrorAnimation');
          } catch (fallbackError) {
            console.error('Fallback navigation also failed:', fallbackError);
          }
        }
      }, 3000);

      return timer;
    };

    const cleanupTimer = initializeApp();

    return () => {
      if (cleanupTimer instanceof Promise) {
        cleanupTimer.then(timer => clearTimeout(timer));
      }
    };
  }, [navigation]);

  return (
    <ImageBackground
      source={require('../../assets/dark_mode_shimmer_bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/Mirror_Collective_Logo_RGB.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>The MIRROR COLLECTIVE</Text>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Math.max(24, screenWidth * 0.06),
  },
  logoContainer: {
    alignItems: 'center',
    gap: Math.max(20, screenHeight * 0.025),
  },
  logo: {
    width: Math.min(Math.max(screenWidth * 0.35, 120), 175),
    height: Math.min(Math.max(screenWidth * 0.35, 120), 175),
    shadowColor: 'rgba(229, 214, 176, 0.86)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: Math.max(5, screenWidth * 0.015),
    elevation: 8,
  },
  title: {
    fontFamily: 'CormorantGaramond-Light', // Exact font from Figma
    fontWeight: '300', // Light weight (300)
    fontSize: Math.min(Math.max(screenWidth * 0.08, 28), 35), // Target 35px from Figma
    lineHeight: Math.min(Math.max(screenWidth * 0.095, 34), 42), // Target ~42px from Figma
    textAlign: 'center', // CENTER alignment from Figma
    color: '#E5D6B0', // Exact color from Figma
    textShadowOffset: { width: 0, height: 4 }, // Exact offset from Figma
    textShadowRadius: 9, // Exact blur from Figma
    textShadowColor: 'rgba(0, 0, 0, 0.25)', // Exact shadow color from Figma
    textTransform: 'none', // Keep original case
  },
});

export default SplashScreen;
