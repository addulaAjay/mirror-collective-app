import { createNavigationContainerRef } from '@react-navigation/native';

import type { RootStackParamList } from '@types';

/**
 * Module-level navigation ref so non-React modules (push handlers,
 * background tasks) can navigate without an active hook context.
 *
 * Wired into `<NavigationContainer ref={navigationRef}>` in App.tsx.
 * Consumers must check `isReady()` before calling `navigate` — the ref
 * is only attached after the container mounts, and a payment-failure
 * push delivered on cold-start fires before that point.
 */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Safe navigate that no-ops if the container isn't mounted yet.
 *
 * Cold-start case (notification opened the app from a fully-killed
 * state): the initial-notification handler runs before the navigator
 * mounts. Callers wrap with `setTimeout(0)` or use the queued-deep-link
 * pattern; this guard is the last line of defense so we don't crash on
 * a missed window.
 */
export function safeNavigate<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName],
): boolean {
  if (!navigationRef.isReady()) {
    return false;
  }
  // The overloads on `navigate` differ between routes with/without params.
  // Casting through `any` is the React Navigation-blessed escape hatch.
  (navigationRef.navigate as any)(name, params);
  return true;
}
