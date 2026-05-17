import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import ProgressBar from './ProgressBar';

import type { UploadStage } from '@services/api/echo';
import {
  fontFamily,
  fontSize,
  moderateScale,
  palette,
  scale,
  spacing,
  verticalScale,
} from '@theme';

interface UploadProgressOverlayProps {
  visible: boolean;
  /** 0..1 — clamped by ProgressBar internally. */
  progress: number;
  /**
   * Most recent stage emitted by `echoApiService.uploadEchoMedia`. Null is
   * acceptable for the brief gap between save-button-press and the first
   * stage event; we fall back to a generic "Preparing…" label.
   */
  stage: UploadStage | null;
}

const stageLabel = (stage: UploadStage | null, progress: number): string => {
  if (!stage) return 'Preparing…';
  switch (stage.type) {
    case 'compressing':
      return `Compressing… ${Math.round(stage.fraction * 100)}%`;
    case 'requesting_url':
      return 'Preparing upload…';
    case 'uploading':
      return `Uploading… ${Math.round(progress * 100)}%`;
    case 'finalizing':
      return 'Finalizing…';
  }
};

const UploadProgressOverlay: React.FC<UploadProgressOverlayProps> = ({
  visible,
  progress,
  stage,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.container} pointerEvents="auto">
        <View style={styles.card as ViewStyle}>
          <Text style={styles.title}>Saving your echo</Text>
          <Text style={styles.subtitle}>{stageLabel(stage, progress)}</Text>
          <ProgressBar progress={progress} width={scale(240)} />
          <Text style={styles.hint}>
            Keep the app open until upload completes.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

export default UploadProgressOverlay;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Light dim — keeps the rest of the screen readable so the user
    // can still see context, not a full blackout.
    backgroundColor: 'rgba(7,9,14,0.18)',
  },
  card: {
    width: '82%',
    maxWidth: 320,
    paddingHorizontal: scale(spacing.l),
    paddingVertical: verticalScale(spacing.l),
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: palette.navy.light,
    // Translucent card — content behind tints through gently.
    backgroundColor: 'rgba(7,9,14,0.72)',
    alignItems: 'center',
    gap: verticalScale(spacing.s),
  },
  title: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize.xl),
    lineHeight: moderateScale(28),
    color: palette.gold.DEFAULT,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.s),
    lineHeight: moderateScale(22),
    color: palette.gold.subtlest,
    textAlign: 'center',
  },
  hint: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.xs),
    lineHeight: moderateScale(18),
    color: 'rgba(253,253,249,0.6)',
    textAlign: 'center',
    marginTop: verticalScale(spacing.xs),
  },
});
