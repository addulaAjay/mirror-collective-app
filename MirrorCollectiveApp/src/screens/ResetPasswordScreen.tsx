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
  theme,
  verticalScale,
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
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from 'react-native-svg';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button';
import LogoHeader from '@components/LogoHeader';
import TextInputField from '@components/TextInputField';
import { useSession } from '@context/SessionContext';
import { getApiErrorMessage } from '@utils/apiErrorUtils';

// Figma 4928:7988 — back arrow, 20×20, gold
const BackArrowIcon: React.FC = () => (
  <Svg width={scale(20)} height={scale(20)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
      fill={palette.gold.DEFAULT}
    />
  </Svg>
);

type ResetPasswordScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ResetPassword'
>;

type ResetPasswordScreenRouteProp = RouteProp<
  RootStackParamList,
  'ResetPassword'
>;

const ResetPasswordScreen = () => {
  const { t } = useTranslation();
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  const { resetPassword, state } = useSession();
  const navigation = useNavigation<ResetPasswordScreenNavigationProp>();
  const route = useRoute<ResetPasswordScreenRouteProp>();
  const { email } = route.params;

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasNonalphas = /\W/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasNonalphas
    );
  };

  const handleResetPassword = async () => {
    if (!resetCode.trim()) {
      Alert.alert(t('common.error'), 'Please enter the reset code');
      return;
    }

    if (resetCode.trim().length !== 6) {
      Alert.alert(t('common.error'), 'Reset code must be 6 digits');
      return;
    }

    if (!newPassword) {
      Alert.alert(t('common.error'), t('auth.validation.missingPassword'));
      return;
    }

    if (!validatePassword(newPassword)) {
      Alert.alert(
        t('auth.validation.weakPasswordTitle'),
        t('auth.validation.weakPasswordMessage'),
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.validation.passwordMismatch'));
      return;
    }

    try {
      setIsLoading(true);
      await resetPassword(email, resetCode.trim(), newPassword);

      Alert.alert(
        t('auth.resetPassword.successTitle'),
        t('auth.resetPassword.successMessage'),
        [
          {
            text: t('common.continue'),
            onPress: () => navigation.navigate('Login'),
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

  return (
    <BackgroundWrapper style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === 'ios' ? 'interactive' : 'on-drag'
          }
          bottomOffset={16}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.contentContainer}>
                {/* Header row — back arrow + centered title + spacer
                    (matches ForgotPassword Figma 4928:7986). */}
                <View style={styles.headerRow}>
                  <TouchableOpacity
                    onPress={handleBackToLogin}
                    style={styles.backBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Back"
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    testID="header-back-button"
                  >
                    <BackArrowIcon />
                  </TouchableOpacity>
                  <Text style={styles.title}>
                    {t('auth.resetPassword.title')}
                  </Text>
                  <View style={styles.headerSpacer} />
                </View>

                {/* Form Section */}
                <View style={styles.formSection}>
                  {/* Reset Code Field */}
                  <View style={styles.fieldContainer}>
                    <TextInputField
                      label='Reset Code'
                      testID="reset-code-input"
                      placeholder="6-digit reset code"
                      value={resetCode}
                      onChangeText={setResetCode}
                      keyboardType="numeric"
                      autoCapitalize="none"
                      autoComplete="off"
                      size="small"
                    />
                  </View>

                  {/* New Password Field */}
                  <View style={styles.fieldContainer}>
                    <TextInputField
                    label={t('auth.resetPassword.passwordPlaceholder')}
                      testID="new-password-input"
                      placeholder={t('auth.resetPassword.passwordPlaceholder')}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!isPasswordVisible}
                      autoCapitalize="none"
                      autoComplete="password"
                      showPasswordToggle={true}
                      isPasswordVisible={isPasswordVisible}
                      size="small"
                      onTogglePassword={() =>
                        setIsPasswordVisible(!isPasswordVisible)
                      }
                    />
                  </View>

                  {/* Confirm Password Field */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>{t('auth.signup.fields.confirmPassword')}</Text>
                    <TextInputField
                      testID="confirm-password-input"
                      placeholder={t('auth.signup.fields.confirmPasswordPlaceholder')}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!isConfirmPasswordVisible}
                      autoCapitalize="none"
                      autoComplete="password"
                      showPasswordToggle={true}
                      isPasswordVisible={isConfirmPasswordVisible}
                      size="small"
                      onTogglePassword={() =>
                        setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
                      }
                    />
                  </View>

                  {state.error && (
                    <Text style={styles.errorText}>{state.error}</Text>
                  )}

                  {/* Reset Password Button — auth-CTA pattern, 24px stars per Figma */}
                  <Button
                    variant="primary"
                    title={
                      isLoading
                        ? t('auth.resetPassword.resettingButton')
                        : t('auth.resetPassword.resetButton')
                    }
                    onPress={handleResetPassword}
                    disabled={isLoading}
                    testID="reset-password-button"
                  />
                </View>

                {/* Back to Login — matches ForgotPassword pill styling
                    (padding 12v/8h, radius 8, Cormorant 24, gold,
                    underlined per Figma 7009:979). */}
                <TouchableOpacity
                  onPress={handleBackToLogin}
                  style={styles.backToLoginBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  testID="back-to-login-button"
                >
                  <Text style={styles.backLinkText}>
                    {t('auth.forgotPassword.backToLogin')}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
    width: '100%',
  },
  container: {
    flex: 1,
  },

  // Match ForgotPasswordScreen — content column at ~72px below LogoHeader,
  // gutters of 24px, gap 40px between sections.
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(72),
    paddingBottom: verticalScale(40),
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    gap: verticalScale(40),
  },

  // Figma 4928:7986 — header row, justify-between, items-center
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  backBtn: {
    paddingVertical: verticalScale(8),
  },
  headerSpacer: {
    width: scale(20),
  },

  // Heading M — Cormorant Regular 28/32, gold, glow
  title: {
    flex: 1,
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize['2xl']),    // 28
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.xl,                    // 32
    letterSpacing: 0,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    textShadowColor: textShadow.glow.color,
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: textShadow.glow.radius,
  },

  formSection: {
    width: '100%',
    gap: verticalScale(12),
  },
  fieldContainer: {
    width: '100%',
    gap: verticalScale(4),
  },
  fieldLabel: {
    ...theme.typography.styles.label,
    paddingLeft: scale(8),
  },
  errorText: {
    ...theme.typography.styles.bodySmall,
    color: palette.status.errorHover,
    textAlign: 'center',
    marginTop: verticalScale(10),
    marginBottom: verticalScale(10),
  },

  // Match ForgotPassword pill styling
  backToLoginBtn: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(8),
    borderRadius: moderateScale(8),
  },
  // Cormorant Regular 24/28, gold, underlined
  backLinkText: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize.xl),
    lineHeight: lineHeight.xl,                    // 28
    color: palette.gold.DEFAULT,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});

export default ResetPasswordScreen;
