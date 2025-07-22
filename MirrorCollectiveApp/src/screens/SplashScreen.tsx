import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, Image } from 'react-native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type SplashProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

const SplashScreen: React.FC<SplashProps> = ({ navigation }) => {
  useEffect(() => {
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

    return () => clearTimeout(timer);
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
        <Text style={styles.title}>The MIRROR{'\n'}COLLECTIVE</Text>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    gap: 25,
  },
  logo: {
    width: 175,
    height: 175,
    shadowColor: 'rgba(229, 214, 176, 0.86)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 8,
  },
  title: {
    fontFamily: 'CormorantGaramond-Italic',
    fontStyle: 'italic',
    fontWeight: '300',
    fontSize: 35,
    lineHeight: 42,
    textAlign: 'center',
    color: '#E5D6B0',
    // textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 9,
  },
});

export default SplashScreen;
