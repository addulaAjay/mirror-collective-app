/**
 * App-wide navigation ref so non-React code (the push-notification service)
 * can navigate when a Soul Ping is tapped — including from a cold start, where
 * the tap is handled before the NavigationContainer has mounted.
 *
 * `navigate()` queues the action if navigation isn't ready yet;
 * `flushPendingNavigation()` (called from NavigationContainer.onReady in
 * App.tsx) replays the queued action once the tree is live.
 */
import {
  createNavigationContainerRef,
  type NavigatorScreenParams,
} from '@react-navigation/native';

import type { RootStackParamList } from '@types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

type RouteName = keyof RootStackParamList;

let pending: { name: RouteName; params?: unknown } | null = null;

/**
 * Navigate to a route, or queue it if the navigator isn't ready yet (cold
 * start). The most recent queued target wins — a notification tap should land
 * the user on the tapped item, not an earlier one.
 */
export function navigate(name: RouteName, params?: unknown): void {
  if (navigationRef.isReady()) {
    // The ref's navigate is overloaded per-route; we route dynamically by name
    // so a single untyped hop is unavoidable here.
    (navigationRef.navigate as (n: string, p?: unknown) => void)(
      name as string,
      params as NavigatorScreenParams<RootStackParamList> | undefined,
    );
  } else {
    pending = { name, params };
  }
}

/** Replay any queued navigation once the container is ready. */
export function flushPendingNavigation(): void {
  if (pending && navigationRef.isReady()) {
    const { name, params } = pending;
    pending = null;
    navigate(name, params);
  }
}
