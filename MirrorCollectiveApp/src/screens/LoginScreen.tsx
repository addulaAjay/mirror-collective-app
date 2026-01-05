import React, { useState } from 'react';
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

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';
import TextInputField from '@components/TextInputField';
import { useSession } from '@context/SessionContext';
import { useUser } from '@context/UserContext';
import { QuizStorageService } from '@services/quizStorageService';
import { theme } from '@theme';
import { getApiErrorMessage } from '@utils/apiErrorUtils';

const LoginScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { signIn } = useSession();
  const { setUser } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

    setIsLoading(true);

    try {
      const data = await signIn(email, password);

      if (data && data.user) {
        // Update user context with profile data
        setUser(data.user);
        
        // Submit any pending quiz results after successful login
        try {
          const quizSubmitted = await QuizStorageService.submitPendingQuizResults();
          if (__DEV__) {
            console.log('Quiz submission after login:', quizSubmitted ? 'Success' : 'Failed or no quiz');
          }
        } catch (quizError) {
          // Log quiz submission error but don't block user flow
          console.error('Failed to submit quiz results after login:', quizError);
        }

        // Navigation is handled automatically by AppNavigator based on auth state
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(t('auth.login.loginFailed'), getApiErrorMessage(error, t));
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
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <BackgroundWrapper
          style={styles.container}
        >
          <LogoHeader />
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

              <TouchableOpacity
                style={styles.enterButton}
                onPress={handleSignIn}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <StarIcon width={24} height={24} />
                <Text style={styles.enterText}>
                  {isLoading ? t('auth.login.enteringButton') : t('auth.login.enterButton')}
                </Text>
                <StarIcon width={24} height={24} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={navigateToForgotPassword}
              disabled={isLoading}
              style={styles.forgotPasswordContainer}
            >
              <Text style={styles.forgotPasswordText}>
                {t('auth.login.forgotPassword')}
              </Text>
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>
                {t('auth.login.newToCollective')}
              </Text>
              <TouchableOpacity onPress={navigateToSignUp} disabled={isLoading}>
                <Text style={styles.signupLink}>{t('auth.login.signUpLink')}</Text>
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
    paddingHorizontal: 40,
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
    marginTop: 0,
  },
  forgotPasswordText: {
    fontFamily: 'CormorantGaramond-LightItalic',
    fontSize: 20,
    lineHeight: 25,
    color: '#E5D6B0',
    textDecorationLine: 'underline' as const,
  },
  signupContainer: {
    alignItems: 'center',
    gap: 8,
    marginTop: 0,
  },
  signupText: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 20,
    fontWeight: 300,
    lineHeight: 25,
    textAlign: 'center',
    width: 313,
    color: '#FDFDF9',
  },
  signupLink: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 24,
    lineHeight: 28,
    color: '#E5D6B0',
    textDecorationLine: 'underline' as const,
    textDecorationStyle: 'solid' as const,
  },
});

export default LoginScreen;
