import {
  palette,
  fontFamily,
  fontSize,
  fontWeight,
  moderateScale,
  scale,
  verticalScale,
} from '@theme';
import type { LoginScreenProps } from '@types';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';
import TextInputField from '@components/TextInputField';
import { useSession } from '@context/SessionContext';
import { useUser } from '@context/UserContext';
import { quizApiService } from '@services/api';
import { QuizStorageService } from '@services/quizStorageService';
import { getApiErrorMessage } from '@utils/apiErrorUtils';

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const { signIn, state } = useSession();
  const { setUser } = useUser();
  const { isAuthenticated } = state;

  useEffect(() => {
    // If authenticated, navigation will be handled by AppNavigator
  }, [isAuthenticated]);

  const handleSignIn = async () => {
    if (!email || !password) {
      setErrorMessage(t('auth.login.missingFields'));
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Perform login
      const success = await signIn(email, password);

      if (success) {
        console.log('Login successful, syncing quiz data...');
        
        // Immediate user population to avoid race conditions with UserContext
        if (success && success.user) {
           setUser(success.user);
        }

        // Try to sync quiz data if available locally or from server
        try {
          const quizResponse = await quizApiService.getMyQuizResults();
          if (quizResponse.success && quizResponse.data) {
            console.log('✅ Quiz data synced from server:', quizResponse.data);
            // After successful server sync, clear local pending state and mark ready
            await QuizStorageService.clearPendingQuizResults();
            await QuizStorageService.markAccountReady();
          }
        } catch (quizError) {
          console.warn('Failed to sync quiz data:', quizError);
        }

        // Check if there are any pending offline quiz submissions to retry
        await QuizStorageService.retryPendingSubmissions();

        // Navigation is handled automatically by AppNavigator based on auth state
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const message = getApiErrorMessage(error, t);
      setErrorMessage(message || t('auth.login.loginFailed'));
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <BackgroundWrapper style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <LogoHeader />
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.contentContainer}>
                {/* Title — Figma: Cormorant Regular 3XL, #f2e2b1 */}
                <Text style={styles.title}>{t('auth.login.title')}</Text>

                {/* Form — inputs + error row. Figma: gap-12px, node 1886:2347 */}
                <View style={styles.formContainer}>
                  <TextInputField
                    size="normal"
                    placeholder={t('auth.login.usernamePlaceholder')}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    placeholderAlign="center"
                  />

                  <TextInputField
                    size="normal"
                    placeholder={t('auth.login.passwordPlaceholder')}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!isPasswordVisible}
                    autoCapitalize="none"
                    autoComplete="password"
                    showPasswordToggle={true}
                    isPasswordVisible={isPasswordVisible}
                    onTogglePassword={() =>
                      setIsPasswordVisible(!isPasswordVisible)
                    }
                    placeholderAlign="center"
                  />

                  {/* Error row — Figma: node 1886:2399, icon 20×20 + Inter XS error text */}
                  {errorMessage && (
                    <View style={styles.errorRow}>
                      <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                        <Circle cx="10" cy="10" r="9" stroke="#f83b3d" strokeWidth="1.5" />
                        <Path d="M10 6v5" stroke="#f83b3d" strokeWidth="1.5" strokeLinecap="round" />
                        <Circle cx="10" cy="13.5" r="0.75" fill="#f83b3d" />
                      </Svg>
                      <Text style={styles.errorText}>{errorMessage}</Text>
                    </View>
                  )}
                </View>

                {/* "Forgotten your way back?" — Figma: node 1886:2410, Cormorant Italic 20px
                    underlined, gold.subtlest. Only visible in error state per Figma. */}
                {errorMessage && (
                  <TouchableOpacity
                    onPress={navigateToForgotPassword}
                    disabled={isLoading}
                  >
                    <Text style={styles.forgotPasswordText}>
                      {t('auth.login.forgotPassword')}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* ENTER button — Figma: node 1886:2353 */}
                <TouchableOpacity
                  style={styles.enterButton}
                  onPress={handleSignIn}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <StarIcon width={20} height={20} />
                  <Text style={styles.enterText}>
                    {isLoading
                      ? t('auth.login.enteringButton')
                      : t('auth.login.enterButton')}
                  </Text>
                  <StarIcon width={20} height={20} />
                </TouchableOpacity>

                {/* Sign up section — Figma: node 1886:2357 */}
                <View style={styles.signupContainer}>
                  <Text style={styles.signupText}>
                    {t('auth.login.newToCollective')}
                  </Text>
                  <TouchableOpacity onPress={navigateToSignUp} disabled={isLoading}>
                    <Text style={styles.signupLink}>
                      {t('auth.login.signUpLink')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </SafeAreaView>
      </BackgroundWrapper>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    width: '100%',
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
    width: '100%',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
    paddingTop: verticalScale(80),     // Figma: content top ~212px from frame; ~80px below LogoHeader
    paddingBottom: verticalScale(40),
  },
  contentContainer: {
    alignItems: 'center',
    width: scale(313),                 // Figma: node 203:2808 w-313px
    gap: verticalScale(40),            // Figma: gap-40px between sections
  },

  // Figma: Heading/Heading L — Cormorant Regular 3XL (32px), #f2e2b1
  title: {
    fontFamily: fontFamily.heading,                       // CormorantGaramond-Regular (NOT Light)
    fontSize: moderateScale(fontSize['3xl']),              // 32px — Figma: font/size/3XL
    fontWeight: fontWeight.regular,                        // 400 (NOT 300 light)
    lineHeight: moderateScale(fontSize['3xl']) * 1.3,      // Figma: lh 1.3
    letterSpacing: 0,
    color: palette.gold.DEFAULT,                           // Figma: text/paragraph-1 (#f2e2b1)
    textAlign: 'center',
  },

  // Figma: node 1259:1264 — flex col gap-12px
  formContainer: {
    width: '100%',
    gap: verticalScale(12),            // Figma: gap-12px between inputs (was 16)
    alignItems: 'center',
  },

  // Figma: node 1886:2399 — flex row gap-4px, items-start
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scale(4),
    width: '100%',
  },

  // Figma: node 1886:2393 — Inter Regular XS (14px), lh 1.4, color: #f83b3d (status.error)
  errorText: {
    flex: 1,
    fontFamily: fontFamily.body,                           // Inter Regular
    fontSize: moderateScale(fontSize.xs),                  // 14px — Figma: font/size/XS
    lineHeight: moderateScale(fontSize.xs) * 1.4,          // Figma: lh 1.4
    color: palette.status.error,                           // #f83b3d (NOT errorHover)
  },

  // Figma: node 1886:2410 — Cormorant Italic 20px, underlined, gold.subtlest
  // Appears only in error state (conditional in JSX)
  forgotPasswordText: {
    fontFamily: fontFamily.headingItalic,                  // CormorantGaramond-Italic
    fontStyle: 'italic',                                   // Required on iOS
    fontSize: moderateScale(fontSize.l),                   // 20px — Figma: font/size/L
    lineHeight: moderateScale(fontSize.l) * 1.3,
    color: palette.gold.subtlest,                          // #fdfdf9
    textDecorationLine: 'underline',
    textAlign: 'center',
  },

  // Figma: node 4042:1415 — flex row gap-16px, stars 20×20
  enterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(16),
    justifyContent: 'center',
  },

  // Figma: Heading/Heading M — Cormorant Regular 2XL (28px), #f2e2b1, shadow 0 0 4px warmGlow
  enterText: {
    fontFamily: fontFamily.heading,                        // CormorantGaramond-Regular
    fontSize: moderateScale(fontSize['2xl']),               // 28px — Figma: font/size/2XL
    fontWeight: fontWeight.regular,                         // 400
    lineHeight: moderateScale(fontSize['2xl']) * 1.3,
    letterSpacing: 0,
    color: palette.gold.DEFAULT,                            // Figma: #f2e2b1 (NOT .warm)
    textShadowColor: 'rgba(229,214,176,0.5)',               // warmGlow color
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,                                    // Figma: 4px (smaller than warmGlow token 9)
  },

  // Figma: node 203:2820 — flex col gap-8px, items center
  signupContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: verticalScale(8),             // Figma: gap-8px between lines
  },

  // Figma: node 203:2821 — Cormorant Garamond Italic L (20px), #fdfdf9, full opacity
  signupText: {
    fontFamily: fontFamily.headingItalic,                  // CormorantGaramond-Italic
    fontStyle: 'italic',                                   // Required on iOS
    fontSize: moderateScale(fontSize.l),                    // 20px — Figma: font/size/L
    lineHeight: moderateScale(fontSize.l) * 1.3,
    color: palette.gold.subtlest,                          // #fdfdf9 — no opacity override
    textAlign: 'center',
  },

  // Figma: node 203:2822 — Cormorant Regular XL (24px), #f2e2b1, underline
  signupLink: {
    fontFamily: fontFamily.heading,                        // CormorantGaramond-Regular
    fontSize: moderateScale(fontSize.xl),                  // 24px — Figma: font/size/XL
    lineHeight: moderateScale(fontSize.xl) * 1.3,
    color: palette.gold.DEFAULT,                           // #f2e2b1
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});

export default LoginScreen;
