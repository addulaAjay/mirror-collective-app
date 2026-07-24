import '@i18n'; // Initialize i18n configuration
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { DarkTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ChatErrorBoundary } from '@components/error';
import { SessionProvider, useSession } from '@context/SessionContext';
import { SubscriptionProvider } from '@context/SubscriptionContext';
import { UserProvider } from '@context/UserContext';
import useAppStateHandler from '@hooks/useAppStateHandler';
import useInactivityTimer from '@hooks/useInactivityTimer';
// Import your screens
import AboutScreen from '@screens/AboutScreen';
import AppVideoScreen from '@screens/AppVideoScreen';
import ArchetypeScreen from '@screens/ArchetypeScreen';
import CheckoutScreen from '@screens/CheckoutScreen';
import AddNewProfileScreen from '@screens/echoVault/AddNewProfileScreen';
import ChooseGuardianScreen from '@screens/echoVault/ChooseGuardianScreen';
import ChooseRecipientScreen from '@screens/echoVault/ChooseRecipientScreen';
import MirrorEchoVaultHomeScreen from '@screens/echoVault/EchoVaultHomeScreen';
import EchoInboxScreen from '@screens/echoVault/EchoInboxScreen';
import MirrorEchoVaultLibraryScreen from '@screens/echoVault/EchoVaultLibraryScreen';
import ManageGuardianScreen from '@screens/echoVault/ManageGuardianScreen';
import ManageRecipientScreen from '@screens/echoVault/ManageRecipientScreen';
import NewEchoAudioScreen from '@screens/echoVault/NewEchoAudioScreen';
import NewEchoComposeScreen from '@screens/echoVault/NewEchoComposeScreen';
import CreateEchoScreen from '@screens/echoVault/CreateEchoScreen';
import NewEchoScreen from '@screens/echoVault/NewEchoVaultScreen';
import NewEchoVideoScreen from '@screens/echoVault/NewEchoVideoScreen';
import EchoVaultStorageScreen from '@screens/EchoVaultStorageScreen';
import EnterMirrorScreen from '@screens/EnterMirrorScreen';
import FAQScreen from '@screens/FAQScreen';
import ForgotPasswordScreen from '@screens/ForgotPasswordScreen';
import LoginScreen from '@screens/LoginScreen';
import MirrorAnimationScreen from '@screens/MirrorAnimationScreen';
import MirrorChatScreen from '@screens/MirrorChatScreen';
import MirrorCodeLibraryCommingsoonScreen from '@screens/MirrorCodeLibraryCommingsoonScreen';
import ReflectionRoomCommingsoonScreen from '@screens/ReflectionRoomCommingsoonScreen';
import MirrorEchoCommingsoonScreen from '@screens/MirrorEchoCommingsoonScreen';
import CausesCarouselScreen from '@screens/MirrorPledge/CausesCarouselScreen';
import EchoLedgerScreen from '@screens/MirrorPledge/EchoLedgerScreen';
import MirrorPledgeIntroScreen from '@screens/MirrorPledge/MirrorPledgeIntroScreen';
import PledgeThankYouScreen from '@screens/MirrorPledge/PledgeThankYouScreen';
import ViewAllCausesScreen from '@screens/MirrorPledge/ViewAllCausesScreen';
import ProfileScreen from '@screens/ProfileScreen';
import QuizQuestionsScreen from '@screens/QuizQuestionsScreen';
import QuizTuningScreen from '@screens/QuizTuningScreen';
import QuizWelcomeScreen from '@screens/QuizWelcomeScreen';
import ReflectionRoomCoreScreen from '@screens/reflectionRoom/ReflectionRoomCoreScreen';
import ReflectionRoomEchoMapScreen from '@screens/reflectionRoom/ReflectionRoomEchoMapScreen';
import ReflectionRoomEchoSignatureScreen from '@screens/reflectionRoom/ReflectionRoomEchoSignatureScreen';
import ReflectionRoomLandingScreen from '@screens/reflectionRoom/ReflectionRoomLandingScreen';
import ReflectionRoomLoadingScreen from '@screens/reflectionRoom/ReflectionRoomLoadingScreen';
import ReflectionRoomMirrorMomentScreen from '@screens/reflectionRoom/ReflectionRoomMirrorMomentScreen';
import ReflectionRoomPracticeCompleteScreen from '@screens/reflectionRoom/ReflectionRoomPracticeCompleteScreen';
import ReflectionRoomPracticeOverlayScreen from '@screens/reflectionRoom/ReflectionRoomPracticeOverlayScreen';
import ReflectionRoomQuizEntryScreen from '@screens/reflectionRoom/ReflectionRoomQuizEntryScreen';
import ReflectionRoomQuizScreen from '@screens/reflectionRoom/ReflectionRoomQuizScreen';
import ReflectionRoomTodaysMotifScreen from '@screens/reflectionRoom/ReflectionRoomTodaysMotifScreen';
import ReflectionRoomWelcomeScreen from '@screens/reflectionRoom/ReflectionRoomWelcomeScreen';

import { JourneyProvider } from '@features/reflection-room/state/JourneyContext';
import ResetPasswordScreen from '@screens/ResetPasswordScreen';
import SignUpScreen from '@screens/SignUpScreen';
import SplashScreen from '@screens/SplashScreen';
import SoulPingScreen from '@screens/SoulPingScreen';
import StartFreeTrialScreen from '@screens/StartFreeTrialScreen';
import TalkToMirrorScreen from '@screens/TalkToMirrorScreen';
import TermsAndConditionsScreen from '@screens/TermsAndConditionsScreen';
import TheMirrorPledgeCommingsoonScreen from '@screens/TheMirrorPledgeCommingsoonScreen';
import VerifyEmailScreen from '@screens/VerifyEmailScreen';
import { OnboardingService } from '@services';
import { navigationRef, flushPendingNavigation } from '@services/navigationRef';
import PushNotificationService from '@services/PushNotificationService';
import { ThemeProvider, palette } from '@theme';
import type { RootStackParamList } from '@types';

// DEV-only: button visual QA + blur tuning screen. Loaded lazily so the
// showcase code never executes outside __DEV__.
const ButtonShowcaseScreen = __DEV__
  ? require('./src/screens/_dev/ButtonShowcase').default
  : null;

import BackgroundWrapper from './src/components/BackgroundWrapper';
import ErrorBoundary from './src/components/ErrorBoundary';
const Stack = createNativeStackNavigator<RootStackParamList>();

// Dark navigation theme. Without an explicit theme, React Navigation falls back
// to the LIGHT DefaultTheme (≈white background). On a dark, full-bleed app whose
// screens paint their own BackgroundWrapper, that light container can flash at
// the screen's top edge during a native-stack push/pop — a transient pale/tinted
// outline before the incoming screen's background paints.
//
// Anchor it to the TOP stop of the app background ramp, not to a mid-ramp colour
// like navy.deep. Screens paint a #080911 → #1a2238 gradient, so no single flat
// colour matches them everywhere; navy.deep only lined up ~18% down the screen
// and sat rgb(16,20,29) darker than the screen at the bottom edge, which showed
// as a differently-coloured band wherever the container was revealed. The
// darkest stop is the safe choice: the only place the container still shows is
// the transition seam, where iOS draws its own shadow, so a too-dark sliver
// reads as shadow while a too-light one reads as a seam.
const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: palette.navy.screenTop, // #080911 — top stop of the app ramp
    card: palette.navy.screenTop,
  },
};

// Screens own their full-bleed background, so keep the native-stack content
// container transparent — nothing but the app's own background ever paints.
const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: 'transparent' },
} as const;
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
    screenOptions={screenOptions}
  >
    <Stack.Screen
      name="ManageGuardianScreen"
      component={ManageGuardianScreen}
    />
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
    <Stack.Screen name="CreateEchoScreen" component={CreateEchoScreen} />
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
    {/* Mirror Pledge flow — Figma Design-Master-File section 2169:1119 */}
    <Stack.Screen name="MirrorPledgeIntro" component={MirrorPledgeIntroScreen} />
    <Stack.Screen name="EchoLedger" component={EchoLedgerScreen} />
    <Stack.Screen name="ViewAllCauses" component={ViewAllCausesScreen} />
    <Stack.Screen name="CausesCarousel" component={CausesCarouselScreen} />
    <Stack.Screen name="PledgeThankYou" component={PledgeThankYouScreen} />
    <Stack.Screen name="About" component={AboutScreen} />
    <Stack.Screen name="FAQ" component={FAQScreen} />
    <Stack.Screen
      name="MirrorCodeLibrary"
      component={MirrorCodeLibraryCommingsoonScreen}
    />
    <Stack.Screen name="ReflectionRoom" component={ReflectionRoomLandingScreen} />
    <Stack.Screen name="ReflectionRoomCommingsoon" component={ReflectionRoomCommingsoonScreen} />
    <Stack.Screen name="ReflectionRoomWelcome" component={ReflectionRoomWelcomeScreen} />
    <Stack.Screen name="ReflectionRoomQuizEntry" component={ReflectionRoomQuizEntryScreen} />
    <Stack.Screen name="ReflectionRoomQuiz" component={ReflectionRoomQuizScreen} />
    <Stack.Screen name="ReflectionRoomLoading" component={ReflectionRoomLoadingScreen} />
    <Stack.Screen name="ReflectionRoomTodaysMotif" component={ReflectionRoomTodaysMotifScreen} />
    <Stack.Screen name="ReflectionRoomEchoSignature" component={ReflectionRoomEchoSignatureScreen} />
    <Stack.Screen name="ReflectionRoomEchoMap" component={ReflectionRoomEchoMapScreen} />
    <Stack.Screen name="ReflectionRoomMirrorMoment" component={ReflectionRoomMirrorMomentScreen} />
    <Stack.Screen name="ReflectionRoomCore" component={ReflectionRoomCoreScreen} />
    <Stack.Screen name="ReflectionRoomPracticeOverlay" component={ReflectionRoomPracticeOverlayScreen} />
    <Stack.Screen name="ReflectionRoomPracticeComplete" component={ReflectionRoomPracticeCompleteScreen} />
    <Stack.Screen name="MirrorEcho" component={MirrorEchoCommingsoonScreen} />
    <Stack.Screen
      name="TermsAndConditions"
      component={TermsAndConditionsScreen}
    />
    <Stack.Screen name="StartFreeTrial" component={StartFreeTrialScreen} />
    <Stack.Screen name="Checkout" component={CheckoutScreen} />
    <Stack.Screen name="EchoVaultStorage" component={EchoVaultStorageScreen} />
    <Stack.Screen name="Splash" component={SplashScreen} />
    <Stack.Screen name="MirrorAnimation" component={MirrorAnimationScreen} />
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
    {/* DEV-only: button showcase. Set initialRouteName="ButtonShowcase" above
        for an iOS dev session, or navigate('ButtonShowcase') from anywhere. */}
    {__DEV__ && ButtonShowcaseScreen && (
      <Stack.Screen name="ButtonShowcase" component={ButtonShowcaseScreen} />
    )}
  </Stack.Navigator>
);

// Authenticated Navigator (Private)
interface AuthenticatedNavigatorProps {
  initialRouteName?: keyof RootStackParamList;
}

const AuthenticatedNavigator = ({ initialRouteName = 'EnterMirror' }: AuthenticatedNavigatorProps) => (
  <Stack.Navigator
    initialRouteName={initialRouteName}
    screenOptions={screenOptions}
  >
    <Stack.Screen name="EnterMirror" component={EnterMirrorScreen} />
    <Stack.Screen name="AppVideo" component={AppVideoScreen} />
    <Stack.Screen name="TalkToMirror" component={TalkToMirrorScreen} />
    <Stack.Screen name="MirrorChat" component={MirrorChatWithErrorBoundary} />
    <Stack.Screen name="SoulPing" component={SoulPingScreen} />
    {/* Profile & Settings */}
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="About" component={AboutScreen} />
    <Stack.Screen name="FAQ" component={FAQScreen} />
    {/* Menu Screens */}
    <Stack.Screen name="MirrorCodeLibrary" component={MirrorCodeLibraryCommingsoonScreen} />
    <Stack.Screen name="ReflectionRoom" component={ReflectionRoomLandingScreen} />
    <Stack.Screen name="ReflectionRoomCommingsoon" component={ReflectionRoomCommingsoonScreen} />
    <Stack.Screen name="ReflectionRoomWelcome" component={ReflectionRoomWelcomeScreen} />
    <Stack.Screen name="ReflectionRoomQuizEntry" component={ReflectionRoomQuizEntryScreen} />
    <Stack.Screen name="ReflectionRoomQuiz" component={ReflectionRoomQuizScreen} />
    <Stack.Screen name="ReflectionRoomLoading" component={ReflectionRoomLoadingScreen} />
    <Stack.Screen name="ReflectionRoomTodaysMotif" component={ReflectionRoomTodaysMotifScreen} />
    <Stack.Screen name="ReflectionRoomEchoSignature" component={ReflectionRoomEchoSignatureScreen} />
    <Stack.Screen name="ReflectionRoomEchoMap" component={ReflectionRoomEchoMapScreen} />
    <Stack.Screen name="ReflectionRoomMirrorMoment" component={ReflectionRoomMirrorMomentScreen} />
    <Stack.Screen name="ReflectionRoomCore" component={ReflectionRoomCoreScreen} />
    <Stack.Screen name="ReflectionRoomPracticeOverlay" component={ReflectionRoomPracticeOverlayScreen} />
    <Stack.Screen name="ReflectionRoomPracticeComplete" component={ReflectionRoomPracticeCompleteScreen} />
    <Stack.Screen name="TheMirrorPledge" component={TheMirrorPledgeCommingsoonScreen} />
    {/* Mirror Pledge flow — Figma Design-Master-File section 2169:1119 */}
    <Stack.Screen name="MirrorPledgeIntro" component={MirrorPledgeIntroScreen} />
    <Stack.Screen name="EchoLedger" component={EchoLedgerScreen} />
    <Stack.Screen name="ViewAllCauses" component={ViewAllCausesScreen} />
    <Stack.Screen name="CausesCarousel" component={CausesCarouselScreen} />
    <Stack.Screen name="PledgeThankYou" component={PledgeThankYouScreen} />
    {/* Echo Vault Screens */}
    <Stack.Screen name="MirrorEchoVaultHome" component={MirrorEchoVaultHomeScreen} />
    <Stack.Screen name="MirrorEchoVaultLibrary" component={MirrorEchoVaultLibraryScreen} />
    <Stack.Screen name="EchoInboxScreen" component={EchoInboxScreen} />
    <Stack.Screen name="NewEchoScreen" component={NewEchoScreen} />
    <Stack.Screen name="NewEchoComposeScreen" component={NewEchoComposeScreen} />
    <Stack.Screen name="CreateEchoScreen" component={CreateEchoScreen} />
    <Stack.Screen name="NewEchoAudioScreen" component={NewEchoAudioScreen} />
    <Stack.Screen name="NewEchoVideoScreen" component={NewEchoVideoScreen} />
    <Stack.Screen name="ManageGuardianScreen" component={ManageGuardianScreen} />
    <Stack.Screen name="ManageRecipientScreen" component={ManageRecipientScreen} />
    <Stack.Screen name="ChooseGuardianScreen" component={ChooseGuardianScreen} />
    <Stack.Screen name="ChooseRecipientScreen" component={ChooseRecipientScreen} />
    <Stack.Screen name="AddNewProfileScreen" component={AddNewProfileScreen} />
    <Stack.Screen name="Checkout" component={CheckoutScreen} />
    <Stack.Screen name="StartFreeTrial" component={StartFreeTrialScreen} />
    <Stack.Screen name="EchoVaultStorage" component={EchoVaultStorageScreen} />
  </Stack.Navigator>
);

// Main Navigator that switches based on auth state
const AppNavigator = () => {
  const { state, signOut } = useSession();
  const { isAuthenticated } = state;
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('EnterMirror');
  // Gate that ensures the AsyncStorage onboarding lookup has completed
  // BEFORE <AuthenticatedNavigator> mounts. native-stack pins
  // initialRouteName at mount and ignores subsequent prop changes — without
  // this gate, returning users always landed on EnterMirror because the
  // resolved route arrived after the navigator had already committed.
  const [routeReady, setRouteReady] = useState(false);

  const handleInactivityTimeout = useCallback(async () => {
    if (__DEV__) {
      console.log('Session timed out due to inactivity');
    }
    await signOut();
  }, [signOut]);

  const { resetTimer } = useInactivityTimer({
    isEnabled: isAuthenticated,
    onTimeout: handleInactivityTimeout,
  });

  // Resolve the post-login route before the authenticated navigator mounts.
  useEffect(() => {
    if (!isAuthenticated) {
      setRouteReady(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const hasCompletedOnboarding =
        await OnboardingService.hasCompletedOnboarding();
      if (cancelled) return;
      setInitialRoute(hasCompletedOnboarding ? 'TalkToMirror' : 'AppVideo');
      setRouteReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Hold a splash while the onboarding read is in flight so the navigator
  // doesn't mount with the stale default initialRoute.
  if (isAuthenticated && !routeReady) {
    // Same gradient + starfield the first real screen paints, so handing over to
    // the navigator is invisible. A flat fill here would step to the gradient.
    return (
      <BackgroundWrapper scrollable style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={palette.gold.DEFAULT} />
      </BackgroundWrapper>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navTheme}
      key={isAuthenticated ? 'authenticated' : 'unauthenticated'}
      // Replay any notification-tap navigation queued before the tree mounted
      // (cold-start taps land here before the container is ready).
      onReady={flushPendingNavigation}
      onStateChange={navState => {
        if (__DEV__) {
          console.log('Navigation state changed:', navState);
        }
      }}
    >
      {isAuthenticated ? (
        <View
          style={styles.fill}
          onStartShouldSetResponderCapture={() => {
            resetTimer();
            return false;
          }}
        >
          <AuthenticatedNavigator initialRouteName={initialRoute} />
        </View>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
  loadingScreen: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

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
      <KeyboardProvider>
        <ThemeProvider>
        <ErrorBoundary>
          <SessionProvider>
            <UserProvider>
              <SubscriptionProvider>
                <JourneyProvider>
                  <React.Fragment>
                    <StatusBar
                      translucent
                      backgroundColor="transparent"
                      barStyle="light-content"
                    />
                    <AppNavigator />
                  </React.Fragment>
                </JourneyProvider>
              </SubscriptionProvider>
            </UserProvider>
          </SessionProvider>
        </ErrorBoundary>
        </ThemeProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
};

export default App;
