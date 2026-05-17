import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';

import { registerDeviceApiService } from '@services/api/register-device';
import { safeNavigate } from '@services/navigationRef';

/**
 * __DEV__-gated console helpers — matches the pattern in
 * `useInAppPurchase`. PushNotificationService runs on every cold
 * start and every AppState→active, so unconditional console output
 * fills the production device console with low-value noise.
 */
function devLog(...args: unknown[]): void {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}
function devWarn(...args: unknown[]): void {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn(...args);
  }
}
function devError(...args: unknown[]): void {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.error(...args);
  }
}

/**
 * Notification payload types the backend tags messages with. Keep in
 * sync with `subscription_service._send_payment_failure_notification`
 * and any future dispatcher (`type` field in the `data` block).
 */
type PushDataType = 'payment_failed' | string;

interface PushDataPayload {
  type?: PushDataType;
  subscription_id?: string;
  deep_link?: string;
  // Two-tier copy: the backend sends generic title/body in the
  // visible APNS alert / GCM notification block (what shows on lock
  // screen — kept generic so a passer-by can't see subscription
  // state), and the detailed copy in `in_app_title` / `in_app_body`
  // here. The foreground handler reads these when present and falls
  // back to the visible notification fields otherwise.
  in_app_title?: string;
  in_app_body?: string;
  // Additional vendor-specific keys are allowed through; we narrow as
  // we add new dispatch types.
  [k: string]: unknown;
}

class PushNotificationService {
  private userId: string | null = null;
  private initialNotificationHandled = false;

  /**
   * Initializes the push notification service.
   * Sets up handlers and checks for existing tokens.
   */
  async initialize(userId: string): Promise<void> {
    this.userId = userId;

    // 1. Handle foreground messages
    this.initializeForegroundHandler();

    // 2. Handle taps on notifications when the app is in the background.
    this.initializeBackgroundTapHandler();

    // 3. Handle the "cold-start" case: app was killed and the user
    //    tapped a notification to open it. The initial-notification
    //    handler must run AFTER the navigator mounts, so we poll-retry
    //    via setTimeout inside the handler if the ref isn't ready yet.
    this.handleColdStartNotification();

    // 4. Handle token refreshes automatically
    this.listenToTokenRefresh();

    // 5. Register the current token with the backend if we have one
    const token = await this.getFCMToken();
    if (token) {
      this.registerDeviceWithBackend(token);
    }
  }

  /**
   * Request OS notification permission for both Android and iOS.
   */
  private async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled && Platform.OS === 'ios') {
        devWarn('iOS Notification permission not granted');
      }

      return enabled;
    } catch (error) {
      devError('Permission request error:', error);
      return false;
    }
  }

  /**
   * Get the FCM token for this device, prioritizing the live token.
   */
  async getFCMToken(): Promise<string | undefined> {
    try {
      // On iOS, we must register for remote messages first
      if (Platform.OS === 'ios') {
        await messaging().registerDeviceForRemoteMessages();
      }

      // Always try to get the fresh token from Firebase first
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        await AsyncStorage.setItem('fcmToken', fcmToken);
        return fcmToken;
      }

      // Fallback to cached token if Firebase is unavailable
      return await AsyncStorage.getItem('fcmToken') || undefined;
    } catch (error: unknown) {
      // Narrow before reading .message — the rest of this service uses
      // the same `unknown` + instanceof pattern, and `any` here was the
      // last hold-out flagged in code review.
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('no apns token specified')) {
        devWarn(
          'FCM Warning: No APNs token available. This is expected on iOS Simulator. Push notifications will not work.',
        );
        return undefined;
      }
      devError('Error getting FCM token:', error);
      return await AsyncStorage.getItem('fcmToken') || undefined;
    }
  }

  /**
   * Listens for FCM token refreshes and syncs with the backend.
   */
  private listenToTokenRefresh(): void {
    messaging().onTokenRefresh((token: string) => {
      AsyncStorage.setItem('fcmToken', token);
      if (this.userId) {
        this.registerDeviceWithBackend(token);
      }
    });
  }

  /**
   * Sends the device registration to the backend.
   */
  private async registerDeviceWithBackend(token: string): Promise<void> {
    if (!this.userId) return;

    try {
      await registerDeviceApiService.registerDevice({
        device_token: token,
        platform: Platform.OS,
      });
      devLog(`Device registered successfully for user ${this.userId} on ${Platform.OS}`);
    } catch (error) {
      devError('Failed to register device with backend:', error);
    }
  }

  /**
   * Prompts the user for permission and registers the device.
   */
  async promptForNotificationPermissionAndRegister(userId: string): Promise<void> {
    this.userId = userId;

    return new Promise(resolve => {
      Alert.alert(
        'Stay Connected',
        'Would you like to receive daily reminders and archetype insights from Mirror Collective?',
        [
          {
            text: 'Not now',
            style: 'cancel',
            onPress: () => resolve(),
          },
          {
            text: 'Enable',
            onPress: () => {
              (async () => {
                try {
                  const enabled = await this.requestPermission();
                  if (enabled) {
                    const token = await this.getFCMToken();
                    if (token) {
                      await this.registerDeviceWithBackend(token);
                    }
                  }
                } catch (error) {
                  devError('Error in permission/registration flow:', error);
                } finally {
                  resolve();
                }
              })();
            },
          },
        ],
        { cancelable: true },
      );
    });
  }

  /**
   * Handle incoming FCM messages while app is in foreground.
   *
   * Branches on `data.type` so domain-specific notifications can drive
   * the right in-app UX:
   *   - `payment_failed` → action-bearing alert with "Update Payment"
   *     CTA that deep-links to YourSubscription. Real-money flow, so
   *     a blocking alert is the right affordance until the Figma-defined
   *     custom banner ships (TODO: replace this with the designed in-app
   *     banner once `docs/visual-qa/payment-failure-push/` lands).
   *   - default → generic informational alert.
   */
  initializeForegroundHandler(): void {
    messaging().onMessage(async (remoteMessage: any) => {
      const data: PushDataPayload = remoteMessage.data ?? {};
      // Visible-notification copy. Generic for lock-screen safety; the
      // server now sends "Mirror Collective" / "Tap to open" here and
      // tucks the detailed copy into data.in_app_title / data.in_app_body.
      const visibleTitle = remoteMessage.notification?.title || 'Mirror Collective';
      const fallbackBody =
        typeof data.message === 'string' ? (data.message as string) : 'New insight available';
      const visibleBody = remoteMessage.notification?.body || fallbackBody;

      if (data.type === 'payment_failed') {
        // Prefer the rich in-app copy from the data block. The visible
        // notification copy is intentionally generic so the lock screen
        // doesn't reveal the user's subscription state.
        const title = data.in_app_title || visibleTitle;
        const body = data.in_app_body || visibleBody;
        Alert.alert(title, body, [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Update Payment',
            onPress: () => {
              this.handlePaymentFailureTap(data);
            },
          },
        ]);
        return;
      }

      Alert.alert(visibleTitle, visibleBody, [{ text: 'View' }]);
    });
  }

  /**
   * Handle a tap on a notification that arrived while the app was
   * backgrounded but still running. React Navigation is mounted at
   * this point — `safeNavigate` will succeed immediately.
   */
  private initializeBackgroundTapHandler(): void {
    messaging().onNotificationOpenedApp((remoteMessage: any) => {
      const data: PushDataPayload = remoteMessage?.data ?? {};
      this.routeFromData(data);
    });
  }

  /**
   * Handle the cold-start case: app was killed, user tapped the
   * notification to open it. `getInitialNotification` resolves once
   * per launch; we no-op on subsequent calls so a re-mount of the
   * service doesn't re-navigate.
   *
   * The navigator may not be mounted yet at this point — `safeNavigate`
   * returns false and we retry once on a short setTimeout. Good enough
   * for the cold-start window; subsequent taps go through the
   * background handler which doesn't have this race.
   */
  private async handleColdStartNotification(): Promise<void> {
    if (this.initialNotificationHandled) {
      return;
    }
    this.initialNotificationHandled = true;
    try {
      const remoteMessage = await messaging().getInitialNotification();
      if (!remoteMessage) {
        return;
      }
      const data: PushDataPayload = remoteMessage.data ?? {};
      // First attempt; if the container isn't ready, retry once after
      // 250 ms — covers the typical cold-start mount delay without
      // looping forever if something else is broken.
      //
      // The retry only guards against the "navigator not yet mounted"
      // race. If the user is unauthenticated at cold-start, the gated
      // YourSubscription route won't actually accept the user even
      // when safeNavigate succeeds — we log that in dev so it's not a
      // completely silent miss.
      if (!this.routeFromData(data)) {
        setTimeout(() => {
          const routed = this.routeFromData(data);
          if (!routed && __DEV__) {
            // eslint-disable-next-line no-console
            devWarn(
              'Cold-start push could not be routed after 250 ms retry — '
              + 'navigator likely never mounted or user is unauthenticated. '
              + 'Payload type:',
              data.type,
            );
          }
        }, 250);
      }
    } catch (error) {
      devError('Cold-start notification handling failed:', error);
    }
  }

  /**
   * Route a push payload to the correct screen based on `data.type` /
   * `data.deep_link`. Returns whether the navigation actually
   * dispatched — callers use the return value to retry on cold-start.
   */
  private routeFromData(data: PushDataPayload): boolean {
    if (data.type === 'payment_failed') {
      return this.handlePaymentFailureTap(data);
    }
    return false;
  }

  /**
   * Deep-link to YourSubscription. Android currently lands on the
   * same screen — the in-app "manage subscription" affordance there
   * has a `Platform.OS === 'android'` branch that opens the Play
   * Store subscription page (placeholder URL until the v1 Android
   * launch).
   */
  private handlePaymentFailureTap(_data: PushDataPayload): boolean {
    return safeNavigate('YourSubscription');
  }

  /**
   * Unregisters the current device from the backend.
   * Useful during logout to prevent further notifications to this device.
   */
  async unregisterDevice(): Promise<void> {
    try {
      const token = await this.getFCMToken();
      if (token) {
        await registerDeviceApiService.unregisterDevice(token);
        devLog('Device unregistered successfully from backend');
      }
      // Also clear local token cache
      await AsyncStorage.removeItem('fcmToken');
    } catch (error) {
      devError('Failed to unregister device:', error);
    }
  }
}

export default new PushNotificationService();
