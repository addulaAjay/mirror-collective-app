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
import { typography, colors } from '../styles/typography';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types';

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
              {/* Reset Code Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Reset Code</Text>
                <TextInputField
                  placeholder="6-digit reset code"
                  value={resetCode}
                  onChangeText={setResetCode}
                  keyboardType="numeric"
                  autoCapitalize="none"
                  autoComplete="off"
                />
              </View>

              {/* New Password Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>New Password</Text>
                <TextInputField
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  autoComplete="password"
                  showPasswordToggle={true}
                  isPasswordVisible={isPasswordVisible}
                  onTogglePassword={() =>
                    setIsPasswordVisible(!isPasswordVisible)
                  }
                />
              </View>

              {/* Confirm Password Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Confirm Password</Text>
                <TextInputField
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!isConfirmPasswordVisible}
                  autoCapitalize="none"
                  autoComplete="password"
                  showPasswordToggle={true}
                  isPasswordVisible={isConfirmPasswordVisible}
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

              {/* Reset Password Button */}
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

            {/* Back to Login */}
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
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: -1, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 26,
    elevation: 10,
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
    paddingTop: 120, // Space for LogoHeader (48 + 46 + 26 margin)
    gap: 40,
  },
  headerSection: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...typography.styles.title,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.styles.body,
    textAlign: 'center',
    lineHeight: 24,
  },
  emailText: {
    color: colors.text.accent,
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
    ...typography.styles.label,
    paddingLeft: 8,
  },
  passwordRequirements: {
    ...typography.styles.caption,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
    lineHeight: 16,
  },
  errorText: {
    ...typography.styles.bodySmall,
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
    ...typography.styles.button,
    textShadowColor: 'rgba(245, 230, 184, 0.50)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  backLink: {
    marginTop: 20,
  },
  backLinkText: {
    ...typography.styles.body,
    textAlign: 'center',
  },
  linkText: {
    ...typography.styles.linkLarge,
  },
});

export default ResetPasswordScreen;
