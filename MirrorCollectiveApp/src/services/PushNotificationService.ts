import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging, {
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';

import { registerDeviceApiService } from '@services/api/register-device';
import { navigate } from '@services/navigationRef';

type RemoteMessage = FirebaseMessagingTypes.RemoteMessage;

class PushNotificationService {
  private userId: string | null = null;
  private tapHandlersBound = false;

  /**
   * Initializes the push notification service.
   * Sets up handlers and checks for existing tokens.
   */
  async initialize(userId: string): Promise<void> {
    this.userId = userId;

    // 1. Handle foreground messages
    this.initializeForegroundHandler();

    // 2. Handle taps that bring the app from background → foreground, and the
    //    cold-start case (app launched by tapping a notification).
    this.initializeTapHandlers();

    // 3. Handle token refreshes automatically
    this.listenToTokenRefresh();

    // 4. Request OS notification permission so pushes actually DISPLAY. Without
    //    this, iOS never shows the system prompt and notifications are silently
    //    suppressed (the FCM token still registers, so delivery "works" but the
    //    user sees nothing). iOS only shows the dialog once; later calls just
    //    return the current status, so calling on every init is safe.
    await this.requestPermission();

    // 5. Register the current token with the backend if we have one
    const token = await this.getDeviceToken();
    if (token) {
      this.registerDeviceWithBackend(token);
    }
  }

  /**
   * Route a notification to its in-app destination based on the `data` payload
   * the backend attaches (see SoulPing.push_data on the API side). Soul Pings
   * carry their copy on the notification block, so we pass it through as params
   * and the SoulPing screen renders without a fetch. Returns true if handled.
   */
  private routeFromMessage(remoteMessage: RemoteMessage | null): boolean {
    const data = remoteMessage?.data ?? {};
    if (data.type === 'soul_ping') {
      navigate('SoulPing', {
        pingId: typeof data.ping_id === 'string' ? data.ping_id : undefined,
        category: typeof data.category === 'string' ? data.category : undefined,
        title: remoteMessage?.notification?.title,
        body: remoteMessage?.notification?.body,
      });
      return true;
    }
    return false;
  }

  /**
   * Bind background-tap + cold-start handlers exactly once.
   * - onNotificationOpenedApp: tapped while app was backgrounded.
   * - getInitialNotification: tapped while app was killed (cold start). The
   *   navigate() call queues until NavigationContainer.onReady flushes it.
   */
  private initializeTapHandlers(): void {
    if (this.tapHandlersBound) return;
    this.tapHandlersBound = true;

    messaging().onNotificationOpenedApp(remoteMessage => {
      this.routeFromMessage(remoteMessage);
    });

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          this.routeFromMessage(remoteMessage);
        }
      })
      .catch(err =>
        console.error('getInitialNotification failed:', err),
      );
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
        console.warn('iOS Notification permission not granted');
      }

      return enabled;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  /**
   * Get the push token to register with the backend (SNS).
   *
   * SNS-native delivery: iOS registers its RAW APNs device token directly
   * against the SNS APNS platform application. We must NOT send the Firebase
   * FCM token here — SNS's APNS app rejects it with `InvalidParameter` on
   * CreatePlatformEndpoint (an FCM token isn't an APNs token). The APNs token
   * can be momentarily null right after registration, so we retry once.
   *
   * Android is parked (iOS-only focus); it keeps the FCM token for if/when a
   * GCM/FCM platform app is wired.
   */
  async getDeviceToken(): Promise<string | undefined> {
    try {
      if (Platform.OS === 'ios') {
        await messaging().registerDeviceForRemoteMessages();
        let apns = await messaging().getAPNSToken();
        if (!apns) {
          // APNs may not have returned the token yet on a cold start.
          await new Promise(res => setTimeout(res, 1500));
          apns = await messaging().getAPNSToken();
        }
        if (apns) {
          await AsyncStorage.setItem('deviceToken', apns);
          return apns;
        }
        console.warn(
          'No APNs token yet (iOS Simulator, or permission/registration pending). Push will not work until one is available.',
        );
        return (await AsyncStorage.getItem('deviceToken')) || undefined;
      }

      // Android (parked) — FCM token.
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        await AsyncStorage.setItem('deviceToken', fcmToken);
        return fcmToken;
      }
      return (await AsyncStorage.getItem('deviceToken')) || undefined;
    } catch (error: any) {
      console.error('Error getting device token:', error);
      return (await AsyncStorage.getItem('deviceToken')) || undefined;
    }
  }

  /**
   * Sync token changes to the backend. FCM token refresh only matters for
   * Android (parked); on iOS we register the raw APNs token, which
   * onTokenRefresh does NOT provide — so we skip iOS here to avoid ever
   * registering an FCM token against the APNS platform app.
   */
  private listenToTokenRefresh(): void {
    if (Platform.OS === 'ios') return;
    messaging().onTokenRefresh((token: string) => {
      AsyncStorage.setItem('deviceToken', token);
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
      console.log(`Device registered successfully for user ${this.userId} on ${Platform.OS}`);
    } catch (error) {
      console.error('Failed to register device with backend:', error);
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
                    const token = await this.getDeviceToken();
                    if (token) {
                      await this.registerDeviceWithBackend(token);
                    }
                  }
                } catch (error) {
                  console.error('Error in permission/registration flow:', error);
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
   */
  initializeForegroundHandler(): void {
    messaging().onMessage(async (remoteMessage: RemoteMessage) => {
      const title = remoteMessage.notification?.title || 'Mirror Collective';
      const body =
        remoteMessage.notification?.body ||
        (typeof remoteMessage.data?.message === 'string'
          ? remoteMessage.data?.message
          : 'New insight available');

      // Foreground messages don't auto-display; offer to open the in-app
      // destination. "View" routes via the same deep-link path as a tap.
      Alert.alert(title, body, [
        { text: 'Dismiss', style: 'cancel' },
        { text: 'View', onPress: () => this.routeFromMessage(remoteMessage) },
      ]);
    });
  }

  /**
   * Unregisters the current device from the backend.
   * Useful during logout to prevent further notifications to this device.
   */
  async unregisterDevice(): Promise<void> {
    try {
      const token = await this.getDeviceToken();
      if (token) {
        await registerDeviceApiService.unregisterDevice(token);
        console.log('Device unregistered successfully from backend');
      }
      // Also clear local token cache
      await AsyncStorage.removeItem('deviceToken');
    } catch (error) {
      console.error('Failed to unregister device:', error);
    }
  }
}

export default new PushNotificationService();
