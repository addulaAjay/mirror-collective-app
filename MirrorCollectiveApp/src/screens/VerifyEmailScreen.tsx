import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '@theme';
import type { RootStackParamList } from '@types';
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
import { SafeAreaView } from "react-native-safe-area-context";

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import { authApiService } from '@services/api';
import { QuizStorageService } from '@services/quizStorageService';
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
  const initialEmail = route.params?.email ?? '';
  const password = route.params?.password;
  const termsAcceptedAt = route.params?.termsAcceptedAt;
  const [verificationCode, setVerificationCode] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  const normalizedEmail = initialEmail.trim().toLowerCase();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerifyCode = async () => {
    const trimmedCode = verificationCode.trim();

    if (!normalizedEmail) {
      Alert.alert(t('common.error'), 'Please enter your email address');
      return;
    }

    if (!trimmedCode) {
      Alert.alert(t('common.error'), 'Please enter the verification code');
      return;
    }

    if (trimmedCode.length !== 6) {
      Alert.alert(t('common.error'), 'Verification code must be 6 digits');
      return;
    }

    setIsVerifying(true);

    if (__DEV__) {
      console.log('VerifyEmailScreen - verificationCode:', verificationCode);
      console.log('VerifyEmailScreen - email:', normalizedEmail);
    }

    try {
      // Get anonymousId for linking quiz data
      const anonymousId = await QuizStorageService.getAnonymousId();

      const response = await authApiService.verifyEmail({
        email: normalizedEmail,
        verificationCode: trimmedCode,
        anonymousId: anonymousId,
        termsAcceptedAt: termsAcceptedAt,
      });

      if (response.success) {
        // Auto sign-in so the user has tokens before reaching the trial screen
        if (password) {
          try {
            const signInResponse = await authApiService.signIn({ email: normalizedEmail, password });
            if (signInResponse.success && signInResponse.data?.tokens) {
              await authApiService.storeTokens({
                accessToken: signInResponse.data.tokens.accessToken,
                refreshToken: signInResponse.data.tokens.refreshToken,
              });
            }
          } catch (signInError) {
            console.error('Auto sign-in after verification failed:', signInError);
            // Non-fatal: user can sign in manually from the trial screen
          }
        }

        // Check if there are any pending offline quiz submissions to retry
        await QuizStorageService.retryPendingSubmissions();

        Alert.alert(
          t('auth.verifyEmail.successTitle'),
          t('auth.verifyEmail.successMessage'),
          [
            {
              text: t('auth.verifyEmail.enterButton'),
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'StartFreeTrial' }],
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

    if (!normalizedEmail) {
      Alert.alert(t('common.error'), 'Please enter your email address');
      return;
    }

    setIsResending(true);

    try {
      const response = await authApiService.resendVerificationCode(normalizedEmail);

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
      <SafeAreaView style={styles.safe}>
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
              <View style={styles.codeInputWrapper}>
                <TextInput
                  testID="verification-code-input"
                  style={styles.codeInput}
                  placeholder={t('auth.verifyEmail.codePlaceholder')}
                  placeholderTextColor="rgba(229, 214, 176, 0.5)"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="numeric"
                  maxLength={6}
                  autoFocus
                  textAlign="center"
                />
              </View>

              <TouchableOpacity
                testID="verify-button"
                style={[
                  styles.verifyButton,
                  (isVerifying || verificationCode.trim().length !== 6) &&
                    styles.verifyButtonDisabled,
                ]}
                onPress={handleVerifyCode}
                disabled={isVerifying || verificationCode.trim().length !== 6}
              >
                <Text
                  style={[
                    styles.verifyButtonText,
                    (isVerifying || verificationCode.trim().length !== 6) &&
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
      </SafeAreaView>
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
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
    width: '100%',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20, 
    gap: 60,
  },
  messageContainer: {
    alignItems: 'center',
    gap: 0,
    width: '100%',
    maxWidth: 360,
    flex: 1,
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    gap: 24,
    marginBottom: 24,
  },
  title: {
    ...theme.typography.styles.title,
    alignSelf: 'stretch',
    color: palette.gold.DEFAULT,
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 28,
    fontStyle: 'normal',
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 36.4,
  },
  subtitle: {
    ...theme.typography.styles.body,
    alignSelf: 'stretch',
    color: palette.gold.subtlest,
    fontFamily: 'Inter',
    fontSize: 18,
    fontStyle: 'normal',
    textAlign: 'center',
    fontWeight: '300',
    lineHeight: 27,
  },
  codeSection: {
    alignItems: 'center',
    gap: 24,
    alignSelf: 'stretch',
    marginBottom: 48,
  },
  codeInputWrapper: {
    width: 313,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 214, 176, 0.4)',
    backgroundColor: 'rgba(58, 74, 92, 0.3)',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  codeInput: {
    flex: 1,
    backgroundColor: 'transparent',
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 24,
    color: palette.gold.warm,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    borderWidth: 0,
  },

  verifyButton: {
    width: 313,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 214, 176, 0.4)',
    backgroundColor: 'rgba(58, 74, 92, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    ...theme.typography.styles.button,
    textAlign: 'center',
    fontFamily: 'CormorantGaramond-Light',
    color: palette.gold.warm,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    textTransform: 'none',
    textShadowColor: 'rgba(229, 214, 176, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  verifyButtonTextDisabled: {
    color: palette.gold.warm,
    fontSize: 20,
    fontWeight: '600',
  },
  resendSection: {
    alignItems: 'center',
    gap: 20,
    width: '100%',
  },
  resendText: {
    alignSelf: 'stretch',
    color: palette.navy.light,
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 16,
    fontStyle: 'italic',
    fontWeight: '400',
    lineHeight: 24,
    flexShrink: 1,
    includeFontPadding: false,
  },
  resendButton: {
    width: 313,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 214, 176, 0.4)',
    backgroundColor: 'rgba(58, 74, 92, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    ...theme.typography.styles.button,
    textAlign: 'center',
    fontFamily: 'CormorantGaramond-Italic',
    color: palette.gold.warm,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    textTransform: 'none',
    textShadowColor: 'rgba(229, 214, 176, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  resendButtonTextDisabled: {
    width: '100%',
  },
  backButton: {
    marginTop: 24,
    padding: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  backButtonText: {
    color: palette.navy.light,
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 16,
    fontStyle: 'italic',
    fontWeight: '400',
    lineHeight: 24,
    includeFontPadding: false,
  },
});

export default VerifyEmailScreen;
