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
import { typography } from '../styles/typography';

interface SignUpScreenProps {
  navigation: any;
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

    // Check for password complexity
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      Alert.alert(
        'Weak Password',
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
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
    if (!validateForm()) {
      return;
    }

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
      console.error('Sign up error:', error);
      Alert.alert(
        'Registration Failed',
        error.message ||
          'Unable to create your account. Please check your connection and try again.',
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
              <Text style={styles.title}>Getting Started</Text>
              <Text style={styles.subtitle}>
                Let's set up your sacred space
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              {/* Full Name Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <TextInputField
                  size="medium"
                  placeholder="Your Soul name"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  autoComplete="name"
                  placeholderAlign="left"
                  placeholderFontFamily="regular"
                  inputTextStyle="gold-regular"
                />
              </View>

              {/* Email Field */}
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
                  placeholderAlign="left"
                  placeholderFontFamily="regular"
                  inputTextStyle="gold-regular"
                />
              </View>

              {/* Password Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Password</Text>
                <TextInputField
                  size="medium"
                  placeholder="Enter password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  showPasswordToggle={true}
                  isPasswordVisible={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                  placeholderAlign="left"
                  placeholderFontFamily="regular"
                  inputTextStyle="gold-regular"
                />
              </View>

              {/* Confirm Password Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Confirm password</Text>
                <TextInputField
                  size="medium"
                  placeholder="Re-enter password to confirm"
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
              <TouchableOpacity onPress={navigateToLogin} disabled={isLoading}>
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
    paddingHorizontal: 44,
    paddingTop: 120,
    gap: 32,
  },
  headerSection: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    ...typography.styles.title,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
    fontSize: 32,
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 38,
  },
  subtitle: {
    ...typography.styles.subtitle,
    color: '#FDFDF9',
    fontFamily: 'CormorantGaramond-Italic',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 30,
  },
  formSection: {
    width: '100%',
    gap: 20,
  },
  fieldContainer: {
    width: '100%',
    gap: 8,
  },
  fieldLabel: {
    ...typography.styles.label,
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
    ...typography.styles.bodyItalic,
    textAlign: 'center',
  },
  loginLink: {
    ...typography.styles.linkLarge,
  },
});

export default SignUpScreen;
