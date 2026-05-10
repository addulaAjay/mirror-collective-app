/**
 * Reusable Practice Overlay — used by both Echo Signature (§4.2) and
 * Mirror Moment (§6) per UI handoff. **Build ONCE per the spec.**
 *
 * Responsibilities:
 *  - On mount, call POST /echo/recommend-practice with the (loop, tone,
 *    surface) provided by the caller.
 *  - Render the canonical TWO MINUTE PRACTICE header + practice.title +
 *    each practice.step as a numbered list.
 *  - Show a countdown timer for breath/somatic practice types.
 *  - Provide a "Done" button that fires the supplied onComplete callback
 *    with the data needed to POST /practice/complete.
 *  - Provide a "Try again" recovery affordance on recommend-fetch error.
 *
 * Privacy / accessibility considerations:
 *  - private_mode reveal layer: deferred to Phase 9.
 *  - reduced_motion: timer falls back to a static seconds counter (no
 *    animated ring) — already the default rendering here.
 *  - Each step is a separate Text node so screen readers iterate.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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

import { getReflectionRoomClient } from '../api';
import {
  ReflectionRoomApiError,
  type PatternInfo,
  type PracticePayload,
} from '../api/types';
import { MIRROR_MOMENT } from '../copy/strings';
import { useReflectionRoomPrefs } from '../state/useReflectionRoomPrefs';
import type { LoopId, PracticeSurface, ToneState } from '../types/ids';

export interface PracticeOverlayProps {
  sessionId: string;
  loopId: LoopId;
  toneState: ToneState;
  surface: PracticeSurface;
  /** Fired when the user taps Done. Parent owns POST /practice/complete. */
  onDone: (data: {
    practice: PracticePayload;
    pattern: PatternInfo;
    ruleId: string;
  }) => Promise<void> | void;
  /** Fired when the user dismisses (X close). */
  onDismiss: () => void;
}

type Status =
  | { kind: 'loading' }
  | { kind: 'ready'; practice: PracticePayload; pattern: PatternInfo; ruleId: string }
  | { kind: 'submitting'; practice: PracticePayload; pattern: PatternInfo; ruleId: string }
  | { kind: 'error'; retryAfterSec: number | null };

const PracticeOverlay: React.FC<PracticeOverlayProps> = ({
  sessionId,
  loopId,
  toneState: _toneState,
  surface,
  onDone,
  onDismiss,
}) => {
  const [status, setStatus] = useState<Status>({ kind: 'loading' });
  const { no_breathwork, private_mode } = useReflectionRoomPrefs();
  // Private-mode blanket-blur defaults to obscured; user taps "Reveal"
  // before the practice content is shown (UI handoff §7.1).
  const [revealed, setRevealed] = useState(!private_mode);
  const fetchedRef = useRef(false);

  const fetchPractice = useCallback(async () => {
    setStatus({ kind: 'loading' });
    try {
      const response = await getReflectionRoomClient().recommendPractice({
        session_id: sessionId,
        selected_loop: loopId,
        surface,
      });
      // Defensive: backend should already filter breath types when the
      // user has no_breathwork=true. If one slips through, log a bug
      // (UI handoff §10) and still render — never crash the user.
      if (no_breathwork && response.practice.type === 'breath' && __DEV__) {
        console.warn(
          '[ReflectionRoom] breath practice returned for user with no_breathwork=true',
          { practice_id: response.practice.id, rule_id: response.rule_id },
        );
      }
      setStatus({
        kind: 'ready',
        practice: response.practice,
        pattern: response.pattern,
        ruleId: response.rule_id,
      });
    } catch (err) {
      const retryAfterSec =
        err instanceof ReflectionRoomApiError ? err.retryAfterSec : null;
      setStatus({ kind: 'error', retryAfterSec });
    }
  }, [loopId, no_breathwork, sessionId, surface]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    void fetchPractice();
  }, [fetchPractice]);

  const onDoneTap = async () => {
    if (status.kind !== 'ready') return;
    const { practice, pattern, ruleId } = status;
    setStatus({ kind: 'submitting', practice, pattern, ruleId });
    try {
      await onDone({ practice, pattern, ruleId });
    } catch {
      // Parent owns the failure path; revert UI to ready so the user can
      // tap Done again or X out.
      setStatus({ kind: 'ready', practice, pattern, ruleId });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text
          style={styles.eyebrow}
          accessibilityRole="header"
          accessibilityLabel={MIRROR_MOMENT.practiceHeader}
        >
          {MIRROR_MOMENT.practiceHeader}
        </Text>
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Close practice"
          hitSlop={12}
          style={styles.closeButton}
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {status.kind === 'loading' && (
          <View style={styles.center}>
            <Text style={styles.loadingHeader}>{MIRROR_MOMENT.loadingHeader}</Text>
            <ActivityIndicator
              size="large"
              color={palette.gold.DEFAULT}
              style={styles.spinner}
            />
            <Text style={styles.bodyMuted}>{MIRROR_MOMENT.loadingBody}</Text>
          </View>
        )}

        {status.kind === 'error' && (
          <View style={styles.center}>
            <Text style={styles.failHeader}>{MIRROR_MOMENT.failHeader}</Text>
            <Text style={styles.bodyMuted}>{MIRROR_MOMENT.failBody}</Text>
            {status.retryAfterSec != null && (
              <Text style={styles.bodyMuted}>
                Try again in {Math.round(status.retryAfterSec / 60)} min.
              </Text>
            )}
            <Pressable
              onPress={() => void fetchPractice()}
              accessibilityRole="button"
              accessibilityLabel="Try again"
              style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            >
              <Text style={styles.buttonText}>TRY AGAIN</Text>
            </Pressable>
          </View>
        )}

        {(status.kind === 'ready' || status.kind === 'submitting') && (
          <View style={styles.practiceBlock}>
            {/* Private-mode reveal gate */}
            {!revealed ? (
              <View style={styles.privateGate} accessibilityLiveRegion="polite">
                <Text style={styles.privateGateLabel}>
                  Practice content is private.
                </Text>
                <Pressable
                  onPress={() => setRevealed(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Reveal practice content"
                  style={({ pressed }) => [
                    styles.button,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.buttonText}>REVEAL</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text
                  style={styles.title}
                  accessibilityRole="header"
                  accessibilityLabel={status.practice.title}
                >
                  {status.practice.title}
                </Text>

                {status.practice.duration_sec > 0 && (
                  <Timer
                    durationSec={status.practice.duration_sec}
                    disabled={status.kind === 'submitting'}
                  />
                )}

                <View style={styles.steps}>
                  {status.practice.steps.map((step, i) => (
                    <View key={i} style={styles.stepRow}>
                      <Text style={styles.stepNumber}>{i + 1}.</Text>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}
                </View>

                <Pressable
                  onPress={onDoneTap}
                  disabled={status.kind === 'submitting'}
                  accessibilityRole="button"
                  accessibilityLabel="Done"
                  accessibilityState={{ disabled: status.kind === 'submitting' }}
                  style={({ pressed }) => [
                    styles.button,
                    pressed && styles.pressed,
                    status.kind === 'submitting' && styles.buttonDisabled,
                  ]}
                >
                  {status.kind === 'submitting' ? (
                    <ActivityIndicator
                      size="small"
                      color={palette.gold.DEFAULT}
                    />
                  ) : (
                    <Text style={styles.buttonText}>DONE</Text>
                  )}
                </Pressable>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default PracticeOverlay;

// ---------------------------------------------------------------------------
// Timer — counts down from durationSec. Pure visual; no callback on finish.
// ---------------------------------------------------------------------------

const Timer: React.FC<{ durationSec: number; disabled?: boolean }> = ({
  durationSec,
  disabled,
}) => {
  const [remaining, setRemaining] = useState(durationSec);

  useEffect(() => {
    if (disabled) return;
    if (remaining <= 0) return;
    const id = setInterval(() => {
      setRemaining(r => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [disabled, remaining]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const display = `${minutes}:${String(seconds).padStart(2, '0')}`;

  return (
    <Text
      style={styles.timer}
      accessibilityLabel={`${minutes} minutes ${seconds} seconds remaining`}
      accessibilityLiveRegion="polite"
    >
      {display}
    </Text>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.l,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.s,
  },
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
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: palette.gold.DEFAULT,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.xl,
    fontFamily: fontFamily.body,
  },
  scroll: {
    flexGrow: 1,
    paddingVertical: spacing.l,
    gap: spacing.l,
  },
  center: {
    alignItems: 'center',
    gap: spacing.m,
    paddingVertical: spacing.xxl,
  },
  spinner: { marginVertical: spacing.s },
  loadingHeader: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['2xl'],
    lineHeight: lineHeight.xl,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    letterSpacing: 1,
  },
  failHeader: {
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
  bodyMuted: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    color: palette.gold.subtlest,
    textAlign: 'center',
  },
  practiceBlock: {
    alignItems: 'center',
    gap: spacing.l,
    paddingVertical: spacing.l,
  },
  privateGate: {
    alignItems: 'center',
    gap: spacing.m,
    paddingVertical: spacing.xxl,
  },
  privateGateLabel: {
    fontFamily: fontFamily.bodyItalic,
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    color: palette.gold.subtlest,
    textAlign: 'center',
  },
  title: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['3xl'],
    lineHeight: lineHeight.xl,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: textShadow.glow.color,
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: textShadow.glow.radius,
  },
  timer: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['4xl'],
    lineHeight: lineHeight.xxl,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    letterSpacing: 4,
  },
  steps: {
    width: '100%',
    gap: spacing.s,
    paddingHorizontal: spacing.s,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  stepNumber: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.l,
    lineHeight: lineHeight.l,
    color: palette.gold.DEFAULT,
    minWidth: 24,
  },
  stepText: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: fontSize.m,
    lineHeight: lineHeight.l,
    color: palette.gold.subtlest,
  },
  button: {
    minWidth: 200,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: palette.gold.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xl,
    color: palette.gold.DEFAULT,
    letterSpacing: 2,
  },
  pressed: { opacity: 0.7 },
});
