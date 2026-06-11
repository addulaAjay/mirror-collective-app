/**
 * @format
 */

import 'react-native-gesture-handler';
import messaging from '@react-native-firebase/messaging';
import { AppRegistry } from 'react-native';

import App from './App';
import { name as appName } from './app.json';
import { installFontScaleGuard } from './src/theme/fontScaling';

// Cap OS font scaling app-wide so large accessibility text settings don't
// overflow fixed layouts. Must run before any <Text> mounts.
installFontScaleGuard();

// Background / quit-state FCM handler. Must be registered at module scope
// (outside React). The OS auto-displays the notification block; tap routing is
// handled in PushNotificationService (onNotificationOpenedApp /
// getInitialNotification). This no-op satisfies FCM's requirement and is where
// any future data-only processing would live.
messaging().setBackgroundMessageHandler(async () => {});

AppRegistry.registerComponent(appName, () => App);
