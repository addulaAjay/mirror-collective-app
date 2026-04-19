import {
  palette,
  fontFamily,
  fontSize,
  lineHeight,
  moderateScale,
  scale,
  verticalScale,
  textShadow,
} from '@theme';
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
                          fill={palette.gold.DEFAULT}
                        />
                      </Svg>
                    </TouchableOpacity>
                    <Text style={styles.title}>{t('auth.signup.title')}</Text>
                    <View style={styles.backButtonSpacer} />
                  </View>
                  <Text style={styles.subtitle}>{t('auth.signup.subtitle')}</Text>
                </View>

                {/* Form Section — Figma: node 286:1358, gap-12px, px-16px */}
                <View style={styles.formSection}>
                  {/* Full Name Field */}
                  <View style={styles.fieldContainer}>
                    <TextInputField
                      size="S"
                      label={t('auth.signup.fields.fullName')}
                      placeholder={t('auth.signup.fields.fullNamePlaceholder')}
                      value={fullName}
                      onChangeText={text => {
                        setFullName(text);
                        clearError('fullName');
                      }}
                      autoCapitalize="words"
                      autoComplete="name"
                      placeholderAlign="left"
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
                    <TextInputField
                      size="S"
                      label={t('auth.signup.fields.email')}
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
                    <TextInputField
                      size="S"
                      label={t('auth.signup.fields.phone')}
                      placeholder={t('auth.signup.fields.phonePlaceholder')}
                      value={formatPhoneDisplay(phoneNumber)}
                      onChangeText={handlePhoneChange}
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      placeholderAlign="left"
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
                    <TextInputField
                      size="S"
                      label={t('auth.signup.fields.password')}
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
                    <TextInputField
                      size="S"
                      label={t('auth.signup.fields.confirmPassword')}
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
    alignItems: 'center',
    paddingHorizontal: scale(24),    // Figma: left:24px on 393px frame
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(60),
  },
  contentContainer: {
    alignItems: 'center',
    gap: verticalScale(40),          // Figma: gap-40px between all sections
    width: '100%',
  },

  // Figma: node 286:1355 — header col gap-4px
  headerSection: {
    alignItems: 'center',
    gap: verticalScale(4),
    width: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  backButton: {
    width: scale(20),
    height: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonSpacer: {
    width: scale(20),               // Mirrors backButton for visual centering of title
  },

  // Figma: Heading/Heading L — Cormorant Regular 3XL (32px), lh:40 (XXL), #f2e2b1, glow shadow
  title: {
    fontFamily: fontFamily.heading,                       // CormorantGaramond-Regular
    fontSize: moderateScale(fontSize['3xl']),              // 32px
    fontWeight: '400',
    lineHeight: lineHeight.xxl,                           // 40px — Figma: font/line-height/XXL
    letterSpacing: 0,
    color: palette.gold.DEFAULT,                          // #f2e2b1
    textShadowColor: textShadow.glow.color,                // Glow: #F0D4A8 · 30%
    textShadowOffset: textShadow.glow.offset,              // X:0 Y:0
    textShadowRadius: textShadow.glow.radius,              // Blur:10
    textAlign: 'center',
    flex: 1,
  },

  // Figma: Heading/Heading S — Cormorant Regular XL (24px), lh:28 (2XL), #fdfdf9
  subtitle: {
    fontFamily: fontFamily.heading,                       // CormorantGaramond-Regular
    fontSize: moderateScale(fontSize.xl),                 // 24px — Figma: font/size/XL
    fontWeight: '400',
    lineHeight: fontSize['2xl'],                          // 28px — Figma: leading-[var(--font/size/2xl,28px)]
    letterSpacing: 0,
    color: palette.gold.subtlest,                         // #fdfdf9
    textAlign: 'center',
    width: '100%',
  },

  // Figma: node 286:1358 — gap-12px, px-16px
  formSection: {
    width: '100%',
    gap: verticalScale(12),
    paddingHorizontal: scale(16),   // Figma: px-[16px] on form section
  },

  // Figma: gap-8px between label and field
  fieldContainer: {
    width: '100%',
    gap: verticalScale(8),
  },

  errorText: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.xs),                 // 14px
    lineHeight: moderateScale(fontSize.xs) * 1.4,
    color: palette.status.error,                          // #f83b3d (NOT errorHover)
    marginTop: -verticalScale(4),
    paddingLeft: scale(2),
  },

  // Figma: node 1286:1443 — row gap-16px, stars 20×20
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(16),
    justifyContent: 'center',
  },

  // Figma: Heading/Heading S — Cormorant Regular XL (24px), lh:2XL (28px), #f2e2b1, shadow 0 0 4px warmGlow
  continueText: {
    fontFamily: fontFamily.heading,                       // CormorantGaramond-Regular
    fontSize: moderateScale(fontSize.xl),                 // 24px — Figma: font/size/XL
    fontWeight: '400',
    lineHeight: fontSize['2xl'],                          // 28px — Figma: font/size/2XL
    letterSpacing: 0,
    color: palette.gold.DEFAULT,                          // #f2e2b1
    textShadowColor: textShadow.warmGlow.color,           // #E5D6B0 · 50%
    textShadowOffset: textShadow.warmGlow.offset,
    textShadowRadius: 4,                                  // Figma: Blur 4px
  },
});

export default SignUpScreen;
