import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import your screens
import SplashScreen from './src/screens/SplashScreen';
import EnterMirrorScreen from './src/screens/EnterMirrorScreen';
import AppExplainerScreen from './src/screens/AppExplainerScreen';

// Define navigation types (optional, for better TypeScript support)
export type RootStackParamList = {
  Splash: undefined;
  EnterMirror: undefined;
  AppExplanation: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false, // Hide headers for full-screen look
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="EnterMirror" component={EnterMirrorScreen} />
        <Stack.Screen name="AppExplanation" component={AppExplainerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
