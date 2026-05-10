import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  palette,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  scale,
  verticalScale,
  moderateScale,
  textShadow,
} from '@theme';
import type { RootStackParamList } from '@types';
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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button';
import LogoHeader from '@components/LogoHeader';
import TextInputField from '@components/TextInputField';
import { useSession } from '@context/SessionContext';
import { getApiErrorMessage } from '@utils/apiErrorUtils';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ForgotPassword'
>;

const ForgotPasswordScreen = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { forgotPassword, state } = useSession();
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();

  const validateEmail = (emailAddress: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailAddress);
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(t('common.error'), t('auth.validation.missingEmail'));
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert(t('common.error'), t('auth.validation.invalidEmail'));
      return;
    }

    try {
      setIsLoading(true);
      await forgotPassword(email.trim());
      setEmailSent(true);
      Alert.alert(
        t('auth.forgotPassword.successTitle'),
        t('auth.forgotPassword.successMessage'),
        [
          {
            text: t('common.continue'),
            onPress: () =>
              navigation.navigate('ResetPassword', { email: email.trim() }),
          },
        ],
      );
    } catch (error: any) {
      Alert.alert(t('common.error'), getApiErrorMessage(error, t));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  // ── Email sent confirmation state ────────────────────────────────────────
  if (emailSent) {
    return (
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <BackgroundWrapper style={styles.container}>
          <SafeAreaView style={styles.safe}>
            <LogoHeader />
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.contentContainer}>
                  <Text style={styles.title}>
                    {t('auth.forgotPassword.title')}
                  </Text>
                  <Text style={styles.subtitle}>
                    {t('auth.forgotPassword.successMessage')}
                    {'\n'}
                    <Text style={styles.emailHighlight}>{email}</Text>
                  </Text>

                  <Button
                    variant="auth"
                    title={t('common.continue')}
                    onPress={() => navigation.navigate('ResetPassword', { email })}
                    testID="success-continue-button"
                  />

                  <TouchableOpacity
                    onPress={handleBackToLogin}
                    testID="success-back-to-login"
                  >
                    <Text style={styles.backLinkText}>
                      {t('auth.forgotPassword.backToLogin')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </ScrollView>
          </SafeAreaView>
        </BackgroundWrapper>
      </KeyboardAvoidingView>
    );
  }

  // ── Default state — Figma: node 4116:513 ────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <BackgroundWrapper style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <LogoHeader />
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === 'ios' ? 'interactive' : 'on-drag'
            }
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              {/* Figma: node 4116:516 — flat flex col gap-40px, left:40px */}
              <View style={styles.contentContainer}>

                {/* Title — Figma: Cormorant Regular 3XL (32px), lh:40 (XXL), #f2e2b1, no shadow */}
                <Text style={styles.title}>
                  {t('auth.forgotPassword.title')}
                </Text>

                {/* Subtitle — Figma: node 4117:604, Cormorant Regular L (20px), lh:24, #fdfdf9 */}
                <Text style={styles.subtitle}>
                  {t('auth.forgotPassword.subtitle')}
                </Text>

                {/* Email input — Figma: node 4116:519, Cormorant Medium centered placeholder */}
                <View style={styles.inputWrapper}>
                  <TextInputField
                    testID="email-input"
                    size="M"
                    placeholder={t('auth.forgotPassword.emailPlaceholder')}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    placeholderAlign="center"
                  />
                  {/* Error row — Figma: node 4121:367, icon 20×20 + Inter XS error text, items-start, gap-4px */}
                  {state.error && (
                    <View style={styles.errorRow}>
                      <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                        <Circle cx="10" cy="10" r="9" stroke={palette.status.error} strokeWidth="1.5" />
                        <Path d="M10 6v5" stroke={palette.status.error} strokeWidth="1.5" strokeLinecap="round" />
                        <Circle cx="10" cy="13.5" r="0.75" fill={palette.status.error} />
                      </Svg>
                      <Text style={styles.errorText}>{state.error}</Text>
                    </View>
                  )}
                </View>

                {/* SEND LINK button — Figma: node 4116:521 (auth-CTA pattern) */}
                <Button
                  variant="auth"
                  title={
                    isLoading
                      ? t('auth.forgotPassword.sendingButton')
                      : t('auth.forgotPassword.sendButton')
                  }
                  onPress={handleForgotPassword}
                  disabled={isLoading}
                  testID="forgot-password-button"
                />

                {/* Back to login — matches LoginScreen "Sign up here" link style */}
                <TouchableOpacity
                  onPress={handleBackToLogin}
                  testID="back-to-login-button"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.backLinkText}>
                    {t('auth.forgotPassword.backToLogin')}
                  </Text>
                </TouchableOpacity>

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
  container: {
    flex: 1,
    alignSelf: 'stretch',
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
    width: '100%',
  },
  scrollView: {
    width: '100%',
  },
  // Figma: content left:40px on 393px frame → paddingHorizontal:40, top:212px → ~80px below LogoHeader
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: scale(40),
    paddingTop: verticalScale(80),
    paddingBottom: verticalScale(40),
  },

  // Figma: node 4116:516 — flat flex col, gap:40px, items:center
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    gap: verticalScale(40),
  },

  // Figma: Heading/Heading L — Cormorant Regular 3XL (32px), lh:40 (XXL), #f2e2b1, glow shadow
  title: {
    fontFamily: fontFamily.heading,                       // CormorantGaramond-Regular
    fontSize: moderateScale(fontSize['3xl']),              // 32px — Figma: font/size/3XL
    fontWeight: fontWeight.regular,                        // 400
    lineHeight: lineHeight.xxl,                           // 40px — Figma: font/line-height/XXL
    letterSpacing: 0,
    color: palette.gold.DEFAULT,                           // #f2e2b1 — Figma: text/paragraph-1
    textAlign: 'center',
    textShadowColor: textShadow.glow.color,                // Glow: #F0D4A8 · 30%
    textShadowOffset: textShadow.glow.offset,              // X:0 Y:0
    textShadowRadius: textShadow.glow.radius,              // Blur:10
  },

  // Figma: Heading/Heading XS — Cormorant Regular L (20px), lh:24px, #fdfdf9
  subtitle: {
    fontFamily: fontFamily.heading,                       // CormorantGaramond-Regular
    fontSize: moderateScale(fontSize.l),                  // 20px — Figma: font/size/L
    fontWeight: fontWeight.regular,                        // 400
    lineHeight: lineHeight.m,                             // 24px — Figma: leading-font/size/XL=24
    letterSpacing: 0,
    color: palette.gold.subtlest,                          // #fdfdf9 — Figma: text/paragraph-2
    textAlign: 'center',
    width: '100%',
  },

  // Figma: node 4121:381 — flex col gap-8px, wraps input + error row
  inputWrapper: {
    width: '100%',
    gap: verticalScale(8),
  },

  // Figma: node 4121:367 — flex row gap-4px, items-start
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scale(4),
    width: '100%',
  },

  // Figma: node 4121:369 — Inter Regular XS (14px), lh S (20px), text/error (#f83b3d), flex-1
  errorText: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.xs),    // 14px — Figma: font/size/xs
    lineHeight: lineHeight.s,                // 20px — Figma: font/line-height/s
    color: palette.status.error,             // #f83b3d
  },

  // Figma: node 4116:521 — flex row gap-16px, items center, justify center
  enterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(16),
    justifyContent: 'center',
  },

  // Figma: Heading/Heading M — Cormorant Regular 2XL (28px), lh:32 (XL), #f2e2b1
  // Shadow: 0 0 4px rgba(229,214,176,0.5) — warmGlow color, radius 4
  enterText: {
    fontFamily: fontFamily.heading,                        // CormorantGaramond-Regular
    fontSize: moderateScale(fontSize['2xl']),               // 28px — Figma: font/size/2XL
    fontWeight: fontWeight.regular,                         // 400
    lineHeight: lineHeight.xl,                             // 32px — Figma: font/line-height/XL
    letterSpacing: 0,
    color: palette.gold.DEFAULT,                            // #f2e2b1
    textShadowColor: textShadow.warmGlow.color,             // rgba(229,214,176,0.5)
    textShadowOffset: textShadow.warmGlow.offset,
    textShadowRadius: 4,                                    // Figma: 4px (not warmGlow token 9)
  },

  // Matches LoginScreen "Sign up here" — Cormorant Regular XL (24px), gold.DEFAULT, underlined
  backLinkText: {
    fontFamily: fontFamily.heading,                        // CormorantGaramond-Regular
    fontSize: moderateScale(fontSize.xl),                  // 24px — Figma: font/size/XL
    lineHeight: moderateScale(fontSize.xl) * 1.3,
    color: palette.gold.DEFAULT,                           // #f2e2b1
    textDecorationLine: 'underline',
    textAlign: 'center',
  },

  // Used in emailSent state for the highlighted email address
  emailHighlight: {
    fontFamily: fontFamily.body,
    fontWeight: fontWeight.semibold,
    color: palette.gold.DEFAULT,
  },
});

export default ForgotPasswordScreen;
