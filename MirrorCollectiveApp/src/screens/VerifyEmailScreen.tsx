import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import LogoHeader from '../components/LogoHeader';
import { authApiService } from '../services/api';
import { QuizStorageService } from '../services/quizStorageService';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types';
import { typography, colors, shadows } from '../styles/typography';

type VerifyEmailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'VerifyEmail'
>;

type VerifyEmailScreenRouteProp = RouteProp<RootStackParamList, 'VerifyEmail'>;

const VerifyEmailScreen = () => {
  const navigation = useNavigation<VerifyEmailScreenNavigationProp>();
  const route = useRoute<VerifyEmailScreenRouteProp>();
  const { email } = route.params;
  const [verificationCode, setVerificationCode] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    if (verificationCode.length !== 6) {
      Alert.alert('Error', 'Verification code must be 6 digits');
      return;
    }

    setIsVerifying(true);

    if (__DEV__) {
      console.log('VerifyEmailScreen - verificationCode:', verificationCode);
      console.log('VerifyEmailScreen - email:', email);
    }

    try {
      const response = await authApiService.verifyEmail({
        email,
        verificationCode: verificationCode.trim(),
      });

      if (response.success) {
        // Submit any pending quiz results after successful verification
        try {
          const quizSubmitted =
            await QuizStorageService.submitPendingQuizResults();
          if (__DEV__) {
            console.log(
              'Quiz submission after verification:',
              quizSubmitted ? 'Success' : 'Failed or no quiz',
            );
          }
        } catch (quizError) {
          // Log quiz submission error but don't block user flow
          console.error(
            'Failed to submit quiz results after verification:',
            quizError,
          );
        }

        Alert.alert(
          'Welcome to the Mirror Collective!',
          'Your sacred space is ready. Let the journey begin.',
          [
            {
              text: 'Enter the Mirror',
              onPress: () => {
                // Navigate to main app
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'EnterMirror' }],
                });
              },
            },
          ],
        );
      } else {
        Alert.alert(
          'Verification Failed',
          response.message || 'Invalid verification code',
        );
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      Alert.alert(
        'Verification Failed',
        error.message || 'Unable to verify your email. Please try again.',
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    if (countdown > 0 || isResending) {
      return;
    }

    setIsResending(true);

    try {
      const response = await authApiService.resendVerificationCode(email);

      if (response.success) {
        setCountdown(60); // 60 second cooldown
        Alert.alert(
          'Email Sent',
          'A new verification link has been whispered to your inbox. Please check your email.',
        );
      } else {
        Alert.alert(
          'Error',
          response.message || 'Failed to resend verification email',
        );
      }
    } catch (error: any) {
      console.error('Resend error:', error);
      Alert.alert(
        'Error',
        error.message ||
        'Unable to resend verification email. Please try again.',
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/dark_mode_shimmer_bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <LogoHeader />

      <View style={styles.contentContainer}>
        {/* Main Content */}
        <View style={styles.messageContainer}>
          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>We've sent a whisper to your inbox</Text>
            <Text style={styles.subtitle}>
              Please enter the 6-digit verification code from your email to
              confirm your entry.
            </Text>
          </View>

          {/* Verification Code Input */}
          <View style={styles.codeSection}>
            <TextInput
              style={styles.codeInput}
              placeholder="Enter 6-digit code"
              placeholderTextColor={colors.text.muted}
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="numeric"
              maxLength={6}
              autoFocus
              textAlign="center"
            />

            <TouchableOpacity
              style={[
                styles.verifyButton,
                (isVerifying || verificationCode.length !== 6) &&
                styles.verifyButtonDisabled,
              ]}
              onPress={handleVerifyCode}
              disabled={isVerifying || verificationCode.length !== 6}
            >
              <Text
                style={[
                  styles.verifyButtonText,
                  (isVerifying || verificationCode.length !== 6) &&
                  styles.verifyButtonTextDisabled,
                ]}
              >
                {isVerifying ? 'Verifying...' : 'Verify Code'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Resend Section */}
          <View style={styles.resendSection}>
            <Text style={styles.resendText}>
              Still didn't receive it? No stress...
            </Text>

            <TouchableOpacity
              style={[
                styles.resendButton,
                (countdown > 0 || isResending) && styles.resendButtonDisabled,
              ]}
              onPress={handleResendEmail}
              disabled={countdown > 0 || isResending}
            >
              <Text
                style={[
                  styles.resendButtonText,
                  (countdown > 0 || isResending) &&
                  styles.resendButtonTextDisabled,
                ]}
              >
                {countdown > 0
                  ? `Resend Email (${countdown}s)`
                  : isResending
                    ? 'Sending...'
                    : 'Resend Email'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 15,
    shadowColor: shadows.container.color,
    shadowOffset: shadows.container.offset,
    shadowOpacity: shadows.container.opacity,
    shadowRadius: shadows.container.radius,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 44,
    paddingTop: 180, // Space for LogoHeader (48 + 46 + 26 margin)
    gap: 60,
  },
  messageContainer: {
    alignItems: 'center',
    gap: 40,
    maxWidth: 305,
  },
  headerSection: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    ...typography.styles.title,
    color: '#F2E2B1',
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 28,
    textAlign: 'center',
    fontWeight: '300',
    lineHeight: 36,
  },
  subtitle: {
    ...typography.styles.body,
    color: '#FDFDF9',
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 28
  },
  codeSection: {
    alignItems: 'center',
    gap: 20,
    width: '100%',
  },
  codeInput: {
    width: 200,
    height: 60,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: colors.border.input,
    backgroundColor: colors.background.input,
    ...typography.styles.input,
    fontSize: 24,
    lineHeight: 30,
    shadowColor: shadows.input.color,
    shadowOffset: shadows.input.offset,
    shadowOpacity: shadows.input.opacity,
    shadowRadius: shadows.input.radius,
  },

  verifyButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.button.primary,
    paddingHorizontal: 40,
    paddingVertical: 12,
    shadowColor: shadows.button.color,
    shadowOffset: shadows.button.offset,
    shadowOpacity: shadows.button.opacity,
    shadowRadius: shadows.button.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonDisabled: {
    borderColor: colors.button.disabled,
    opacity: 0.6,
  },
  verifyButtonText: {
    ...typography.styles.button,
    textAlign: 'center',
    width: 220,
    fontFamily: 'CormorantGaramond-Italic',
    color: '#E5D6B0',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    textTransform: 'none',
  },
  verifyButtonTextDisabled: {
    color: '#E5D6B0',
    fontSize: 20,
    fontWeight: '600',
  },
  resendSection: {
    alignItems: 'center',
    gap: 20,
  },
  resendText: {
    ...typography.styles.body,
    color: '#FDFDF9',
    fontFamily: 'CormorantGaramond-Italic',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '300',
    lineHeight: 28,
  },
  resendButton: {
    width: 300,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.primary,
    paddingHorizontal: 40,
    paddingVertical: 12,
    shadowColor: shadows.input.color,
    shadowOffset: shadows.input.offset,
    shadowOpacity: shadows.input.opacity,
    shadowRadius: shadows.input.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendButtonDisabled: {
    opacity: 0.6,
  },
  resendButtonText: {
    ...typography.styles.button,
    textAlign: 'center',
    fontFamily: 'CormorantGaramond-Italic',
    color: '#E5D6B0',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    textTransform: 'none',
  },
  resendButtonTextDisabled: {
    width: '100%',
  },
});

export default VerifyEmailScreen;
