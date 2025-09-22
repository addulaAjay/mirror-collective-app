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

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

import { useAuthGuard } from '../hooks/useAuthGuard';
import LogoHeader from '../components/LogoHeader';

// 🎨 Theme imports
import { COLORS, SHADOWS, SPACING, BORDERS } from '../styles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
            <Stop offset="29%" stopColor={COLORS.BACKGROUND.GRADIENT_START} />
            <Stop offset="70%" stopColor={COLORS.BACKGROUND.GRADIENT_MID} />
            <Stop offset="100%" stopColor={COLORS.BACKGROUND.GRADIENT_END} />
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
    borderRadius: BORDERS.RADIUS.LARGE,
    shadowColor: SHADOWS.LARGE.shadowColor,
    shadowOffset: SHADOWS.LARGE.shadowOffset,
    shadowOpacity: SHADOWS.LARGE.shadowOpacity,
    shadowRadius: SHADOWS.LARGE.shadowRadius,
    elevation: SHADOWS.LARGE.elevation,
    alignItems: 'center',
    paddingTop: Math.max(SPACING.XL, screenHeight * 0.056),
    paddingHorizontal: Math.max(SPACING.L, screenWidth * 0.06),
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BORDERS.RADIUS.LARGE,
  },
  mirrorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    top: Math.max(-SPACING.S, screenHeight * -0.024),
  },
  glowEffect: {
    position: 'absolute',
    width: Math.min(screenWidth * 0.753, 296),
    height: Math.min(screenHeight * 0.554, 472),
    borderRadius: Math.min(screenWidth * 0.376, 236),
    backgroundColor: 'rgba(217, 217, 217, 0.01)',
    shadowColor: COLORS.TEXT.SECONDARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.47,
    shadowRadius: Math.min(screenWidth * 0.153, 60),
    elevation: SHADOWS.LARGE.elevation,
  },
  mirrorFrame: {
    width: Math.min(screenWidth * 1.183, 465),
    height: Math.min(screenHeight * 0.731, 623),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mirrorAsset1: {
    position: 'absolute',
    width: Math.min(screenWidth * 1.183, 465),
    height: Math.min(screenHeight * 0.731, 623),
    top: 0,
    left: 0,
  },
  mirrorAsset2: {
    position: 'absolute',
    width: Math.min(screenWidth * 0.972, 382),
    height: Math.min(screenHeight * 0.421, 359),
    top: Math.min(screenHeight * 0.153, 130),
    left: Math.min(screenWidth * 0.105, 42),
  },
});

export default MirrorAnimationScreen;
