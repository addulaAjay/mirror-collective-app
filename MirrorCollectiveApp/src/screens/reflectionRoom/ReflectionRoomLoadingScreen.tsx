/**
 * Reflection Room — Tuning state (§12.5, Figma node 4654-3272 frame 6).
 *
 * The post-submit screen between the quiz and Today's Motif. Owns the
 * POST /reflection/quiz network call so the user sees the tuning copy
 * during the wait.
 *
 * Behavior:
 *  - Receives QuizAnswers as a route param.
 *  - On mount: calls postQuiz(); waits for both the API response AND a
 *    minimum visual hold (1500ms) so the screen never flashes by.
 *  - On success: caches session + motif in JourneyContext, replaces
 *    nav with Today's Motif.
 *  - On error: replaces nav with Today's Motif in error mode (renders
 *    the §12.7 RESULTS NOT AVAILABLE state with a retry CTA).
 *  - Keeps the existing staggered-icon animation as a non-blocking
 *    decoration; reduced_motion will fall back to a static layout in
 *    Phase 9.
 */

import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import {
  fontFamily,
  fontSize,
  lineHeight,
  palette,
  spacing,
  textShadow,
} from '@theme';
import type { RootStackParamList } from '@types';

import { getReflectionRoomClient } from '@features/reflection-room/api';
import { ReflectionRoomApiError } from '@features/reflection-room/api/types';
import type { QuizAnswers } from '@features/reflection-room/api/types';
import { QUIZ_TUNING } from '@features/reflection-room/copy/strings';
import { useJourney } from '@features/reflection-room/state/JourneyContext';
import { useReflectionRoomPrefs } from '@features/reflection-room/state/useReflectionRoomPrefs';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type LoadingRouteProps = NativeStackScreenProps<
  RootStackParamList,
  'ReflectionRoomLoading'
>;

const ICONS = [
  require('@assets/reflection-loading-icon-4.png'),
  require('@assets/reflection-loading-icon-1.png'),
  require('@assets/reflection-loading-icon-2.png'),
  require('@assets/reflection-loading-icon-3.png'),
];

const ICON_SIZE = 70;
const ICON_START_SCALE = 0.15;
const STAGGER_DELAY_MS = 400;
const ANIM_DURATION_MS = 500;
const MIN_DISPLAY_MS = 1500;

const ReflectionRoomLoadingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<LoadingRouteProps['route']>();
  const journey = useJourney();
  const { reduced_motion } = useReflectionRoomPrefs();
  // When reduced_motion is on, render the icons fully visible without
  // the stagger sequence — keeps the page coherent for screen readers
  // and users who've opted out of motion (UI handoff §7.1).
  const initialScale = reduced_motion ? 1 : ICON_START_SCALE;
  const initialOpacity = reduced_motion ? 1 : 0;
  const scales = useRef(
    ICONS.map(() => new Animated.Value(initialScale)),
  ).current;
  const opacities = useRef(
    ICONS.map(() => new Animated.Value(initialOpacity)),
  ).current;

  // Decorative stagger animation — runs once. Skipped under reduced_motion.
  useEffect(() => {
    if (reduced_motion) return;
    const animations = ICONS.map((_, i) =>
      Animated.sequence([
        Animated.delay(i * STAGGER_DELAY_MS),
        Animated.parallel([
          Animated.spring(scales[i], {
            toValue: 1,
            friction: 5,
            tension: 60,
            useNativeDriver: true,
          }),
          Animated.timing(opacities[i], {
            toValue: 1,
            duration: ANIM_DURATION_MS,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    Animated.parallel(animations).start();
  }, [opacities, reduced_motion, scales]);

  // API call gated by min display time.
  useEffect(() => {
    let cancelled = false;
    const answers = route.params?.answers as QuizAnswers | undefined;

    if (!answers) {
      // Defensive — without answers we have nothing to submit. Route to
      // QuizEntry so the user can start over.
      navigation.replace('ReflectionRoomQuizEntry');
      return;
    }

    const startedAt = Date.now();

    void (async () => {
      try {
        const response = await getReflectionRoomClient().postQuiz({
          answers,
          session_id: null,
          user_override_tag: null,
        });
        if (cancelled) return;
        const elapsed = Date.now() - startedAt;
        const wait = Math.max(0, MIN_DISPLAY_MS - elapsed);
        setTimeout(() => {
          if (cancelled) return;
          journey.setSession({
            sessionId: response.session_id,
            motif: response.motif,
          });
          navigation.replace('ReflectionRoomTodaysMotif');
        }, wait);
      } catch (err) {
        if (cancelled) return;
        const elapsed = Date.now() - startedAt;
        const wait = Math.max(0, MIN_DISPLAY_MS - elapsed);
        const code =
          err instanceof ReflectionRoomApiError ? err.code : 'UNKNOWN';
        setTimeout(() => {
          if (cancelled) return;
          navigation.replace('ReflectionRoomTodaysMotif', {
            error: true,
            errorCode: code,
          });
        }, wait);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.answers]);

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
            accessibilityLabel={QUIZ_TUNING.eyebrow}
          >
            {QUIZ_TUNING.eyebrow}
          </Text>

          <View style={styles.iconsRow} accessibilityElementsHidden>
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
                <Image source={icon} style={styles.icon} resizeMode="contain" />
              </Animated.View>
            ))}
          </View>

          <Text style={styles.status}>{QUIZ_TUNING.status}</Text>
          <Text style={styles.body}>{QUIZ_TUNING.body}</Text>
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default ReflectionRoomLoadingScreen;

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: palette.navy.deep },
  safe: { flex: 1 },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.l,
  },
  eyebrow: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['3xl'],
    lineHeight: lineHeight.xl,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: textShadow.glow.color,
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: textShadow.glow.radius,
  },
  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: spacing.s,
    marginVertical: spacing.l,
  },
  iconContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: '100%', height: '100%' },
  status: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['2xl'],
    lineHeight: lineHeight.xl,
    color: palette.gold.subtlest,
    textAlign: 'center',
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    color: palette.gold.subtlest,
    textAlign: 'center',
    paddingHorizontal: spacing.s,
  },
});
