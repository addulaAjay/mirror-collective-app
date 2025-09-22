import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Dimensions,
} from 'react-native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { authApiService } from '../services/api';

import { COLORS, TEXT_STYLES, SPACING, responsive } from '../styles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type SplashProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

const SplashScreen: React.FC<SplashProps> = ({ navigation }) => {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await authApiService.clearTokens();
        console.log('Authentication tokens cleared on app start');
      } catch (error) {
        console.warn('Failed to clear tokens on app start:', error);
      }

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
    paddingHorizontal: Math.max(SPACING.L, screenWidth * 0.06),
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  logoContainer: {
    alignItems: 'center',
    gap: Math.max(SPACING.L, screenHeight * 0.025),
  },
  logo: {
    width: Math.min(Math.max(screenWidth * 0.35, 120), 175),
    height: Math.min(Math.max(screenWidth * 0.35, 120), 175),
    shadowColor: COLORS.PRIMARY.GOLD_LIGHT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.86,
    shadowRadius: Math.max(5, screenWidth * 0.015),
    elevation: 8,
  },
  title: {
    ...TEXT_STYLES.h2,
    fontFamily: 'CormorantGaramond-Light',
    fontWeight: '300',
    fontSize: Math.min(
      Math.max(screenWidth * 0.08, responsive(28)),
      responsive(35),
    ),
    lineHeight: Math.min(
      Math.max(screenWidth * 0.095, responsive(34)),
      responsive(42),
    ),
    textAlign: 'center',
    color: COLORS.TEXT.SECONDARY, // #E5D6B0
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 9,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textTransform: 'none',
  },
});

export default SplashScreen;
