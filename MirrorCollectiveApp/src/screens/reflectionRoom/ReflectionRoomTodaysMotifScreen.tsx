/**
 * Reflection Room — Today's Motif reveal (§12.6, Figma node 7128-5771 success /
 * 7128-6104 error).
 *
 * Renders the motif assigned by /reflection/quiz, sourced from JourneyContext.
 * Handles two states:
 *   - success: TODAY'S MOTIF eyebrow (with info affordance) + motif name
 *     (uppercase) + glyph + why_text + "VIEW ECHO SIGNATURE" CTA.
 *   - error  : §12.7 RESULTS NOT AVAILABLE state with retry CTA back to QuizEntry.
 */

import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { MOTIF_SVG } from '@assets/motifs-icons/MotifIconAssets';
import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import {
  QUIZ_ERROR,
  TODAYS_MOTIF,
  displayMotifUpper,
} from '@features/reflection-room/copy/strings';
import { useJourney } from '@features/reflection-room/state/JourneyContext';
import type { MotifId } from '@features/reflection-room/types/ids';
import {
  borderWidth,
  fontFamily,
  fontSize,
  glassGradient,
  lineHeight,
  moderateScale,
  palette,
  radius,
  scale,
  spacing,
  textShadow,
  verticalScale,
} from '@theme';
import type { RootStackParamList } from '@types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type RouteProps = NativeStackScreenProps<
  RootStackParamList,
  'ReflectionRoomTodaysMotif'
>;

const ICON_SIZE = scale(24);
const GLYPH_SIZE = scale(240);

/**
 * Glass CTA — Figma "Component 5": transparent-white vertical gradient over a
 * subtle steel border, radius s (top-right radius m), Heading S gold label.
 */
const GlassCta: React.FC<{
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
}> = ({ label, accessibilityLabel, onPress }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    style={({ pressed }) => [styles.ctaWrap, pressed && styles.pressed]}
  >
    <LinearGradient
      colors={[glassGradient.echoSecondary.start, glassGradient.echoSecondary.end]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.ctaButton}
    >
      <Text style={styles.ctaText}>{label}</Text>
    </LinearGradient>
  </Pressable>
);

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
          {/* Eyebrow row: leading spacer, centered title, info affordance. */}
          <View style={styles.titleRow}>
            <View style={styles.iconSlot} accessibilityElementsHidden />
            <Text
              style={styles.eyebrow}
              accessibilityRole="header"
              accessibilityLabel={TODAYS_MOTIF.eyebrow}
            >
              {TODAYS_MOTIF.eyebrow}
            </Text>
            <View style={styles.iconSlot} accessibilityElementsHidden>
              <Image
                source={require('@assets/rr-info-icon.png')}
                style={styles.infoIcon}
                resizeMode="contain"
              />
            </View>
          </View>

          <Text style={styles.motifName} accessibilityLabel={motif.motif_name}>
            {motifNameUpper}
          </Text>

          <View style={styles.glyphContainer} accessibilityElementsHidden>
            <SvgXml xml={motifSvg} width="100%" height="100%" />
          </View>

          <Text style={styles.whyText}>{motif.why_text}</Text>

          <GlassCta
            label="VIEW ECHO SIGNATURE"
            accessibilityLabel="View Signature"
            onPress={() => navigation.replace('ReflectionRoomEchoSignature')}
          />
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
        contentContainerStyle={styles.errorScroll}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={styles.errorHeader}
          accessibilityRole="header"
          accessibilityLabel={QUIZ_ERROR.header}
        >
          {QUIZ_ERROR.header}
        </Text>
        <Text style={styles.errorBody}>{QUIZ_ERROR.body}</Text>
        <GlassCta
          label="RETAKE QUIZ"
          accessibilityLabel="Retake Quiz"
          onPress={onRetry}
        />
      </ScrollView>
    </SafeAreaView>
  </BackgroundWrapper>
);

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: scale(24),
    paddingBottom: spacing.xxxl,
    gap: verticalScale(40),
    flexGrow: 1,
    justifyContent: 'center',
  },
  // §12.6 eyebrow row — leading spacer + centered title + info icon.
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    gap: spacing.l,
  },
  iconSlot: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIcon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    tintColor: palette.gold.DEFAULT,
  },
  eyebrow: {
    flex: 1,
    fontFamily: fontFamily.heading,
    fontSize: fontSize['3xl'],
    lineHeight: lineHeight.xxl,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    textShadowColor: textShadow.glow.color,
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: textShadow.glow.radius,
  },
  motifName: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(40),
    lineHeight: moderateScale(52),
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    textShadowColor: textShadow.glowStrong.color,
    textShadowOffset: textShadow.glowStrong.offset,
    textShadowRadius: textShadow.glowStrong.radius,
  },
  glyphContainer: {
    width: GLYPH_SIZE,
    height: GLYPH_SIZE,
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
  // §12.7 error state.
  errorScroll: {
    alignItems: 'center',
    paddingHorizontal: scale(24),
    paddingBottom: spacing.xxxl,
    gap: spacing.xxxl,
    flexGrow: 1,
    justifyContent: 'center',
  },
  errorHeader: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['2xl'],
    lineHeight: lineHeight.xl,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    textShadowColor: textShadow.glow.color,
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: textShadow.glow.radius,
  },
  errorBody: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    color: palette.gold.subtlest,
    textAlign: 'center',
    paddingHorizontal: spacing.s,
  },
  // Figma "Component 5" glass CTA.
  ctaWrap: {
    borderRadius: radius.s,
    borderTopRightRadius: radius.m,
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
    overflow: 'hidden',
  },
  ctaButton: {
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.l,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    textShadowColor: textShadow.glow.color,
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: textShadow.glow.radius,
  },
  pressed: { opacity: 0.7 },
});
