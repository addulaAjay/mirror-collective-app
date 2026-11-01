/**
 * Reflection Room — Echo Signature (§12.8, Figma node 7128-6439).
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
 * States (Figma nodes):
 *  - loading → 7128:7468 — LOADING header + dot spinner + "taking shape" block
 *  - active  → 7128:6439 — header, subhead, 3 tone cards, OPEN ECHO MAP CTA
 *  - empty   → 7128:7137 — NO LOOPS FOUND + GO HOME CTA
 *  - error   → 7128:6806 — RESULTS NOT AVAILABLE + TRY AGAIN CTA
 *
 * The error / empty / loading states are centred single-column blocks
 * (no eyebrow / subhead header), matching their dedicated Figma frames.
 */

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import { getReflectionRoomClient } from '@features/reflection-room/api';
import { firePracticeExpand } from '@features/reflection-room/api/telemetry';
import { ReflectionRoomApiError } from '@features/reflection-room/api/types';
import type { LoopState } from '@features/reflection-room/api/types';
import EchoSignatureCard from '@features/reflection-room/components/EchoSignatureCard';
import { ECHO_SIGNATURE, LANDING } from '@features/reflection-room/copy/strings';
import { useJourney } from '@features/reflection-room/state/JourneyContext';
import {
  borderWidth,
  fontFamily,
  fontSize,
  glassGradient,
  lineHeight,
  moderateScale,
  palette,
  radius,
  spacing,
  textShadow,
} from '@theme';
import type { RootStackParamList } from '@types';




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

  const isHeaderState = status === 'active';

  return (
    <BackgroundWrapper style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            !isHeaderState && styles.scrollCentered,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {isHeaderState && (
            <View style={styles.headerBlock}>
              <View style={styles.titleRow}>
                <Pressable
                  onPress={() => navigation.goBack()}
                  accessibilityRole="button"
                  accessibilityLabel="Back"
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.iconButton,
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
                <View style={styles.iconButton}>
                  <Image
                    source={require('@assets/rr-info-icon.png')}
                    style={styles.infoIcon}
                    resizeMode="contain"
                  />
                </View>
              </View>
              <Text style={styles.subhead}>{ECHO_SIGNATURE.subhead}</Text>
            </View>
          )}

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
            <GlassCta
              label={LANDING.ctaOpenEchoMap}
              onPress={() => navigation.navigate('ReflectionRoomEchoMap')}
            />
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

/**
 * Glass gradient CTA button — matches Figma "Component 5" (transparent
 * white vertical gradient, subtle steel border, asymmetric top-right
 * radius, warm gold text glow).
 */
const GlassCta: React.FC<{
  label: string;
  onPress: () => void;
  ctaLabel?: string;
}> = ({ label, onPress, ctaLabel }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={ctaLabel ?? label}
    style={({ pressed }) => [styles.ctaWrapper, pressed && styles.pressed]}
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

const LoadingBlock: React.FC = () => (
  <View style={styles.loadingBlock}>
    <Text style={styles.stateHeader}>{ECHO_SIGNATURE.loadingHeader}</Text>
    <ActivityIndicator
      size="large"
      color={palette.gold.DEFAULT}
      style={styles.spinner}
    />
    <Text style={styles.loadingBody}>{ECHO_SIGNATURE.loadingBody}</Text>
  </View>
);

const EmptyBlock: React.FC<{ onGoHome: () => void }> = ({ onGoHome }) => (
  <View style={styles.stateBlock}>
    <Text style={styles.stateHeader}>{ECHO_SIGNATURE.emptyHeader}</Text>
    <Text style={styles.stateBody}>{ECHO_SIGNATURE.emptyBody}</Text>
    <GlassCta label="GO HOME" onPress={onGoHome} ctaLabel="Go home" />
  </View>
);

const ErrorBlock: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <View style={styles.stateBlock}>
    <Text style={styles.stateHeader}>{ECHO_SIGNATURE.errorHeader}</Text>
    <Text style={styles.stateBody}>{ECHO_SIGNATURE.errorBody}</Text>
    <GlassCta label="TRY AGAIN" onPress={onRetry} ctaLabel="Try again" />
  </View>
);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const ICON_BUTTON = moderateScale(40);
const HEADER_ICON = moderateScale(24);

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.xxxl,
    gap: spacing.xxxl,
  },
  scrollCentered: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  headerBlock: {
    gap: spacing.l,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.s,
  },
  iconButton: {
    width: ICON_BUTTON,
    height: ICON_BUTTON,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    width: HEADER_ICON,
    height: HEADER_ICON,
    tintColor: palette.gold.DEFAULT,
  },
  infoIcon: {
    width: HEADER_ICON,
    height: HEADER_ICON,
  },
  eyebrow: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['2xl'],
    lineHeight: lineHeight.xxl,
    color: palette.gold.DEFAULT,
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: textShadow.glow.color,
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: textShadow.glow.radius,
  },
  subhead: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    color: palette.gold.subtlest,
    textAlign: 'center',
  },
  cards: {
    gap: spacing.s,
  },
  // Centred single-column state blocks (error / empty).
  stateBlock: {
    alignItems: 'center',
    gap: spacing.xxxl,
    width: '100%',
  },
  // Loading uses a tighter rhythm around the spinner.
  loadingBlock: {
    alignItems: 'center',
    gap: spacing.xxl,
    width: '100%',
  },
  stateHeader: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['2xl'],
    lineHeight: lineHeight.xxl,
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
  loadingBody: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['2xl'],
    lineHeight: lineHeight.xxl,
    color: palette.gold.subtlest,
    textAlign: 'center',
  },
  spinner: { marginVertical: spacing.s },
  ctaWrapper: {
    alignSelf: 'center',
    minWidth: moderateScale(221),
  },
  ctaButton: {
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderTopLeftRadius: radius.s,
    borderTopRightRadius: radius.m,
    borderBottomLeftRadius: radius.s,
    borderBottomRightRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.l,
    color: palette.gold.DEFAULT,
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: textShadow.warmGlow.color,
    textShadowOffset: textShadow.warmGlow.offset,
    textShadowRadius: textShadow.warmGlow.radius,
  },
  pressed: { opacity: 0.7 },
});
