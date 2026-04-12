import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  fontFamily,
  fontSize,
  moderateScale,
  palette,
  scaleCap,
  spacing,
} from '@theme';
import type { RootStackParamList } from '@types';
import React, { useCallback, useEffect } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';

const { width: screenWidth } = Dimensions.get('screen');

const LOGO_SIZE = Math.max(120, scaleCap(screenWidth * 0.35, 175));

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
    paddingHorizontal: spacing.xl, // 24
  },
  logoContainer: {
    alignItems: 'center',
    gap: spacing.xl, // 24
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    shadowColor: palette.gold.warm,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.86,
    shadowRadius: moderateScale(20, 0.3),
    elevation: 8,
  },
  title: {
    fontFamily: fontFamily.headingLight,  // CormorantGaramond-Light
    fontWeight: '300',
    fontSize: moderateScale(fontSize['2xl'], 0.3), // 28 base
    lineHeight: moderateScale(fontSize['2xl'] * 1.3, 0.3),
    textAlign: 'center',
    color: palette.gold.warm,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 9,
  },
});

export default SplashScreen;
