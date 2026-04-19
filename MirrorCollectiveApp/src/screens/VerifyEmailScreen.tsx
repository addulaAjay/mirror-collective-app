import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  palette,
  radius,
  borderWidth,
  textShadow,
  glassGradient,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  scale,
  verticalScale,
  moderateScale,
} from '@theme';
import type { RootStackParamList } from '@types';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button/Button';
import LogoHeader from '@components/LogoHeader';
import TextInputField from '@components/TextInputField';
import { authApiService } from '@services/api';
import { QuizStorageService } from '@services/quizStorageService';
import { getApiErrorMessage } from '@utils/apiErrorUtils';

type VerifyEmailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'VerifyEmail'
>;

type VerifyEmailScreenRouteProp = RouteProp<RootStackParamList, 'VerifyEmail'>;

const VERIFICATION_CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

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

    if (trimmedCode.length !== VERIFICATION_CODE_LENGTH) {
      Alert.alert(t('common.error'), `Verification code must be ${VERIFICATION_CODE_LENGTH} digits`);
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
    } catch (error: unknown) {
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
        setCountdown(RESEND_COOLDOWN_SECONDS);
        Alert.alert(
          t('auth.forgotPassword.successTitle'),
          t('auth.verifyEmail.title'),
        );
      } else {
        Alert.alert(t('common.error'), getApiErrorMessage(response, t));
      }
    } catch (error: unknown) {
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
              <Text style={styles.title}>We've sent a code to your inbox</Text>
              <Text style={styles.subtitle}>
                Please enter the 6-digit verification code from your email to confirm your entry.
              </Text>
            </View>

            {/* Verification Code Input */}
            <View style={styles.codeSection}>
              <TextInputField
                testID="verification-code-input"
                placeholder="Enter 6-digit code"
                placeholderAlign="center"
                textAlign="center"
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="numeric"
                autoCapitalize="none"
                maxLength={VERIFICATION_CODE_LENGTH}
                placeholderStyle={styles.inputPlaceholder}
              />

              <Button
                variant="gradient"
                title={isVerifying ? 'Verifying...' : 'Verify'}
                onPress={handleVerifyCode}
                disabled={isVerifying || verificationCode.trim().length !== VERIFICATION_CODE_LENGTH}
                style={styles.buttonWrapper}
                containerStyle={styles.buttonContainer}
                contentStyle={styles.buttonContent}
                textStyle={styles.buttonText}
                gradientColors={[
                  glassGradient.button.start,
                  glassGradient.button.end,
                ]}
              />
            </View>

            {/* Resend Section */}
            <View style={styles.resendSection}>
              <Text style={styles.resendText}>
                Didn't get an email?
              </Text>

              <Button
                variant="gradient"
                title={
                  countdown > 0
                    ? `Resend (${countdown}s)`
                    : isResending
                    ? 'Sending...'
                    : 'Resend'
                }
                onPress={handleResendEmail}
                disabled={countdown > 0 || isResending}
                style={styles.buttonWrapper}
                containerStyle={styles.buttonContainer}
                contentStyle={styles.buttonContent}
                textStyle={styles.buttonText}
                gradientColors={[
                  glassGradient.button.start,
                  glassGradient.button.end,
                ]}
              />
            </View>

            {/* Back to Sign Up */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Back to sign up"
              accessibilityHint="Returns to the sign up screen"
            >
              <Text style={styles.backButtonText}>
                Back to Sign up
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
    paddingHorizontal: scale(24),
    justifyContent: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    gap: verticalScale(48),
    width: '100%',
    maxWidth: scale(360),
    paddingHorizontal: scale(12),
  },
  headerSection: {
    alignItems: 'center',
    gap: verticalScale(24),
    alignSelf: 'stretch',
  },
  title: {
    alignSelf: 'stretch',
    color: palette.gold.DEFAULT,
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize['2xl']),
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.xl,
    textAlign: 'center',
    textShadowColor: textShadow.glow.color,                // Glow: #F0D4A8 · 30%
    textShadowOffset: textShadow.glow.offset,              // X:0 Y:0
    textShadowRadius: textShadow.glow.radius,              // Blur:10
  },
  subtitle: {
    alignSelf: 'stretch',
    color: palette.gold.subtlest,
    fontFamily: fontFamily.bodyLight,
    fontSize: moderateScale(fontSize.m),
    fontWeight: fontWeight.light,
    lineHeight: lineHeight.m,
    textAlign: 'center',
  },
  codeSection: {
    alignItems: 'center',
    gap: verticalScale(24),
    alignSelf: 'stretch',
  },
  // Input placeholder style matching Login/SignUp screens
  // Inter Regular 16px, lh:24, #fdfdf9 (text/paragraph-2)
  inputPlaceholder: {
    fontFamily: fontFamily.body,                          // Inter18pt-Regular
    fontSize: moderateScale(fontSize.s, 0.3),             // 16px
    lineHeight: lineHeight.m,                             // 24px
    color: palette.gold.subtlest,                         // #fdfdf9 (text/paragraph-2)
    textShadowColor: 'transparent',                       // No shadow
    textShadowRadius: 0,
  },
  buttonWrapper: {
    backgroundColor: palette.neutral.transparent,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    borderRadius: radius.m,
  },
  buttonContainer: {
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
    borderRadius: radius.m,
  },
  buttonContent: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    minWidth: 0,
  },
  buttonText: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize.xl),
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(fontSize.xl) * 1.3,
    letterSpacing: 0,
    color: palette.gold.DEFAULT,
    textShadowColor: textShadow.warmGlow.color,
    textShadowOffset: textShadow.warmGlow.offset,
    textShadowRadius: textShadow.warmGlow.radius,
    textTransform: 'none',
  },
  resendSection: {
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: verticalScale(20),
  },
  resendText: {
    alignSelf: 'stretch',
    color: palette.navy.light,
    fontFamily: fontFamily.bodyItalic,
    fontSize: moderateScale(fontSize.s),
    fontWeight: fontWeight.regular,
    fontStyle: 'italic',
    lineHeight: lineHeight.m,
    textAlign: 'center',
  },
  backButton: {
    padding: moderateScale(12),
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  backButtonText: {
    color: palette.navy.light,
    fontFamily: fontFamily.bodyItalic,
    fontSize: moderateScale(fontSize.s),
    fontWeight: fontWeight.regular,
    fontStyle: 'italic',
    lineHeight: lineHeight.m,
    textAlign: 'center',
  },
});

export default VerifyEmailScreen;
