/**
 * JourneyContext — caches the Reflection Room session for the duration of a
 * single journey (Echo Signature → Echo Map → Mirror Moment).
 *
 * Per UI handoff §9: the snapshot is fetched once at the top of the journey
 * (after /reflection/quiz or on first room entry), passed down through every
 * dependent surface, and re-fetched only after POST /practice/complete or an
 * explicit echo_map_refresh.
 *
 * The context also exposes the first-time Welcome flag so screens can decide
 * whether to gate on the onboarding overlays.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { hasSeenWelcome, markWelcomeSeen } from './welcomeFlag';
import type { MotifPayload, SnapshotResponse } from '../api/types';

interface JourneyState {
  sessionId: string | null;
  motif: MotifPayload | null;
  snapshot: SnapshotResponse | null;
}

interface JourneyContextValue extends JourneyState {
  /** True once we've checked AsyncStorage. Avoids a flash of "first-time" UX. */
  welcomeChecked: boolean;
  /** True if the user has completed the 3-overlay welcome before. */
  welcomeSeen: boolean;
  /** Persist welcome-seen and update in-memory state. */
  setWelcomeSeen: () => Promise<void>;
  /** Replace the cached session+motif (e.g. after /reflection/quiz). */
  setSession: (session: { sessionId: string; motif: MotifPayload }) => void;
  /** Replace the cached snapshot (e.g. after /echo/snapshot or /practice/complete). */
  setSnapshot: (snapshot: SnapshotResponse) => void;
  /** Fully clear the journey (e.g. on session expiry or sign-out). */
  reset: () => void;
}

const JourneyContext = createContext<JourneyContextValue | null>(null);

interface JourneyProviderProps {
  children: React.ReactNode;
  /** Optional initial state — useful for tests. Production code never sets this. */
  initialState?: Partial<JourneyState>;
  /** Optional initial welcome-seen value — bypasses AsyncStorage for tests. */
  initialWelcomeSeen?: boolean;
}

export const JourneyProvider: React.FC<JourneyProviderProps> = ({
  children,
  initialState,
  initialWelcomeSeen,
}) => {
  const [state, setState] = useState<JourneyState>({
    sessionId: initialState?.sessionId ?? null,
    motif: initialState?.motif ?? null,
    snapshot: initialState?.snapshot ?? null,
  });
  const [welcomeChecked, setWelcomeChecked] = useState(
    initialWelcomeSeen !== undefined,
  );
  const [welcomeSeen, setWelcomeSeenState] = useState(
    initialWelcomeSeen ?? false,
  );

  useEffect(() => {
    if (initialWelcomeSeen !== undefined) return;
    let cancelled = false;
    void hasSeenWelcome().then(seen => {
      if (cancelled) return;
      setWelcomeSeenState(seen);
      setWelcomeChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, [initialWelcomeSeen]);

  const setWelcomeSeen = useCallback(async () => {
    setWelcomeSeenState(true);
    await markWelcomeSeen();
  }, []);

  const setSession = useCallback(
    ({ sessionId, motif }: { sessionId: string; motif: MotifPayload }) => {
      setState(prev => ({ ...prev, sessionId, motif }));
    },
    [],
  );

  const setSnapshot = useCallback((snapshot: SnapshotResponse) => {
    setState(prev => ({ ...prev, snapshot }));
  }, []);

  const reset = useCallback(() => {
    setState({ sessionId: null, motif: null, snapshot: null });
  }, []);

  const value = useMemo<JourneyContextValue>(
    () => ({
      ...state,
      welcomeChecked,
      welcomeSeen,
      setWelcomeSeen,
      setSession,
      setSnapshot,
      reset,
    }),
    [state, welcomeChecked, welcomeSeen, setWelcomeSeen, setSession, setSnapshot, reset],
  );

  return (
    <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>
  );
};

export function useJourney(): JourneyContextValue {
  const value = useContext(JourneyContext);
  if (!value) {
    throw new Error('useJourney must be used inside a JourneyProvider');
  }
  return value;
}
