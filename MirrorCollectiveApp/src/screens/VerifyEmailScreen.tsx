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
  Platform,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from 'react-native-linear-gradient';

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
                // After successful verification, continue to Start Free Trial
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: 'StartFreeTrial',
                    },
                  ],
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
              <LinearGradient
                colors={['rgba(253, 253, 249, 0.04)', 'rgba(253, 253, 249, 0.01)']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.codeInputWrapper}
              >
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
              </LinearGradient>

              <TouchableOpacity
                testID="verify-button"
                style={[
                  (isVerifying || verificationCode.trim().length !== 6) &&
                    styles.verifyButtonDisabled,
                ]}
                onPress={handleVerifyCode}
                disabled={isVerifying || verificationCode.trim().length !== 6}
              >
                <LinearGradient
                  colors={['rgba(253, 253, 249, 0.04)', 'rgba(253, 253, 249, 0.01)']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.verifyButton}
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
                </LinearGradient>
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
                  (countdown > 0 || isResending) && styles.resendButtonDisabled,
                ]}
                onPress={handleResendEmail}
                disabled={countdown > 0 || isResending}
              >
                <LinearGradient
                  colors={['rgba(253, 253, 249, 0.04)', 'rgba(253, 253, 249, 0.01)']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.resendButton}
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
                </LinearGradient>
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
    paddingHorizontal: 44,
    paddingTop: 20, 
    gap: 60,
  },
  messageContainer: {
    alignItems: 'center',
    gap: 0,
    width: '100%',
    maxWidth: 305,
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
    color: '#F2E2B1',
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
    color: '#FDFDF9',
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
    width: 190,
    alignSelf: 'center',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#A3B3CC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' } as any)
      : {}),
  },
  codeInput: {
    width: '100%',
    backgroundColor: 'transparent',
    ...theme.typography.styles.input,
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 24,
    lineHeight: 30,
    paddingVertical: 0,
    paddingHorizontal: 0,
    color: theme.colors.text.primary,
  },

  verifyButton: {
    flexDirection: 'row',
    width: 171,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#A3B3CC',
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' } as any)
      : {}),
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    ...theme.typography.styles.button,
    textAlign: 'center',
    fontFamily: 'CormorantGaramond-Light',
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
    gap: 20,
    width: '100%',
  },
  resendText: {
    alignSelf: 'stretch',
    color: '#A3B3CC',
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
    flexDirection: 'row',
    width: 171,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#A3B3CC',
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' } as any)
      : {}),
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
    alignSelf: 'stretch',
  },
  backButtonText: {
    alignSelf: 'stretch',
    color: '#A3B3CC',
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
