/**
 * Reflection Room — Echo Map (§5 + §12.9, Figma nodes 7128:2411 / 7128:2795 /
 * 7128:3134).
 *
 * Visualizes the cached `/echo/snapshot` as 6 loop nodes arranged around a
 * concentric-ring field with a glowing "YOU" center (baked into ECHO_MAP_SVG):
 *   - Each loop sits in a fixed Figma slot (top / right / bottom-right / …).
 *   - Tone-state drives a soft colored glow (rising=amber, softening=aqua,
 *     steady=lavender) per UI handoff §5.1.
 *   - `intensity_score` remains available on the loop payload for overlays.
 *
 * Tap a node → 5-element overlay (§12.9).
 * Tap "i"    → 2-page info overlay (§12.9 overlays 1 + 2).
 *
 * States (each matched to its Figma frame):
 *   - loading → 7128:3134 "Echo Map Loading" (title + dimmed icon-only field).
 *   - active  → 7128:2411 "Echo Map" (labeled nodes + footer + CTA).
 *   - empty   → canonical §12.9 strings, centered.
 *   - error   → 7128:2795 "Echo Map - error" (heading + body + retry).
 *
 * Reduced motion: respected via `useReflectionRoomPrefs().reduced_motion`.
 * V1 ships with no orbit animation regardless — Phase 9 may add a subtle
 * 10s pulse for the prefers-motion case.
 */

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import {
  CONNECTING_LINES_SVG,
  ECHO_MAP_SVG,
} from '@assets/reflection-room-ech0-map-assets/ReflectionRoomEchoMapAssets';
import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
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
import { ECHO_MAP, LANDING, displayLoopName } from '@features/reflection-room/copy/strings';
import { useJourney } from '@features/reflection-room/state/JourneyContext';
import type { LoopId } from '@features/reflection-room/types/ids';
import {
  borderWidth,
  fontFamily,
  fontSize,
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
type Status = 'loading' | 'active' | 'empty' | 'error';

const { width: screenWidth } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Layout — the field is a fixed 345 × 452 canvas (Figma "Group 142"). The
// concentric-ring SVG (272 × 272, "YOU" baked in) is centered, connecting
// lines overlay the full canvas, and each loop occupies a fixed 100 × 100
// slot. We scale the whole canvas to the device width so proportions hold.
// ---------------------------------------------------------------------------

const FIELD_W = 345;
const FIELD_H = 452;
const FIELD_SCALE = Math.min((screenWidth - scale(48)) / FIELD_W, 1);

const RING_SIZE = 272; // Figma "Frame 594" — ECHO_MAP_SVG native viewBox.
const RING_LEFT = 37; // Figma "Group 141" x within the 345-wide field.
const RING_TOP = 66; // Figma "Group 141" y within the 452-tall field.

const NODE_SIZE = 100; // Figma node frame (100 × 100 / 100 × 98).
const NODE_ICON = 48; // Figma icon glyph box inside a node.

/** Loop_id → fixed top-left offset of its 100 × 100 slot in the field. */
const NODE_SLOT: Record<LoopId, { left: number; top: number }> = {
  self_silencing: { left: 12, top: 14 }, // top-left
  overwhelm: { left: 123, top: 0 }, // top-center
  pressure: { left: 243, top: 82 }, // right
  agency: { left: 245, top: 312 }, // bottom-right
  transition: { left: 117, top: 352 }, // bottom-center
  grief: { left: 0, top: 284 }, // bottom-left
};

/** Stable render order (matches Figma z-order top→bottom). */
const LOOP_RENDER_ORDER: LoopId[] = [
  'self_silencing',
  'overwhelm',
  'pressure',
  'agency',
  'transition',
  'grief',
];

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
// Field — shared ring + connecting-lines backdrop.
// ---------------------------------------------------------------------------

const RingField: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <View
    style={styles.field}
    accessibilityRole="image"
    accessibilityLabel="Echo map field with loop nodes"
  >
    <View style={styles.fieldInner}>
      <SvgXml
        xml={CONNECTING_LINES_SVG}
        width={FIELD_W}
        height={FIELD_H}
        style={styles.lines}
      />
      <SvgXml
        xml={ECHO_MAP_SVG}
        width={RING_SIZE}
        height={RING_SIZE}
        style={styles.ring}
      />
      {children}
    </View>
  </View>
);

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const ReflectionRoomEchoMapScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  // Stable destructure — see Landing/EchoSignature for the rationale.
  const { sessionId, snapshot, setSnapshot } = useJourney();
  const [status, setStatus] = useState<Status>(
    snapshot ? 'active' : 'loading',
  );
  const [selectedLoop, setSelectedLoop] = useState<LoopState | null>(null);
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

  const loops = status === 'active' && snapshot ? snapshot.loops : [];
  const loopById = new Map(loops.map(l => [l.loop_id, l]));

  // -------------------------------------------------------------------------
  // Error — Figma 7128:2795. Centered heading + body + retry, no title row.
  // -------------------------------------------------------------------------
  if (status === 'error') {
    return (
      <BackgroundWrapper style={styles.bg}>
        <SafeAreaView style={styles.safe}>
          <LogoHeader />
          <View style={styles.centeredState}>
            <Text style={styles.stateHeader}>{ECHO_MAP.errorHeader}</Text>
            <Text style={styles.stateBody}>{ECHO_MAP.errorBody}</Text>
            <Pressable
              onPress={() => void fetchSnapshot()}
              accessibilityRole="button"
              accessibilityLabel={LANDING.failRetry}
              style={({ pressed }) => [
                styles.button,
                styles.stateButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.buttonText}>{LANDING.failRetry}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </BackgroundWrapper>
    );
  }

  // -------------------------------------------------------------------------
  // Loading — Figma 7128:3134. Title above a dimmed, icon-only ring field.
  // -------------------------------------------------------------------------
  if (status === 'loading') {
    return (
      <BackgroundWrapper style={styles.bg}>
        <SafeAreaView style={styles.safe}>
          <LogoHeader />
          <View style={styles.loadingWrap}>
            <Text
              style={styles.loadingHeader}
              accessibilityRole="header"
              accessibilityLabel={ECHO_MAP.loadingHeader}
            >
              {ECHO_MAP.loadingHeader}
            </Text>
            <RingField>
              {LOOP_RENDER_ORDER.map(loopId => {
                const slot = NODE_SLOT[loopId];
                return (
                  <View
                    key={loopId}
                    style={[
                      styles.node,
                      styles.nodeLoading,
                      { left: slot.left, top: slot.top },
                    ]}
                  >
                    <SvgXml
                      xml={loopNodeXml(loopId)}
                      width={NODE_ICON}
                      height={NODE_ICON}
                    />
                  </View>
                );
              })}
            </RingField>
          </View>
        </SafeAreaView>
      </BackgroundWrapper>
    );
  }

  // -------------------------------------------------------------------------
  // Active + empty — Figma 7128:2411 (title row + field + footer + CTA).
  // -------------------------------------------------------------------------
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
              style={styles.iconButton}
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
              style={styles.iconButton}
            >
              <Image
                source={require('@assets/rr-info-icon.png')}
                style={styles.iconImg}
                resizeMode="contain"
              />
            </Pressable>
          </View>

          <Text style={styles.subhead}>{ECHO_MAP.subhead}</Text>

          {status === 'empty' ? (
            <View style={styles.centeredState}>
              <Text style={styles.stateHeader}>{ECHO_MAP.emptyHeader}</Text>
              <Text style={styles.stateBody}>{ECHO_MAP.emptyBody}</Text>
            </View>
          ) : (
            <RingField>
              {LOOP_RENDER_ORDER.map(loopId => {
                const loop = loopById.get(loopId);
                if (!loop) return null;
                const slot = NODE_SLOT[loopId];
                const glow = toneColor(loop.tone_state);
                return (
                  <Pressable
                    key={loopId}
                    onPress={() => setSelectedLoop(loop)}
                    accessibilityRole="button"
                    accessibilityLabel={`${loop.loop_id} ${loop.tone_state}, intensity ${loop.intensity_label}`}
                    hitSlop={4}
                    style={({ pressed }) => [
                      styles.node,
                      {
                        left: slot.left,
                        top: slot.top,
                        borderColor: `${glow}66`, // tone tint on the ring edge
                        shadowColor: glow,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <SvgXml
                      xml={loopNodeXml(loop.loop_id)}
                      width={NODE_ICON}
                      height={NODE_ICON}
                    />
                    <Text style={styles.nodeLabel} numberOfLines={2}>
                      {displayLoopName(loop.loop_id)}
                    </Text>
                  </Pressable>
                );
              })}
            </RingField>
          )}

          {/* Footer fixed string */}
          <Text style={styles.footer}>{ECHO_MAP.footer}</Text>

          {status === 'active' && (
            <Pressable
              onPress={() => navigation.navigate('ReflectionRoomMirrorMoment')}
              accessibilityRole="button"
              accessibilityLabel={LANDING.ctaMirrorMoment}
              style={({ pressed }) => [
                styles.button,
                styles.bottomCta,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.buttonText}>{LANDING.ctaMirrorMoment}</Text>
            </Pressable>
          )}
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

const ICON_BTN = scale(24);

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: scale(24),
    paddingBottom: verticalScale(40),
    gap: verticalScale(spacing.m),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: verticalScale(spacing.m),
  },
  iconButton: {
    width: ICON_BTN,
    height: ICON_BTN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImg: {
    width: ICON_BTN,
    height: ICON_BTN,
    tintColor: palette.gold.DEFAULT,
  },
  eyebrow: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['2xl'],
    lineHeight: lineHeight.xl,
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
  // --- Field ---------------------------------------------------------------
  field: {
    width: FIELD_W * FIELD_SCALE,
    height: FIELD_H * FIELD_SCALE,
    alignSelf: 'center',
  },
  fieldInner: {
    width: FIELD_W,
    height: FIELD_H,
    transform: [{ scale: FIELD_SCALE }],
    transformOrigin: 'top left',
  },
  lines: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  ring: {
    position: 'absolute',
    left: RING_LEFT,
    top: RING_TOP,
  },
  node: {
    position: 'absolute',
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
    alignItems: 'center',
    justifyContent: 'center',
    gap: verticalScale(spacing.xxs),
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    shadowOpacity: 0.5,
  },
  nodeLoading: {
    opacity: 0.55,
    borderColor: `${palette.gold.active}55`,
  },
  nodeLabel: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    color: palette.gold.subtlest,
    textAlign: 'center',
  },
  // --- Loading -------------------------------------------------------------
  loadingWrap: {
    flex: 1,
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(spacing.xxl),
    gap: verticalScale(spacing.xl),
    alignItems: 'center',
  },
  loadingHeader: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['2xl'],
    lineHeight: lineHeight.xl,
    color: palette.gold.DEFAULT,
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: textShadow.glow.color,
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: textShadow.glow.radius,
  },
  // --- Centered states (empty / error) -------------------------------------
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: verticalScale(spacing.xl),
    paddingHorizontal: scale(24),
    minHeight: verticalScale(320),
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
  stateButton: {
    marginTop: verticalScale(spacing.s),
  },
  // --- Footer + CTA --------------------------------------------------------
  footer: {
    fontFamily: fontFamily.bodyItalic,
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    color: palette.gold.subtlest,
    textAlign: 'center',
    paddingHorizontal: scale(spacing.s),
  },
  button: {
    minWidth: scale(159),
    paddingVertical: verticalScale(spacing.s),
    paddingHorizontal: scale(spacing.xl),
    borderRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.l,
    color: palette.gold.DEFAULT,
    letterSpacing: moderateScale(2),
    textAlign: 'center',
  },
  bottomCta: {
    alignSelf: 'center',
  },
  pressed: { opacity: 0.7 },
});
