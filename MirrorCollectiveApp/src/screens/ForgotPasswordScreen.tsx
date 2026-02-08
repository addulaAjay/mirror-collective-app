import { useNavigation } from '@react-navigation/native';
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
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';
import TextInputField from '@components/TextInputField';
import { useSession } from '@context/SessionContext';
import { theme } from '@theme';
import type { RootStackParamList } from '@types';
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

  if (emailSent) {
    return (
      <BackgroundWrapper style={styles.root}>
        <SafeAreaView style={styles.safe}>
          <LogoHeader />
          <KeyboardAvoidingView
            style={styles.keyboardContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
          <ScrollView
            style={{ width: '100%' }}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.contentContainer}>
                <Text style={styles.title}>{t('auth.forgotPassword.title')}</Text>
                <Text style={styles.subtitle}>
                  {t('auth.forgotPassword.successMessage')}
                  {'\n'}
                  <Text style={styles.emailText}>{email}</Text>
                </Text>

                <Text style={styles.instructions}>
                  {t('auth.resetPassword.subtitle')}
                </Text>

                <TouchableOpacity
                  style={styles.enterButton}
                  testID="success-continue-button"
                  onPress={() => navigation.navigate('ResetPassword', { email })}
                  activeOpacity={0.8}
                >
                  <StarIcon width={24} height={24} />
                  <Text style={styles.enterText}>{t('common.continue')}</Text>
                  <StarIcon width={24} height={24} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleBackToLogin}
                  style={styles.backLink}
                  testID="success-back-to-login"
                >
                  <Text style={styles.backLinkText}>{t('auth.forgotPassword.backToLogin')}</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </KeyboardAvoidingView>
        </SafeAreaView>
      </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={{ width: '100%' }}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.contentContainer}>
                <Text style={styles.title}>{t('auth.forgotPassword.title')}</Text>
                <Text style={styles.subtitle}>
                  {t('auth.forgotPassword.subtitle')}
                </Text>

                <View style={styles.formContainer}>
                  <TextInputField
                    testID="email-input"
                    placeholder={t('auth.forgotPassword.emailPlaceholder')}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    size="small"
                  />

                  {state.error && <Text style={styles.errorText}>{state.error}</Text>}

                  <TouchableOpacity
                    style={styles.enterButton}
                    testID="forgot-password-button"
                    onPress={handleForgotPassword}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <StarIcon width={24} height={24} />
                    <Text style={styles.enterText}>
                      {isLoading ? t('auth.forgotPassword.sendingButton') : t('auth.forgotPassword.sendButton')}
                    </Text>
                    <StarIcon width={24} height={24} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={handleBackToLogin} style={styles.backLink} testID="back-to-login-button">
                  <Text style={styles.backLinkText}>
                    {t('auth.forgotPassword.backToLogin')}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 20,
    width: '100%',
    maxWidth: 313,
  },
  title: {
    ...theme.typography.styles.title,
    textAlign: 'center',
    fontFamily: 'CormorantGaramond-Italic',
  },
  subtitle: {
    ...theme.typography.styles.body,
    textAlign: 'center',
    fontFamily: 'CormorantGaramond-LightItalic',
  },
  emailText: {
    color: theme.colors.text.accent,
    fontWeight: '600',
  },
  instructions: {
    ...theme.typography.styles.bodySmall,
    textAlign: 'center',
  },
  formContainer: {
    gap: 12,
    width: '100%',
    alignItems: 'center',
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
  errorText: {
    ...theme.typography.styles.bodySmall,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  backLink: {
    marginTop: 20,
  },
  backLinkText: {
    ...theme.typography.styles.body,
    textAlign: 'center',
    fontFamily: 'CormorantGaramond-Italic',
  },
  linkText: {
    ...theme.typography.styles.linkLarge,
    fontWeight: '600',
    fontFamily: 'CormorantGaramond-LightItalic',
  },
});

export default ForgotPasswordScreen;
