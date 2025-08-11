import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { useAuthGuard } from '../hooks/useAuthGuard';
import LogoHeader from '../components/LogoHeader';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MirrorAnimation'>;
};

const MirrorAnimationScreen: React.FC<Props> = ({ navigation }) => {
  const { isAuthenticated, hasValidToken } = useAuthGuard();

  const handleEnter = useCallback(() => {
    if (isAuthenticated && hasValidToken) {
      navigation.replace('EnterMirror');
    } else {
      navigation.replace('QuizWelcome');
    }
  }, [isAuthenticated, hasValidToken, navigation]);

  return (
    <ImageBackground
      source={require('../../assets/dark_mode_shimmer_bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Radial gradient overlay to match Figma */}
      <Svg
        style={styles.gradientOverlay}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <Defs>
          <RadialGradient id="figmaGradient" cx="50%" cy="50%" r="70%">
            <Stop offset="29%" stopColor="rgba(0, 0, 0, 0)" />
            <Stop offset="70%" stopColor="rgba(20, 13, 13, 0.41)" />
            <Stop offset="100%" stopColor="rgba(48, 31, 31, 1)" />
          </RadialGradient>
        </Defs>
        <Rect
          width="100%"
          height="100%"
          fill="url(#figmaGradient)"
          opacity="0.2"
        />
      </Svg>

      <LogoHeader />

      <View style={styles.mirrorContainer}>
        {/* Circular glow effect behind mirror */}
        <View style={styles.glowEffect} />

        {/* Mirror frame/border */}
        <TouchableOpacity onPress={handleEnter} style={styles.mirrorFrame}>
          {/* Mirror reflection assets */}
          <Image
            source={require('../../assets/Asset_4@2x-8.png')}
            style={styles.mirrorAsset1}
            resizeMode="contain"
          />
          <Image
            source={require('../../assets/Asset_3@2x-8.png')}
            style={styles.mirrorAsset2}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 15,
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: -1, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 26,
    elevation: 10,
    alignItems: 'center',
    paddingTop: Math.max(48, screenHeight * 0.056),
    paddingHorizontal: Math.max(24, screenWidth * 0.06),
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 15,
  },
  mirrorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    top: Math.max(-20, screenHeight * -0.024),
  },
  glowEffect: {
    position: 'absolute',
    width: Math.min(screenWidth * 0.753, 296), // Exact 296px from Figma
    height: Math.min(screenHeight * 0.554, 472), // Exact 472px from Figma
    borderRadius: Math.min(screenWidth * 0.376, 236), // Circular
    backgroundColor: 'rgba(217, 217, 217, 0.01)', // Exact fill from Figma: a: 1, r: 0.8509804, g: 0.8509804, b: 0.8509804, opacity: 0.009999
    shadowColor: 'rgba(229, 214, 176, 0.47)', // Exact shadow color from Figma: a: 0.47, r: 0.8980392, g: 0.8392157, b: 0.6901961
    shadowOffset: { width: 0, height: 0 }, // Exact offset from Figma
    shadowOpacity: 1,
    shadowRadius: Math.min(screenWidth * 0.153, 60), // Exact 60px blur from Figma with responsive cap
    elevation: 15,
  },
  mirrorFrame: {
    width: Math.min(screenWidth * 1.183, 465), // Exact 465px from Figma (393px viewport)
    height: Math.min(screenHeight * 0.731, 623), // Exact 623px from Figma (852px viewport)
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mirrorAsset1: {
    position: 'absolute',
    width: Math.min(screenWidth * 1.183, 465), // Exact 465px from Figma
    height: Math.min(screenHeight * 0.731, 623), // Exact 623px from Figma
    top: 0,
    left: 0,
    resizeMode: 'contain',
  },
  mirrorAsset2: {
    position: 'absolute',
    width: Math.min(screenWidth * 0.972, 382), // Exact 382px from Figma
    height: Math.min(screenHeight * 0.421, 359), // Exact 359px from Figma
    top: Math.min(screenHeight * 0.153, 130), // Proportional positioning from Figma
    left: Math.min(screenWidth * 0.105, 42), // Proportional positioning from Figma
    resizeMode: 'contain',
  },
});

export default MirrorAnimationScreen;
