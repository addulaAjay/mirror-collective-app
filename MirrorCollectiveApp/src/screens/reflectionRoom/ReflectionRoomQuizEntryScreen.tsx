/**
 * Reflection Room — Quiz Entry (§12.3, Figma node 4654-3272 entry block).
 *
 * The first screen the user sees after the Welcome onboarding (or after
 * tapping "Start Reflection" on the home tile). Hosts the eyebrow + body
 * + Ambient Sounds toggle + START button. Tapping START opens the 4-question
 * quiz.
 *
 * This screen previously lived inside ReflectionRoomLandingScreen — extracted
 * here so the landing can match Figma node 4791-2304 (motif tile) instead.
 */

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import {
  borderWidth,
  fontFamily,
  fontSize,
  lineHeight,
  palette,
  radius,
  spacing,
  textShadow,
} from '@theme';
import type { RootStackParamList } from '@types';

import { LANDING, QUIZ_ENTRY } from '@features/reflection-room/copy/strings';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ReflectionRoomQuizEntryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <BackgroundWrapper style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={styles.eyebrow}
            accessibilityRole="header"
            accessibilityLabel={LANDING.eyebrow}
          >
            {LANDING.eyebrow}
          </Text>

          <View style={styles.imageContainer} accessibilityElementsHidden>
            <Image
              source={require('@assets/reflection-room-arch-1.png')}
              style={styles.archLayer1}
              resizeMode="contain"
            />
            <Image
              source={require('@assets/reflection-room-arch-2.png')}
              style={styles.archLayer2}
              resizeMode="contain"
            />
            <Image
              source={require('@assets/reflection-room-stairs.png')}
              style={styles.stairsImage}
              resizeMode="contain"
            />
            <Image
              source={require('@assets/reflection-room-arch-3.png')}
              style={styles.archLayer3}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.body}>{QUIZ_ENTRY.body}</Text>

          <Pressable
            onPress={() => navigation.navigate('ReflectionRoomQuiz')}
            accessibilityRole="button"
            accessibilityLabel="Start reflection"
            style={({ pressed }) => [
              styles.startButton,
              pressed && styles.startButtonPressed,
            ]}
          >
            <Text style={styles.startText}>START</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default ReflectionRoomQuizEntryScreen;

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: palette.navy.deep },
  safe: { flex: 1 },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.xxxl,
    gap: spacing.xxxl,
  },
  eyebrow: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['3xl'],
    lineHeight: lineHeight.xl,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: textShadow.glow.color,
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: textShadow.glow.radius,
  },
  imageContainer: {
    width: 317,
    height: 300,
    position: 'relative',
  },
  archLayer1: {
    position: 'absolute',
    width: 263,
    height: 300,
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -131.5 }],
  },
  archLayer2: {
    position: 'absolute',
    width: 238,
    height: 282,
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -119 }],
  },
  archLayer3: {
    position: 'absolute',
    width: 213,
    height: 265,
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -106.5 }],
  },
  stairsImage: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -76.5 }],
    width: 183,
    height: 172,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    color: palette.gold.subtlest,
    textAlign: 'center',
    width: 317,
  },
  startButton: {
    minWidth: 104,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.l,
    borderRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
    backgroundColor: palette.neutral.transparent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonPressed: { opacity: 0.7 },
  startText: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xl,
    color: palette.gold.DEFAULT,
    letterSpacing: 1,
  },
  ambientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.l,
    height: 32,
  },
  ambientLabel: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.l,
    color: palette.gold.warm,
  },
  toggle: {
    width: 60,
    height: 32,
    borderRadius: radius.m,
    backgroundColor: palette.navy.light,
    borderWidth: borderWidth.regular,
    borderColor: palette.navy.border,
    padding: 4,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: palette.gold.dark,
    borderColor: palette.gold.dark,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: radius.s,
    backgroundColor: palette.gold.subtlest,
    alignSelf: 'flex-start',
  },
  thumbOn: { alignSelf: 'flex-end' },
});
