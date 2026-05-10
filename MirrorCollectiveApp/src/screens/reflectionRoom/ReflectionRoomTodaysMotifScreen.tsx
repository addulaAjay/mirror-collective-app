/**
 * Reflection Room — Today's Motif reveal (§12.6, Figma node 4654-3272 frame 7).
 *
 * Renders the motif assigned by /reflection/quiz, sourced from JourneyContext.
 * Handles two states:
 *   - success: motif name (uppercase) + glyph + why_text + "VIEW SIGNATURE" CTA.
 *   - error  : §12.7 RESULTS NOT AVAILABLE state with retry CTA back to QuizEntry.
 */

import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { MOTIF_SVG } from '@assets/motifs-icons/MotifIconAssets';
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

import {
  QUIZ_ERROR,
  TODAYS_MOTIF,
  displayMotifUpper,
} from '@features/reflection-room/copy/strings';
import { useJourney } from '@features/reflection-room/state/JourneyContext';
import type { MotifId } from '@features/reflection-room/types/ids';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type RouteProps = NativeStackScreenProps<
  RootStackParamList,
  'ReflectionRoomTodaysMotif'
>;

const ReflectionRoomTodaysMotifScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps['route']>();
  const journey = useJourney();

  const error = route.params?.error === true;
  const hasMotif = !error && journey.motif != null;

  if (error) {
    return (
      <ErrorState
        onRetry={() => navigation.replace('ReflectionRoomQuizEntry')}
      />
    );
  }

  if (!hasMotif) {
    // Reached this screen without a motif and without an error flag —
    // bounce to the quiz entry rather than rendering blank.
    return (
      <ErrorState
        onRetry={() => navigation.replace('ReflectionRoomQuizEntry')}
      />
    );
  }

  const motif = journey.motif!;
  const motifNameUpper = displayMotifUpper(motif.motif_id);
  const motifSvg =
    MOTIF_SVG[motif.motif_id] ??
    MOTIF_SVG[(motif.motif_id as MotifId).replace('_', '-')] ??
    '';

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
            accessibilityLabel={TODAYS_MOTIF.eyebrow}
          >
            {TODAYS_MOTIF.eyebrow}
          </Text>
          <Text style={styles.motifName} accessibilityLabel={motif.motif_name}>
            {motifNameUpper}
          </Text>

          <View style={styles.glyphContainer} accessibilityElementsHidden>
            <SvgXml
              xml={motifSvg}
              width="100%"
              height="100%"
            />
          </View>

          <Text style={styles.whyText}>{motif.why_text}</Text>

          <Pressable
            onPress={() => navigation.replace('ReflectionRoomEchoSignature')}
            accessibilityRole="button"
            accessibilityLabel="View Signature"
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.ctaText}>VIEW SIGNATURE</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default ReflectionRoomTodaysMotifScreen;

const ErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
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
          accessibilityLabel={QUIZ_ERROR.header}
        >
          {QUIZ_ERROR.header}
        </Text>
        <Text style={styles.errorBody}>{QUIZ_ERROR.body}</Text>
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retake Quiz"
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.ctaText}>RETAKE QUIZ</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  </BackgroundWrapper>
);

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: palette.navy.deep },
  safe: { flex: 1 },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.xxxl,
    gap: spacing.l,
    flexGrow: 1,
    justifyContent: 'center',
  },
  eyebrow: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['2xl'],
    lineHeight: lineHeight.xl,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    letterSpacing: 4,
    textShadowColor: textShadow.glow.color,
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: textShadow.glow.radius,
  },
  motifName: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['4xl'],
    lineHeight: lineHeight.xxl,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    letterSpacing: 3,
    textShadowColor: textShadow.glowStrong.color,
    textShadowOffset: textShadow.glowStrong.offset,
    textShadowRadius: textShadow.glowStrong.radius,
  },
  glyphContainer: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whyText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    color: palette.gold.subtlest,
    textAlign: 'center',
    paddingHorizontal: spacing.s,
  },
  errorBody: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    color: palette.gold.subtlest,
    textAlign: 'center',
    paddingHorizontal: spacing.s,
  },
  ctaButton: {
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
