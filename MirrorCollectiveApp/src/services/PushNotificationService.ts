import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';

import { registerDeviceApiService } from '@services/api/register-device';

class PushNotificationService {
  private userId: string | null = null;

  /**
   * Initializes the push notification service.
   * Sets up handlers and checks for existing tokens.
   */
  async initialize(userId: string): Promise<void> {
    this.userId = userId;

    // 1. Handle foreground messages
    this.initializeForegroundHandler();

    // 2. Handle token refreshes automatically
    this.listenToTokenRefresh();

    // 3. Register the current token with the backend if we have one
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
        console.warn('iOS Notification permission not granted');
      }

      return enabled;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  /**
   * Get the FCM token for this device, prioritizing the live token.
   */
  async getFCMToken(): Promise<string | undefined> {
    try {
      // Always try to get the fresh token from Firebase first
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        await AsyncStorage.setItem('fcmToken', fcmToken);
        return fcmToken;
      }

      // Fallback to cached token if Firebase is unavailable
      return await AsyncStorage.getItem('fcmToken') || undefined;
    } catch (error) {
      console.error('Error getting FCM token:', error);
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
                    const token = await this.getFCMToken();
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
  private initializeForegroundHandler(): void {
    messaging().onMessage(async (remoteMessage: any) => {
      const title = remoteMessage.notification?.title || 'Mirror Collective';
      const body = remoteMessage.notification?.body || 
                   (typeof remoteMessage.data?.message === 'string' ? remoteMessage.data?.message : 'New insight available');

      Alert.alert(title, body, [{ text: 'View' }]);
    });
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
        console.log('Device unregistered successfully from backend');
      }
      // Also clear local token cache
      await AsyncStorage.removeItem('fcmToken');
    } catch (error) {
      console.error('Failed to unregister device:', error);
    }
  }
}

export default new PushNotificationService();
