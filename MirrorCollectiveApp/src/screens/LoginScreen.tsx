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
} from 'react-native';
import LogoHeader from '../components/LogoHeader';
import TextInputField from '../components/TextInputField';
import StarIcon from '../components/StarIcon';
import apiService from '../services/apiService';
import { typography } from '../styles/typography';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return false;
    }

    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return false;
    }

    return true;
  };

  const handleSignIn = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiService.signIn({
        email: email.toLowerCase().trim(),
        password,
      });
      if (__DEV__) {
        console.log('SignIn response:', response);
      }
      if (response.success && response.data && response.data.tokens) {
        // Store authentication tokens
        await apiService.storeTokens(response.data.tokens);

        // Check if user is verified
        if (response.data.user && !response.data.user.emailVerified) {
          Alert.alert(
            'Email Verification Required',
            'Please verify your email address to continue.',
            [
              {
                text: 'Verify Now',
                onPress: () =>
                  navigation.navigate('VerifyEmail', {
                    email: response.data!.user!.email,
                    fullName: response.data!.user!.fullName,
                  }),
              },
            ],
          );
          return;
        }

        // Navigate to main app
        navigation.reset({
          index: 0,
          routes: [{ name: 'EnterMirror' }],
        });
      } else {
        Alert.alert(
          'Sign In Failed',
          response.message || response.error || 'Invalid credentials',
        );
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      Alert.alert(
        'Sign In Failed',
        error.message ||
          'Unable to sign in. Please check your connection and try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToSignUp = () => {
    navigation.navigate('SignUp');
  };

  const navigateToForgotPassword = () => {
    navigation.navigate('ForgotPassword');
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
        <LogoHeader />
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Welcome to the Living Mirror</Text>

          <View style={styles.formContainer}>
            <TextInputField
              placeholder="Username"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <TextInputField
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              showPasswordToggle={true}
              isPasswordVisible={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />

            <TouchableOpacity
              style={styles.enterButton}
              onPress={handleSignIn}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <StarIcon width={24} height={24} />
              <Text style={styles.enterText}>
                {isLoading ? 'ENTERING...' : 'ENTER'}
              </Text>
              <StarIcon width={24} height={24} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={navigateToForgotPassword}
            disabled={isLoading}
            style={styles.forgotPasswordContainer}
          >
            <Text style={styles.forgotPasswordText}>
              Forgotten your way back?
            </Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>New to the Mirror Collective?</Text>
            <TouchableOpacity onPress={navigateToSignUp} disabled={isLoading}>
              <Text style={styles.signupLink}>Sign up here</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
    gap: 40,
    width: '100%',
    maxWidth: 313,
  },
  title: {
    ...typography.styles.title,
    textAlign: 'center',
    marginBottom: 20,
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
    ...typography.styles.button,
    textShadowColor: 'rgba(245, 230, 184, 0.50)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  forgotPasswordContainer: {
    marginTop: 15,
  },
  forgotPasswordText: {
    ...typography.styles.link,
    textAlign: 'center',
  },
  signupContainer: {
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  signupText: {
    ...typography.styles.body,
    textAlign: 'center',
  },
  signupLink: {
    ...typography.styles.linkLarge,
  },
});

export default LoginScreen;
