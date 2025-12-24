import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ErrorBoundary from './src/components/ErrorBoundary';
import { ChatErrorBoundary } from './src/components/error';
import { AuthProvider } from './src/context/AuthContext';
import useAppStateHandler from './src/hooks/useAppStateHandler';
import type { RootStackParamList } from './src/types';

// Import your screens
import SplashScreen from './src/screens/SplashScreen';
import MirrorAnimationScreen from './src/screens/MirrorAnimationScreen';
import EnterMirrorScreen from './src/screens/EnterMirrorScreen';
import EmailConfirmationScreen from './src/screens/EmailConfirmationScreen';
import AppVideoScreen from './src/screens/AppVideoScreen';
import TalkToMirrorScreen from './src/screens/TalkToMirrorScreen';
import AppExplainerScreen from './src/screens/AppExplainerScreen';
import LoginScreen from './src/screens/LoginScreen';
import MirrorChatScreen from './src/screens/MirrorChatScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import QuizWelcomeScreen from './src/screens/QuizWelcomeScreen';
import QuizTuningScreen from './src/screens/QuizTuningScreen';
import QuizQuestionsScreen from './src/screens/QuizQuestionsScreen';
import ArchetypeScreen from './src/screens/ArchetypeScreen';
const Stack = createNativeStackNavigator<RootStackParamList>();

// Wrapped MirrorChat component with error boundary
const MirrorChatWithErrorBoundary = () => (
  <ChatErrorBoundary>
    <MirrorChatScreen />
  </ChatErrorBoundary>
);

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
      <Stack.Screen name="EmailConfirmation" component={EmailConfirmationScreen} />
      <Stack.Screen name="AppVideo" component={AppVideoScreen} />
      <Stack.Screen name="TalkToMirror" component={TalkToMirrorScreen} />
      <Stack.Screen name="AppExplanation" component={AppExplainerScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="MirrorChat" component={MirrorChatWithErrorBoundary} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="QuizQuestions" component={QuizQuestionsScreen} />
      <Stack.Screen name="QuizTuning" component={QuizTuningScreen} />
      <Stack.Screen name="QuizWelcome" component={QuizWelcomeScreen} />
      <Stack.Screen name="Archetype" component={ArchetypeScreen} />
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
    onBackground: async () => {
      if (__DEV__) {
        console.log('App went to background - clearing authentication');
      }
      // Clear authentication tokens when app goes to background
      // This ensures the user will need to login again when returning to the app
      try {
        const { authApiService } = await import('./src/services/api');
        await authApiService.clearTokens();
        console.log('Authentication cleared on background');
      } catch (error) {
        console.warn('Failed to clear auth on background:', error);
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
