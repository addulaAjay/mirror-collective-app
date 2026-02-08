import { theme } from '@theme';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import Svg, { Mask, Rect, G, Path } from 'react-native-svg';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';
import TextInputField from '@components/TextInputField';
import { useSession } from '@context/SessionContext';
import { useUser } from '@context/UserContext';
import { quizApiService } from '@services/api/quiz';
import PushNotificationService from '@services/PushNotificationService';
import { QuizStorageService } from '@services/quizStorageService';
import { getApiErrorMessage } from '@utils/apiErrorUtils';

const LoginScreen = ({ navigation, route }: any) => {
  const { t } = useTranslation();
  const { signIn } = useSession();
  const { setUser } = useUser();
  const [email, setEmail] = useState(route?.params?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hasShownNotificationPrompt, setHasShownNotificationPrompt] =
    useState(false);

  useEffect(() => {
    const shouldShowPrompt = route?.params?.showNotificationPrompt;
    const emailFromParams = route?.params?.email;

    if (!shouldShowPrompt || !emailFromParams || hasShownNotificationPrompt) {
      return;
    }

    setHasShownNotificationPrompt(true);

    PushNotificationService.promptForNotificationPermissionAndRegister(
      emailFromParams,
    ).catch((error: unknown) => {
      console.error(
        'Error during push notification registration from LoginScreen:',
        error,
      );
    });
  }, [
    route?.params?.showNotificationPrompt,
    route?.params?.email,
    hasShownNotificationPrompt,
  ]);

  const validateForm = (): boolean => {
    if (!email.trim()) {
      Alert.alert(t('common.error'), t('auth.login.missingEmail'));
      return false;
    }

    if (!password) {
      Alert.alert(t('common.error'), t('auth.login.missingPassword'));
      return false;
    }

    return true;
  };

  const handleSignIn = async () => {
    if (!validateForm()) {
      return;
    }

    // Clear any previous error before a new attempt
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const data = await signIn(email, password);

      if (data && data.user) {
        // Update user context with profile data
        setUser(data.user);
        await QuizStorageService.markAccountReady();
        setErrorMessage(null);

        // Sync quiz results from server (cross-device sync)
        try {
          const quizResponse = await quizApiService.getMyQuizResults();
          if (quizResponse.success && quizResponse.data) {
            console.log('✅ Quiz data synced from server:', quizResponse.data);
            // After successful server sync, clear local pending state and mark ready
            await QuizStorageService.clearPendingQuizResults();
            await QuizStorageService.markAccountReady();
          }
        } catch (quizError) {
          console.warn('Failed to sync quiz data:', quizError);
        }

        // Check if there are any pending offline quiz submissions to retry
        await QuizStorageService.retryPendingSubmissions();

        // Navigation is handled automatically by AppNavigator based on auth state
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const message = getApiErrorMessage(error, t);
      setErrorMessage(message || t('auth.login.loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToSignUp = () => {
    navigation.navigate('SignUp');
  };

  const navigateToForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <BackgroundWrapper style={styles.container}>
          <LogoHeader
            onMenuPress={() => setDrawerOpen(!drawerOpen)}
            navigation={navigation}
          />
          <View style={styles.contentContainer}>
            <Text style={styles.title}>{t('auth.login.title')}</Text>

            <View style={styles.formContainer}>
              <TextInputField
                size="normal"
                placeholder={t('auth.login.usernamePlaceholder')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                testID="email-input"
              />

              <TextInputField
                size="normal"
                placeholder={t('auth.login.passwordPlaceholder')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                showPasswordToggle={true}
                isPasswordVisible={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
                testID="password-input"
              />

              {errorMessage && (
                <View style={styles.errorRow}>
                  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                    <Mask
                      id="errorMask"
                      maskUnits="userSpaceOnUse"
                      x={0}
                      y={0}
                      width={20}
                      height={20}
                      aspect-ratio="1/1"
                    >
                      <Rect width={20} height={20} fill="#D9D9D9" />
                    </Mask>
                    <G mask="url(#errorMask)">
                      <Path
                        d="M9.99999 14.1665C10.2361 14.1665 10.434 14.0866 10.5937 13.9269C10.7535 13.7672 10.8333 13.5693 10.8333 13.3332C10.8333 13.0971 10.7535 12.8991 10.5937 12.7394C10.434 12.5797 10.2361 12.4998 9.99999 12.4998C9.76388 12.4998 9.56596 12.5797 9.40624 12.7394C9.24652 12.8991 9.16666 13.0971 9.16666 13.3332C9.16666 13.5693 9.24652 13.7672 9.40624 13.9269C9.56596 14.0866 9.76388 14.1665 9.99999 14.1665ZM9.99999 10.8332C10.2361 10.8332 10.434 10.7533 10.5937 10.5936C10.7535 10.4339 10.8333 10.2359 10.8333 9.99984V6.6665C10.8333 6.43039 10.7535 6.23248 10.5937 6.07275C10.434 5.91303 10.2361 5.83317 9.99999 5.83317C9.76388 5.83317 9.56596 5.91303 9.40624 6.07275C9.24652 6.23248 9.16666 6.43039 9.16666 6.6665V9.99984C9.16666 10.2359 9.24652 10.4339 9.40624 10.5936C9.56596 10.7533 9.76388 10.8332 9.99999 10.8332ZM9.99999 18.3332C8.84721 18.3332 7.76388 18.1144 6.74999 17.6769C5.7361 17.2394 4.85416 16.6457 4.10416 15.8957C3.35416 15.1457 2.76041 14.2637 2.32291 13.2498C1.88541 12.2359 1.66666 11.1526 1.66666 9.99984C1.66666 8.84706 1.88541 7.76373 2.32291 6.74984C2.76041 5.73595 3.35416 4.854 4.10416 4.104C4.85416 3.354 5.7361 2.76025 6.74999 2.32275C7.76388 1.88525 8.84721 1.6665 9.99999 1.6665C11.1528 1.6665 12.2361 1.88525 13.25 2.32275C14.2639 2.76025 15.1458 3.354 15.8958 4.104C16.6458 4.854 17.2396 5.73595 17.6771 6.74984C18.1146 7.76373 18.3333 8.84706 18.3333 9.99984C18.3333 11.1526 18.1146 12.2359 17.6771 13.2498C17.2396 14.2637 16.6458 15.1457 15.8958 15.8957C15.1458 16.6457 14.2639 17.2394 13.25 17.6769C12.2361 18.1144 11.1528 18.3332 9.99999 18.3332ZM9.99999 16.6665C11.8611 16.6665 13.4375 16.0207 14.7292 14.729C16.0208 13.4373 16.6667 11.8609 16.6667 9.99984C16.6667 8.13873 16.0208 6.56234 14.7292 5.27067C13.4375 3.979 11.8611 3.33317 9.99999 3.33317C8.13888 3.33317 6.56249 3.979 5.27082 5.27067C3.97916 6.56234 3.33332 8.13873 3.33332 9.99984C3.33332 11.8609 3.97916 13.4373 5.27082 14.729C6.56249 16.0207 8.13888 16.6665 9.99999 16.6665Z"
                        fill="#F83B3D"
                      />
                    </G>
                  </Svg>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              <TouchableOpacity
                onPress={navigateToForgotPassword}
                disabled={isLoading}
                style={styles.forgotPasswordContainer}
              >
                <Text style={styles.forgotPasswordText}>
                  {t('auth.login.forgotPassword')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.enterButton}
                onPress={handleSignIn}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <StarIcon width={24} height={24} />
                <Text style={styles.enterText}>
                  {isLoading
                    ? t('auth.login.enteringButton')
                    : t('auth.login.enterButton')}
                </Text>
                <StarIcon width={24} height={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>
                {t('auth.login.newToCollective')}
              </Text>
              <TouchableOpacity onPress={navigateToSignUp} disabled={isLoading}>
                <Text style={styles.signupLink}>
                  {t('auth.login.signUpLink')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </BackgroundWrapper>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#0B0F1C',
  },
  container: {
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: -1, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 26,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    gap: 40,
    width: '100%',
    maxWidth: 313,
  },
  title: {
    ...theme.typography.styles.title,
    color: '#F2E2B1',
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 10,
    lineHeight: 38,
    fontStyle: 'normal',
    fontSize: 32,
  },
  formContainer: {
    gap: 12,
    width: '100%',
    alignItems: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'center',
    marginRight: 4,
    gap: 4,
  },
  errorText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    lineHeight: 18,
    color: '#E53935',
  },
  enterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    marginTop: 20,
  },
  enterText: {
    ...theme.typography.styles.button,
    textShadowColor: 'rgba(245, 230, 184, 0.50)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
    lineHeight: 35,
    fontFamily: 'CormorantGaramond-Light',
    fontSize: 28,
  },
  forgotPasswordContainer: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  forgotPasswordText: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 18,
    lineHeight: 22,
    color: '#FDFDF9',
    textDecorationLine: 'underline' as const,
    textAlign: 'center',
    flexShrink: 1,
  },
  signupContainer: {
    alignItems: 'center',
    gap: 8,
    marginTop: 0,
  },
  signupText: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 20,
    fontWeight: '300' as const,
    lineHeight: 25,
    textAlign: 'center',
    width: 313,
    color: '#FDFDF9',
  },
  signupLink: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 24,
    lineHeight: 28,
    color: '#E5D6B0',
    textDecorationLine: 'underline' as const,
    textDecorationStyle: 'solid' as const,
  },
});

export default LoginScreen;
