import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import LogoHeader from '../components/LogoHeader';
import TextInputField from '../components/TextInputField';
import StarIcon from '../components/StarIcon';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types';
import {
  COLORS,
  SPACING,
  BORDERS,
  TEXT_STYLES,
  SHADOWS,
  LAYOUT,
} from '../styles';

type ResetPasswordScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ResetPassword'
>;

type ResetPasswordScreenRouteProp = RouteProp<
  RootStackParamList,
  'ResetPassword'
>;

const ResetPasswordScreen = () => {
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  const { resetPassword, state } = useAuth();
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
      Alert.alert('Error', 'Please enter the reset code');
      return;
    }

    if (resetCode.trim().length !== 6) {
      Alert.alert('Error', 'Reset code must be 6 digits');
      return;
    }

    if (!newPassword) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (!validatePassword(newPassword)) {
      Alert.alert(
        'Weak Password',
        'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character',
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      await resetPassword(email, resetCode.trim(), newPassword);

      Alert.alert(
        'Password Reset Successful',
        'Your password has been reset successfully. Please log in with your new password.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ],
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reset password');
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
      <ImageBackground
        source={require('../../assets/dark_mode_shimmer_bg.png')}
        style={styles.container}
        resizeMode="cover"
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LogoHeader />

          <View style={styles.contentContainer}>
            {/* Header Section */}
            <View style={styles.headerSection}>
              <Text style={styles.title}>Reset Your Password</Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit code sent to{'\n'}
                <Text style={styles.emailText}>{email}</Text>
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Reset Code</Text>
                <TextInputField
                  placeholder="6-digit reset code"
                  value={resetCode}
                  onChangeText={setResetCode}
                  keyboardType="numeric"
                  autoCapitalize="none"
                  autoComplete="off"
                  size="small"
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>New Password</Text>
                <TextInputField
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  autoComplete="password"
                  showPasswordToggle
                  isPasswordVisible={isPasswordVisible}
                  size="small"
                  onTogglePassword={() =>
                    setIsPasswordVisible(!isPasswordVisible)
                  }
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Confirm Password</Text>
                <TextInputField
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!isConfirmPasswordVisible}
                  autoCapitalize="none"
                  autoComplete="password"
                  showPasswordToggle
                  isPasswordVisible={isConfirmPasswordVisible}
                  size="small"
                  onTogglePassword={() =>
                    setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
                  }
                />
              </View>

              <Text style={styles.passwordRequirements}>
                Password must be at least 8 characters with uppercase,
                lowercase, number, and special character
              </Text>

              {state.error && (
                <Text style={styles.errorText}>{state.error}</Text>
              )}

              <TouchableOpacity
                style={styles.enterButton}
                onPress={handleResetPassword}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <StarIcon width={24} height={24} />
                <Text style={styles.enterText}>
                  {isLoading ? 'RESETTING...' : 'RESET PASSWORD'}
                </Text>
                <StarIcon width={24} height={24} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleBackToLogin}
              style={styles.backLink}
            >
              <Text style={styles.backLinkText}>
                Remember your password?{' '}
                <Text style={styles.linkText}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    borderRadius: BORDERS.RADIUS.MEDIUM,
    ...SHADOWS.MEDIUM,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.L,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: SPACING.XL,
    paddingTop: LAYOUT.HEADER_HEIGHT + SPACING.L, // Space for LogoHeader
    gap: SPACING.XL,
  },
  headerSection: {
    alignItems: 'center',
    gap: SPACING.XS,
  },
  title: {
    ...TEXT_STYLES.h2,
    textAlign: 'center',
    fontFamily: 'CormorantGaramond-Italic',
    fontWeight: undefined,
  },
  subtitle: {
    ...TEXT_STYLES.body,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: undefined,
  },
  emailText: {
    color: COLORS.TEXT.ACCENT,
    fontWeight: '600',
  },
  formSection: {
    width: '100%',
    gap: SPACING.S,
  },
  fieldContainer: {
    width: '100%',
    gap: SPACING.XXS,
  },
  fieldLabel: {
    ...TEXT_STYLES.caption,
    paddingLeft: SPACING.S,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: undefined,
  },
  passwordRequirements: {
    ...TEXT_STYLES.caption,
    textAlign: 'center',
    marginTop: SPACING.S,
    marginBottom: SPACING.M,
    fontWeight: undefined,
  },
  errorText: {
    ...TEXT_STYLES.body,
    color: COLORS.TEXT.ERROR,
    textAlign: 'center',
    marginVertical: SPACING.S,
    fontWeight: undefined,
  },
  enterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.M,
    justifyContent: 'center',
    marginTop: SPACING.M,
  },
  enterText: {
    ...TEXT_STYLES.button,
    textShadowColor: 'rgba(245, 230, 184, 0.50)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
    fontWeight: undefined,
  },
  backLink: {
    marginTop: SPACING.M,
  },
  backLinkText: {
    ...TEXT_STYLES.body,
    textAlign: 'center',
    fontWeight: undefined,
  },
  linkText: {
    ...TEXT_STYLES.link,
    fontWeight: '600',
  },
});

export default ResetPasswordScreen;
