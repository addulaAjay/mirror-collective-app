/**
 * "CAPTURE YOUR REFLECTION" info modal for the MirrorGPT screen.
 *
 * Opened from the (i) icon in the MirrorGPT header. Explains the copy-to-Echo-
 * Vault flow: tapping the copy icon on a reply carries that text straight into
 * a new Echo. Figma: Dev-Master-File node 7915-4583.
 *
 * Mirrors the tokens/structure of features/reflection-room InfoOverlay, but is
 * a focused single-page card with the content_copy glyph the design calls out
 * (InfoOverlay is paginated and has no inline icon).
 */

import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import GlassCard from '@components/_internal/GlassCard';
import {
  fontFamily,
  fontSize,
  lineHeight,
  modalColors,
  palette,
  radius,
  spacing,
} from '@theme';

// Copy exactly as authored in Figma (node 7915-4583).
const HEADER = 'CAPTURE YOUR REFLECTION';
const BODY =
  'Tap the copy icon in Mirror GPT to grab the lesson, insight, or memory ' +
  'you want to keep. You’ll jump straight to the Echo Vault—just create a ' +
  'new Echo, and your copied content will already be there waiting for you.';
const FOOTER = '“Learn something → copy it → save it for later.”';

/** Material-style content_copy glyph, gold — matches the copy affordance the
 *  modal is teaching the user about. */
const CopyGlyph: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x={9}
      y={9}
      width={11}
      height={11}
      rx={2}
      stroke={palette.gold.DEFAULT}
      strokeWidth={1.6}
    />
    <Path
      d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
      stroke={palette.gold.DEFAULT}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

interface MirrorGptInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

const MirrorGptInfoModal: React.FC<MirrorGptInfoModalProps> = ({
  visible,
  onClose,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    {/* Scrim tap dismisses; inner Pressable swallows taps on the card. */}
    <Pressable
      style={styles.scrim}
      onPress={onClose}
      accessibilityLabel="Close info"
    >
      <Pressable onPress={() => {}}>
        <GlassCard
          padding={spacing.l}
          borderRadius={radius.m}
          style={styles.card}
        >
          <View style={styles.closeRow}>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={styles.closeButton}
            >
              <Text style={styles.closeText} allowFontScaling={false}>
                ×
              </Text>
            </Pressable>
          </View>

          <Text style={styles.header} accessibilityRole="header">
            {HEADER}
          </Text>

          <Text style={styles.body}>{BODY}</Text>

          <View style={styles.iconRow}>
            <CopyGlyph />
          </View>

          <Text style={styles.footer}>{FOOTER}</Text>
        </GlassCard>
      </Pressable>
    </Pressable>
  </Modal>
);

export default MirrorGptInfoModal;

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: modalColors.backdrop,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
  },
  card: {
    width: '100%',
    maxWidth: 329, // Figma frame width
    // Gold glow — Figma "Background Blur" drop shadow (#F2E2B1 @ 30%).
    shadowColor: palette.gold.DEFAULT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  closeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closeButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: palette.gold.DEFAULT,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl,
    fontFamily: fontFamily.body,
  },
  header: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xl, // 24
    lineHeight: lineHeight.l, // 28
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: spacing.s,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.s, // 16
    lineHeight: lineHeight.m, // 24
    color: palette.gold.subtlest,
    textAlign: 'center',
    marginTop: spacing.l,
  },
  iconRow: {
    alignItems: 'center',
    marginTop: spacing.l,
  },
  footer: {
    fontFamily: fontFamily.bodyItalic,
    fontSize: fontSize.xs, // 14
    lineHeight: lineHeight.s, // 20
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    marginTop: spacing.m,
  },
});
