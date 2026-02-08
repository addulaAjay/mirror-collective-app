import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';
import TextInputField from '@components/TextInputField';
import { useSession } from '@context/SessionContext';
import { theme } from '@theme';
import type { RootStackParamList } from '@types';
import { getApiErrorMessage } from '@utils/apiErrorUtils';

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
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <BackgroundWrapper
        style={styles.container}
      >
        <SafeAreaView style={styles.safe}>
          <LogoHeader />
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === 'ios' ? 'interactive' : 'on-drag'
            }
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.contentContainer}>
                {/* Header Section */}
                <View style={styles.headerSection}>
                  <Text style={styles.title}>{t('auth.resetPassword.title')}</Text>
                  <Text style={styles.subtitle}>
                    {t('auth.forgotPassword.subtitle')}
                    {'\n'}
                    <Text style={styles.emailText}>{email}</Text>
                  </Text>
                </View>

                {/* Form Section */}
                <View style={styles.formSection}>
                  {/* Reset Code Field */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Reset Code</Text>
                    <TextInputField
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
                    <Text style={styles.fieldLabel}>{t('auth.resetPassword.passwordPlaceholder')}</Text>
                    <TextInputField
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

                  <Text style={styles.passwordRequirements}>
                    {t('auth.validation.weakPasswordMessage')}
                  </Text>

                  {state.error && (
                    <Text style={styles.errorText}>{state.error}</Text>
                  )}

                  {/* Reset Password Button */}
                  <TouchableOpacity
                    style={styles.enterButton}
                    testID="reset-password-button"
                    onPress={handleResetPassword}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <StarIcon width={24} height={24} />
                    <Text style={styles.enterText}>
                      {isLoading ? t('auth.resetPassword.resettingButton') : t('auth.resetPassword.resetButton')}
                    </Text>
                    <StarIcon width={24} height={24} />
                  </TouchableOpacity>
                </View>

                {/* Back to Login */}
                <TouchableOpacity
                  onPress={handleBackToLogin}
                  style={styles.backLink}
                  testID="back-to-login-button"
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
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
    width: '100%',
  },
  container: {
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: -1, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 26,
    elevation: 10,
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 0, 
    gap: 40,
  },
  headerSection: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...theme.typography.styles.title,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.styles.body,
    textAlign: 'center',
    lineHeight: 24,
  },
  emailText: {
    color: theme.colors.text.accent,
    fontWeight: '600',
  },
  formSection: {
    width: '100%',
    gap: 12,
  },
  fieldContainer: {
    width: '100%',
    gap: 4,
  },
  fieldLabel: {
    ...theme.typography.styles.label,
    paddingLeft: 8,
  },
  passwordRequirements: {
    ...theme.typography.styles.caption,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
    lineHeight: 16,
  },
  errorText: {
    ...theme.typography.styles.bodySmall,
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
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
    textShadowColor: 'rgba(245, 230, 184, 0.50)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  backLink: {
    marginTop: 20,
  },
  backLinkText: {
    ...theme.typography.styles.body,
    textAlign: 'center',
  },
  linkText: {
    ...theme.typography.styles.linkLarge,
  },
});

export default ResetPasswordScreen;
