/**
 * Reflection Room — Mirror Moment (§6 + §12.10, Figma node 4654-3335).
 *
 * Renders 3 dynamically-generated buttons from the top-3 loops of the
 * cached `/echo/snapshot`. Each button label comes from the
 * (loop, tone) → label matrix (`labelFor`) per UI handoff §6.2.
 * **Hard rule: no hardcoded button labels anywhere.**
 *
 * Tap a button → navigate to the Practice Overlay screen (Phase 5)
 * with `surface = "mirror_moment"`, `selected_loop = loop.loop_id`,
 * and the loop's current `tone_state`.
 *
 * Info icon opens the reusable InfoOverlay with §12.10 overlays 1–3.
 *
 * States: loading | active | empty | error.
 */

import { getReflectionRoomClient } from '@features/reflection-room/api';
import { firePracticeExpand } from '@features/reflection-room/api/telemetry';
import {
  ReflectionRoomApiError,
  type LoopState,
} from '@features/reflection-room/api/types';
import InfoOverlay, {
  type InfoPage,
} from '@features/reflection-room/components/InfoOverlay';
import { MIRROR_MOMENT } from '@features/reflection-room/copy/strings';
import { useJourney } from '@features/reflection-room/state/JourneyContext';
import { labelFor } from '@features/reflection-room/utils/labelFor';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  fontFamily,
  fontSize,
  glassGradient,
  lineHeight,
  palette,
  radius,
  spacing,
  textShadow,
} from '@theme';
import type { RootStackParamList } from '@types';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
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

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';


type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type Status = 'loading' | 'active' | 'empty' | 'error';

const { width: screenWidth } = Dimensions.get('window');

// Figma choice-button width (node 7128:8147 — 240px content column).
const CHOICE_WIDTH = 240;
// Figma divider width (node 7128:8151 — 227px line).
const DIVIDER_WIDTH = 227;

// Decorative wave from the existing screen — gold serif gradient SVG.
// Preserved verbatim from prior implementation; visual reference only.
const WAVE_SVG = `<svg width="345" height="161" viewBox="0 0 345 161" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 138.379C11.8463 139.798 24.4967 139.249 35.2048 130.353C37.9302 128.097 40.5302 125.159 42.7125 121.721C43.6367 120.432 44.4198 118.947 45.1403 117.405C47.26 112.563 48.5287 106.942 50.0166 101.51L61.8316 57.2224C65.9614 42.4436 69.5221 27.3037 75.4949 13.9281C78.6431 7.1172 83.3941 2.22649 88.7091 0.765835C96.5248 -1.58105 105.103 1.43872 110.929 10.2026C123.428 29.1172 126.404 62.5563 131.625 87.5761C133.954 98.695 136.277 110.298 141.55 118.767C145.027 124.347 149.862 126.152 154.707 124.347C155.934 123.977 157.197 123.534 158.518 123.239C162.544 122.164 166.767 124.035 170.109 127.67C174.609 132.315 177.152 140.258 179.12 147.734C180.112 151.024 180.854 154.807 182.801 156.883C186.821 160.289 191.045 149.924 193.123 145.452C201.941 125.553 211.84 87.8879 228.907 84.6958C234.264 83.8506 239.829 86.1482 243.964 91.5231C249.143 97.9811 252.135 107.582 254.652 116.879C257.46 125.61 263.673 129.73 269.322 132.585C274.126 134.899 279.127 136.171 284.108 137.222C304.235 141.399 324.758 140.077 345 138.371C321.61 141.522 282.521 147.545 261.449 131.158C257.915 128.22 254.547 124.117 252.772 118.315C252.187 116.387 251.749 114.59 251.211 112.793C249.175 105.752 246.502 98.9412 242.664 94.0915C238.89 89.1844 233.909 87.2232 229.126 87.9617C216.946 90.3579 208.994 111.767 202.928 126.825C200.27 133.628 197.748 140.594 194.851 147.307C192.084 153.387 187.369 164.449 181.736 159.706C179.324 157.326 178.311 152.846 177.209 149.038C174.614 138.896 171.158 129.869 164.094 126.841C161.108 125.586 158.283 126.529 155.114 127.563C147.909 130.189 141.723 125.783 137.509 116.338C124.76 87.4858 125.558 29.9706 106.664 9.04559C99.7879 1.80798 89.4557 1.20075 82.4074 8.06909C76.1475 14.6338 73.1454 26.1467 69.8823 36.5518C63.7686 57.5014 57.7541 81.6104 51.9693 102.806C49.8235 110.093 47.8813 118.225 43.8455 123.551C42.0077 126.308 39.7366 128.77 37.5438 130.764C26.1883 140.611 12.5825 140.758 0.0156628 138.371L0 138.379Z" fill="${palette.gold.warm}"/>
</svg>`;

// Circled-i info glyph (Figma node 7869:4467 — gold outline circle + "i").
// Self-contained SVG so it scales crisply and tints via the gold token.
const INFO_ICON_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="12" cy="12" r="10.5" stroke="${palette.gold.DEFAULT}" stroke-width="1"/>
<circle cx="12" cy="7.6" r="1.1" fill="${palette.gold.DEFAULT}"/>
<rect x="11" y="10.4" width="2" height="7" rx="1" fill="${palette.gold.DEFAULT}"/>
</svg>`;

// Loading sparkle row (Figma node 7128:9534 — four small gold glyphs).
// Rendered as a self-contained SVG to avoid raster/hash-named assets.
const LOADING_SPARKLES_SVG = `<svg width="90" height="12" viewBox="0 0 90 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6 0 L7.3 4.7 L12 6 L7.3 7.3 L6 12 L4.7 7.3 L0 6 L4.7 4.7 Z" fill="${palette.gold.DEFAULT}" opacity="0.9"/>
<path d="M32 1 L33 5 L37 6 L33 7 L32 11 L31 7 L27 6 L31 5 Z" fill="${palette.gold.warm}" opacity="0.8"/>
<path d="M58 1 L59 5 L63 6 L59 7 L58 11 L57 7 L53 6 L57 5 Z" fill="${palette.gold.warm}" opacity="0.8"/>
<path d="M84 0 L85.3 4.7 L90 6 L85.3 7.3 L84 12 L82.7 7.3 L78 6 L82.7 4.7 Z" fill="${palette.gold.DEFAULT}" opacity="0.9"/>
</svg>`;

// §12.10 info overlay pages.
const INFO_PAGES: InfoPage[] = [
  {
    header: MIRROR_MOMENT.infoOverlay1.header,
    body: MIRROR_MOMENT.infoOverlay1.body,
  },
  {
    header: MIRROR_MOMENT.infoOverlay2.header,
    body: MIRROR_MOMENT.infoOverlay2.body,
  },
  {
    header: MIRROR_MOMENT.infoOverlay3.header,
    body: MIRROR_MOMENT.infoOverlay3.body,
  },
];

const ReflectionRoomMirrorMomentScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  // Stable destructure — see Landing/EchoSignature for the rationale.
  const { sessionId, snapshot, setSnapshot } = useJourney();
  const [status, setStatus] = useState<Status>(
    snapshot ? 'active' : 'loading',
  );
  const [showInfo, setShowInfo] = useState(false);

  const fetchSnapshot = useCallback(async () => {
    if (!sessionId) {
      setStatus('error');
      return;
    }
    setStatus('loading');
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

  useEffect(() => {
    if (!snapshot && status === 'loading') {
      void fetchSnapshot();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onButtonTap = (loop: LoopState) => {
    firePracticeExpand(loop.loop_id, 'mirror_moment');
    navigation.navigate('ReflectionRoomPracticeOverlay', {
      loopId: loop.loop_id,
      toneState: loop.tone_state,
      surface: 'mirror_moment',
    });
  };

  const top3 = (snapshot?.loops ?? []).slice(0, 3);

  return (
    <BackgroundWrapper style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Title row — back arrow + centered heading (Figma 7128:8137) */}
          <View style={styles.titleRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel={MIRROR_MOMENT.backNav}
              hitSlop={8}
              style={styles.iconButton}
            >
              <Image
                source={require('@assets/back-arrow.png')}
                style={styles.backIcon}
                resizeMode="contain"
              />
            </Pressable>
            <Text
              style={styles.eyebrow}
              accessibilityRole="header"
              accessibilityLabel={MIRROR_MOMENT.eyebrow}
            >
              {MIRROR_MOMENT.eyebrow}
            </Text>
            <View style={styles.iconButton} />
          </View>

          {status === 'active' && top3.length > 0 && (
            <>
              {/* Circled-i info button, right-aligned above the wave
                  (Figma 7128:8144 / 7869:4467). */}
              <View style={styles.infoRow}>
                <Pressable
                  onPress={() => setShowInfo(true)}
                  accessibilityRole="button"
                  accessibilityLabel="About Mirror Moment"
                  hitSlop={8}
                  style={styles.iconButton}
                >
                  <SvgXml xml={INFO_ICON_SVG} width={24} height={24} />
                </Pressable>
              </View>

              {/* Decorative wave — preserved from prior visual */}
              <View style={styles.waveContainer} accessibilityElementsHidden>
                <SvgXml
                  xml={WAVE_SVG}
                  width={Math.min(345, screenWidth * 0.88)}
                  height={160}
                />
              </View>

              <Text style={styles.subhead}>{MIRROR_MOMENT.subhead}</Text>

              <View style={styles.choices}>
                {top3.map(loop => {
                  const label = labelFor(loop.loop_id, loop.tone_state);
                  return (
                    <Pressable
                      key={loop.loop_id}
                      onPress={() => onButtonTap(loop)}
                      accessibilityRole="button"
                      accessibilityLabel={label}
                      style={({ pressed }) => [
                        styles.choiceShadow,
                        pressed && styles.pressed,
                      ]}
                    >
                      <LinearGradient
                        colors={[
                          glassGradient.echoPrimary.start,
                          glassGradient.echoPrimary.end,
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.choiceButton}
                      >
                        <Text style={styles.ctaText}>{label}</Text>
                      </LinearGradient>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.divider} />

              <Pressable
                onPress={() => navigation.navigate('ReflectionRoomCore')}
                accessibilityRole="button"
                accessibilityLabel="Continue to Reflection Room"
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                <LinearGradient
                  colors={[
                    glassGradient.echoSecondary.start,
                    glassGradient.echoSecondary.end,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.continueButton}
                >
                  <Text style={[styles.ctaText, styles.continueText]}>
                    CONTINUE
                  </Text>
                </LinearGradient>
              </Pressable>
            </>
          )}

          {status === 'loading' && (
            <View style={styles.centeredState}>
              <Text style={styles.stateHeader}>
                {MIRROR_MOMENT.loadingHeader}
              </Text>
              <View style={styles.sparkleRow} accessibilityElementsHidden>
                <SvgXml xml={LOADING_SPARKLES_SVG} width={90} height={12} />
              </View>
              <Text style={styles.stateBody}>{MIRROR_MOMENT.loadingBody}</Text>
            </View>
          )}

          {status === 'error' && (
            <View style={styles.centeredState}>
              <Text style={styles.stateHeader}>
                {MIRROR_MOMENT.errorHeader}
              </Text>
              <Text style={styles.stateBody}>{MIRROR_MOMENT.errorBody}</Text>
              <Pressable
                onPress={() => void fetchSnapshot()}
                accessibilityRole="button"
                accessibilityLabel="Try again"
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                <LinearGradient
                  colors={[
                    glassGradient.echoSecondary.start,
                    glassGradient.echoSecondary.end,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.retryButton}
                >
                  <Text style={styles.ctaText}>TRY AGAIN</Text>
                </LinearGradient>
              </Pressable>
            </View>
          )}

          {status === 'empty' && (
            <View style={styles.centeredState}>
              <Text style={styles.stateBody}>{MIRROR_MOMENT.emptyBody}</Text>
            </View>
          )}
        </ScrollView>

        {showInfo && (
          <InfoOverlay
            pages={INFO_PAGES}
            onDismiss={() => setShowInfo(false)}
          />
        )}
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default ReflectionRoomMirrorMomentScreen;

const ICON_BUTTON_SIZE = 24;

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.xxxl,
    gap: spacing.xxxl,
    flexGrow: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.s,
  },
  iconButton: {
    width: ICON_BUTTON_SIZE,
    height: ICON_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { width: 24, height: 24, tintColor: palette.gold.DEFAULT },
  eyebrow: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['2xl'],
    lineHeight: lineHeight.xl,
    color: palette.gold.DEFAULT,
    letterSpacing: 2,
    textAlign: 'center',
    flex: 1,
    textShadowColor: textShadow.glow.color,
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: textShadow.glow.radius,
  },
  // Info button sits right-aligned just above the wave (Figma 7128:8144).
  infoRow: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: -spacing.s,
  },
  waveContainer: {
    alignItems: 'center',
  },
  subhead: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    color: palette.gold.subtlest,
    textAlign: 'center',
    paddingHorizontal: spacing.s,
  },
  choices: {
    width: CHOICE_WIDTH,
    alignSelf: 'center',
    gap: spacing.m,
  },
  // Wrapper carries the gold glow drop-shadow (Figma "Text Button Selected"
  // — #F2E2B140, radius 16). Gradient fill lives on the inner LinearGradient.
  choiceShadow: {
    borderRadius: radius.m,
    shadowColor: palette.gold.DEFAULT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  choiceButton: {
    width: '100%',
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: radius.m,
    borderWidth: 0.5,
    borderColor: palette.navy.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xl,
    lineHeight: fontSize['2xl'],
    color: palette.gold.DEFAULT,
    letterSpacing: 2,
    textAlign: 'center',
  },
  divider: {
    width: DIVIDER_WIDTH,
    height: StyleSheet.hairlineWidth,
    alignSelf: 'center',
    backgroundColor: palette.navy.light,
  },
  // Transparent CTA with the tr corner slightly rounder (Figma 7128:8152).
  continueButton: {
    alignSelf: 'center',
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: radius.s,
    borderTopRightRadius: radius.m,
    borderWidth: 0.5,
    borderColor: palette.navy.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    textShadowColor: textShadow.glow.color,
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: 15,
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxxl,
    paddingHorizontal: spacing.s,
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
    paddingHorizontal: spacing.s,
  },
  sparkleRow: { alignItems: 'center' },
  retryButton: {
    alignSelf: 'center',
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.s,
    borderWidth: 0.5,
    borderColor: palette.navy.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});
