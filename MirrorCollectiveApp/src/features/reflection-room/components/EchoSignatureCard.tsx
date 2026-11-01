/**
 * Reusable Echo Signature card.
 *
 * One per top-3 loop, per UI handoff §4.1 + §12.8 + Figma node 7128-6439
 * (nodes 7938:2850 / 7938:2858 / 7938:2867 — the tone-coloured cards).
 *
 * Card layout (matches Figma):
 *   ┃ [icon]  LOOP_NAME - Tone
 *   ┃         reflection line (italic)
 *
 * The left edge carries a 2px tone-coloured accent border (rising = gold,
 * steady = lavender, softening = aqua). The card fill is a vertical
 * transparent-white glass gradient. Fixed height (120px) with the content
 * vertically centred, matching the Figma frame.
 *
 * Tapping the card invokes `onPress`, which navigates to the practice
 * overlay (UI handoff §4.2) with `surface = "echo_signature"` and the
 * card's loop_id + tone_state.
 *
 * The component is a pure presentational unit — it never reads state
 * from a context. The parent passes a fully-resolved `LoopState`.
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type AccessibilityRole,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SvgXml } from 'react-native-svg';

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
  verticalScale,
} from '@theme';

import type { LoopState } from '../api/types';
import {
  displayLoopUpper,
  toneSignatureLabel,
} from '../copy/strings';

import { loopIconXml } from './loopIcons';
import { toneColor } from './toneColors';

interface EchoSignatureCardProps {
  loop: LoopState;
  onPress: (loop: LoopState) => void;
}

const ICON_SIZE = moderateScale(40);
const CARD_HEIGHT = verticalScale(120);
const ROLE: AccessibilityRole = 'button';

const EchoSignatureCard: React.FC<EchoSignatureCardProps> = ({
  loop,
  onPress,
}) => {
  const upper = displayLoopUpper(loop.loop_id);
  const tone = toneSignatureLabel(loop.tone_state); // e.g. "- Rising"
  const reflection = loop.reflection_line ?? '';

  return (
    <Pressable
      onPress={() => onPress(loop)}
      accessibilityRole={ROLE}
      accessibilityLabel={`Try a 2-min practice for ${upper}, ${tone}`}
      accessibilityHint={reflection}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={[glassGradient.echoSecondary.start, glassGradient.echoSecondary.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.card, { borderLeftColor: toneColor(loop.tone_state) }]}
      >
        <View style={styles.row}>
          <View style={styles.iconContainer}>
            <SvgXml
              xml={loopIconXml(loop.loop_id)}
              width={ICON_SIZE}
              height={ICON_SIZE}
            />
          </View>
          <Text style={styles.heading}>
            <Text style={styles.headingName}>{upper}</Text>
            <Text style={styles.headingTone}> {tone}</Text>
          </Text>
        </View>
        {reflection !== '' && (
          <Text style={styles.reflection} numberOfLines={2}>
            {reflection}
          </Text>
        )}
      </LinearGradient>
    </Pressable>
  );
};

export default EchoSignatureCard;

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  pressed: { opacity: 0.7 },
  card: {
    width: '100%',
    height: CARD_HEIGHT,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderLeftWidth: borderWidth.thick,
    justifyContent: 'center',
    gap: spacing.xs,
    // Figma: bottom corners squared, subtle rounding elsewhere is carried by
    // the accent edge only; keep a small radius so the gradient clips cleanly.
    borderTopRightRadius: radius.xs,
    borderBottomRightRadius: radius.xs,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  iconContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    flex: 1,
    color: palette.gold.DEFAULT,
  },
  headingName: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.l,
    color: palette.gold.DEFAULT,
    letterSpacing: 1,
  },
  headingTone: {
    fontFamily: fontFamily.headingItalic,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.l,
    color: palette.gold.DEFAULT,
  },
  reflection: {
    fontFamily: fontFamily.bodyItalic,
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    color: palette.gold.subtlest,
    paddingLeft: ICON_SIZE + spacing.m,
  },
});
