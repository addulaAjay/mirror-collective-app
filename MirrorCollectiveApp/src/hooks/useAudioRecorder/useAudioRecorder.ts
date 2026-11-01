/**
 * Voice recording for MirrorGPT chat.
 *
 * The lifecycle is lifted from `NewEchoAudioScreen`, which learned several
 * things the hard way; each is preserved below with the reason. What is new
 * here is the 120s cap, which does not exist anywhere else in the app.
 *
 * Deliberately NOT reusing Echo Vault's audio config — see
 * `SPEECH_AUDIO_SET`.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

import { ensureMicPermission } from '@utils/permissions/media';

/**
 * Hard cap on a single recording.
 *
 * Both a UX guard (nobody means to send the Mirror a 20-minute monologue)
 * and a cost control: transcription bills per minute, which makes it the
 * largest cost lever in the chat-media feature. No duration cap exists
 * anywhere else in this app.
 */
export const MAX_RECORDING_MS = 120_000;

/**
 * Speech-tuned recording config — deliberately different from
 * `NewEchoAudioScreen`'s 44.1kHz / quality-96 archival set.
 *
 * Whisper resamples everything to 16kHz internally, so recording at 44.1kHz
 * produces roughly 4x the bytes for zero accuracy gain — and those bytes ride
 * inline in the request body. Mono for the same reason: speech has no stereo
 * information worth carrying.
 *
 * Do not "fix" the inconsistency with Echo Vault by unifying these. The two
 * configs serve different purposes: that one is archival audio a recipient
 * will listen to, this one is throwaway input to a transcription model.
 *
 * Only v4-supported keys are used. The library manages
 * `AVAudioSession.category` itself; older keys like `AVAudioSessionCategoryIOS`
 * are ignored in v4.
 */
const SPEECH_AUDIO_SET = {
  AVEncoderAudioQualityKeyIOS: 96 as never, // 'high' — of a 16kHz mono source
  AVNumberOfChannelsKeyIOS: 1,
  AVSampleRateKeyIOS: 16000,
  AVModeIOS: 'measurement' as const,
};

/**
 * Delay before acquiring the audio session.
 *
 * Gives any prior media component (Vision Camera with audio,
 * react-native-video) a chance to release `AVAudioSession`. Without it,
 * going from a video screen straight to recording often fails with
 * "audio session was hijacked".
 */
const AUDIO_SESSION_DELAY_MS = 300;

export interface UseAudioRecorderOptions {
  /**
   * Called with the saved file path when the 120s cap stops the recording
   * on the user's behalf, so the caller can proceed as if they had tapped
   * stop.
   */
  onAutoStop?: (uri: string) => void;
}

/** Map a recorder failure to something the user can act on. */
function toUserMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  const msg = raw.toLowerCase();

  if (msg.includes('permission') || msg.includes('denied')) {
    return 'Microphone access was denied. Enable it in Settings to speak to the Mirror.';
  }

  if (
    msg.includes('hijacked') ||
    msg.includes('playback') ||
    msg.includes('attempts')
  ) {
    // The most common real-world cause on iOS is a Bluetooth audio device
    // holding the session in a routing mode the recorder can't switch out
    // of. Closing other audio apps does NOT help; disconnecting Bluetooth
    // does — so the copy says that rather than something generic.
    return 'Something else is using the microphone. Disconnecting AirPods or other Bluetooth audio usually frees it.';
  }

  return "Couldn't start recording. Try again in a moment.";
}

export const useAudioRecorder = (options?: UseAudioRecorderOptions) => {
  // The library's default export is a singleton INSTANCE, not a class. Held
  // in a ref so React never treats it as state.
  const recorder = useRef(AudioRecorderPlayer).current;

  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // SYNCHRONOUS guard. `isRecording` state lands too late to prevent a
  // stopRecorder() call on an idle recorder, which can throw on iOS.
  const isRecordingRef = useRef(false);
  // Latched so the cap can only fire once per recording — the record-back
  // listener fires continuously, and without this it would call stop on
  // every subsequent tick.
  const autoStoppedRef = useRef(false);
  // Read inside the listener, which closes over its first render.
  const onAutoStopRef = useRef(options?.onAutoStop);
  onAutoStopRef.current = options?.onAutoStop;

  /** Shared teardown. Returns the saved path, or null if nothing was running. */
  const teardown = useCallback(async (): Promise<string | null> => {
    if (!isRecordingRef.current) return null;
    isRecordingRef.current = false;

    try {
      // stopRecorder()'s return value IS the saved file path — dropping it
      // loses the recording.
      const uri = await recorder.stopRecorder();
      recorder.removeRecordBackListener();
      setIsRecording(false);
      return uri ?? null;
    } catch (err) {
      console.warn('Failed to stop recording:', err);
      recorder.removeRecordBackListener();
      setIsRecording(false);
      return null;
    }
  }, [recorder]);

  const start = useCallback(async (): Promise<void> => {
    setError(null);

    const granted = await ensureMicPermission();
    if (!granted) return;

    setElapsedMs(0);
    autoStoppedRef.current = false;

    try {
      await new Promise(resolve => setTimeout(resolve, AUDIO_SESSION_DELAY_MS));

      await recorder.startRecorder(undefined, SPEECH_AUDIO_SET, false);
      isRecordingRef.current = true;

      // Clear before adding: on a retry this would otherwise stack
      // listeners, and the timer would advance in multiples.
      recorder.removeRecordBackListener();
      recorder.addRecordBackListener(e => {
        const position = e?.currentPosition ?? 0;
        setElapsedMs(position);

        if (position >= MAX_RECORDING_MS && !autoStoppedRef.current) {
          autoStoppedRef.current = true;
          void teardown().then(uri => {
            if (uri) onAutoStopRef.current?.(uri);
          });
        }
      });

      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      isRecordingRef.current = false;
      setIsRecording(false);
      setError(toUserMessage(err));
    }
  }, [recorder, teardown]);

  /** Stop and keep the recording. */
  const stop = useCallback(
    (): Promise<string | null> => teardown(),
    [teardown],
  );

  /** Stop and discard. */
  const cancel = useCallback(async (): Promise<void> => {
    await teardown();
    setElapsedMs(0);
    setError(null);
  }, [teardown]);

  const clearError = useCallback(() => setError(null), []);

  // Stop on unmount. Without this the mic stays hot after the user navigates
  // away, and on iOS the orange recording indicator stays lit.
  //
  // Empty deps deliberately: this must run exactly once, on teardown. The
  // synchronous ref inside `teardown` is what makes that safe despite the
  // stale closure — it reads the live value, not a captured one.
  useEffect(() => {
    return () => {
      if (isRecordingRef.current) {
        isRecordingRef.current = false;
        recorder.stopRecorder().catch(() => {});
        recorder.removeRecordBackListener();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isRecording,
    elapsedMs,
    error,
    start,
    stop,
    cancel,
    clearError,
  };
};
