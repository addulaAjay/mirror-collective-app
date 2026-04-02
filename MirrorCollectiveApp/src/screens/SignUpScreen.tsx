import { theme } from '@theme';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';
import TextInputField from '@components/TextInputField';
import { useSession } from '@context/SessionContext';

interface SignUpScreenProps {
  navigation: any;
}

interface FormErrors {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

const EMPTY_ERRORS: FormErrors = {
  fullName: '',
  email: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
};

const formatPhoneDisplay = (e164: string): string => {
  const digits = e164.startsWith('+1') ? e164.slice(2) : '';
  if (digits.length === 0) return '+1';
  if (digits.length <= 3) return `+1 (${digits}`;
  if (digits.length <= 6) return `+1 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

const SignUpScreen = ({ navigation }: SignUpScreenProps) => {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+1');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>(EMPTY_ERRORS);

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePhoneChange = (text: string) => {
    clearError('phoneNumber');
    let digits = text.replace(/\D/g, '');
    // Strip the leading '1' from the '+1' country code prefix in the displayed value
    if (digits.startsWith('1')) {
      digits = digits.slice(1);
    }
    digits = digits.slice(0, 10);
    setPhoneNumber(digits.length === 0 ? '+1' : `+1${digits}`);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = { ...EMPTY_ERRORS };
    let isValid = true;

    if (!fullName.trim()) {
      newErrors.fullName = t('auth.validation.missingFullName');
      isValid = false;
    }

    if (!email.trim()) {
      newErrors.email = t('auth.validation.missingEmail');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('auth.validation.invalidEmail');
      isValid = false;
    }

    if (phoneNumber === '+1' || phoneNumber.length <= 2) {
      newErrors.phoneNumber = t('auth.validation.missingPhone');
      isValid = false;
    } else if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
      newErrors.phoneNumber = t('auth.validation.invalidPhone');
      isValid = false;
    }

    if (!password) {
      newErrors.password = t('auth.validation.missingPassword');
      isValid = false;
    } else if (password.length < 8) {
      newErrors.password = t('auth.validation.passwordTooShort');
      isValid = false;
    } else {
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChar = /[!"#$%&'()*+,-./:;<=>?@[\]^_{|}~`.]/.test(
        password,
      );
      if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
        newErrors.password = t('auth.validation.weakPasswordMessage');
        isValid = false;
      }
    }

    if (password && password !== confirmPassword) {
      newErrors.confirmPassword = t('auth.validation.passwordMismatch');
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleContinue = () => {
    if (!validateForm()) {
      return;
    }
    navigation.navigate('TermsAndConditions', {
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password,
      phoneNumber,
    });
  };

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
              <View style={styles.contentContainer}>
                {/* Header Section */}
                <View style={styles.headerSection}>
                  <View style={styles.titleRow}>
                    <TouchableOpacity
                      onPress={() => navigation.goBack()}
                      style={styles.backButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      testID="back-button"
                    >
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
                          fill="#F2E2B1"
                        />
                      </Svg>
                    </TouchableOpacity>
                    <Text style={styles.title}>{t('auth.signup.title')}</Text>
                    <View style={styles.backButtonSpacer} />
                  </View>
                  <Text style={styles.subtitle}>{t('auth.signup.subtitle')}</Text>
                </View>

                {/* Form Section */}
                <View style={styles.formSection}>
                  {/* Full Name Field */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>
                      {t('auth.signup.fields.fullName')}
                    </Text>
                    <TextInputField
                      size="medium"
                      placeholder={t('auth.signup.fields.fullNamePlaceholder')}
                      value={fullName}
                      onChangeText={text => {
                        setFullName(text);
                        clearError('fullName');
                      }}
                      autoCapitalize="words"
                      autoComplete="name"
                      placeholderAlign="left"
                      placeholderFontFamily="regular"
                      inputTextStyle="gold-regular"
                      testID="fullname-input"
                    />
                    {errors.fullName ? (
                      <Text style={styles.errorText} testID="fullname-error">
                        {errors.fullName}
                      </Text>
                    ) : null}
                  </View>

                  {/* Email Field */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>
                      {t('auth.signup.fields.email')}
                    </Text>
                    <TextInputField
                      size="medium"
                      placeholder={t('auth.signup.fields.emailPlaceholder')}
                      value={email}
                      onChangeText={text => {
                        setEmail(text);
                        clearError('email');
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      placeholderAlign="left"
                      placeholderFontFamily="regular"
                      inputTextStyle="gold-regular"
                      testID="email-input"
                    />
                    {errors.email ? (
                      <Text style={styles.errorText} testID="email-error">
                        {errors.email}
                      </Text>
                    ) : null}
                  </View>

                  {/* Phone Number Field */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>
                      {t('auth.signup.fields.phone')}
                    </Text>
                    <TextInputField
                      size="medium"
                      placeholder="(555) 123-4567"
                      value={formatPhoneDisplay(phoneNumber)}
                      onChangeText={handlePhoneChange}
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      placeholderAlign="left"
                      placeholderFontFamily="regular"
                      inputTextStyle="gold-regular"
                      testID="phone-input"
                    />
                    {errors.phoneNumber ? (
                      <Text style={styles.errorText} testID="phone-error">
                        {errors.phoneNumber}
                      </Text>
                    ) : null}
                  </View>

                  {/* Password Field */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>
                      {t('auth.signup.fields.password')}
                    </Text>
                    <TextInputField
                      size="medium"
                      placeholder={t('auth.signup.fields.passwordPlaceholder')}
                      value={password}
                      onChangeText={text => {
                        setPassword(text);
                        clearError('password');
                      }}
                      secureTextEntry={!showPassword}
                      showPasswordToggle={true}
                      isPasswordVisible={showPassword}
                      onTogglePassword={() => setShowPassword(!showPassword)}
                      autoComplete="new-password"
                      textContentType="newPassword"
                      placeholderAlign="left"
                      placeholderFontFamily="regular"
                      inputTextStyle="gold-regular"
                      testID="password-input"
                    />
                    {errors.password ? (
                      <Text style={styles.errorText} testID="password-error">
                        {errors.password}
                      </Text>
                    ) : null}
                  </View>

                  {/* Confirm Password Field */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>
                      {t('auth.signup.fields.confirmPassword')}
                    </Text>
                    <TextInputField
                      size="medium"
                      placeholder={t(
                        'auth.signup.fields.confirmPasswordPlaceholder',
                      )}
                      value={confirmPassword}
                      onChangeText={text => {
                        setConfirmPassword(text);
                        clearError('confirmPassword');
                      }}
                      secureTextEntry={!showConfirmPassword}
                      showPasswordToggle={true}
                      isPasswordVisible={showConfirmPassword}
                      onTogglePassword={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      autoComplete="new-password"
                      textContentType="newPassword"
                      placeholderAlign="left"
                      placeholderFontFamily="regular"
                      inputTextStyle="gold-regular"
                      testID="confirm-password-input"
                    />
                    {errors.confirmPassword ? (
                      <Text style={styles.errorText} testID="confirm-password-error">
                        {errors.confirmPassword}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Continue Button */}
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={handleContinue}
                  activeOpacity={0.8}
                  testID="signup-button"
                >
                  <StarIcon width={20} height={20} />
                  <Text style={styles.continueText}>
                    {t('auth.signup.buttons.continue')}
                  </Text>
                  <StarIcon width={20} height={20} />
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
  scrollContainer: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
    paddingBottom: 100,
  },
  contentContainer: {
    alignItems: 'center',
    paddingTop: 20,
    gap: 40,
    paddingBottom: 100,
    width: '100%',
    maxWidth: 313,
  },
  headerSection: {
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  backButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonSpacer: {
    width: 20,
  },
  title: {
    ...theme.typography.styles.title,
    fontSize: 32,
    lineHeight: 42,
    color: '#F2E2B1',
    textShadowColor: '#F0D4A8',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
    textAlign: 'center',
    flex: 1,
  },
  subtitle: {
    ...theme.typography.styles.subtitle,
    fontSize: 24,
    lineHeight: 31,
    color: '#FDFDF9',
    textAlign: 'center',
  },
  formSection: {
    width: '100%',
    gap: 12,
  },
  fieldContainer: {
    width: '100%',
    gap: 8,
  },
  fieldLabel: {
    ...theme.typography.styles.label,
    fontSize: 20,
    lineHeight: 26,
    color: '#FDFDF9',
    paddingLeft: 2,
  },
  errorText: {
    ...theme.typography.styles.bodySmall,
    color: '#FF6B6B',
    marginTop: -4,
    paddingLeft: 2,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  continueText: {
    ...theme.typography.styles.title,
    fontSize: 28,
    lineHeight: 36,
    color: '#F2E2B1',
    textShadowColor: 'rgba(242, 226, 177, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
});

export default SignUpScreen;
