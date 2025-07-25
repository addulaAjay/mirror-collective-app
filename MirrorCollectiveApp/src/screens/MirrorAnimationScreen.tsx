import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
} from 'react-native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { useAuthGuard } from '../hooks/useAuthGuard';
import LogoHeader from '../components/LogoHeader';
import { shadows } from '../styles/typography';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MirrorAnimation'>;
};

const MirrorAnimationScreen: React.FC<Props> = ({ navigation }) => {
  const { isAuthenticated, hasValidToken } = useAuthGuard();

  const handleEnter = useCallback(() => {
    if (isAuthenticated && hasValidToken) {
      navigation.replace('EnterMirror');
    } else {
      navigation.replace('AppExplanation');
    }
  }, [isAuthenticated, hasValidToken, navigation]);

  return (
    <ImageBackground
      source={require('../../assets/dark_mode_shimmer_bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
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
    shadowColor: shadows.container.color,
    shadowOffset: shadows.container.offset,
    shadowOpacity: shadows.container.opacity,
    shadowRadius: shadows.container.radius,
    elevation: 10,
    alignItems: 'center',
    paddingTop: 120, // Space for LogoHeader (48 + 46 + 26 margin)
    paddingHorizontal: 42,
  },
  mirrorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    top: -40,
  },
  glowEffect: {
    position: 'absolute',
    width: 296,
    height: 472,
    borderRadius: 236,
    backgroundColor: 'rgba(217, 217, 217, 0.01)',
    shadowColor: 'rgba(229, 214, 176, 0.47)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 60,
    elevation: 12,
  },
  mirrorFrame: {
    width: 465,
    height: 623,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mirrorAsset1: {
    position: 'absolute',
    width: 465,
    height: 623,
    top: 0,
    left: 0,
  },
  mirrorAsset2: {
    position: 'absolute',
    width: 382,
    height: 359,
    top: 131,
    left: 41.5,
  },
});

export default MirrorAnimationScreen;
