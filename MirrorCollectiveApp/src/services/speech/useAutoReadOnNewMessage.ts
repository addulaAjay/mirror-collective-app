/**
 * useAutoReadOnNewMessage — when `enabled` is true, speak the latest
 * assistant reply whenever a NEW one arrives. Skips the very first
 * render (so the on-screen greeting doesn't immediately play after a
 * user enables the toggle).
 *
 * Lives next to the ttsService so the chat screen wires up one hook
 * instead of carrying a useEffect with its own bookkeeping.
 */

import { useEffect, useRef } from 'react';
import type { Message } from '@types';

import { ttsService } from './ttsService';

export function useAutoReadOnNewMessage(
  messages: Message[],
  enabled: boolean,
): void {
  // Track the latest assistant id we've ALREADY processed so we don't
  // re-speak the same reply when an unrelated re-render happens. The
  // first effect run captures the initial state without speaking.
  const lastSpokenIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const latest = messages[messages.length - 1];
    if (!latest) return;

    // First effect run after mount or after re-enabling: seed the ref
    // with the current latest assistant id (if any) without speaking.
    // This prevents the greeting from speaking when the user enters
    // the screen with auto-read already on.
    if (!initializedRef.current) {
      initializedRef.current = true;
      lastSpokenIdRef.current =
        latest.sender === 'system' ? latest.id : null;
      return;
    }

    // From here on, speak only when a newer assistant message has
    // arrived. User messages don't get spoken (no point) and don't
    // advance the lastSpokenId — a user message followed by a system
    // reply still triggers the reply to be spoken.
    if (latest.sender !== 'system') return;
    if (latest.id === lastSpokenIdRef.current) return;

    lastSpokenIdRef.current = latest.id;
    void ttsService.speak(latest.text, latest.id);
  }, [messages, enabled]);

  // On unmount, stop any speech this screen kicked off so the user
  // doesn't hear half a reply continuing from another screen.
  useEffect(() => {
    return () => {
      ttsService.stop();
    };
  }, []);
}
