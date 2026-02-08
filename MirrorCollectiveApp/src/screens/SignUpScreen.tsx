import { theme } from '@theme';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';
import TextInputField from '@components/TextInputField';
import { useSession } from '@context/SessionContext';
import { getApiErrorMessage } from '@utils/apiErrorUtils';
const { width: screenWidth } = Dimensions.get('window');
interface SignUpScreenProps {
  navigation: any;
}

const SignUpScreen = ({ navigation }: SignUpScreenProps) => {
  const { t } = useTranslation();
  const { signUp } = useSession();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    if (!fullName.trim()) {
      Alert.alert(t('common.error'), t('auth.validation.missingFullName'));
      return false;
    }

    if (!email.trim()) {
      Alert.alert(t('common.error'), t('auth.validation.missingEmail'));
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('common.error'), t('auth.validation.invalidEmail'));
      return false;
    }

    if (!password) {
      Alert.alert(t('common.error'), t('auth.validation.missingPassword'));
      return false;
    }

    if (password.length < 8) {
      Alert.alert(t('common.error'), t('auth.validation.passwordTooShort'));
      return false;
    }

    // Check for password complexity
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      Alert.alert(
        t('auth.validation.weakPasswordTitle'),
        t('auth.validation.weakPasswordMessage'),
      );
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.validation.passwordMismatch'));
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await signUp(fullName, email, password);

      Alert.alert(
        t('auth.signup.alerts.welcomeTitle'),
        t('auth.signup.alerts.welcomeMessage'),
        [
          {
            text: t('auth.validation.continue'),
            onPress: () =>
              navigation.navigate('VerifyEmail', {
                email: email.toLowerCase().trim(),
                fullName: fullName.trim(),
              }),
          },
        ],
      );
    } catch (error: any) {
      console.error('Sign up error:', error);
      Alert.alert(
        t('auth.signup.alerts.failedTitle'),
        getApiErrorMessage(error, t),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };
  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
        <BackgroundWrapper style={styles.container}>
          <SafeAreaView style={styles.safe}>
            <LogoHeader />
            <ScrollView
              style={{ width: '100%' }}
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
                    <Text style={styles.title}>{t('auth.signup.title')}</Text>
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
                        onChangeText={setFullName}
                        autoCapitalize="words"
                        autoComplete="name"
                        placeholderAlign="left"
                        placeholderFontFamily="regular"
                        inputTextStyle="gold-regular"
                        testID="fullname-input"
                      />
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
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        placeholderAlign="left"
                        placeholderFontFamily="regular"
                        inputTextStyle="gold-regular"
                        testID="email-input"
                      />
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
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        showPasswordToggle={true}
                        isPasswordVisible={showPassword}
                        onTogglePassword={() => setShowPassword(!showPassword)}
                        placeholderAlign="left"
                        placeholderFontFamily="regular"
                        inputTextStyle="gold-regular"
                        testID="password-input"
                      />
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
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                        showPasswordToggle={true}
                        isPasswordVisible={showConfirmPassword}
                        placeholderAlign="left"
                        placeholderFontFamily="regular"
                        inputTextStyle="gold-regular"
                        onTogglePassword={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        testID="confirm-password-input"
                      />
                    </View>
                  </View>

                  {/* Continue Button */}
                  <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleSignUp}
                    disabled={isLoading}
                    activeOpacity={0.8}
                    testID="signup-button"
                  >
                    <StarIcon width={20} height={20} />
                    <Text style={styles.continueText}>
                      {isLoading
                        ? t('auth.signup.buttons.creating')
                        : t('auth.signup.buttons.continue')}
                    </Text>
                    <StarIcon width={20} height={20} />
                  </TouchableOpacity>

                  {/* Login Link */}
                  <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>
                      {t('auth.signup.footer.alreadyMember')}
                    </Text>
                    <TouchableOpacity
                      onPress={navigateToLogin}
                      disabled={isLoading}
                      testID="login-link"
                    >
                      <Text style={styles.loginLink}>
                        {t('auth.signup.footer.signIn')}
                      </Text>
                    </TouchableOpacity>
                  </View>
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
  },
  scrollContainer: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
    paddingVertical: 0,
    paddingBottom: 100,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 20,
    gap: 32,
    paddingBottom: 100,
  },
  headerSection: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    ...theme.typography.styles.title,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
    fontSize: 32,
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 38,
    marginTop: 20, // Added consistency
  },
  subtitle: {
    ...theme.typography.styles.subtitle,
    color: '#FDFDF9',
    fontFamily: 'CormorantGaramond-Regular',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 30,
  },
  formSection: {
    width: '100%',
    gap: 20,
    maxWidth: 360,
    paddingHorizontal: 24,
  },
  fieldContainer: {
    width: '100%',
    gap: 8,
  },
  fieldLabel: {
    ...theme.typography.styles.label,
    paddingLeft: 4,
    fontSize: 20,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
    marginTop: 40,
    paddingVertical: 4,
  },
  continueText: {
    fontFamily: 'CormorantGaramond-Medium',
    fontSize: 24,
    fontWeight: '500',
    color: '#E5D6B0',
    textShadowColor: 'rgba(229, 214, 176, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  loginContainer: {
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  loginText: {
    ...theme.typography.styles.bodyItalic,
    textAlign: 'center',
  },
  loginLink: {
    ...theme.typography.styles.linkLarge,
  },
});

export default SignUpScreen;
