/**
 * Per-loop tap overlay for the Echo Map (UI handoff §5.4 + §12.9).
 *
 * Renders the canonical 5 elements:
 *   1. Loop name (Title-case)
 *   2. Tone state ("Rising"/"Steady"/"Softening" — no leading "- ")
 *   3. Reflection line
 *   4. INTENSITY label ("HIGH INTENSITY"/"MEDIUM INTENSITY"/"LOW INTENSITY")
 *   5. "click anywhere to continue"
 *
 * Tapping anywhere in the overlay fires onDismiss.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import GlassCard from '@components/_internal/GlassCard';
import {
  fontFamily,
  fontSize,
  lineHeight,
  modalColors,
  palette,
  radius,
  spacing,
  textShadow,
} from '@theme';

import {
  displayLoopName,
  ECHO_MAP,
  intensityMapLabel,
  toneMapLabel,
} from '../copy/strings';
import type { LoopState } from '../api/types';

interface LoopOverlayProps {
  loop: LoopState;
  onDismiss: () => void;
}

const LoopOverlay: React.FC<LoopOverlayProps> = ({ loop, onDismiss }) => {
  const name = displayLoopName(loop.loop_id);
  const tone = toneMapLabel(loop.tone_state);
  const intensity = intensityMapLabel(loop.intensity_label);
  const reflection = loop.reflection_line ?? '';

  return (
    <Pressable
      style={styles.scrim}
      onPress={onDismiss}
      accessibilityRole="button"
      accessibilityLabel={`${name} ${tone}, ${intensity}. ${reflection}. Tap anywhere to continue.`}
    >
      <Pressable onPress={onDismiss}>
        <GlassCard
          padding={spacing.l}
          borderRadius={radius.m}
          style={styles.card}
        >
          <Text style={styles.loopName}>{name}</Text>
          <Text style={styles.tone}>{tone}</Text>
          {reflection !== '' && (
            <Text style={styles.reflection}>{reflection}</Text>
          )}
          <Text style={styles.intensity}>{intensity}</Text>
          <Text style={styles.footer}>{ECHO_MAP.tapOverlayContinue}</Text>
        </GlassCard>
      </Pressable>
    </Pressable>
  );
};

export default LoopOverlay;

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: modalColors.backdrop,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    zIndex: 50,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: spacing.s,
  },
  loopName: {
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
  tone: {
    fontFamily: fontFamily.headingItalic,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.l,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
  },
  reflection: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    color: palette.gold.subtlest,
    textAlign: 'center',
    paddingHorizontal: spacing.s,
  },
  intensity: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    color: palette.gold.DEFAULT,
    letterSpacing: 2,
    textAlign: 'center',
  },
  footer: {
    fontFamily: fontFamily.bodyItalic,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.s,
    color: palette.gold.subtlest,
    textAlign: 'center',
    marginTop: spacing.s,
  },
});
