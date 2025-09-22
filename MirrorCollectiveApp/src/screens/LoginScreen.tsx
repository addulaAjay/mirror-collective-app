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
import { authApiService } from '../services/api';
import { QuizStorageService } from '../services/quizStorageService';

import { COLORS, TEXT_STYLES, SPACING, LAYOUT, responsive } from '../styles';

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
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await authApiService.signIn({
        email: email.toLowerCase().trim(),
        password,
      });

      if (response.success && response.data?.tokens) {
        await authApiService.storeTokens(response.data.tokens);

        if (response.data.user && !response.data.user.isVerified) {
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

        try {
          await QuizStorageService.submitPendingQuizResults();
        } catch (quizError) {
          console.error('Quiz submission error:', quizError);
        }

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
              size="normal"
              placeholder="Username"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <TextInputField
              size="normal"
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
            onPress={() => navigation.navigate('ForgotPassword')}
            disabled={isLoading}
          >
            <Text style={styles.forgotPasswordText}>
              Forgotten your way back?
            </Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>New to the Mirror Collective?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SignUp')}
              disabled={isLoading}
            >
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
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: LAYOUT.SCREEN_PADDING * 2,
    gap: SPACING.XL,
    width: '100%',
    maxWidth: 360,
  },
  title: {
    ...TEXT_STYLES.h2,
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: responsive(32),
    lineHeight: responsive(38),
    textAlign: 'center',
    color: COLORS.PRIMARY.GOLD_LIGHT,
    marginTop: SPACING.XXL,
    marginBottom: SPACING.S,
    fontWeight: undefined,
  },
  formContainer: {
    gap: SPACING.M,
    width: '100%',
    alignItems: 'center',
  },
  enterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.S,
    marginTop: SPACING.L,
  },
  enterText: {
    ...TEXT_STYLES.button,
    fontFamily: 'CormorantGaramond-Light',
    fontSize: responsive(28),
    lineHeight: responsive(35),
    color: COLORS.PRIMARY.GOLD_LIGHT,
    textShadowColor: 'rgba(245, 230, 184, 0.50)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
    fontWeight: undefined,
  },
  forgotPasswordText: {
    fontFamily: 'CormorantGaramond-LightItalic',
    fontSize: responsive(20),
    lineHeight: responsive(25),
    color: COLORS.TEXT.SECONDARY,
    textDecorationLine: 'underline',
    marginTop: SPACING.S,
  },
  signupContainer: {
    alignItems: 'center',
    gap: SPACING.XS,
    marginTop: SPACING.M,
  },
  signupText: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: responsive(20),
    lineHeight: responsive(25),
    textAlign: 'center',
    color: COLORS.TEXT.PRIMARY,
  },
  signupLink: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: responsive(24),
    lineHeight: responsive(28),
    color: COLORS.TEXT.SECONDARY,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
