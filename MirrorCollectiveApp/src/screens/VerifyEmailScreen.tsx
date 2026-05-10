import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  moderateScale,
  palette,
  scale,
  textShadow,
  verticalScale,
} from '@theme';
import type { RootStackParamList } from '@types';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button/Button';
import LogoHeader from '@components/LogoHeader';
import TextInputField from '@components/TextInputField';
import { authApiService } from '@services/api';
import { QuizStorageService } from '@services/quizStorageService';
import { getApiErrorMessage } from '@utils/apiErrorUtils';
import { clearPendingVerification } from '@utils/verificationState';

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
      Alert.alert(
        t('auth.verifyEmail.missingEmailTitle'),
        t('auth.verifyEmail.missingEmailBody'),
      );
      return;
    }

    if (trimmedCode.length !== VERIFICATION_CODE_LENGTH) {
      // UI gates the Verify button until the code is exactly 6 digits, so this
      // should be unreachable in practice — but keep a defensive guard.
      Alert.alert(t('common.error'), t('auth.verifyEmail.codePlaceholder'));
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
        // Email verified — clear the recovery record so app launch routes
        // back to its normal flow.
        await clearPendingVerification();

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
      Alert.alert(
        t('auth.verifyEmail.missingEmailTitle'),
        t('auth.verifyEmail.missingEmailBody'),
      );
      return;
    }

    setIsResending(true);

    try {
      const response = await authApiService.resendVerificationCode(normalizedEmail);

      if (response.success) {
        setCountdown(RESEND_COOLDOWN_SECONDS);
        Alert.alert(
          t('auth.verifyEmail.resendSuccessTitle'),
          t('auth.verifyEmail.resendSuccessBody'),
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
              <Text
                style={styles.title}
                accessibilityRole="header"
                accessibilityLabel={t('auth.verifyEmail.title')}
              >
                {t('auth.verifyEmail.title')}
              </Text>
              <Text style={styles.subtitle}>
                {t('auth.verifyEmail.subtitle')}
              </Text>
            </View>

            {/* Verification Code Input */}
            <View style={styles.codeSection}>
              <TextInputField
                testID="verification-code-input"
                placeholder={t('auth.verifyEmail.codePlaceholder')}
                placeholderAlign="center"
                textAlign="center"
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="numeric"
                autoCapitalize="none"
                autoComplete="one-time-code"
                maxLength={VERIFICATION_CODE_LENGTH}
              />

              <Button
                variant="primary"
                size="L"
                active={!isVerifying && verificationCode.trim().length === VERIFICATION_CODE_LENGTH}
                title={isVerifying
                  ? t('auth.verifyEmail.verifyingButton')
                  : t('auth.verifyEmail.verifyButton')}
                onPress={handleVerifyCode}
                disabled={isVerifying || verificationCode.trim().length !== VERIFICATION_CODE_LENGTH}
              />
            </View>

            {/* Resend Section */}
            <View style={styles.resendSection}>
              <Text style={styles.resendText}>
                {t('auth.verifyEmail.resendPrompt')}
              </Text>

              <Button
                variant="primary"
                size="L"
                active={countdown === 0 && !isResending}
                title={
                  countdown > 0
                    ? t('auth.verifyEmail.resendButtonWithTimer', { count: countdown })
                    : isResending
                    ? t('auth.verifyEmail.sendingButton')
                    : t('auth.verifyEmail.resendButton')
                }
                onPress={handleResendEmail}
                disabled={countdown > 0 || isResending}
              />
            </View>

            {/* Back to sign up — underlined gold link per Figma node 2936-446 */}
            <Pressable
              onPress={() => {
                // Prefer popTo so we land on the SignUp instance still in
                // the stack (preserves any form values via React state).
                // popTo throws if SignUp is absent (e.g. recovered into
                // VerifyEmail from app launch); fall back to navigate.
                try {
                  navigation.popTo('SignUp');
                } catch {
                  navigation.navigate('SignUp');
                }
              }}
              style={({ pressed }) => [
                styles.backLinkWrap,
                pressed && styles.backLinkPressed,
              ]}
              accessibilityRole="link"
              accessibilityLabel={t('auth.verifyEmail.backToSignUp')}
              accessibilityHint="Returns to the sign up screen"
              hitSlop={8}
            >
              <Text style={styles.backLink}>
                {t('auth.verifyEmail.backToSignUp')}
              </Text>
            </Pressable>
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
  // Back to sign up — matches the "Sign up here" link on LoginScreen
  // (Figma node 203:2821 / 1886:2357). Cormorant Garamond Regular 24px,
  // gold default, native textDecorationLine underline.
  backLinkWrap: {
    alignSelf: 'center',
  },
  backLinkPressed: {
    opacity: 0.7,
  },
  backLink: {
    fontFamily: fontFamily.heading,                       // CormorantGaramond-Regular
    fontSize: moderateScale(fontSize.xl),                 // 24px — Figma: font/size/XL
    lineHeight: moderateScale(fontSize.xl) * 1.3,
    color: palette.gold.DEFAULT,                          // #f2e2b1
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});

export default VerifyEmailScreen;
