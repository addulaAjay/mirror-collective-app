import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';

import { registerDeviceApiService } from '@services/api/register-device';


class PushNotificationService {
  /**
   * Request OS notification permission (Android only for now).
   * Returns true when notifications are enabled.
   */
  private async requestPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        Alert.alert('Permission denied', 'Push notifications are disabled');
      }

      return enabled;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  /**
   * Get or create the FCM token for this device.
   * The token is cached in AsyncStorage.
   */
  async getFCMToken(): Promise<string | undefined> {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      const storedToken = await AsyncStorage.getItem('fcmToken');
      if (storedToken) {
        return storedToken;
      }

      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        await AsyncStorage.setItem('fcmToken', fcmToken);
        console.log('FCM Token:', fcmToken);
        return fcmToken;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
    }

    return undefined;
  }

  /**
   * Ensure the device is registered with the backend, then
   * optionally ask the user if they want to see notifications.
   *
   * - Device registration (with FCM token) always happens when
   *   this method is called and a token is available.
   * - The Alert only controls whether OS-level notification
   *   permission is requested, i.e. whether notifications show.
   */
  async promptForNotificationPermissionAndRegister(
    userId: string,
  ): Promise<void> {
    if (!userId) {
      return;
    }
    try {
      const fcmToken = await this.getFCMToken();
      if (!fcmToken) {
        console.warn('No FCM token available for registration');
        return;
      }

      // Always register the device with the backend
      await registerDeviceApiService.registerDevice({
        user_id: userId,
        device_token: fcmToken,
      });
    } catch (error) {
      console.error('Error registering device with backend:', error);
    }

    // Now independently ask if the user wants to enable notifications.
    // Saying "Not now" keeps the device registered but does not
    // request OS notification permission, so notifications won't show.
    return new Promise(resolve => {
      Alert.alert(
        'Allow notifications',
        'Would you like to receive notifications from Mirror Collective?',
        [
          {
            text: 'Not now',
            style: 'cancel',
            onPress: () => resolve(),
          },
          {
            text: 'Allow',
            onPress: () => {
              (async () => {
                try {
                  await this.requestPermission();
                } catch (error) {
                  console.error(
                    'Error requesting notification permission:',
                    error,
                  );
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
   * Handle incoming FCM messages while the app is in the foreground.
   *
   * By default, Android does not show a system notification banner
   * when the app is open. This sets up an in-app handler so the
   * user still sees something when a push arrives.
   */
  initializeForegroundHandler(): void {
    if (Platform.OS !== 'android') {
      return;
    }

    messaging().onMessage(async remoteMessage => {
      try {
        const title =
          remoteMessage.notification?.title || 'Mirror Collective';
        const body = remoteMessage.notification?.body ||
          (typeof remoteMessage.data?.message === 'string'
            ? remoteMessage.data?.message
            : 'New message received');

        Alert.alert(title, body);
      } catch (error) {
        console.error('Error handling foreground notification:', error);
      }
    });
  }
}

export default new PushNotificationService();
