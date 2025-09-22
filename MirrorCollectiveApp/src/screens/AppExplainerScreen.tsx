import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { useAuthGuard } from '../hooks/useAuthGuard';
import LogoHeader from '../components/LogoHeader';
import {
  COLORS,
  SPACING,
  BORDERS,
  SHADOWS,
  TEXT_STYLES,
  LAYOUT,
} from '../styles';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AppExplanation'>;
};

const AppExplainerScreen: React.FC<Props> = ({ navigation }) => {
  const { isAuthenticated, hasValidToken, isLoading } = useAuthGuard();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) return;

      if (isAuthenticated && hasValidToken) {
        navigation.replace('EnterMirror');
      } else {
        navigation.replace('Login');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigation, isAuthenticated, hasValidToken, isLoading]);

  return (
    <ImageBackground
      source={require('../../assets/dark_mode_shimmer_bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <LogoHeader />

      {/* Video Placeholder */}
      <View style={styles.videoFrame}>
        <Text style={styles.videoText}>App explainer video</Text>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: LAYOUT.HEADER_HEIGHT + SPACING.XL,
    paddingHorizontal: SPACING.XL + 2,
    gap: SPACING.XXL,
    borderRadius: BORDERS.RADIUS.LARGE,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.MEDIUM,
  },
  videoFrame: {
    width: 309,
    height: 600,
    backgroundColor: 'rgba(255, 255, 255, 0.40)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.S,
    borderRadius: BORDERS.RADIUS.MEDIUM,
    paddingVertical: 236, // placeholder dimensions
    paddingHorizontal: 70,
    top: -40,
  },
  videoText: {
    ...TEXT_STYLES.h3,
    color: COLORS.TEXT.PRIMARY,
    textAlign: 'center',
    width: 169,
    fontWeight: undefined,
  },
});

export default AppExplainerScreen;
