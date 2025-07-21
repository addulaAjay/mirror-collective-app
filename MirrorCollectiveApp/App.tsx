import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ErrorBoundary from './src/components/ErrorBoundary';
import { AuthProvider } from './src/context/AuthContext';
import useAppStateHandler from './src/hooks/useAppStateHandler';

// Import your screens
import SplashScreen from './src/screens/SplashScreen';
import MirrorAnimationScreen from './src/screens/MirrorAnimationScreen';
import EnterMirrorScreen from './src/screens/EnterMirrorScreen';
import AppExplainerScreen from './src/screens/AppExplainerScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import MirrorGPTScreen from './src/screens/MirrorGPTScreen';

// Define navigation types
export type RootStackParamList = {
  Splash: undefined;
  MirrorAnimation: undefined;
  EnterMirror: undefined;
  AppExplanation: undefined;
  Login: undefined;
  SignUp: undefined;
  VerifyEmail: { email: string; fullName: string };
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  MirrorGPT: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Authentication-aware navigator
const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false, // Hide headers for full-screen look
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="MirrorAnimation" component={MirrorAnimationScreen} />
      <Stack.Screen name="EnterMirror" component={EnterMirrorScreen} />
      <Stack.Screen name="AppExplanation" component={AppExplainerScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="MirrorGPT" component={MirrorGPTScreen} />
    </Stack.Navigator>
  );
};

const App = () => {
  // Handle app state changes for better crash recovery
  useAppStateHandler({
    onForeground: () => {
      if (__DEV__) {
        console.log('App came to foreground');
      }
    },
    onBackground: () => {
      if (__DEV__) {
        console.log('App went to background');
      }
    },
  });

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NavigationContainer
          onStateChange={state => {
            // Optional: Log navigation state changes for debugging
            if (__DEV__) {
              console.log('Navigation state changed:', state);
            }
          }}
          onReady={() => {
            // Optional: Log when navigation is ready
            if (__DEV__) {
              console.log('Navigation container is ready');
            }
          }}
        >
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
