import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import { palette, spacing, theme } from '@theme';
import type { RootStackParamList } from '@types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ICONS = [
  require('@assets/reflection-loading-icon-4.png'),
  require('@assets/reflection-loading-icon-1.png'),
  require('@assets/reflection-loading-icon-2.png'),
  require('@assets/reflection-loading-icon-3.png'),
];

const ICON_SIZE = 70;
const ICON_START_SCALE = 0.15;
const STAGGER_DELAY = 400;
const ANIM_DURATION = 500;

const ReflectionRoomLoadingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const scales = useRef(ICONS.map(() => new Animated.Value(ICON_START_SCALE))).current;
  const opacities = useRef(ICONS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = ICONS.map((_, i) =>
      Animated.sequence([
        Animated.delay(i * STAGGER_DELAY),
        Animated.parallel([
          Animated.spring(scales[i], {
            toValue: 1,
            friction: 5,
            tension: 60,
            useNativeDriver: true,
          }),
          Animated.timing(opacities[i], {
            toValue: 1,
            duration: ANIM_DURATION,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    Animated.parallel(animations).start();

    const timer = setTimeout(() => {
      navigation.navigate('ReflectionRoomTodaysMotif' as never);
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigation, scales, opacities]);

  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.tuningTitle}>THE MIRROR IS{'\n'}TUNING...</Text>

          <View style={styles.iconsRow}>
            {ICONS.map((icon, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.iconContainer,
                  {
                    transform: [{ scale: scales[i] }],
                    opacity: opacities[i],
                  },
                ]}
              >
                <Image source={icon} style={styles.iconImage} resizeMode="contain" />
              </Animated.View>
            ))}
          </View>

          <Text style={styles.tuningBody}>Your reflection is taking form.</Text>
          <Text style={styles.tuningSubtext}>
            You will be guided to your reflection room shortly. Every step you take, the Mirror will {'\n'}walk beside you.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default ReflectionRoomLoadingScreen;

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: palette.navy.deep,
  },
  bgImage: {
    resizeMode: 'cover',
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: Math.max(20, screenWidth * 0.051),
    paddingBottom: Math.max(40, screenHeight * 0.05),
    flexGrow: 1,
    paddingTop: Math.max(40, screenHeight * 0.05),
  },
  tuningTitle: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.sizes['4xl'],
    color: theme.colors.text.paragraph1,
    textAlign: 'center',
    letterSpacing: 2,
    marginTop: Math.max(30, screenHeight * 0.04),
    marginBottom: Math.max(40, screenHeight * 0.05),
  },
  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: spacing.s,
    marginBottom: Math.max(50, screenHeight * 0.06),
  },
  iconContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconImage: {
    width: '100%',
    height: '100%',
  },
  tuningBody: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.sizes['3xl'],
    color: theme.colors.text.paragraph2,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  tuningSubtext: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text.paragraph2,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeights.lg,
    paddingHorizontal: spacing.xs,
  },
});
