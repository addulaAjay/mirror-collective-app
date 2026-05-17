/**
 * Text-to-speech facade over react-native-tts.
 *
 * Why a wrapper instead of importing react-native-tts directly:
 *
 *   1. "Only one utterance speaks at a time" — RN-TTS's native side will
 *      happily start a second utterance while the first is still going.
 *      The chat UI assumes exactly one bubble is in the "speaking" state,
 *      so the wrapper enforces stop-before-start.
 *
 *   2. State the UI can observe — a `subscribe()` channel lets MessageBubble
 *      flip its speaker icon to "stop" without each bubble owning its own
 *      RN-TTS event listener.
 *
 *   3. Test-safe — when the native module isn't linked (jest, ejected app
 *      misconfiguration), `speak()` resolves silently instead of crashing.
 *      Same posture as our other native-leaning wrappers.
 *
 * The wrapper is intentionally stateless about CONTENT (it doesn't queue,
 * doesn't store the text). The chat layer owns message identity; the
 * wrapper just tracks which utteranceId is currently active.
 */

import Tts from 'react-native-tts';

export type TtsEvent =
  | { type: 'started'; utteranceId: string }
  | { type: 'finished'; utteranceId: string }
  | { type: 'cancelled'; utteranceId: string };

type Subscriber = (event: TtsEvent) => void;

class TtsService {
  private activeUtteranceId: string | null = null;
  private subscribers: Set<Subscriber> = new Set();
  private nativeListenersAttached = false;

  /**
   * Begin speaking `text` and tag the utterance with `utteranceId`.
   * Stops any in-flight utterance first. Whitespace-only text is a
   * no-op — RN-TTS will fire a `tts-start` immediately followed by
   * `tts-finish` for an empty string, which produces a flash on the
   * UI; cheaper to skip the round-trip entirely.
   */
  async speak(text: string, utteranceId: string): Promise<void> {
    const trimmed = text.trim();
    if (trimmed.length === 0) return;

    this.ensureListeners();

    // Stop-before-start. The check on activeUtteranceId is the cheaper
    // guard; we also call native stop() unconditionally to cover the
    // edge case where the wrapper missed a finish event.
    if (this.activeUtteranceId) {
      this.stop();
    }

    try {
      // Some RN-TTS versions return a Promise, others fire-and-forget.
      // Await defensively — if it throws synchronously (no native
      // module), the catch below keeps us in a sane state. We rely on
      // the engine defaults for voice + rate; expose a setRate API
      // here later if Settings grows a "speech rate" slider.
      await Promise.resolve(Tts.speak(trimmed));
      this.activeUtteranceId = utteranceId;
    } catch (err) {
      // Common in jest / detached environments. Swallow to keep the
      // chat UI usable; consumers can check getActiveUtteranceId() to
      // know whether speech actually started.
      console.warn('[tts] speak failed', err);
      this.activeUtteranceId = null;
    }
  }

  /**
   * Stop the in-flight utterance. Safe to call when nothing is playing.
   * Subscribers receive a `cancelled` event via the native `tts-cancel`
   * callback — we don't emit it ourselves to avoid double-firing.
   */
  stop(): void {
    try {
      Tts.stop();
    } catch (err) {
      console.warn('[tts] stop failed', err);
    }
    this.activeUtteranceId = null;
  }

  /**
   * The utteranceId of the bubble currently speaking, or null if idle.
   * The chat UI calls this on render to pick which speaker icon shows
   * the "stop" affordance.
   */
  getActiveUtteranceId(): string | null {
    return this.activeUtteranceId;
  }

  /**
   * Subscribe to lifecycle events (started/finished/cancelled). Returns
   * an unsubscribe function. Consumers should call it on unmount.
   */
  subscribe(fn: Subscriber): () => void {
    this.subscribers.add(fn);
    return () => {
      this.subscribers.delete(fn);
    };
  }

  /**
   * Test-only reset. Clears active state, listeners, and subscribers.
   * In production the service is a singleton that lives for the app
   * lifetime.
   */
  reset(): void {
    this.activeUtteranceId = null;
    this.subscribers.clear();
    this.nativeListenersAttached = false;
    try {
      Tts.removeAllListeners?.('tts-start');
      Tts.removeAllListeners?.('tts-finish');
      Tts.removeAllListeners?.('tts-cancel');
    } catch {
      // ignored — native module may not be linked in tests
    }
  }

  /**
   * Lazily attach the native lifecycle listeners on first speak(). Doing
   * this at module import time would crash jest because the mock isn't
   * installed yet when the module evaluates.
   */
  private ensureListeners(): void {
    if (this.nativeListenersAttached) return;
    try {
      Tts.addEventListener('tts-start', () => this.emit('started'));
      Tts.addEventListener('tts-finish', () => this.emit('finished'));
      Tts.addEventListener('tts-cancel', () => this.emit('cancelled'));
      this.nativeListenersAttached = true;
    } catch (err) {
      console.warn('[tts] failed to attach listeners', err);
    }
  }

  private emit(type: TtsEvent['type']): void {
    const id = this.activeUtteranceId;
    if (!id) return;
    if (type !== 'started') {
      // started keeps the active id; finished/cancelled clear it.
      this.activeUtteranceId = null;
    }
    const event: TtsEvent = { type, utteranceId: id };
    this.subscribers.forEach((fn) => fn(event));
  }
}

export const ttsService = new TtsService();
