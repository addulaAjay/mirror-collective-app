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
  // Set to true once stop() runs OR the host promise resolves — any
  // late AppState event after that is for the next screen, not this
  // upload, and firing onBackground would surface a bogus "Save paused"
  // alert on the wrong screen.
  let stopped = false;
  // .remove() is safe to call multiple times on modern RN, but pinning
  // the guarantee here makes us robust to future lib changes.
  let removed = false;

  const handle = (next: AppStateStatus) => {
    if (stopped) return;
    // 'inactive' is iOS-only and fires on incoming calls, Control Center
    // swipes, screen-dimming transitions — none of which suspend the
    // JS thread. Track it on `backgrounded` for telemetry, but DON'T
    // fire onBackground (the user would see "Save paused" during an
    // incoming call that they immediately decline).
    if (next === 'background' || next === 'inactive') {
      backgrounded = true;
    }
    if (next === 'background' && !firedOnce && opts.onBackground) {
      firedOnce = true;
      try {
        opts.onBackground();
      } catch (err) {
        // Don't let a buggy callback take down the upload.
        console.warn('uploadLifecycle.onBackground threw:', err);
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
      stopped = true;
      if (!removed) {
        removed = true;
        sub.remove();
      }
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
