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
import { COLORS, SPACING, BORDERS, SHADOWS, TEXT_STYLES } from '../styles';

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
    try {
      const response = await authApiService.verifyEmail({
        email,
        verificationCode: verificationCode.trim(),
      });

      if (response.success) {
        try {
          await QuizStorageService.submitPendingQuizResults();
        } catch (quizError) {
          console.error(
            'Quiz submission after verification failed:',
            quizError,
          );
        }

        Alert.alert(
          'Welcome to the Mirror Collective!',
          'Your sacred space is ready. Let the journey begin.',
          [
            {
              text: 'Enter the Mirror',
              onPress: () =>
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'EnterMirror' }],
                }),
            },
          ],
        );
      } else {
        Alert.alert('Verification Failed', response.message || 'Invalid code');
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
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    try {
      const response = await authApiService.resendVerificationCode(email);
      if (response.success) {
        setCountdown(60);
        Alert.alert(
          'Email Sent',
          'A new verification code has been whispered to your inbox.',
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to resend email');
      }
    } catch (error: any) {
      console.error('Resend error:', error);
      Alert.alert(
        'Error',
        error.message || 'Unable to resend email. Please try again.',
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
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>We've sent a whisper to your inbox</Text>
          <Text style={styles.subtitle}>
            Please enter the 6-digit verification code from your email to
            confirm your entry.
          </Text>
        </View>

        {/* Code Input */}
        <View style={styles.codeSection}>
          <TextInput
            style={styles.codeInput}
            placeholder="Enter 6-digit code"
            placeholderTextColor={COLORS.TEXT.MUTED}
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
    </ImageBackground>
  );
};

export default VerifyEmailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: BORDERS.RADIUS.MEDIUM,
    ...SHADOWS.LARGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: SPACING.XL,
    paddingTop: 180,
    gap: SPACING.XXL,
  },
  headerSection: {
    alignItems: 'center',
    gap: SPACING.M,
    maxWidth: 320,
  },
  title: {
    ...TEXT_STYLES.h2,
    fontFamily: 'CormorantGaramond-Italic',
    fontWeight: '300',
    color: COLORS.PRIMARY.GOLD_LIGHT,
    textAlign: 'center',
  },
  subtitle: {
    ...TEXT_STYLES.body,
    fontFamily: 'CormorantGaramond-Regular',
    color: COLORS.TEXT.PRIMARY,
    textAlign: 'center',
    fontWeight: undefined,
  },
  codeSection: {
    alignItems: 'center',
    gap: SPACING.L,
    width: '100%',
  },
  codeInput: {
    width: 200,
    height: 60,
    borderRadius: BORDERS.RADIUS.MEDIUM,
    borderWidth: BORDERS.WIDTH.THIN,
    borderColor: COLORS.UI.BORDER,
    backgroundColor: COLORS.UI.INPUT_BG,
    fontSize: 24,
    lineHeight: 30,
    color: COLORS.TEXT.PRIMARY,
    textAlign: 'center',
    ...SHADOWS.SMALL,
  },
  verifyButton: {
    borderRadius: BORDERS.RADIUS.MEDIUM,
    borderWidth: BORDERS.WIDTH.THIN,
    borderColor: COLORS.PRIMARY.GOLD,
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.S,
    ...SHADOWS.MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonDisabled: {
    borderColor: COLORS.UI.DISABLED,
    opacity: 0.6,
  },
  verifyButtonText: {
    ...TEXT_STYLES.button,
    fontFamily: 'CormorantGaramond-Italic',
    color: COLORS.PRIMARY.GOLD_LIGHT,
    textTransform: 'none',
    fontWeight: undefined,
  },
  verifyButtonTextDisabled: {
    color: COLORS.UI.DISABLED,
  },
  resendSection: {
    alignItems: 'center',
    gap: SPACING.L,
  },
  resendText: {
    ...TEXT_STYLES.body,
    fontFamily: 'CormorantGaramond-Italic',
    color: COLORS.TEXT.PRIMARY,
    textAlign: 'center',
    fontWeight: undefined,
  },
  resendButton: {
    width: 300,
    borderRadius: BORDERS.RADIUS.MEDIUM,
    borderWidth: BORDERS.WIDTH.THIN,
    borderColor: COLORS.PRIMARY.GOLD,
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.S,
    ...SHADOWS.SMALL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendButtonDisabled: {
    opacity: 0.6,
  },
  resendButtonText: {
    ...TEXT_STYLES.button,
    fontFamily: 'CormorantGaramond-Italic',
    color: COLORS.PRIMARY.GOLD_LIGHT,
    textTransform: 'none',
    fontWeight: undefined,
  },
  resendButtonTextDisabled: {
    color: COLORS.UI.DISABLED,
  },
});
