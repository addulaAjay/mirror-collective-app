/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';

import App from './App';
import { name as appName } from './app.json';
import { installFontScaleGuard } from './src/theme/fontScaling';

// Cap OS font scaling app-wide so large accessibility text settings don't
// overflow fixed layouts. Must run before any <Text> mounts.
installFontScaleGuard();

AppRegistry.registerComponent(appName, () => App);
