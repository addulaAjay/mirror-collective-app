/**
 * Reflection Room — Echo Map (§5 + §12.9, Figma node 4654-2881).
 *
 * Visualizes the cached `/echo/snapshot` as 6 loop nodes around a ring:
 *   - Each loop has a fixed angular slot.
 *   - Distance from center scales with `intensity_score` (closer = higher).
 *   - Tone-state drives a colored halo (rising=amber, softening=aqua,
 *     steady=lavender) per UI handoff §5.1.
 *
 * Tap a node → 5-element overlay (§12.9).
 * Tap "i"    → 2-page info overlay (§12.9 overlays 1 + 2).
 *
 * States: loading | active | empty | error.
 *
 * Reduced motion: respected via `useReflectionRoomPrefs().reduced_motion`.
 * V1 ships with no orbit animation regardless — Phase 9 may add a subtle
 * 10s pulse for the prefers-motion case.
 */

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import {
  ECHO_MAP_SVG,
} from '@assets/reflection-room-ech0-map-assets/ReflectionRoomEchoMapAssets';
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
import {
  ReflectionRoomApiError,
  type LoopState,
} from '@features/reflection-room/api/types';
import InfoOverlay, {
  type InfoPage,
} from '@features/reflection-room/components/InfoOverlay';
import { loopNodeXml } from '@features/reflection-room/components/loopNodeIcons';
import LoopOverlay from '@features/reflection-room/components/LoopOverlay';
import { toneColor } from '@features/reflection-room/components/toneColors';
import { ECHO_MAP, LANDING } from '@features/reflection-room/copy/strings';
import { useJourney } from '@features/reflection-room/state/JourneyContext';
import type { LoopId } from '@features/reflection-room/types/ids';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type Status = 'loading' | 'active' | 'empty' | 'error';

const { width: screenWidth } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Layout — fixed angular slots per loop. Center of ring is the geometric
// center of the map; radius scales with `intensity_score`.
// ---------------------------------------------------------------------------

const FIELD_WIDTH = Math.min(screenWidth - 40, 345);
const FIELD_HEIGHT = 452; // matches existing assets pack viewBox
const CENTER_X = FIELD_WIDTH / 2;
const CENTER_Y = FIELD_HEIGHT / 2;
const NODE_SIZE = 90;
const HALO_SIZE = 110;
const RING_RENDER_SIZE = 280;
const MAX_RADIUS = 150;
const MIN_RADIUS = 30;

/** Loop_id → fixed angular slot (radians, RN screen coords: y+ = down). */
const LOOP_ANGLE: Record<LoopId, number> = {
  transition: -Math.PI / 2, // top
  pressure: -Math.PI / 6, // top-right
  grief: Math.PI / 3, // bottom-right
  overwhelm: Math.PI / 2, // bottom
  agency: (2 * Math.PI) / 3, // bottom-left
  self_silencing: -(5 * Math.PI) / 6, // top-left
};

interface NodeLayout {
  loop: LoopState;
  x: number;
  y: number;
}

function nodePositions(loops: LoopState[]): NodeLayout[] {
  return loops.map(loop => {
    const angle = LOOP_ANGLE[loop.loop_id];
    const radius =
      MAX_RADIUS - loop.intensity_score * (MAX_RADIUS - MIN_RADIUS);
    return {
      loop,
      x: CENTER_X + radius * Math.cos(angle),
      y: CENTER_Y + radius * Math.sin(angle),
    };
  });
}

// ---------------------------------------------------------------------------
// Info overlay pages (§12.9)
// ---------------------------------------------------------------------------

const INFO_PAGES: InfoPage[] = [
  {
    header: ECHO_MAP.infoOverlay1.header,
    body: ECHO_MAP.infoOverlay1.body,
    footer: ECHO_MAP.infoOverlay1.footer,
  },
  {
    header: ECHO_MAP.infoOverlay2.header,
    subhead: ECHO_MAP.infoOverlay2.subhead,
    body: ECHO_MAP.infoOverlay2.body,
    footer: ECHO_MAP.infoOverlay2.footer,
  },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const ReflectionRoomEchoMapScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const journey = useJourney();
  const [status, setStatus] = useState<Status>(
    journey.snapshot ? 'active' : 'loading',
  );
  const [selectedLoop, setSelectedLoop] = useState<LoopState | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const fetchSnapshot = useCallback(async () => {
    if (!journey.sessionId) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      const snap = await getReflectionRoomClient().getSnapshot(
        journey.sessionId,
      );
      journey.setSnapshot(snap);
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
  }, [journey]);

  useFocusEffect(
    useCallback(() => {
      if (journey.snapshot) {
        setStatus(journey.snapshot.loops.length === 0 ? 'empty' : 'active');
        return;
      }
      void fetchSnapshot();
    }, [fetchSnapshot, journey.snapshot]),
  );

  useEffect(() => {
    if (!journey.snapshot && status === 'loading') {
      void fetchSnapshot();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const layout =
    status === 'active' && journey.snapshot
      ? nodePositions(journey.snapshot.loops)
      : [];

  return (
    <BackgroundWrapper style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Title row: back arrow, title, info icon */}
          <View style={styles.titleRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={8}
              style={styles.backButton}
            >
              <Image
                source={require('@assets/back-arrow.png')}
                style={styles.iconImg}
                resizeMode="contain"
              />
            </Pressable>
            <Text
              style={styles.eyebrow}
              accessibilityRole="header"
              accessibilityLabel={ECHO_MAP.eyebrow}
            >
              {ECHO_MAP.eyebrow}
            </Text>
            <Pressable
              onPress={() => setShowInfo(true)}
              accessibilityRole="button"
              accessibilityLabel="About the Echo Map"
              hitSlop={8}
              style={styles.infoButton}
            >
              <Image
                source={require('@assets/rr-info-icon.png')}
                style={styles.iconImg}
                resizeMode="contain"
              />
            </Pressable>
          </View>

          <Text style={styles.subhead}>{ECHO_MAP.subhead}</Text>

          {/* Field */}
          <View
            style={styles.field}
            accessibilityRole="image"
            accessibilityLabel="Echo map field with loop nodes"
          >
            <SvgXml
              xml={ECHO_MAP_SVG}
              width={RING_RENDER_SIZE}
              height={RING_RENDER_SIZE}
              style={[
                styles.ring,
                { left: CENTER_X - RING_RENDER_SIZE / 2, top: CENTER_Y - RING_RENDER_SIZE / 2 },
              ]}
            />

            {status === 'loading' && (
              <View style={styles.fieldOverlay}>
                <Text style={styles.stateHeader}>{ECHO_MAP.loadingHeader}</Text>
                <ActivityIndicator
                  size="large"
                  color={palette.gold.DEFAULT}
                  style={styles.spinner}
                />
              </View>
            )}

            {status === 'error' && (
              <View style={styles.fieldOverlay}>
                <Text style={styles.stateHeader}>{ECHO_MAP.errorHeader}</Text>
                <Text style={styles.stateBody}>{ECHO_MAP.errorBody}</Text>
                <Pressable
                  onPress={() => void fetchSnapshot()}
                  accessibilityRole="button"
                  accessibilityLabel={LANDING.failRetry}
                  style={({ pressed }) => [
                    styles.button,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.buttonText}>{LANDING.failRetry}</Text>
                </Pressable>
              </View>
            )}

            {status === 'empty' && (
              <View style={styles.fieldOverlay}>
                <Text style={styles.stateHeader}>{ECHO_MAP.emptyHeader}</Text>
                <Text style={styles.stateBody}>{ECHO_MAP.emptyBody}</Text>
              </View>
            )}

            {status === 'active' &&
              layout.map(({ loop, x, y }) => (
                <Pressable
                  key={loop.loop_id}
                  onPress={() => setSelectedLoop(loop)}
                  accessibilityRole="button"
                  accessibilityLabel={`${loop.loop_id} ${loop.tone_state}, intensity ${loop.intensity_label}`}
                  hitSlop={8}
                  style={[
                    styles.nodeWrap,
                    {
                      left: x - HALO_SIZE / 2,
                      top: y - HALO_SIZE / 2,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.halo,
                      {
                        backgroundColor: `${toneColor(loop.tone_state)}33`, // 20% opacity
                        borderColor: toneColor(loop.tone_state),
                      },
                    ]}
                  >
                    <SvgXml
                      xml={loopNodeXml(loop.loop_id)}
                      width={NODE_SIZE}
                      height={NODE_SIZE}
                    />
                  </View>
                </Pressable>
              ))}
          </View>

          {/* Footer fixed string */}
          <Text style={styles.footer}>{ECHO_MAP.footer}</Text>
        </ScrollView>

        {/* Tap overlays — modal-style, last-mounted-on-top */}
        {selectedLoop && (
          <LoopOverlay
            loop={selectedLoop}
            onDismiss={() => setSelectedLoop(null)}
          />
        )}
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

export default ReflectionRoomEchoMapScreen;

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
    gap: spacing.m,
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
  infoButton: {
    width: BACK_SIZE,
    height: BACK_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImg: { width: 20, height: 20, tintColor: palette.gold.DEFAULT },
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
    textAlign: 'center',
  },
  field: {
    width: FIELD_WIDTH,
    height: FIELD_HEIGHT,
    alignSelf: 'center',
    position: 'relative',
  },
  ring: {
    position: 'absolute',
  },
  fieldOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    paddingHorizontal: spacing.l,
  },
  stateHeader: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['2xl'],
    lineHeight: lineHeight.xl,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    letterSpacing: 1,
  },
  stateBody: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    color: palette.gold.subtlest,
    textAlign: 'center',
  },
  spinner: { marginVertical: spacing.s },
  nodeWrap: {
    position: 'absolute',
    width: HALO_SIZE,
    height: HALO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    width: HALO_SIZE,
    height: HALO_SIZE,
    borderRadius: HALO_SIZE / 2,
    borderWidth: borderWidth.regular,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    fontFamily: fontFamily.bodyItalic,
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    color: palette.gold.subtlest,
    textAlign: 'center',
    paddingHorizontal: spacing.s,
  },
  button: {
    minWidth: 200,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xl,
    color: palette.gold.DEFAULT,
    letterSpacing: 2,
  },
  pressed: { opacity: 0.7 },
});
