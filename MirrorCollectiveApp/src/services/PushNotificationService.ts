import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { Platform } from 'react-native';
import { registerDeviceApiService } from './api/register-device';

class PushNotificationService {
  constructor() {
    this.configure();
  }

  private async configure(): Promise<void> {
    await this.requestPermission();
    await this.getFCMToken();
  }

  private async requestPermission(): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
      } else {
        Alert.alert('Permission denied', 'Push notifications are disabled');
      }
    } catch (error) {
      console.error('Permission request error:', error);
    }
  }

  async getFCMToken(): Promise<string | undefined> {
    if (Platform.OS !== 'android') {
      return;
    }
    try {
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        await AsyncStorage.setItem('fcmToken', fcmToken);

        try {
          await registerDeviceApiService.registerDevice({
            device_token: fcmToken,
            user_id: 'xyz',
          });
        } catch (error) {
          console.error('Error registering device:', error);
        }
        console.log('FCM Token:', fcmToken);
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
    }
  }
}

export default new PushNotificationService();
