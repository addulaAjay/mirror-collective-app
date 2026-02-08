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
  ScrollView,
} from 'react-native';
import Svg, { Mask, Rect, G, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';
import TextInputField from '@components/TextInputField';
import { useSession } from '@context/SessionContext';
import { useUser } from '@context/UserContext';
import { quizApiService } from '@services/api';
import { QuizStorageService } from '@services/quizStorageService';
import type { LoginScreenProps } from '@types';
import { getApiErrorMessage } from '@utils/apiErrorUtils';

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const { signIn, state } = useSession();
  const { setUser } = useUser();
  const { isAuthenticated } = state;

  useEffect(() => {
    // If authenticated, navigation will be handled by AppNavigator
  }, [isAuthenticated]);

  const handleSignIn = async () => {
    if (!email || !password) {
      setErrorMessage(t('auth.login.missingFields'));
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Perform login
      const success = await signIn(email, password);

      if (success) {
        console.log('Login successful, syncing quiz data...');
        
        // Immediate user population to avoid race conditions with UserContext
        if (success && success.user) {
           setUser(success.user);
        }

        // Try to sync quiz data if available locally or from server
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
      <BackgroundWrapper style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <LogoHeader />
          <ScrollView
            style={{ width: '100%' }}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.contentContainer}>
                <Text style={styles.title}>{t('auth.login.title')}</Text>

                <View style={styles.formContainer}>
                  <TextInputField
                    size="normal"
                    placeholder={t('auth.login.usernamePlaceholder')}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                  />

                  <TextInputField
                    size="normal"
                    placeholder={t('auth.login.passwordPlaceholder')}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!isPasswordVisible}
                    autoCapitalize="none"
                    autoComplete="password"
                    showPasswordToggle={true}
                    isPasswordVisible={isPasswordVisible}
                    onTogglePassword={() =>
                      setIsPasswordVisible(!isPasswordVisible)
                    }
                  />

                  {errorMessage && (
                    <Text style={styles.errorText}>{errorMessage}</Text>
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
            </TouchableWithoutFeedback>
          </ScrollView>
        </SafeAreaView>
      </BackgroundWrapper>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
    width: '100%',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
    paddingVertical: 40,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    gap: 40,
    width: '100%',
    maxWidth: 313,
  },
  title: {
    ...theme.typography.styles.title,
    textAlign: 'center',
    fontSize: 32,
    fontFamily: 'CormorantGaramond-Light',
    fontWeight: '300',
    // color: theme.colors.text.primary, // Removed override to use theme default (Gold)
    marginBottom: 20,
  },
  formContainer: {
    width: '100%',
    gap: 16,
    alignItems: 'center',
  },
  errorText: {
    ...theme.typography.styles.bodySmall,
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: -8,
  },
  forgotPasswordContainer: {
    alignSelf: 'center',
    marginTop: 8,
  },
  forgotPasswordText: {
    ...theme.typography.styles.linkSmall,
    color: '#A3B3CC',
    textDecorationLine: 'none',
  },
  enterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    justifyContent: 'center',
    marginTop: 20,
  },
  enterText: {
    ...theme.typography.styles.button,
    color: '#E5D6B0',
    fontSize: 20,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 40,
  },
  signupText: {
    ...theme.typography.styles.bodySmall,
    color: '#FDFDF9',
    opacity: 0.6,
  },
  signupLink: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.accent,
    fontWeight: '600',
  },
});

export default LoginScreen;
