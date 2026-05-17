/**
 * Lifecycle monitor for in-progress uploads.
 *
 * What this delivers (today)
 * --------------------------
 * Listens to AppState. If the user backgrounds the app while an
 * upload is mid-flight, fires the caller's ``onBackground`` callback
 * exactly once so the UI can surface a "save will pause — bring the
 * app back" hint. Also exposes ``isBackgroundedSinceStart`` so the
 * caller can post telemetry once the upload finishes.
 *
 * What this does NOT deliver
 * --------------------------
 * True NSURLSession background uploads (uploads that survive lock
 * screen indefinitely). react-native-blob-util's IOSBackgroundTask
 * flag is download-centric and the lib doesn't expose the
 * handleEventsForBackgroundURLSession hook required for proper
 * background continuation. Migrating to react-native-background-upload
 * (or shipping a custom turbo module that wraps NSURLSession with a
 * background session config) is a separate workstream — see
 * docs/echo-vault/upload-roadmap.md.
 *
 * Today's behaviour: a mid-flight upload pauses when the OS suspends
 * the JS thread (~30 s after backgrounding for most devices). The
 * upload resumes from where it left off in the multipart path
 * (per-part retry), or restarts from the beginning in the single-PUT
 * path. Users only notice this when they background the app for
 * longer than the upload would have taken — the lifecycle hint helps
 * them know to come back.
 */

import { AppState, AppStateStatus, Platform } from 'react-native';

export interface UploadLifecycleMonitor {
  /** True if the app transitioned to background at any point since start. */
  readonly isBackgroundedSinceStart: boolean;
  /** Tear down the AppState listener. Safe to call multiple times. */
  stop(): void;
}

export interface UploadLifecycleOptions {
  /** Fired once per monitor when the app transitions to background.
   * Subsequent transitions during the same upload are ignored — most
   * callers just want to surface the warning hint a single time. */
  onBackground?: () => void;
}

/**
 * Start watching AppState for the lifetime of an upload. Always call
 * ``stop()`` (or wrap with ``withUploadLifecycle``) when the upload
 * settles — leaving the listener attached after the upload finishes
 * would fire ``onBackground`` for unrelated app transitions.
 */
export function startUploadLifecycleMonitor(
  opts: UploadLifecycleOptions = {},
): UploadLifecycleMonitor {
  let backgrounded = false;
  let firedOnce = false;

  const handle = (next: AppStateStatus) => {
    if (next === 'background' || next === 'inactive') {
      backgrounded = true;
      if (!firedOnce && opts.onBackground) {
        firedOnce = true;
        try {
          opts.onBackground();
        } catch (err) {
          // Don't let a buggy callback take down the upload.
          console.warn('uploadLifecycle.onBackground threw:', err);
        }
      }
    }
  };

  // AppState is no-op on web; on React Native it returns a Subscription
  // with .remove(). API hasn't changed across recent RN versions.
  const sub = AppState.addEventListener('change', handle);

  return {
    get isBackgroundedSinceStart() {
      return backgrounded;
    },
    stop() {
      sub.remove();
    },
  };
}

/**
 * Sugar for the common case: wrap an async upload function so the
 * AppState listener is automatically torn down regardless of
 * success / failure.
 */
export async function withUploadLifecycle<T>(
  opts: UploadLifecycleOptions,
  fn: (monitor: UploadLifecycleMonitor) => Promise<T>,
): Promise<T> {
  const monitor = startUploadLifecycleMonitor(opts);
  try {
    return await fn(monitor);
  } finally {
    monitor.stop();
  }
}

/** Constant exposed for telemetry tagging — distinguishes iOS-only
 *  limitations from Android (which has a different background story
 *  via WorkManager — also future work). */
export const PLATFORM_BACKGROUND_HINT = Platform.OS;
