/**
 * Reflection Room — Echo Signature (§12.8, Figma node 4654-3274).
 *
 * Renders the top-3 active loops from the cached `/echo/snapshot`. Each
 * card is tappable → opens the Practice overlay with surface =
 * "echo_signature".
 *
 * Snapshot policy (UI handoff §9):
 *  - If JourneyContext already has a snapshot, use it (don't refetch).
 *  - If not, fetch `/echo/snapshot` once and cache.
 *  - Refetch only after `/practice/complete` or explicit refresh.
 *
 * States:
 *  - loading → §12.8 LOADING strings
 *  - active  → 3 cards (or fewer if snapshot has <3 loops)
 *  - empty   → §12.8 NO LOOPS FOUND + GO HOME CTA
 *  - error   → §12.8 RESULTS NOT AVAILABLE + TRY AGAIN CTA
 */

import { getReflectionRoomClient } from '@features/reflection-room/api';
import { firePracticeExpand } from '@features/reflection-room/api/telemetry';
import { ReflectionRoomApiError } from '@features/reflection-room/api/types';
import type { LoopState } from '@features/reflection-room/api/types';
import EchoSignatureCard from '@features/reflection-room/components/EchoSignatureCard';
import { ECHO_SIGNATURE, LANDING } from '@features/reflection-room/copy/strings';
import { useJourney } from '@features/reflection-room/state/JourneyContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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


type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Status = 'loading' | 'active' | 'empty' | 'error';

const ReflectionRoomEchoSignatureScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  // Pull stable fields/setters only — `journey` as a whole has a fresh
  // ref every time JourneyContext state changes (including our own
  // setSnapshot call), which would re-create fetchSnapshot, re-fire
  // useFocusEffect, and loop forever.
  const { sessionId, snapshot, setSnapshot } = useJourney();
  const [status, setStatus] = useState<Status>(
    snapshot ? 'active' : 'loading',
  );

  const fetchSnapshot = useCallback(async () => {
    if (!sessionId) {
      setStatus('error');
      return;
    }
    try {
      const snap = await getReflectionRoomClient().getSnapshot(sessionId);
      setSnapshot(snap);
      setStatus(snap.loops.length === 0 ? 'empty' : 'active');
    } catch (err) {
      if (
        err instanceof ReflectionRoomApiError &&
        err.code === 'NO_ACTIVE_LOOPS'
      ) {
        setStatus('empty');
      } else {
        setStatus('error');
      }
    }
  }, [sessionId, setSnapshot]);

  useFocusEffect(
    useCallback(() => {
      if (snapshot) {
        setStatus(snapshot.loops.length === 0 ? 'empty' : 'active');
        return;
      }
      void fetchSnapshot();
    }, [fetchSnapshot, snapshot]),
  );

  // First-load fallback in environments where useFocusEffect doesn't fire.
  useEffect(() => {
    if (!snapshot && status === 'loading') {
      void fetchSnapshot();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCardPress = (loop: LoopState) => {
    // Fire `practice_expand` per UI handoff §8 — BEFORE the recommend
    // call (which the next screen owns) so analytics see intent even
    // when the recommend ultimately errors.
    firePracticeExpand(loop.loop_id, 'echo_signature');
    navigation.navigate('ReflectionRoomPracticeOverlay', {
      loopId: loop.loop_id,
      toneState: loop.tone_state,
      surface: 'echo_signature',
    });
  };

  return (
    <BackgroundWrapper style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={8}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
            >
              <Image
                source={require('@assets/back-arrow.png')}
                style={styles.backArrow}
                resizeMode="contain"
              />
            </Pressable>
            <Text
              style={styles.eyebrow}
              accessibilityRole="header"
              accessibilityLabel={ECHO_SIGNATURE.eyebrow}
            >
              {ECHO_SIGNATURE.eyebrow}
            </Text>
            <View style={styles.titleSpacer} />
          </View>
          <Text style={styles.subhead}>{ECHO_SIGNATURE.subhead}</Text>

          {status === 'loading' && <LoadingBlock />}
          {status === 'error' && (
            <ErrorBlock onRetry={() => void fetchSnapshot()} />
          )}
          {status === 'empty' && (
            <EmptyBlock onGoHome={() => navigation.navigate('ReflectionRoom')} />
          )}
          {status === 'active' && snapshot && (
            <View style={styles.cards}>
              {snapshot.loops.slice(0, 3).map(loop => (
                <EchoSignatureCard
                  key={loop.loop_id}
                  loop={loop}
                  onPress={onCardPress}
                />
              ))}
            </View>
          )}

          {status === 'active' && (
            <Pressable
              onPress={() => navigation.navigate('ReflectionRoomEchoMap')}
              accessibilityRole="button"
              accessibilityLabel={LANDING.ctaOpenEchoMap}
              style={({ pressed }) => [
                styles.ctaButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.ctaText}>{LANDING.ctaOpenEchoMap}</Text>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default ReflectionRoomEchoSignatureScreen;

// ---------------------------------------------------------------------------
// Sub-blocks
// ---------------------------------------------------------------------------

const LoadingBlock: React.FC = () => (
  <View style={styles.stateBlock}>
    <Text style={styles.stateHeader}>{ECHO_SIGNATURE.loadingHeader}</Text>
    <ActivityIndicator
      size="large"
      color={palette.gold.DEFAULT}
      style={styles.spinner}
    />
    <Text style={styles.stateBody}>{ECHO_SIGNATURE.loadingBody}</Text>
  </View>
);

const EmptyBlock: React.FC<{ onGoHome: () => void }> = ({ onGoHome }) => (
  <View style={styles.stateBlock}>
    <Text style={styles.stateHeader}>{ECHO_SIGNATURE.emptyHeader}</Text>
    <Text style={styles.stateBody}>{ECHO_SIGNATURE.emptyBody}</Text>
    <Pressable
      onPress={onGoHome}
      accessibilityRole="button"
      accessibilityLabel="Go home"
      style={({ pressed }) => [styles.ctaButton, pressed && styles.pressed]}
    >
      <Text style={styles.ctaText}>GO HOME</Text>
    </Pressable>
  </View>
);

const ErrorBlock: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <View style={styles.stateBlock}>
    <Text style={styles.stateHeader}>{ECHO_SIGNATURE.errorHeader}</Text>
    <Text style={styles.stateBody}>{ECHO_SIGNATURE.errorBody}</Text>
    <Pressable
      onPress={onRetry}
      accessibilityRole="button"
      accessibilityLabel="Try again"
      style={({ pressed }) => [styles.ctaButton, pressed && styles.pressed]}
    >
      <Text style={styles.ctaText}>TRY AGAIN</Text>
    </Pressable>
  </View>
);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const BACK_SIZE = 40;

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: palette.navy.deep },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.xxxl,
    gap: spacing.l,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.s,
  },
  backButton: {
    width: BACK_SIZE,
    height: BACK_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { width: 20, height: 20, tintColor: palette.gold.DEFAULT },
  titleSpacer: { width: BACK_SIZE, height: BACK_SIZE },
  eyebrow: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['2xl'],
    lineHeight: lineHeight.xl,
    color: palette.gold.DEFAULT,
    letterSpacing: 2,
    textShadowColor: textShadow.glow.color,
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: textShadow.glow.radius,
  },
  subhead: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    color: palette.gold.subtlest,
    paddingHorizontal: spacing.xs,
  },
  cards: {
    gap: spacing.s,
  },
  stateBlock: {
    alignItems: 'center',
    gap: spacing.m,
    paddingVertical: spacing.xxl,
  },
  stateHeader: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['2xl'],
    lineHeight: lineHeight.xl,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: textShadow.glow.color,
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: textShadow.glow.radius,
  },
  stateBody: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    color: palette.gold.subtlest,
    textAlign: 'center',
  },
  spinner: { marginVertical: spacing.s },
  ctaButton: {
    minWidth: 200,
    alignSelf: 'center',
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
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
