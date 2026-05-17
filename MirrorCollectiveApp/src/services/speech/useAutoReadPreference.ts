/**
 * useAutoReadPreference — persists a single boolean ("auto-read assistant
 * replies aloud") via AsyncStorage, exposes it to the Chat + Settings UIs.
 *
 * Default is `false` — first-time users should NOT hear a surprise voice.
 * The toggle lives next to the other "global" prefs we'll grow into a
 * proper Settings store later.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export const AUTO_READ_STORAGE_KEY = 'settings:autoReadMirrorReplies';

export interface AutoReadPreferenceApi {
  /** False until the AsyncStorage read completes. UIs that flash if the
   *  toggle starts wrong should wait for this before rendering the switch. */
  loaded: boolean;
  enabled: boolean;
  setEnabled: (next: boolean) => Promise<void>;
}

export function useAutoReadPreference(): AutoReadPreferenceApi {
  const [enabled, setEnabledState] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(AUTO_READ_STORAGE_KEY);
        if (!cancelled) {
          // Strict equality on 'true' — any other value (null, 'false',
          // legacy garbage from a refactor) is treated as disabled.
          setEnabledState(raw === 'true');
          setLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setEnabledState(false);
          setLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setEnabled = useCallback(async (next: boolean) => {
    // Optimistic update so the Switch UI responds immediately; the write
    // is best-effort. If it fails the next mount re-reads the old value
    // and the toggle visually resets — acceptable for a non-critical pref.
    setEnabledState(next);
    try {
      // Write 'false' explicitly (not removeItem) so future readers
      // that interpret "any non-null = true" don't silently flip on.
      await AsyncStorage.setItem(AUTO_READ_STORAGE_KEY, next ? 'true' : 'false');
    } catch (err) {
      console.warn('[autoRead] failed to persist preference', err);
    }
  }, []);

  return { enabled, setEnabled, loaded };
}
