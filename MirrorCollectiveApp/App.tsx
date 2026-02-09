import '@i18n'; // Initialize i18n configuration
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@types';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ChatErrorBoundary } from '@components/error';
import { SessionProvider, useSession } from '@context/SessionContext';
import { UserProvider } from '@context/UserContext';
import useAppStateHandler from '@hooks/useAppStateHandler';
// Import your screens
import AboutScreen from '@screens/AboutScreen';
import AppExplainerScreen from '@screens/AppExplainerScreen';
import AppVideoScreen from '@screens/AppVideoScreen';
import ArchetypeScreen from '@screens/ArchetypeScreen';
import CheckoutScreen from '@screens/CheckoutScreen';
import AddNewProfileScreen from '@screens/echoVault/AddNewProfileScreen';
import ChooseGuardianScreen from '@screens/echoVault/ChooseGuardianScreen';
import ChooseRecipientScreen from '@screens/echoVault/ChooseRecipientScreen';
import EchoAudioPlaybackScreen from '@screens/echoVault/EchoAudioPlaybackScreen';
import EchoDetailScreen from '@screens/echoVault/EchoDetailScreen';
import MirrorEchoVaultHomeScreen from '@screens/echoVault/EchoVaultHomeScreen';
import MirrorEchoVaultLibraryScreen from '@screens/echoVault/EchoVaultLibraryScreen';
import EchoVideoPlaybackScreen from '@screens/echoVault/EchoVideoPlaybackScreen';
import ManageGuardianScreen from '@screens/echoVault/ManageGuardianScreen';
import ManageRecipientScreen from '@screens/echoVault/ManageRecipientScreen';
import NewEchoAudioScreen from '@screens/echoVault/NewEchoAudioScreen';
import NewEchoComposeScreen from '@screens/echoVault/NewEchoComposeScreen';
import NewEchoScreen from '@screens/echoVault/NewEchoVaultScreen';
import NewEchoVideoScreen from '@screens/echoVault/NewEchoVideoScreen';
import EchoVaultStorageScreen from '@screens/EchoVaultStorageScreen';
import EmailConfirmationScreen from '@screens/EmailConfirmationScreen';
import EnterMirrorScreen from '@screens/EnterMirrorScreen';
import FAQScreen from '@screens/FAQScreen';
import ForgotPasswordScreen from '@screens/ForgotPasswordScreen';
import LoginScreen from '@screens/LoginScreen';
import MirrorAnimationScreen from '@screens/MirrorAnimationScreen';
import MirrorChatScreen from '@screens/MirrorChatScreen';
import MirrorCodeLibraryCommingsoonScreen from '@screens/MirrorCodeLibraryCommingsoonScreen';
import MirrorEchoCommingsoonScreen from '@screens/MirrorEchoCommingsoonScreen';
import ProfileScreen from '@screens/ProfileScreen';
import QuizQuestionsScreen from '@screens/QuizQuestionsScreen';
import QuizTuningScreen from '@screens/QuizTuningScreen';
import QuizWelcomeScreen from '@screens/QuizWelcomeScreen';
import ReflectionRoomCommingsoonScreen from '@screens/ReflectionRoomCommingsoonScreen';
import ResetPasswordScreen from '@screens/ResetPasswordScreen';
import SignUpScreen from '@screens/SignUpScreen';
import SplashScreen from '@screens/SplashScreen';
import StartFreeTrialScreen from '@screens/StartFreeTrialScreen';
import TalkToMirrorScreen from '@screens/TalkToMirrorScreen';
import TermsAndConditionsScreen from '@screens/TermsAndConditionsScreen';
import TheMirrorPledgeCommingsoonScreen from '@screens/TheMirrorPledgeCommingsoonScreen';
import VerifyEmailScreen from '@screens/VerifyEmailScreen';
import PushNotificationService from '@services/PushNotificationService';

import ErrorBoundary from './src/components/ErrorBoundary';
const Stack = createNativeStackNavigator<RootStackParamList>();
// Wrapped MirrorChat component with error boundary
const MirrorChatWithErrorBoundary = () => (
  <ChatErrorBoundary>
    <MirrorChatScreen />
  </ChatErrorBoundary>
);
// Auth Navigator (Public + Onboarding)
const AuthNavigator = () => (
  <Stack.Navigator
    initialRouteName="Splash"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen
      name="ManageGuardianScreen"
      component={ManageGuardianScreen}
    />
    <Stack.Screen
      name="EchoVideoPlaybackScreen"
      component={EchoVideoPlaybackScreen}
    />
    <Stack.Screen
      name="EchoAudioPlaybackScreen"
      component={EchoAudioPlaybackScreen}
    />
    <Stack.Screen name="EchoDetailScreen" component={EchoDetailScreen} />
    <Stack.Screen
      name="ChooseGuardianScreen"
      component={ChooseGuardianScreen}
    />
    <Stack.Screen
      name="ChooseRecipientScreen"
      component={ChooseRecipientScreen}
    />
    <Stack.Screen name="AddNewProfileScreen" component={AddNewProfileScreen} />
    <Stack.Screen name="NewEchoVideoScreen" component={NewEchoVideoScreen} />
    <Stack.Screen name="NewEchoAudioScreen" component={NewEchoAudioScreen} />
    <Stack.Screen
      name="NewEchoComposeScreen"
      component={NewEchoComposeScreen}
    />
    <Stack.Screen name="NewEchoScreen" component={NewEchoScreen} />
    <Stack.Screen
      name="MirrorEchoVaultLibrary"
      component={MirrorEchoVaultLibraryScreen}
    />
    <Stack.Screen
      name="MirrorEchoVaultHome"
      component={MirrorEchoVaultHomeScreen}
    />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen
      name="TheMirrorPledge"
      component={TheMirrorPledgeCommingsoonScreen}
    />
    <Stack.Screen name="About" component={AboutScreen} />
    <Stack.Screen name="FAQ" component={FAQScreen} />
    <Stack.Screen
      name="MirrorCodeLibrary"
      component={MirrorCodeLibraryCommingsoonScreen}
    />
    <Stack.Screen
      name="ReflectionRoom"
      component={ReflectionRoomCommingsoonScreen}
    />
    <Stack.Screen name="MirrorEcho" component={MirrorEchoCommingsoonScreen} />
    <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
    <Stack.Screen name="StartFreeTrial" component={StartFreeTrialScreen} />
    <Stack.Screen name="Checkout" component={CheckoutScreen} />
    <Stack.Screen name="EchoVaultStorage" component={EchoVaultStorageScreen} />
    <Stack.Screen name="Splash" component={SplashScreen} />
    <Stack.Screen name="MirrorAnimation" component={MirrorAnimationScreen} />
    <Stack.Screen name="AppExplanation" component={AppExplainerScreen} />
    {/* Quiz Flow (Pre-Auth) */}
    <Stack.Screen name="QuizWelcome" component={QuizWelcomeScreen} />
    <Stack.Screen name="QuizTuning" component={QuizTuningScreen} />
    <Stack.Screen name="QuizQuestions" component={QuizQuestionsScreen} />
    <Stack.Screen name="Archetype" component={ArchetypeScreen} />
    {/* Authentication */}
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="SignUp" component={SignUpScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
    <Stack.Screen
      name="EmailConfirmation"
      component={EmailConfirmationScreen}
    />
  </Stack.Navigator>
);

// Authenticated Navigator (Private)
const AuthenticatedNavigator = () => (
  <Stack.Navigator
    initialRouteName="EnterMirror"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="EnterMirror" component={EnterMirrorScreen} />
    <Stack.Screen name="AppVideo" component={AppVideoScreen} />
    <Stack.Screen name="TalkToMirror" component={TalkToMirrorScreen} />
    <Stack.Screen name="MirrorChat" component={MirrorChatWithErrorBoundary} />
    {/* Profile & Settings */}
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="About" component={AboutScreen} />
    <Stack.Screen name="FAQ" component={FAQScreen} />
    {/* Menu Screens */}
    <Stack.Screen name="MirrorCodeLibrary" component={MirrorCodeLibraryCommingsoonScreen} />
    <Stack.Screen name="ReflectionRoom" component={ReflectionRoomCommingsoonScreen} />
    <Stack.Screen name="TheMirrorPledge" component={TheMirrorPledgeCommingsoonScreen} />
    {/* Echo Vault Screens */}
    <Stack.Screen name="MirrorEchoVaultHome" component={MirrorEchoVaultHomeScreen} />
    <Stack.Screen name="MirrorEchoVaultLibrary" component={MirrorEchoVaultLibraryScreen} />
    <Stack.Screen name="NewEchoScreen" component={NewEchoScreen} />
    <Stack.Screen name="NewEchoComposeScreen" component={NewEchoComposeScreen} />
    <Stack.Screen name="NewEchoAudioScreen" component={NewEchoAudioScreen} />
    <Stack.Screen name="NewEchoVideoScreen" component={NewEchoVideoScreen} />
    <Stack.Screen name="ManageGuardianScreen" component={ManageGuardianScreen} />
    <Stack.Screen name="ManageRecipientScreen" component={ManageRecipientScreen} />
    <Stack.Screen name="ChooseGuardianScreen" component={ChooseGuardianScreen} />
    <Stack.Screen name="ChooseRecipientScreen" component={ChooseRecipientScreen} />
    <Stack.Screen name="AddNewProfileScreen" component={AddNewProfileScreen} />
    <Stack.Screen name="EchoDetailScreen" component={EchoDetailScreen} />
    <Stack.Screen name="EchoAudioPlaybackScreen" component={EchoAudioPlaybackScreen} />
    <Stack.Screen name="EchoVideoPlaybackScreen" component={EchoVideoPlaybackScreen} />
    <Stack.Screen name="Checkout" component={CheckoutScreen} />
  </Stack.Navigator>
);

// Main Navigator that switches based on auth state
const AppNavigator = () => {
  const { state } = useSession();
  const { isAuthenticated } = state;

  // Optionally show a loading screen while session is restoring
  // if (isLoading) {
  //   // Cast SplashScreen or pass mock props since it's just a loader here
  //   return <SplashScreen navigation={null as any} />;
  // }

  return (
    <NavigationContainer
      onStateChange={navState => {
        if (__DEV__) {
          console.log('Navigation state changed:', navState);
        }
      }}
    >
      {isAuthenticated ? <AuthenticatedNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const App = () => {
  useAppStateHandler({
    onForeground: async () => {
      if (__DEV__) {
        console.log('App came to foreground');
      }

      // Try to submit any pending offline quiz results
      try {
        const { QuizStorageService } = await import(
          '@services/quizStorageService'
        );
        await QuizStorageService.retryPendingSubmissions();
      } catch (error) {
        console.warn('Failed to retry quiz submissions on foreground:', error);
      }
    },
    onBackground: async () => {
      if (__DEV__) {
        console.log('App went to background');
      }
      // Session persistence is now preferred over forced logout
    },
  });

  useEffect(() => {
    // Set up foreground push notification handling.
    // This does not show a system permission prompt; it only
    // decides what happens when a push arrives while the app
    // is open.
    PushNotificationService.initializeForegroundHandler();
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <SessionProvider>
          <UserProvider>
            <React.Fragment>
              <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle="light-content"
              />
              <AppNavigator />
            </React.Fragment>
          </UserProvider>
        </SessionProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
};

export default App;
