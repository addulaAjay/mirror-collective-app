import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import type { RootStackParamList } from '@types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

type SplashProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

const SplashScreen: React.FC<SplashProps> = ({ navigation }) => {
  useEffect(() => {
    const initializeApp = async () => {
      // Navigate after timeout
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
    <BackgroundWrapper style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@assets/Mirror_Collective_Logo_RGB.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>The MIRROR COLLECTIVE</Text>
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
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
    fontFamily: 'CormorantGaramond-Light',
    fontWeight: '300',
    fontSize: Math.min(Math.max(screenWidth * 0.08, 28), 35),
    lineHeight: Math.min(Math.max(screenWidth * 0.095, 34), 42),
    textAlign: 'center',
    color: '#E5D6B0',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 9,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textTransform: 'none',
  },
});

export default SplashScreen;
