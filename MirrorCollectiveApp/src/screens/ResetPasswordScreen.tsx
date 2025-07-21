import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import LogoHeader from '../components/LogoHeader';
import TextInputField from '../components/TextInputField';
import AuthButton from '../components/AuthButton';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <LogoHeader />

          <View style={styles.content}>
            <Text style={styles.title}>Reset Your Password</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>

            <View style={styles.formContainer}>
              <TextInputField
                placeholder="6-digit reset code"
                value={resetCode}
                onChangeText={setResetCode}
                keyboardType="numeric"
                autoCapitalize="none"
                autoComplete="off"
              />

              <TextInputField
                placeholder="New password"
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

              <Text style={styles.passwordRequirements}>
                Password must be at least 8 characters with uppercase,
                lowercase, number, and special character
              </Text>

              {state.error && (
                <Text style={styles.errorText}>{state.error}</Text>
              )}

              <AuthButton
                title="Reset Password"
                onPress={handleResetPassword}
                isLoading={isLoading}
                disabled={isLoading}
              />
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B1B1D',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120, // Space for LogoHeader (48 + 46 + 26 margin)
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'CormorantGaramond-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#B0B0B0',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    fontFamily: 'CormorantGaramond-Regular',
  },
  emailText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  formContainer: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 30,
  },
  passwordRequirements: {
    fontSize: 12,
    color: '#808080',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
    lineHeight: 16,
    fontFamily: 'CormorantGaramond-Regular',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
    fontFamily: 'CormorantGaramond-Regular',
  },
  backLink: {
    marginTop: 20,
  },
  backLinkText: {
    fontSize: 16,
    color: '#B0B0B0',
    textAlign: 'center',
    fontFamily: 'CormorantGaramond-Regular',
  },
  linkText: {
    color: '#8B7355',
    fontWeight: '600',
  },
});

export default ResetPasswordScreen;
