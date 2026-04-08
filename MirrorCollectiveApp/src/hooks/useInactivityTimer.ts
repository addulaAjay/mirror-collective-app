import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

interface UseInactivityTimerProps {
  isEnabled: boolean;
  onTimeout: () => void;
}

/**
 * Tracks user inactivity and fires `onTimeout` after 5 minutes.
 * Covers two scenarios:
 *   1. No touch activity for 5 continuous minutes while app is in foreground.
 *   2. App returns to foreground after being backgrounded for 5+ minutes.
 *
 * Returns `resetTimer` — call this on every user touch to keep the session alive.
 */
export const useInactivityTimer = ({
  isEnabled,
  onTimeout,
}: UseInactivityTimerProps) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundedAtRef = useRef<number | null>(null);
  const onTimeoutRef = useRef(onTimeout);

  // Keep onTimeout ref current without restarting the timer
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      onTimeoutRef.current();
    }, INACTIVITY_TIMEOUT_MS);
  }, [clearTimer]);

  /** Call this on every user interaction to reset the 5-minute countdown. */
  const resetTimer = useCallback(() => {
    if (!isEnabled) return;
    startTimer();
  }, [isEnabled, startTimer]);

  // Start / stop the timer based on isEnabled
  useEffect(() => {
    if (isEnabled) {
      startTimer();
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [isEnabled, startTimer, clearTimer]);

  // Handle app going to background / coming back to foreground
  useEffect(() => {
    if (!isEnabled) return;

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        // Record when app left foreground; pause the countdown timer
        backgroundedAtRef.current = Date.now();
        clearTimer();
      } else if (nextState === 'active') {
        const backgroundedAt = backgroundedAtRef.current;
        backgroundedAtRef.current = null;

        if (backgroundedAt !== null) {
          const elapsed = Date.now() - backgroundedAt;
          if (elapsed >= INACTIVITY_TIMEOUT_MS) {
            // Was backgrounded long enough — force logout immediately
            onTimeoutRef.current();
            return;
          }
          // Remaining time before timeout
          const remaining = INACTIVITY_TIMEOUT_MS - elapsed;
          clearTimer();
          timerRef.current = setTimeout(() => {
            onTimeoutRef.current();
          }, remaining);
        } else {
          startTimer();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [isEnabled, clearTimer, startTimer]);

  return { resetTimer };
};

export default useInactivityTimer;
