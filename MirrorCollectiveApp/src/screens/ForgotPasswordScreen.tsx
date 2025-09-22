import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from 'react-native';
import LogoHeader from '../components/LogoHeader';
import TextInputField from '../components/TextInputField';
import StarIcon from '../components/StarIcon';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

// 🎨 Theme imports
import { COLORS, TEXT_STYLES, SPACING, SHADOWS,BORDERS } from '../styles';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ForgotPassword'
>;

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { forgotPassword, state } = useAuth();
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();

  const validateEmail = (emailAddress: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    if (!validateEmail(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      await forgotPassword(email.trim());
      setEmailSent(true);
      Alert.alert(
        'Reset Code Sent',
        'Check your email for the reset code and follow the instructions to reset your password.',
        [
          {
            text: 'OK',
            onPress: () =>
              navigation.navigate('ResetPassword', { email: email.trim() }),
          },
        ],
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  if (emailSent) {
    return (
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ImageBackground
          source={require('../../assets/dark_mode_shimmer_bg.png')}
          style={styles.container}
          resizeMode="cover"
        >
          <LogoHeader />

          <View style={styles.contentContainer}>
            <Text style={styles.title}>Check Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent a reset code to{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>

            <Text style={styles.instructions}>
              Enter the 6-digit code in the next screen to reset your password.
            </Text>

            <TouchableOpacity
              style={styles.enterButton}
              onPress={() => navigation.navigate('ResetPassword', { email })}
              activeOpacity={0.8}
            >
              <StarIcon width={24} height={24} />
              <Text style={styles.enterText}>CONTINUE</Text>
              <StarIcon width={24} height={24} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleBackToLogin}
              style={styles.backLink}
            >
              <Text style={styles.backLinkText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ImageBackground
        source={require('../../assets/dark_mode_shimmer_bg.png')}
        style={styles.container}
        resizeMode="cover"
      >
        <LogoHeader />

        <View style={styles.contentContainer}>
          <Text style={styles.title}>Forgotten your way back?</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a code to reset your
            password.
          </Text>

          <View style={styles.formContainer}>
            <TextInputField
              placeholder="Email address"
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
              onPress={handleForgotPassword}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <StarIcon width={24} height={24} />
              <Text style={styles.enterText}>
                {isLoading ? 'SENDING...' : 'SEND CODE'}
              </Text>
              <StarIcon width={24} height={24} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleBackToLogin} style={styles.backLink}>
            <Text style={styles.backLinkText}>
              Remember your password?{' '}
              <Text style={styles.linkText}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    borderRadius: BORDERS.RADIUS.LARGE,
    ...SHADOWS.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.XL,
    gap: SPACING.M,
    width: '100%',
    maxWidth: 313,
  },
  title: {
    ...TEXT_STYLES.h2,
    textAlign: 'center',
    fontFamily: 'CormorantGaramond-Italic',
    color: COLORS.TEXT.SECONDARY,
    fontWeight: undefined,
  },
  subtitle: {
    ...TEXT_STYLES.body,
    textAlign: 'center',
    fontFamily: 'CormorantGaramond-LightItalic',
    color: COLORS.TEXT.PRIMARY,
    fontWeight: undefined,
  },
  emailText: {
    color: COLORS.TEXT.ACCENT,
    fontWeight: '600',
  },
  instructions: {
    ...TEXT_STYLES.caption,
    textAlign: 'center',
    color: COLORS.TEXT.TERTIARY,
    fontWeight: undefined,
  },
  formContainer: {
    gap: SPACING.S,
    width: '100%',
    alignItems: 'center',
  },
  enterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.M,
    justifyContent: 'center',
    marginTop: SPACING.L,
  },
  enterText: {
    ...TEXT_STYLES.button,
    textShadowColor: COLORS.PRIMARY.GOLD_SHIMMER,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
    fontWeight: undefined,
  },
  errorText: {
    ...TEXT_STYLES.caption,
    color: COLORS.TEXT.ERROR,
    textAlign: 'center',
    fontWeight: undefined,
  },
  backLink: {
    marginTop: SPACING.L,
  },
  backLinkText: {
    ...TEXT_STYLES.body,
    textAlign: 'center',
    fontFamily: 'CormorantGaramond-Italic',
    color: COLORS.TEXT.PRIMARY,
    fontWeight: undefined,
  },
  linkText: {
    ...TEXT_STYLES.link,
    fontWeight: '600',
    fontFamily: 'CormorantGaramond-LightItalic',
  },
});
