import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './src/context/AuthContext';

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

// TODO: Import authenticated screens here when they exist
// import HomeScreen from './src/screens/HomeScreen';
// import ProfileScreen from './src/screens/ProfileScreen';

// Define navigation types (optional, for better TypeScript support)
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
  // Add authenticated routes here
  // Home: undefined;
  // Profile: undefined;
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
      {/* Always include all screens to prevent navigation errors */}
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
      {/* TODO: Add authenticated screens here when they exist */}
      {/* 
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      */}
    </Stack.Navigator>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;
