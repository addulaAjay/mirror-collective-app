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
import AuthButton from '../components/AuthButton';
import apiService from '../services/apiService';
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
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
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
      const response = await apiService.signUp({
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
              onPress: () => navigation.navigate('VerifyEmail', { 
                email: email.toLowerCase().trim(),
                fullName: fullName.trim(),
              }),
            },
          ]
        );
      } else {
        Alert.alert('Registration Failed', response.message || response.error || 'Please try again');
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      Alert.alert(
        'Registration Failed',
        error.message || 'Unable to create your account. Please check your connection and try again.'
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
              <Text style={styles.subtitle}>Let's set up your sacred space</Text>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              {/* Full Name Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <TextInputField
                  placeholder="Your Soul name"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>

              {/* Email Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInputField
                  placeholder="Email address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              {/* Password Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Password</Text>
                <TextInputField
                  placeholder="Enter password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  showPasswordToggle={true}
                  isPasswordVisible={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                />
              </View>

              {/* Confirm Password Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Confirm password</Text>
                <TextInputField
                  placeholder="Re-enter password to confirm"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  showPasswordToggle={true}
                  isPasswordVisible={showConfirmPassword}
                  onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              </View>
            </View>

            {/* Continue Button */}
            <AuthButton
              title="Continue"
              onPress={handleSignUp}
              isLoading={isLoading}
              disabled={isLoading}
            />

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already part of the Mirror Collective?</Text>
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
    paddingTop: 120, // Space for LogoHeader (48 + 46 + 26 margin)
    gap: 40,
  },
  headerSection: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    ...typography.styles.title,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.styles.subtitle,
    textAlign: 'center',
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