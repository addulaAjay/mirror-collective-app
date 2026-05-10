/**
 * Reflection Room API factory — single entry point for screens.
 *
 * `getReflectionRoomClient()` returns the configured client (mock until
 * Phase 8, real after). Screens import this and never touch the concrete
 * classes, so swapping is a one-line config change.
 */

import { REFLECTION_ROOM_USE_MOCK } from '@constants/config';

import type { ReflectionRoomClient } from './client';
import { MockReflectionRoomClient } from './mockClient';
import { RealReflectionRoomClient } from './realClient';

let cached: ReflectionRoomClient | null = null;

export function getReflectionRoomClient(): ReflectionRoomClient {
  if (cached) return cached;
  cached = REFLECTION_ROOM_USE_MOCK
    ? new MockReflectionRoomClient()
    : new RealReflectionRoomClient();
  return cached;
}

/**
 * Test-only — replace the cached client with an explicit instance.
 * Use to inject a fresh mock between tests.
 */
export function __setReflectionRoomClientForTests(
  client: ReflectionRoomClient | null,
): void {
  cached = client;
}

export type { ReflectionRoomClient } from './client';
export { MockReflectionRoomClient } from './mockClient';
export { RealReflectionRoomClient } from './realClient';
export * from './types';
