import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import { authApiService } from '@services/api';
import { QuizStorageService } from '@services/quizStorageService';
import { theme } from '@theme';
import type { RootStackParamList } from '@types';
import { getApiErrorMessage } from '@utils/apiErrorUtils';

type VerifyEmailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'VerifyEmail'
>;

type VerifyEmailScreenRouteProp = RouteProp<RootStackParamList, 'VerifyEmail'>;

const VerifyEmailScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<VerifyEmailScreenNavigationProp>();
  const route = useRoute<VerifyEmailScreenRouteProp>();
  const { email } = route.params;
  const [verificationCode, setVerificationCode] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      Alert.alert(t('common.error'), 'Please enter the verification code');
      return;
    }

    if (verificationCode.length !== 6) {
      Alert.alert(t('common.error'), 'Verification code must be 6 digits');
      return;
    }

    setIsVerifying(true);

    if (__DEV__) {
      console.log('VerifyEmailScreen - verificationCode:', verificationCode);
      console.log('VerifyEmailScreen - email:', email);
    }

    try {
      // Get anonymousId for linking quiz data
      const anonymousId = await QuizStorageService.getAnonymousId();

      const response = await authApiService.verifyEmail({
        email,
        verificationCode: verificationCode.trim(),
        anonymousId: anonymousId, // Send anonymousId for backend linking
      });

      if (response.success) {
        // Check if there are any pending offline quiz submissions to retry
        await QuizStorageService.retryPendingSubmissions();

        Alert.alert(
          t('auth.verifyEmail.successTitle'),
          t('auth.verifyEmail.successMessage'),
          [
            {
              text: t('auth.verifyEmail.enterButton'),
              onPress: () => {
                // Navigate to Login (EnterMirror is only accessible after sign in)
                navigation.reset({
                  index: 0,
                  routes: [{
                    name: 'Login',
                    params: { email, showNotificationPrompt: true },
                  }],
                });
              },
            },
          ],
        );
      } else {
        Alert.alert(
          t('auth.verifyEmail.failedTitle'),
          getApiErrorMessage(response, t),
        );
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      Alert.alert(
        t('auth.verifyEmail.failedTitle'),
        getApiErrorMessage(error, t),
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    if (countdown > 0 || isResending) {
      return;
    }

    setIsResending(true);

    try {
      const response = await authApiService.resendVerificationCode(email);

      if (response.success) {
        setCountdown(60); // 60 second cooldown
        Alert.alert(
          t('auth.forgotPassword.successTitle'),
          t('auth.verifyEmail.title'),
        );
      } else {
        Alert.alert(t('common.error'), getApiErrorMessage(response, t));
      }
    } catch (error: any) {
      console.error('Resend error:', error);
      Alert.alert(t('common.error'), getApiErrorMessage(error, t));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <BackgroundWrapper style={styles.container}>
      <LogoHeader />

      <View style={styles.contentContainer}>
        {/* Main Content */}
        <View style={styles.messageContainer}>
          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>{t('auth.verifyEmail.title')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.verifyEmail.subtitle')}
            </Text>
          </View>

          {/* Verification Code Input */}
          <View style={styles.codeSection}>
            <TextInput
              testID="verification-code-input"
              style={styles.codeInput}
              placeholder={t('auth.verifyEmail.codePlaceholder')}
              placeholderTextColor={theme.colors.text.muted}
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="numeric"
              maxLength={6}
              autoFocus
              textAlign="center"
            />

            <TouchableOpacity
              testID="verify-button"
              style={[
                styles.verifyButton,
                (isVerifying || verificationCode.length !== 6) &&
                  styles.verifyButtonDisabled,
              ]}
              onPress={handleVerifyCode}
              disabled={isVerifying || verificationCode.length !== 6}
            >
              <Text
                style={[
                  styles.verifyButtonText,
                  (isVerifying || verificationCode.length !== 6) &&
                    styles.verifyButtonTextDisabled,
                ]}
              >
                {isVerifying
                  ? t('auth.verifyEmail.verifyingButton')
                  : t('auth.verifyEmail.verifyButton')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Resend Section */}
          <View style={styles.resendSection}>
            <Text style={styles.resendText}>
              {t('auth.verifyEmail.resendPrompt')}
            </Text>

            <TouchableOpacity
              testID="resend-button"
              style={[
                styles.resendButton,
                (countdown > 0 || isResending) && styles.resendButtonDisabled,
              ]}
              onPress={handleResendEmail}
              disabled={countdown > 0 || isResending}
            >
              <Text
                style={[
                  styles.resendButtonText,
                  (countdown > 0 || isResending) &&
                    styles.resendButtonTextDisabled,
                ]}
              >
                {countdown > 0
                  ? t('auth.verifyEmail.resendButtonWithTimer', {
                      count: countdown,
                    })
                  : isResending
                  ? t('auth.verifyEmail.sendingButton')
                  : t('auth.verifyEmail.resendButton')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Back to Sign Up */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>
              {t('auth.verifyEmail.backToSignUp')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 15,
    shadowColor: theme.shadows.container.color,
    shadowOffset: theme.shadows.container.offset,
    shadowOpacity: theme.shadows.container.opacity,
    shadowRadius: theme.shadows.container.radius,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 44,
    paddingTop: 150, // Space for LogoHeader (48 + 46 + 26 margin)
    gap: 60,
  },
  messageContainer: {
    alignItems: 'center',
    gap: 40,
    maxWidth: 305,
  },
  headerSection: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    ...theme.typography.styles.title,
    color: '#F2E2B1',
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 28,
    textAlign: 'center',
    fontWeight: '300',
    lineHeight: 36,
  },
  subtitle: {
    ...theme.typography.styles.body,
    color: '#FDFDF9',
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 28,
  },
  codeSection: {
    alignItems: 'center',
    gap: 20,
    width: '100%',
  },
  codeInput: {
    width: 200,
    height: 60,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: theme.colors.border.input,
    backgroundColor: theme.colors.background.input,
    ...theme.typography.styles.input,
    fontSize: 24,
    lineHeight: 30,
    shadowColor: theme.shadows.input.color,
    shadowOffset: theme.shadows.input.offset,
    shadowOpacity: theme.shadows.input.opacity,
    shadowRadius: theme.shadows.input.radius,
  },

  verifyButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.button.primary,
    paddingHorizontal: 40,
    paddingVertical: 12,
    shadowColor: theme.shadows.button.color,
    shadowOffset: theme.shadows.button.offset,
    shadowOpacity: theme.shadows.button.opacity,
    shadowRadius: theme.shadows.button.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonDisabled: {
    borderColor: theme.colors.button.disabled,
    opacity: 0.6,
  },
  verifyButtonText: {
    ...theme.typography.styles.button,
    textAlign: 'center',
    width: 220,
    fontFamily: 'CormorantGaramond-Italic',
    color: '#E5D6B0',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    textTransform: 'none',
  },
  verifyButtonTextDisabled: {
    color: '#E5D6B0',
    fontSize: 20,
    fontWeight: '600',
  },
  resendSection: {
    alignItems: 'center',
    gap: 10,
  },
  resendText: {
    ...theme.typography.styles.body,
    color: '#FDFDF9',
    fontFamily: 'CormorantGaramond-Italic',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '300',
    lineHeight: 28,
  },
  resendButton: {
    marginTop: 20,
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A3B3CC',
    paddingVertical: 10,
    paddingHorizontal: 72,
    alignItems: 'center',
    backgroundColor: 'rgba(253, 253, 249, 0.05)',
  },
  resendButtonDisabled: {
    opacity: 0.6,
  },
  resendButtonText: {
    ...theme.typography.styles.button,
    textAlign: 'center',
    fontFamily: 'CormorantGaramond-Italic',
    color: '#E5D6B0',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    textTransform: 'none',
  },
  resendButtonTextDisabled: {
    width: '100%',
  },
  backButton: {
    marginTop: 20,
    padding: 10,
  },
  backButtonText: {
    fontFamily: 'CormorantGaramond-Italic',
    color: '#FDFDF9',
    fontSize: 18,
    textDecorationLine: 'underline',
  },
});

export default VerifyEmailScreen;
