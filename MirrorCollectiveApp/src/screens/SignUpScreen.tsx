import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LogoHeader from '../components/LogoHeader';
import TextInputField from '../components/TextInputField';
import StarIcon from '../components/StarIcon';
import { authApiService } from '../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import {
  COLORS,
  SPACING,
  BORDERS,
  SHADOWS,
  LAYOUT,
  TEXT_STYLES,
} from '../styles';

interface SignUpScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SignUp'>;
}

const SignUpScreen = ({ navigation }: SignUpScreenProps) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return false;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /\W/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      Alert.alert(
        'Weak Password',
        'Password must contain uppercase, lowercase, number, and special character',
      );
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await authApiService.signUp({
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        password,
      });

      if (response.success) {
        Alert.alert(
          'Welcome to the Mirror Collective!',
          'Your sacred space is being prepared. Please check your email for verification.',
          [
            {
              text: 'Continue',
              onPress: () =>
                navigation.navigate('VerifyEmail', {
                  email: email.toLowerCase().trim(),
                  fullName: fullName.trim(),
                }),
            },
          ],
        );
      } else {
        Alert.alert(
          'Registration Failed',
          response.message || response.error || 'Please try again',
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.message || 'Unable to create your account. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
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
            {/* Header */}
            <View style={styles.headerSection}>
              <Text style={styles.title}>Getting Started</Text>
              <Text style={styles.subtitle}>
                Let's set up your sacred space
              </Text>
            </View>

            {/* Form */}
            <View style={styles.formSection}>
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <TextInputField
                  size="medium"
                  placeholder="Your Soul name"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  autoComplete="name"
                  inputTextStyle="gold-regular"
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInputField
                  size="medium"
                  placeholder="Email address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  inputTextStyle="gold-regular"
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Password</Text>
                <TextInputField
                  size="medium"
                  placeholder="Enter password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  showPasswordToggle
                  isPasswordVisible={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                  inputTextStyle="gold-regular"
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Confirm Password</Text>
                <TextInputField
                  size="medium"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  showPasswordToggle
                  isPasswordVisible={showConfirmPassword}
                  onTogglePassword={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  inputTextStyle="gold-regular"
                />
              </View>
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleSignUp}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <StarIcon width={20} height={20} />
              <Text style={styles.continueText}>
                {isLoading ? 'Creating...' : 'Continue'}
              </Text>
              <StarIcon width={20} height={20} />
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>
                Already part of the Mirror Collective?
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign in here</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1 },
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
    paddingHorizontal: SPACING.XL + 4,
    paddingTop: LAYOUT.HEADER_HEIGHT + SPACING.XL,
    gap: SPACING.XL,
  },
  headerSection: {
    alignItems: 'center',
    gap: SPACING.XS,
  },
  title: {
    ...TEXT_STYLES.h1,
    fontFamily: 'CormorantGaramond-Light',
    fontWeight: '300',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
  },
  subtitle: {
    ...TEXT_STYLES.h3,
    fontFamily: 'CormorantGaramond-Italic',
    color: COLORS.TEXT.PRIMARY,
    textAlign: 'center',
    fontWeight: undefined,
  },
  formSection: { width: '100%', gap: SPACING.L },
  fieldContainer: { width: '100%', gap: SPACING.XS },
  fieldLabel: {
    ...TEXT_STYLES.bodySecondary,
    paddingLeft: SPACING.XS,
    fontWeight: undefined,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.S,
    justifyContent: 'center',
    marginTop: SPACING.XL,
  },
  continueText: {
    ...TEXT_STYLES.button,
    textShadowColor: 'rgba(229, 214, 176, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    fontWeight: undefined,
  },
  loginContainer: {
    alignItems: 'center',
    gap: SPACING.XS,
    marginTop: SPACING.L,
  },
  loginText: {
    ...TEXT_STYLES.body,
    fontStyle: 'italic',
    textAlign: 'center',
    fontWeight: undefined,
  },
  loginLink: { ...TEXT_STYLES.link, fontSize: 16, fontWeight: undefined },
});

export default SignUpScreen;
