/**
 * Microphone and camera permission helpers.
 *
 * ## Why this exists
 *
 * Before this module, permission handling was copy-pasted across four Echo
 * Vault screens with four slightly different shapes — NewEchoAudioScreen,
 * NewEchoVideoScreen, CreateEchoScreen and NewEchoComposeScreen. Two of them
 * also mixed `PermissionsAndroid` (Android) with Vision Camera's hooks (iOS),
 * which is where a real bug crept in: those `PermissionsAndroid.requestMultiple`
 * calls ask for `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` without
 * branching on API level, so on Android 13+ (targetSdk is 35) they resolve
 * denied while the manifest's `READ_MEDIA_*` permissions are never requested.
 *
 * ## Why Vision Camera's static API on both platforms
 *
 * `Camera.getMicrophonePermissionStatus()` / `requestMicrophonePermission()`
 * are cross-platform statics that wrap the correct native API per platform —
 * including the Android runtime-permission dance. Using them uniformly removes
 * the per-platform branching that produced the bug above, and it needs no new
 * dependency: `react-native-vision-camera` is already installed and is already
 * the de-facto permission shim in this codebase.
 *
 * They are *statics*, not hooks, so unlike `useMicrophonePermission()` these
 * can be called from an event handler (e.g. "user tapped the mic button")
 * rather than forcing the caller to be a component.
 *
 * ## What is deliberately NOT here
 *
 * There is no `ensurePhotoLibraryPermission()`. Picking from the camera roll
 * via `react-native-image-picker`'s `launchImageLibrary` goes through the
 * system picker, which carries its own implicit grant — no runtime permission
 * request is needed on either platform, and asking for one would add a prompt
 * users should never see. This is also why chat does not inherit the Android
 * 13+ storage bug described above: it never requests storage permissions.
 */

import { Alert, Linking } from 'react-native';
import { Camera } from 'react-native-vision-camera';

export interface EnsurePermissionOptions {
  /**
   * Suppress the "open Settings" alert on denial and just return false.
   * Use when the caller renders its own inline denial UI.
   */
  silent?: boolean;
}

/** Copy for the denial alert, per permission kind. */
const DENIAL_COPY = {
  microphone: {
    title: 'Microphone access needed',
    body: 'Enable microphone access to speak to the Mirror.',
  },
  camera: {
    title: 'Camera access needed',
    body: 'Enable camera access to take a photo.',
  },
} as const;

type PermissionKind = keyof typeof DENIAL_COPY;

function promptForSettings(kind: PermissionKind): void {
  const { title, body } = DENIAL_COPY[kind];
  Alert.alert(title, body, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Open Settings', onPress: () => Linking.openSettings() },
  ]);
}

/**
 * Shared flow: read the current status, request only when that could help,
 * and fall back to pointing the user at Settings.
 *
 * `restricted` (iOS parental controls / MDM) short-circuits the request —
 * requesting cannot succeed there, so firing one just wastes a round-trip
 * and delays the explanatory alert.
 */
async function ensurePermission(
  kind: PermissionKind,
  getStatus: () => string,
  request: () => Promise<string>,
  options?: EnsurePermissionOptions,
): Promise<boolean> {
  let status: string;
  try {
    status = getStatus();
  } catch (err) {
    // Native module missing (e.g. a JS-only test env, or a broken pod
    // install). Treat as "no permission" rather than crashing the caller.
    console.warn(`Could not read ${kind} permission status:`, err);
    return false;
  }

  if (status === 'granted') return true;

  let granted = false;
  if (status !== 'restricted') {
    try {
      granted = (await request()) === 'granted';
    } catch (err) {
      console.warn(`${kind} permission request failed:`, err);
    }
  }

  if (granted) return true;
  if (!options?.silent) promptForSettings(kind);
  return false;
}

/**
 * Ensure microphone access before recording.
 *
 * Must be called before `startRecorder()`:
 * `react-native-audio-recorder-player` v4 does **not** auto-prompt for the
 * microphone on iOS, so recording throws when the permission is still
 * undetermined — exactly the fresh-install case App Review hit on Echo Vault.
 */
export function ensureMicPermission(
  options?: EnsurePermissionOptions,
): Promise<boolean> {
  return ensurePermission(
    'microphone',
    () => Camera.getMicrophonePermissionStatus(),
    () => Camera.requestMicrophonePermission(),
    options,
  );
}

/** Ensure camera access before launching the camera. */
export function ensureCameraPermission(
  options?: EnsurePermissionOptions,
): Promise<boolean> {
  return ensurePermission(
    'camera',
    () => Camera.getCameraPermissionStatus(),
    () => Camera.requestCameraPermission(),
    options,
  );
}
