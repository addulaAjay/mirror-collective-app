/**
 * Reflection Room — Landing tile (§12.2, Figma node 4791-2304).
 *
 * The journey-entry screen rendered when the user taps the Reflection Room
 * tile from the app home. Three states:
 *
 *  - First-time user (no `welcomeSeen` flag) → routes to Welcome onboarding.
 *  - Active session in JourneyContext (or fresh fetch) → motif glyph +
 *    "OPEN ECHO MAP" + "MIRROR MOMENT" CTAs. Tapping the motif opens
 *    Echo Signature.
 *  - No session yet → routes to Quiz Entry to start one.
 *  - Fail state → archway + RESULTS NOT AVAILABLE + TRY AGAIN.
 *
 * Loading state: motif placeholder + spinner.
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

import { getReflectionRoomClient } from '@features/reflection-room/api';
import { ReflectionRoomApiError } from '@features/reflection-room/api/types';
import { LANDING } from '@features/reflection-room/copy/strings';
import { useJourney } from '@features/reflection-room/state/JourneyContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type ScreenStatus = 'loading' | 'active' | 'no_session' | 'error';

const ReflectionRoomLandingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const journey = useJourney();
  const [status, setStatus] = useState<ScreenStatus>('loading');

  const refresh = useCallback(async () => {
    setStatus('loading');
    if (!journey.sessionId || !journey.motif) {
      setStatus('no_session');
      return;
    }
    try {
      const snap = await getReflectionRoomClient().getSnapshot(journey.sessionId);
      journey.setSnapshot(snap);
      setStatus('active');
    } catch (err) {
      if (err instanceof ReflectionRoomApiError && err.code === 'SESSION_NOT_FOUND') {
        setStatus('no_session');
      } else {
        setStatus('error');
      }
    }
  }, [journey]);

  useFocusEffect(
    useCallback(() => {
      // First-time gate: route to Welcome before showing the landing.
      if (journey.welcomeChecked && !journey.welcomeSeen) {
        navigation.replace('ReflectionRoomWelcome');
        return;
      }
      void refresh();
    }, [journey.welcomeChecked, journey.welcomeSeen, navigation, refresh]),
  );

  // Re-run loading once welcomeChecked flips true.
  useEffect(() => {
    if (!journey.welcomeChecked) return;
    if (!journey.welcomeSeen) return;
    void refresh();
  }, [journey.welcomeChecked, journey.welcomeSeen, refresh]);

  if (status === 'loading' || !journey.welcomeChecked) {
    return <LandingLoading />;
  }

  if (status === 'error') {
    return <LandingFail onRetry={() => void refresh()} />;
  }

  if (status === 'no_session' || !journey.motif) {
    return <LandingNoSession onStart={() => navigation.navigate('ReflectionRoomQuizEntry')} />;
  }

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
          <Text style={styles.subhead}>{LANDING.subhead}</Text>

          <Pressable
            onPress={() => navigation.navigate('ReflectionRoomEchoSignature')}
            accessibilityRole="button"
            accessibilityLabel={`${journey.motif.motif_name} — view your current Echo Signature`}
            style={({ pressed }) => [
              styles.motifTouchable,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.motifGlyph}>
              <SvgXml
                xml={MOTIF_SVG[journey.motif.motif_id] || ''}
                width="100%"
                height="100%"
              />
            </View>
          </Pressable>

          <Text style={styles.tapHint}>{LANDING.motifTapHint}</Text>

          <View style={styles.ctaStack}>
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
            <Pressable
              onPress={() => navigation.navigate('ReflectionRoomMirrorMoment')}
              accessibilityRole="button"
              accessibilityLabel={LANDING.ctaMirrorMoment}
              style={({ pressed }) => [
                styles.ctaButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.ctaText}>{LANDING.ctaMirrorMoment}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default ReflectionRoomLandingScreen;

// ---------------------------------------------------------------------------
// Sub-views: loading / fail / no-session
// ---------------------------------------------------------------------------

const LandingLoading: React.FC = () => (
  <BackgroundWrapper style={styles.bg}>
    <SafeAreaView style={styles.safe}>
      <LogoHeader />
      <View style={styles.centerView}>
        <Text style={styles.eyebrow}>{LANDING.eyebrow}</Text>
        <View style={styles.motifSkeleton}>
          <ActivityIndicator size="large" color={palette.gold.DEFAULT} />
        </View>
      </View>
    </SafeAreaView>
  </BackgroundWrapper>
);

const LandingNoSession: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <BackgroundWrapper style={styles.bg}>
    <SafeAreaView style={styles.safe}>
      <LogoHeader />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>{LANDING.eyebrow}</Text>
        <Text style={styles.subhead}>{LANDING.subhead}</Text>
        <View style={styles.archStack} accessibilityElementsHidden>
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
        <Pressable
          onPress={onStart}
          accessibilityRole="button"
          accessibilityLabel="Begin reflection"
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.ctaText}>BEGIN REFLECTION</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  </BackgroundWrapper>
);

const LandingFail: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
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
          accessibilityLabel={LANDING.failHeader}
        >
          {LANDING.failHeader}
        </Text>
        <View style={styles.archStack} accessibilityElementsHidden>
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
        <Text style={styles.body}>{LANDING.failBody}</Text>
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={LANDING.failRetry}
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.ctaText}>{LANDING.failRetry}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  </BackgroundWrapper>
);

// ---------------------------------------------------------------------------
// Styles — every value flows through theme tokens
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: palette.navy.deep },
  safe: { flex: 1 },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.xxxl,
    gap: spacing.l,
    flexGrow: 1,
  },
  centerView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.l,
    gap: spacing.l,
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
  subhead: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    color: palette.gold.subtlest,
    textAlign: 'center',
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    color: palette.gold.subtlest,
    textAlign: 'center',
    width: 317,
  },
  motifTouchable: {
    alignSelf: 'center',
    marginVertical: spacing.l,
  },
  motifGlyph: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  motifSkeleton: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: borderWidth.thin,
    borderColor: 'rgba(242, 226, 177, 0.2)',
  },
  tapHint: {
    fontFamily: fontFamily.bodyItalic,
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    color: palette.gold.subtlest,
    textAlign: 'center',
    marginBottom: spacing.l,
  },
  ctaStack: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.s,
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
    letterSpacing: 1,
  },
  pressed: { opacity: 0.7 },
  archStack: {
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
});
