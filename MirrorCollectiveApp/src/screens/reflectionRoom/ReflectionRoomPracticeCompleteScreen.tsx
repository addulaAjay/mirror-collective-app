/**
 * Reflection Room — Practice Complete (§12.10 complete state).
 *
 * Renders the canonical PRACTICE COMPLETE confirmation + the three post-
 * completion CTAs from §12.10:
 *   - Back to Reflection Room
 *   - Back Home
 *   - View Updated Echo Map (optional)
 *
 * The cached snapshot has already been refreshed by
 * ReflectionRoomPracticeOverlayScreen via setSnapshot() before navigating
 * here, so subsequent screens (Echo Signature, Echo Map, Mirror Moment)
 * see the new state without re-fetching.
 */

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

import { MIRROR_MOMENT } from '@features/reflection-room/copy/strings';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ReflectionRoomPracticeCompleteScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <BackgroundWrapper style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={styles.eyebrow}
            accessibilityRole="header"
            accessibilityLabel={MIRROR_MOMENT.completeHeader}
          >
            {MIRROR_MOMENT.completeHeader}
          </Text>
          <Text style={styles.body}>{MIRROR_MOMENT.completeBody}</Text>

          <View style={styles.ctaStack}>
            <Pressable
              onPress={() => navigation.navigate('ReflectionRoom')}
              accessibilityRole="button"
              accessibilityLabel={MIRROR_MOMENT.postCompleteCtas.backToReflectionRoom}
              style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
            >
              <Text style={styles.ctaText}>
                {MIRROR_MOMENT.postCompleteCtas.backToReflectionRoom}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('EnterMirror')}
              accessibilityRole="button"
              accessibilityLabel={MIRROR_MOMENT.postCompleteCtas.backHome}
              style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
            >
              <Text style={styles.ctaText}>
                {MIRROR_MOMENT.postCompleteCtas.backHome}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('ReflectionRoomEchoMap')}
              accessibilityRole="button"
              accessibilityLabel={MIRROR_MOMENT.postCompleteCtas.viewUpdatedEchoMap}
              style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
            >
              <Text style={styles.ctaText}>
                {MIRROR_MOMENT.postCompleteCtas.viewUpdatedEchoMap}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default ReflectionRoomPracticeCompleteScreen;

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: palette.navy.deep },
  safe: { flex: 1 },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.xxl,
    gap: spacing.l,
    flexGrow: 1,
    justifyContent: 'center',
  },
  eyebrow: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['3xl'],
    lineHeight: lineHeight.xl,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    letterSpacing: 4,
    textShadowColor: textShadow.glowStrong.color,
    textShadowOffset: textShadow.glowStrong.offset,
    textShadowRadius: textShadow.glowStrong.radius,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    color: palette.gold.subtlest,
    textAlign: 'center',
    paddingHorizontal: spacing.s,
  },
  ctaStack: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.s,
    marginTop: spacing.l,
  },
  cta: {
    minWidth: 240,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
    backgroundColor: palette.neutral.transparent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xl,
    color: palette.gold.DEFAULT,
    letterSpacing: 2,
  },
  pressed: { opacity: 0.7 },
});
