import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  palette,
  scaleCap,
  scale,
  spacing,
} from '@theme';
import type { RootStackParamList } from '@types';
import React, { useCallback, useEffect } from 'react';
import {
  Dimensions,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import CircularLogoMark from '@components/CircularLogoMark';
import HeaderTextSvg from '@components/HeaderTextSvg';

const { width: screenWidth } = Dimensions.get('screen');

// Logo mark sized to ~40% of screen width, capped at 160px
const LOGO_MARK_SIZE = Math.max(120, scaleCap(screenWidth * 0.4, 160));
// Text SVG maintains its 93:45 aspect ratio; scaled proportionally to logo mark
const HEADER_TEXT_WIDTH = scaleCap(screenWidth * 0.55, 210);

type SplashProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

const SplashScreen: React.FC<SplashProps> = ({ navigation }) => {
  const goNext = useCallback(() => {
    try {
      navigation.replace('MirrorAnimation');
    } catch {
      navigation.navigate('MirrorAnimation');
    }
  }, [navigation]);

  useEffect(() => {
    const timer = setTimeout(goNext, 3000);
    return () => clearTimeout(timer);
  }, [goNext]);

  return (
    <BackgroundWrapper style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.logoContainer}>
          <CircularLogoMark size={LOGO_MARK_SIZE} />
          <HeaderTextSvg
            width={HEADER_TEXT_WIDTH}
            color={palette.neutral.white}
          />
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
    paddingHorizontal: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    gap: scale(20),
  },
});

export default SplashScreen;
