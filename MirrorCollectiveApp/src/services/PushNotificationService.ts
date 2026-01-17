import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { Platform } from 'react-native';
import { registerDeviceApiService } from './api/register-device';

// AWS SDK v3
// import {
//   SNSClient,
// } from '@aws-sdk/client-sns';

// type PlatformType = 'android';

// const sns = new SNSClient({
//   region: 'us-east-1',
//   credentials: {
//     accessKeyId: '',
//     secretAccessKey: '',
//   },
// });

// const PLATFORM_ARNS: Record<PlatformType, string> = {
//   android: '',
// };

// interface MessagePayload {
//   title: string;
//   body: string;
// }

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

  //   private async registerWithSNS(deviceToken: string): Promise<string | undefined> {
  //     try {
  //       const platform = Platform.OS as PlatformType;
  //       const platformArn = PLATFORM_ARNS[platform];

  //       if (!platformArn) {
  //         throw new Error(`Platform ARN not found for ${platform}`);
  //       }

  //       const command = new CreatePlatformEndpointCommand({
  //         PlatformApplicationArn: platformArn,
  //         Token: deviceToken,
  //         CustomUserData: JSON.stringify({
  //           userId: '',
  //           platform,
  //         }),
  //       });

  //       const result = await sns.send(command);

  //       if (result.EndpointArn) {
  //         console.log('SNS Endpoint ARN:', result.EndpointArn);
  //         await AsyncStorage.setItem('snsEndpointArn', result.EndpointArn);
  //         return result.EndpointArn;
  //       }
  //     } catch (error: any) {
  //       console.error('Error registering with SNS:', error);

  //       if (
  //         error.name === 'InvalidParameterException' &&
  //         error.message.includes('already exists')
  //       ) {
  //         const existingArn = this.extractEndpointArnFromError(error.message);
  //         if (existingArn) {
  //           await AsyncStorage.setItem('snsEndpointArn', existingArn);
  //           return existingArn;
  //         }
  //       }
  //     }
  //   }

  //   private extractEndpointArnFromError(errorMessage: string): string | null {
  //     const match = errorMessage.match(/arn:aws:sns:[^"]+/);
  //     return match ? match[0] : null;
  //   }

  //   private setupListeners(): void {
  //     messaging().onMessage(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
  //       console.log('Foreground message:', remoteMessage);
  //       Alert.alert(
  //         JSON.stringify(remoteMessage.data?.title) || 'Notification',
  //         JSON.stringify(remoteMessage.data?.message) || 'New message received'
  //       );
  //     });

  //     messaging().setBackgroundMessageHandler(
  //       async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
  //         console.log('Background message:', remoteMessage);
  //       }
  //     );

  //     messaging().getInitialNotification().then((remoteMessage) => {
  //       if (remoteMessage) {
  //         console.log('App opened from notification:', remoteMessage);
  //       }
  //     });

  //     messaging().onNotificationOpenedApp(
  //       (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
  //         console.log('App opened from background notification:', remoteMessage);
  //       }
  //     );

  //     messaging().onTokenRefresh((token: string) => {
  //       console.log('Token refreshed:', token);
  //       this.registerWithSNS(token);
  //     });
  //   }

  //   public async sendNotification(
  //     message: MessagePayload,
  //     targetArn?: string
  //   ): Promise<void> {
  //     try {
  //       const baseMessage = JSON.stringify({
  //         default: message.body,
  //         APNS: JSON.stringify({
  //           aps: {
  //             alert: { title: message.title, body: message.body },
  //             sound: 'default',
  //             badge: 1,
  //           },
  //         }),
  //         GCM: JSON.stringify({
  //           data: { title: message.title, body: message.body },
  //           notification: { title: message.title, body: message.body, sound: 'default' },
  //         }),
  //       });

  //       const command = new PublishCommand({
  //         Message: baseMessage,
  //         MessageStructure: 'json',
  //         ...(targetArn
  //           ? { TargetArn: targetArn }
  //           : { TopicArn: '' }),
  //       });

  //       const result = await sns.send(command);
  //       console.log('Notification sent:', result.MessageId);
  //     } catch (error) {
  //       console.error('Error sending notification:', error);
  //     }
  //   }

  //   public async subscribeToTopic(topicArn: string): Promise<string | undefined> {
  //     try {
  //       const endpointArn = await AsyncStorage.getItem('snsEndpointArn');
  //       if (!endpointArn) {
  //         throw new Error('Endpoint ARN not found');
  //       }

  //       const command = new SubscribeCommand({
  //         Protocol: 'application',
  //         TopicArn: topicArn,
  //         Endpoint: endpointArn,
  //       });

  //       const result = await sns.send(command);
  //       console.log('Subscribed to topic:', result.SubscriptionArn);
  //       return result.SubscriptionArn;
  //     } catch (error) {
  //       console.error('Error subscribing to topic:', error);
  //     }
  //   }

  //   public async getStoredData(): Promise<{
  //     fcmToken: string | null;
  //     endpointArn: string | null;
  //   }> {
  //     try {
  //       const fcmToken = await AsyncStorage.getItem('fcmToken');
  //       const endpointArn = await AsyncStorage.getItem('snsEndpointArn');
  //       return { fcmToken, endpointArn };
  //     } catch (error) {
  //       console.error('Error getting stored data:', error);
  //       return { fcmToken: null, endpointArn: null };
  //     }
  //   }
}

export default new PushNotificationService();
