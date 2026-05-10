/**
 * Reusable Echo Signature card.
 *
 * One per top-3 loop, per UI handoff §4.1 + §12.8 + Figma node 4654-3274.
 *
 * Card layout (matches Figma — single-line header, italic body):
 *   [icon] LOOP_NAME - Tone
 *          reflection line (italic)
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
import { SvgXml } from 'react-native-svg';

import {
  borderWidth,
  fontFamily,
  fontSize,
  lineHeight,
  palette,
  radius,
  spacing,
} from '@theme';

import {
  displayLoopUpper,
  toneSignatureLabel,
} from '../copy/strings';
import type { LoopState } from '../api/types';
import { loopIconXml } from './loopIcons';

interface EchoSignatureCardProps {
  loop: LoopState;
  onPress: (loop: LoopState) => void;
}

const ICON_SIZE = 32;
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
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <SvgXml xml={loopIconXml(loop.loop_id)} width={ICON_SIZE} height={ICON_SIZE} />
        </View>
        <Text style={styles.heading}>
          <Text style={styles.headingName}>{upper}</Text>
          <Text style={styles.headingTone}> {tone}</Text>
        </Text>
      </View>
      {reflection !== '' && (
        <Text style={styles.reflection}>{reflection}</Text>
      )}
    </Pressable>
  );
};

export default EchoSignatureCard;

const styles = StyleSheet.create({
  card: {
    width: '100%',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    borderRadius: radius.m,
    borderWidth: borderWidth.thin,
    borderColor: 'rgba(163, 179, 204, 0.3)',
    backgroundColor: 'rgba(10, 18, 40, 0.6)',
    gap: spacing.xs,
  },
  pressed: { opacity: 0.7 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
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
    fontSize: fontSize.l,
    lineHeight: lineHeight.l,
    color: palette.gold.DEFAULT,
    letterSpacing: 1,
  },
  headingTone: {
    fontFamily: fontFamily.headingItalic,
    fontSize: fontSize.l,
    lineHeight: lineHeight.l,
    color: palette.gold.DEFAULT,
  },
  reflection: {
    fontFamily: fontFamily.bodyItalic,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.s,
    color: palette.gold.subtlest,
    paddingLeft: ICON_SIZE + spacing.s,
  },
});
