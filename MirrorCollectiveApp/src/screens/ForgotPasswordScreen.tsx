import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  palette,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  scale,
  verticalScale,
  moderateScale,
  textShadow,
} from '@theme';
import type { RootStackParamList } from '@types';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button';
import LogoHeader from '@components/LogoHeader';
import TextInputField from '@components/TextInputField';
import { useSession } from '@context/SessionContext';
import { getApiErrorMessage } from '@utils/apiErrorUtils';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ForgotPassword'
>;

// Figma 4928:7988 — back arrow, 20×20, gold/paragraph-1 #f2e1b0
const BackArrowIcon: React.FC = () => (
  <Svg width={scale(20)} height={scale(20)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
      fill={palette.gold.DEFAULT}
    />
  </Svg>
);

const ForgotPasswordScreen = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { forgotPassword, state } = useSession();
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();

  const validateEmail = (emailAddress: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailAddress);
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(t('common.error'), t('auth.validation.missingEmail'));
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert(t('common.error'), t('auth.validation.invalidEmail'));
      return;
    }

    try {
      setIsLoading(true);
      await forgotPassword(email.trim());
      setEmailSent(true);
      Alert.alert(
        t('auth.forgotPassword.successTitle'),
        t('auth.forgotPassword.successMessage'),
        [
          {
            text: t('common.continue'),
            onPress: () =>
              navigation.navigate('ResetPassword', { email: email.trim() }),
          },
        ],
      );
    } catch (error: any) {
      Alert.alert(t('common.error'), getApiErrorMessage(error, t));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  // ── Email sent confirmation state ────────────────────────────────────────
  if (emailSent) {
    return (
      <BackgroundWrapper style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <LogoHeader />
          <KeyboardAwareScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bottomOffset={16}
          >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.contentContainer}>
                  <Text style={styles.title}>
                    {t('auth.forgotPassword.title')}
                  </Text>
                  <Text style={styles.subtitle}>
                    {t('auth.forgotPassword.successMessage')}
                    {'\n'}
                    <Text style={styles.emailHighlight}>{email}</Text>
                  </Text>

                  <Button
                    variant="primary"
                    size="L"
                    title={t('common.continue')}
                    onPress={() => navigation.navigate('ResetPassword', { email })}
                    testID="success-continue-button"
                  />

                  <Button
                    variant="link"
                    title={t('auth.forgotPassword.backToLogin')}
                    onPress={handleBackToLogin}
                    testID="success-back-to-login"
                  />
                </View>
              </TouchableWithoutFeedback>
          </KeyboardAwareScrollView>
        </SafeAreaView>
      </BackgroundWrapper>
    );
  }

  // ── Default state — Figma: node 4928:7982 (Forgot Password - Fail) ─────
  return (
    <BackgroundWrapper style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />
        <KeyboardAwareScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === 'ios' ? 'interactive' : 'on-drag'
          }
          bottomOffset={16}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              {/* Figma 4928:7985 — content column, w:345, gap:40, items:center */}
              <View style={styles.contentContainer}>

                {/* Header row (Figma 4928:7986) — back arrow + centered title + spacer */}
                <View style={styles.headerRow}>
                  <TouchableOpacity
                    onPress={handleBackToLogin}
                    style={styles.backBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Back"
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    testID="header-back-button"
                  >
                    <BackArrowIcon />
                  </TouchableOpacity>

                  {/* Heading M — Cormorant Regular 28/32, gold #f2e1b0, glow */}
                  <Text style={styles.title}>
                    {t('auth.forgotPassword.title')}
                  </Text>

                  {/* Spacer mirrors back-button width so the title stays
                      perfectly centered (Figma right-side icon is decorative
                      symmetry — we render an invisible spacer instead). */}
                  <View style={styles.headerSpacer} />
                </View>

                {/* Subtitle — Heading XS Cormorant Regular 20/24, white */}
                <Text style={styles.subtitle}>
                  {t('auth.forgotPassword.subtitle')}
                </Text>

                {/* Email input + error row — Figma 4928:7992 (col gap-8) */}
                <View style={styles.inputWrapper}>
                  <TextInputField
                    testID="email-input"
                    size="M"
                    placeholder={t('auth.forgotPassword.emailPlaceholder')}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    placeholderAlign="center"
                  />
                  {/* Error row — Figma 4928:7994: row, gap:4, items:start */}
                  {state.error && (
                    <View style={styles.errorRow}>
                      <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                        <Circle cx="10" cy="10" r="9" stroke={palette.status.error} strokeWidth="1.5" />
                        <Path d="M10 6v5" stroke={palette.status.error} strokeWidth="1.5" strokeLinecap="round" />
                        <Circle cx="10" cy="13.5" r="0.75" fill={palette.status.error} />
                      </Svg>
                      <Text style={styles.errorText}>{state.error}</Text>
                    </View>
                  )}
                </View>

                {/* SEND LINK — Figma 7024:2139, MC Button "primary" variant */}
                <Button
                  variant="primary"
                  size="L"
                  title={
                    isLoading
                      ? t('auth.forgotPassword.sendingButton')
                      : t('auth.forgotPassword.sendButton')
                  }
                  onPress={handleForgotPassword}
                  disabled={isLoading}
                  testID="forgot-password-button"
                />

                {/* Back to Login — link variant of the shared Button so
                    styling matches other auth screens. */}
                <Button
                  variant="link"
                  title={t('auth.forgotPassword.backToLogin')}
                  onPress={handleBackToLogin}
                  testID="back-to-login-button"
                />

              </View>
            </TouchableWithoutFeedback>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignSelf: 'stretch',
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
    width: '100%',
  },
  scrollView: {
    width: '100%',
  },
  // Figma 4928:7985 — content column at top:212 from page top, w:345, gap:40
  // LogoHeader is ~140 tall; top:212 - 140 ≈ 72 → paddingTop:72.
  // paddingHorizontal: scale(24) keeps the content centered on a 393-frame
  // with ~24px gutter on either side.
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(72),
    paddingBottom: verticalScale(40),
  },

  // Figma 4928:7985 — flex col, gap:40, items:center, w:345
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    gap: verticalScale(40),
  },

  // Figma 4928:7986 — header row, full-width, justify-between, items-center
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },

  // Wrapping touchable for the back arrow with vertical padding (Figma 4928:7987)
  backBtn: {
    paddingVertical: verticalScale(8),
  },

  // Mirrors backBtn's effective width (icon 20 + no horizontal padding) so
  // the title stays perfectly centered in the row.
  headerSpacer: {
    width: scale(20),
  },

  // Figma 4928:7989 — Heading M: Cormorant Regular, 28/32 (font/size/2XL,
  // font/line-height/XL), gold #f2e1b0, glow drop shadow.
  title: {
    flex: 1,
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize['2xl']),    // 28px — Figma: font/size/2XL
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.xl,                   // 32px — Figma: font/line-height/XL
    letterSpacing: 0,
    color: palette.gold.DEFAULT,                 // #f2e1b0 — Figma: text/paragraph-1
    textAlign: 'center',
    textShadowColor: textShadow.glow.color,      // 0 0 10 spread:3 #F0D4A84D
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: textShadow.glow.radius,
  },

  // Figma 4928:7991 — Heading XS: Cormorant Regular, 20/24, white #fdfdf9
  subtitle: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize.l),         // 20px — Figma: font/size/L
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.m,                    // 24px — Figma: font/size/XL line-height
    letterSpacing: 0,
    color: palette.gold.subtlest,                // #fdfdf9 — Figma: text/paragraph-2
    textAlign: 'center',
    width: '100%',
  },

  // Figma 4928:7992 — flex col, gap:8, w-full (input + error row)
  inputWrapper: {
    width: '100%',
    gap: verticalScale(8),
  },

  // Figma 4928:7994 — flex row, gap:4, items:start
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scale(4),
    width: '100%',
  },

  // Figma 4928:7996 — Body XS: Inter Regular, 14/20, error #f83b3d
  errorText: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.xs),
    lineHeight: lineHeight.s,
    color: palette.status.error,
  },

  // Used in emailSent state for the highlighted email address
  emailHighlight: {
    fontFamily: fontFamily.body,
    fontWeight: fontWeight.semibold,
    color: palette.gold.DEFAULT,
  },
});

export default ForgotPasswordScreen;
