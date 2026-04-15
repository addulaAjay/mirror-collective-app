import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  palette,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  borderWidth,
  textShadow,
  glassGradient,
  scale,
  verticalScale,
  moderateScale,
  modalColors,
} from '@theme';
import type { RootStackParamList } from '@types';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    type ViewStyle,
    type TextStyle,
    type ImageStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button/Button';
import LogoHeader from '@components/LogoHeader';
import { useSession } from '@context/SessionContext';
import { getApiErrorMessage } from '@utils/apiErrorUtils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'TermsAndConditions'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'TermsAndConditions'>;

const TermsAndConditionsScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<ScreenRouteProp>();
    const { fullName, email, password, phoneNumber } = route.params;
    const { signUp } = useSession();
    const { t } = useTranslation();
    const [agreed, setAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    return (
      <BackgroundWrapper
        style={styles.bg}
        imageStyle={styles.bgImage}
        scrollable
      >
        {/*
              FLAT layout — SafeAreaView is the sole flex container.
              Header, card, and footer are DIRECT children so iOS Yoga can
              compute the card's height in a single pass:
                cardHeight = safeArea.height - logo.height - headerRow.height - footer.height - gaps
              Intermediate wrapper Views (outerBoxContainer / outerBox / innerBox)
              were the root cause: chained flex:1 produced an unstable height
              that reset during scroll, stopping the ScrollView mid-gesture.
            */}
        <SafeAreaView style={styles.safe}>
          {/* ── Logo ─────────────────────────────────────────────── */}
          <LogoHeader />

          {/* ── Back + Title ──────────────────────────────────────── */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Image
                source={require('../assets/back-arrow.png')}
                style={styles.backArrow}
                accessibilityIgnoresInvertColors
              />
            </TouchableOpacity>
            <Text style={styles.title}>TERMS AND{'\n'}CONDITIONS</Text>
          </View>

          {/*
                  ── Scrollable card ────────────────────────────────────────
                  Three-layer pattern for rounded-border + shadow + scroll:
                    1. cardShadow  — shadow only, overflow visible (iOS shadow / Android elevation)
                    2. cardClip    — overflow:hidden clips content to border radius
                    3. ScrollView  — NO overflow set; flex:1 fills cardClip exactly
                  flex:1 here is concrete because its siblings (header + footer)
                  have known natural heights — no ambiguous nested flex chains.
                */}
          <View style={styles.cardShadow}>
            {/*
                      Gradient border pattern (reliable on iOS + Android):
                      - cardGradientBorder: plain View with overflow:hidden + borderRadius
                        clips everything inside to rounded corners
                      - LinearGradient: absoluteFill behind cardClip — visible only
                        through the margin gap (the "border")
                      - cardClip: flex:1 + margin:0.5 — flex correctly subtracts
                        margin from the child's size on all 4 sides, so the gradient
                        peeks through uniformly. This avoids the position:absolute
                        right/bottom bug where iOS ignores those insets on gradient parents.
                    */}
            <View style={styles.cardGradientBorder}>
              <View style={styles.cardClip}>
                <ScrollView
                  style={styles.cardScroll}
                  contentContainerStyle={styles.cardContent}
                  showsVerticalScrollIndicator={true}
                  scrollIndicatorInsets={{ right: 1 }}
                  bounces={true}
                >
                  <Text style={styles.cardHeading}>Before You Begin</Text>

                  <Text style={styles.cardEmphasis}>Welcome to Mirror.</Text>
                  <Text style={styles.cardBody}>
                    Mirror is designed for reflection, self-inquiry, and
                    personal insight. Before continuing, please read the
                    following carefully.
                  </Text>

                  <Text style={styles.cardHeading}>What Mirror Is</Text>
                  <Text style={styles.cardBody}>
                    Mirror uses artificial intelligence to generate symbolic,
                    reflective responses based on the language you share. These
                    reflections are intended to support self-awareness and
                    contemplation.
                  </Text>
                  <Text style={styles.cardBody}>
                    Mirror does not provide medical, mental health, legal, or
                    other professional advice and should not be used as a
                    substitute for professional care or guidance.
                  </Text>

                  <Text style={styles.cardHeading}>Important Boundaries</Text>
                  <Text style={styles.cardBody}>
                    • Mirror is not a doctor, therapist, counselor, clergy
                    member, or authority.
                  </Text>
                  <Text style={styles.cardBody}>
                    • Mirror does not diagnose, treat, or prevent any condition.
                  </Text>
                  <Text style={styles.cardBody}>
                    • Mirror does not speak for God, Source, or any higher
                    power. Symbolic or poetic language is metaphorical.
                  </Text>
                  <Text style={styles.cardBody}>
                    • Responses are generated by AI systems and are not
                    conscious, sentient, or aware.
                  </Text>
                  <Text style={styles.cardBody}>
                    • You are responsible for how you interpret and act on any
                    reflections.
                  </Text>

                  <Text style={styles.cardHeading}>Safety &amp; Support</Text>
                  <Text style={styles.cardBody}>
                    Mirror is not intended for use in emergency situations.
                  </Text>
                  <Text style={styles.cardBody}>
                    If you believe you may be in danger, experiencing a mental
                    health crisis, or thinking about harming yourself or others,
                    please seek immediate help by contacting:
                  </Text>
                  <Text style={styles.cardBody}>
                    • Local emergency services, or
                  </Text>
                  <Text style={styles.cardBody}>
                    • A qualified mental health professional, or
                  </Text>
                  <Text style={styles.cardBody}>
                    • A trusted person in your life
                  </Text>
                  <Text style={styles.cardBody}>
                    Mirror cannot provide crisis support.
                  </Text>

                  <Text style={styles.cardHeading}>Data &amp; Privacy</Text>
                  <Text style={styles.cardBody}>
                    Your interactions may be processed to generate reflections
                    and improve the experience. You remain in control of your
                    data and can manage or delete it at any time in Settings.
                  </Text>
                  <Text style={styles.cardBody}>
                    You can review our full policies here:
                  </Text>
                  <Text style={styles.cardBody}>• Terms of Service</Text>
                  <Text style={styles.cardBody}>• Privacy Policy</Text>
                  <Text style={styles.cardBody}>
                    • AI Transparency &amp; Use Policy
                  </Text>

                  <Text style={styles.cardHeading}>Consent</Text>
                  <Text style={styles.cardBody}>
                    By continuing, you confirm that:
                  </Text>
                  <Text style={styles.cardBody}>
                    • You understand the purpose and limitations of Mirror
                  </Text>
                  <Text style={styles.cardBody}>
                    • You agree to use Mirror for reflective purposes only
                  </Text>
                  <Text style={styles.cardBody}>
                    • You accept our Terms of Service and Privacy Policy
                  </Text>
                </ScrollView>
              </View>
            </View>
          </View>

          {/* ── Footer: checkbox + button ─────────────────────────── */}
          <View style={styles.footer}>
            <TouchableOpacity
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}
              onPress={() => setAgreed(prev => !prev)}
              style={styles.checkboxRow}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.checkboxBox,
                  agreed && styles.checkboxBoxChecked,
                ]}
              >
                {agreed ? <Text style={styles.checkboxCheck}>✓</Text> : null}
              </View>
              <Text style={styles.checkboxLabel}>
                I understand and agree to continue
              </Text>
            </TouchableOpacity>

            <Button
              variant="gradient"
              title={isLoading ? 'CREATING...' : 'CONTINUE'}
              onPress={async () => {
                if (!agreed || isLoading) return;
                setIsLoading(true);
                try {
                  const termsAcceptedAt = new Date().toISOString();
                  await signUp(
                    fullName,
                    email,
                    password,
                    phoneNumber,
                    termsAcceptedAt,
                  );
                  Alert.alert(
                    t('auth.signup.alerts.welcomeTitle'),
                    t('auth.signup.alerts.welcomeMessage'),
                    [
                      {
                        text: t('auth.validation.continue'),
                        onPress: () =>
                          navigation.navigate('VerifyEmail', {
                            email,
                            fullName,
                            password,
                            termsAcceptedAt,
                          }),
                      },
                    ],
                  );
                } catch (error: unknown) {
                  Alert.alert(
                    t('auth.signup.alerts.failedTitle'),
                    getApiErrorMessage(error, t),
                  );
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={!agreed || isLoading}
              style={styles.buttonWrapper}
              containerStyle={styles.buttonContainer}
              contentStyle={styles.buttonContent}
              textStyle={styles.buttonText}
              gradientColors={[
                glassGradient.button.start,
                glassGradient.button.end,
              ]}
            />
          </View>
        </SafeAreaView>
      </BackgroundWrapper>
    );
};

export default TermsAndConditionsScreen;

const styles = StyleSheet.create<{
  bg: ViewStyle;
  bgImage: ImageStyle;
  safe: ViewStyle;
  headerRow: ViewStyle;
  backButton: ViewStyle;
  backArrow: ImageStyle;
  title: TextStyle;
  cardShadow: ViewStyle;
  cardGradientBorder: ViewStyle;
  cardClip: ViewStyle;
  cardScroll: ViewStyle;
  cardContent: ViewStyle;
  cardHeading: TextStyle;
  cardEmphasis: TextStyle;
  cardBody: TextStyle;
  footer: ViewStyle;
  checkboxRow: ViewStyle;
  checkboxBox: ViewStyle;
  checkboxBoxChecked: ViewStyle;
  checkboxCheck: TextStyle;
  checkboxLabel: TextStyle;
  buttonWrapper: ViewStyle;
  buttonContainer: ViewStyle;
  buttonContent: ViewStyle;
  buttonText: TextStyle;
}>({
  bg: {
    flex: 1,
    backgroundColor: palette.navy.deep,
  },
  bgImage: {
    resizeMode: 'cover',
  },

  // SafeAreaView is the single flex container — all children are siblings.
  // paddingHorizontal applies to the full column so header, card, and footer
  // are all inset by the same 24px gutter.
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: scale(24),
    paddingBottom: verticalScale(24),
    gap: verticalScale(24),
  },

  // ── Header row ──────────────────────────────────────────────────────────
  headerRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: scale(40),
    height: verticalScale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    width: scale(20),
    height: verticalScale(20),
    resizeMode: 'contain',
    tintColor: palette.gold.warm,
  },
  title: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize['2xl']),
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.xl,
    color: palette.gold.warm,
    textAlign: 'center',
    textShadowColor: textShadow.glow.color,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    fontStyle: 'normal',
  },

  // ── Scrollable card ──────────────────────────────────────────────────────
  // flex:1 — fills all height between headerRow and footer. Bounded because
  // its siblings have concrete natural heights (no nested flex chains).
  // backgroundColor gives iOS CALayer a concrete shape to render the gold
  // glow shadow from. Without it, shadowOpacity has no effect on iOS.
  // palette.navy.deep matches the app background — no visible corner bleed.
  cardShadow: {
    flex: 1,
    alignSelf: 'center',
    width: scale(313),
    borderRadius: radius.s,
    backgroundColor: palette.navy.cardInner,
    // iOS shadow (overflow must stay visible)
    shadowColor: modalColors.textGoldMuted,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: moderateScale(16),
    // Android shadow
    elevation: 8,
  },
  // Clip container — overflow:hidden + borderRadius rounds all children.
  // paddingHorizontal:0.5 creates LEFT + RIGHT border: padding reliably
  // constrains child width in the cross axis on iOS, whereas marginRight
  // on a stretched flex child is ignored. The LinearGradient (absoluteFill)
  // ignores padding so it shows through the 0.5px gap on each side.
  cardGradientBorder: {
    flex: 1,
    borderRadius: radius.s,
    overflow: 'hidden',
    paddingHorizontal: 0.5,
  },
  // marginVertical:0.5 creates TOP + BOTTOM border: margin in the main
  // flex axis (vertical) is always respected.
  cardClip: {
    flex: 1,
    marginVertical: 0.25,
    borderRadius: radius.s - 0.25,
    overflow: 'hidden',
    backgroundColor: palette.navy.card,
  },
  // flex:1 fills cardClip — NO overflow, NO backgroundColor (cardClip provides it)
  cardScroll: {
    flex: 1,
  },
  cardContent: {
    gap: verticalScale(12),
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(20),
  },
  cardHeading: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize.xl),
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(fontSize.xl) * 1.3,
    color: palette.gold.subtlest,
    textAlign: 'center',
  },
  cardEmphasis: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.m),
    fontStyle: 'italic',
    fontWeight: fontWeight.semibold,
    lineHeight: moderateScale(fontSize.m) * 1.5,
    color: palette.gold.subtlest,
    textAlign: 'center',
  },
  cardBody: {
    fontFamily: fontFamily.bodyLight,
    fontSize: moderateScale(fontSize.s),
    fontWeight: fontWeight.light,
    lineHeight: moderateScale(fontSize.s) * 1.5,
    color: palette.gold.subtlest,
    textAlign: 'center',
  },

  // ── Footer ───────────────────────────────────────────────────────────────
  footer: {
    width: '100%',
    gap: verticalScale(16),
    alignItems: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  checkboxBox: {
    width: scale(20),
    height: verticalScale(20),
    borderRadius: moderateScale(2),
    borderWidth: borderWidth.thin,
    borderColor: 'rgba(229, 214, 176, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
  },
  checkboxBoxChecked: {
    backgroundColor: 'rgba(229, 214, 176, 0.25)',
  },
  checkboxCheck: {
    fontSize: moderateScale(fontSize.s),
    lineHeight: moderateScale(fontSize.s),
    color: palette.gold.warm,
  },
  checkboxLabel: {
    flexShrink: 1,
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.s),
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.m,
    color: palette.gold.DEFAULT,
  },
  buttonWrapper: {
    backgroundColor: palette.neutral.transparent,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    borderRadius: radius.m,
  },
  buttonContainer: {
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
    borderRadius: radius.m,
  },
  buttonContent: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    minWidth: 0,
  },
  buttonText: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize.xl),
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.l,
    letterSpacing: 0,
    color: palette.gold.DEFAULT,
    textShadowColor: textShadow.warmGlow.color,
    textShadowOffset: textShadow.warmGlow.offset,
    textShadowRadius: textShadow.warmGlow.radius,
    textTransform: 'none',
  },
});
