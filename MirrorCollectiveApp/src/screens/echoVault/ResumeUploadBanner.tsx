/**
 * Resume-upload banner — shows in-flight multipart uploads recovered
 * after a force-quit / cold start and lets the user continue or
 * dismiss each one.
 *
 * Architecture note: this is a pure render component. The vault
 * library screen owns the listResumableUploads scan, the
 * resumeMediaMultipart call, and progress state. Keeping this
 * component stateless makes it trivially testable and lets the
 * parent decide what "Continue" and "Dismiss" actually do
 * (today: resume + abort, respectively).
 */

import {
  fontFamily,
  fontSize,
  moderateScale,
  palette,
  radius,
  scale,
  spacing,
  verticalScale,
} from '@theme';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import type { PendingUpload } from '@services/api/pendingUploads';

interface ResumeUploadBannerProps {
  /** Recoverable uploads as returned by listResumableUploads(). */
  pending: PendingUpload[];
  /**
   * Echo currently being resumed. Disables both buttons on that row
   * and shows the inline progress indicator. The parent screen owns
   * this state because only one resume can run at a time.
   */
  resumingEchoId?: string | null;
  /**
   * 0..1 progress fraction for the currently-resuming upload. Driven
   * by the parent's resumeMediaMultipart onStage callback. Ignored
   * for rows other than `resumingEchoId`.
   */
  resumingProgress?: number;
  /** Tapped Continue: parent runs resumeMediaMultipart for this row. */
  onContinue: (pending: PendingUpload) => void;
  /** Tapped Dismiss: parent aborts on S3 + removes the pending row. */
  onDismiss: (pending: PendingUpload) => void;
}

export function ResumeUploadBanner({
  pending,
  resumingEchoId,
  resumingProgress = 0,
  onContinue,
  onDismiss,
}: ResumeUploadBannerProps) {
  if (pending.length === 0) return null;

  return (
    <View style={styles.wrap}>
      {pending.map(row => {
        const isResuming = resumingEchoId === row.echoId;
        // Anyone else is in progress — disable buttons on this row
        // too (only one resume at a time).
        const isAnyResuming = resumingEchoId != null;
        const completedCount = row.completedParts.length;
        const totalPartsCount = Math.ceil(
          row.fileSize / (5 * 1024 * 1024),
        );
        return (
          <View key={row.echoId} style={styles.card}>
            <View style={styles.textCol}>
              <Text style={styles.title} numberOfLines={1}>
                {row.title}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {isResuming
                  ? `Uploading… ${Math.round(resumingProgress * 100)}%`
                  : `${completedCount} of ${totalPartsCount} parts saved`}
              </Text>
            </View>

            <View style={styles.actions}>
              {isResuming ? (
                <ActivityIndicator
                  size="small"
                  color={palette.gold.DEFAULT}
                  accessibilityLabel="Resuming upload"
                />
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() => onContinue(row)}
                    disabled={isAnyResuming}
                    style={[
                      styles.btn,
                      styles.btnPrimary,
                      isAnyResuming && styles.btnDisabled,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Continue uploading ${row.title}`}
                  >
                    <Text style={styles.btnPrimaryText}>Continue</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onDismiss(row)}
                    disabled={isAnyResuming}
                    style={[styles.btn, isAnyResuming && styles.btnDisabled]}
                    accessibilityRole="button"
                    accessibilityLabel={`Dismiss upload of ${row.title}`}
                  >
                    <Text style={styles.btnText}>Dismiss</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create<{
  wrap: ViewStyle;
  card: ViewStyle;
  textCol: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  actions: ViewStyle;
  btn: ViewStyle;
  btnPrimary: ViewStyle;
  btnDisabled: ViewStyle;
  btnText: TextStyle;
  btnPrimaryText: TextStyle;
}>({
  wrap: {
    paddingHorizontal: spacing.m,
    marginBottom: spacing.s,
    gap: spacing.s,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.m,
    borderRadius: radius.m,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.gold.DEFAULT,
    backgroundColor: 'rgba(242, 226, 177, 0.06)',
  },
  textCol: {
    flex: 1,
    marginRight: spacing.s,
  },
  title: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize.s),
    color: palette.gold.subtlest,
  },
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.xs),
    color: palette.navy.light,
    marginTop: verticalScale(2),
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  btn: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: radius.s,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.navy.light,
  },
  btnPrimary: {
    backgroundColor: palette.gold.DEFAULT,
    borderColor: palette.gold.DEFAULT,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.xs),
    color: palette.navy.light,
  },
  btnPrimaryText: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.xs),
    color: palette.navy.deep,
    fontWeight: '600',
  },
});
