import { useNavigation } from '@react-navigation/native';
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
  semantic,
  scale,
  verticalScale,
  moderateScale,
  modalColors,
} from '@theme';
import type { RootStackParamList } from '@types';
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
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
import StarIcon from '@components/StarIcon';

import { useSession } from '@/context/SessionContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { useInAppPurchase } from '@/hooks/useInAppPurchase';
import { subscriptionApiService } from '@/services/api/subscriptionApi';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'StartFreeTrial'>;

const StartFreeTrialScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const canGoBack = navigation.canGoBack();
    const { hasUsedTrial, hasActiveSubscription, refreshSubscriptionStatus } = useSubscription();
    const { setAuthenticated } = useSession();
    const { purchaseSubscription, purchasing, PRODUCT_IDS } = useInAppPurchase();
    const [loading, setLoading] = useState(false);
    const [selectedPeriod] = useState<'monthly' | 'yearly'>('monthly');

    const isTrialMode = !hasUsedTrial && !hasActiveSubscription;
    const buttonText = isTrialMode ? 'START FREE TRIAL' : 'SUBSCRIBE NOW';

    const handleButtonPress = async () => {
        if (hasActiveSubscription) {
            Alert.alert('Already Subscribed', 'You already have an active subscription.');
            return;
        }

        if (isTrialMode) {
            try {
                setLoading(true);
                const response = await subscriptionApiService.startTrial();
                if (response.success) {
                    await refreshSubscriptionStatus();
                    setAuthenticated();
                } else {
                    throw new Error(response.message || 'Failed to start trial');
                }
            } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to start trial');
            } finally {
                setLoading(false);
            }
        } else {
            const productId = selectedPeriod === 'monthly'
                ? PRODUCT_IDS.CORE_MONTHLY
                : PRODUCT_IDS.CORE_YEARLY;
            try {
                await purchaseSubscription(productId);
                await refreshSubscriptionStatus();
            } catch (error: any) {
                Alert.alert('Purchase Failed', error.message || 'Unable to complete purchase');
            }
        }
    };

    return (
      /*
          FLAT layout — SafeAreaView is the sole flex container.
          Header, card (flex:1), and footer are DIRECT children so iOS Yoga
          computes a concrete, stable card height in a single pass.
          Chained flex:1 wrappers cause height collapse during scroll on iOS.
        */
      <BackgroundWrapper
        style={styles.bg}
        imageStyle={styles.bgImage}
        scrollable
      >
        <SafeAreaView style={styles.safe}>
          {/* ── Logo ────────────────────────────────────────────────── */}
          <LogoHeader />

          {/* ── Back + Title ─────────────────────────────────────────── */}
          {/* Single-element header — matches TermsAndConditionsScreen's
                    headerRow pattern exactly (back button absolute + centred text).
                    Subtitle is inside the card so this view stays shallow. */}
          <View style={styles.headerRow}>
            {canGoBack && (
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
            )}
            <Text style={styles.title}>Start your{'\n'}14 Day free trial</Text>
          </View>

          {/*
                  ── Scrollable card ─────────────────────────────────────────
                  Three-layer gradient border pattern (same as TermsAndConditionsScreen):
                    1. cardShadow  — gold glow, overflow visible
                    2. cardGradientBorder — overflow:hidden + LinearGradient absoluteFill
                       paddingHorizontal:0.5 = left+right gradient border (cross-axis padding
                       reliably constrains child width on iOS)
                    3. cardClip — marginVertical:0.25 = top+bottom gradient border
                       (main-axis margin always respected); dark background; ScrollView inside
                */}
          {/* ── Subtitle — direct sibling of headerRow and card in safe's gap column */}
          <Text style={styles.subtitle}>
            Reflect, remember, and track what's changing in real time.
          </Text>

          <View style={styles.cardShadow}>
            <View style={styles.cardGradientBorder}>
              <View style={styles.cardClip}>
                <ScrollView
                  style={styles.cardScroll}
                  contentContainerStyle={styles.cardContent}
                  showsVerticalScrollIndicator={true}
                  scrollIndicatorInsets={{ right: 1 }}
                  bounces={true}
                >
                  {/* Card heading */}
                  <Text style={styles.cardTitle}>Mirror Core</Text>
                  <Text style={styles.cardSubtitle}>
                    Your daily reflective companion.
                  </Text>

                  {/* Star divider */}
                  <View style={styles.starDividerRow}>
                    <LinearGradient
                      colors={[palette.gold.DEFAULT, palette.gold.rich]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.starDividerLine}
                    />
                    <StarIcon
                      width={scale(18)}
                      height={scale(18)}
                      color={palette.gold.DEFAULT}
                    />
                    <LinearGradient
                      colors={[palette.gold.rich, palette.gold.DEFAULT]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.starDividerLine}
                    />
                  </View>

                  {/* Feature bullets */}
                  <View style={styles.bullets}>
                    <View style={styles.bulletRow}>
                      <Text style={styles.bulletMarker}>•</Text>
                      <Text style={styles.bulletLine}>
                        <Text style={styles.bulletLead}>MirrorGPT</Text>
                        {' — reflect, process, and gain clarity'}
                      </Text>
                    </View>
                    <View style={styles.bulletRow}>
                      <Text style={styles.bulletMarker}>•</Text>
                      <Text style={styles.bulletLine}>
                        <Text style={styles.bulletLead}>
                          Echo Map + micro-practices
                        </Text>
                        {' — see patterns and shift them'}
                      </Text>
                    </View>
                    <View style={styles.bulletRow}>
                      <Text style={styles.bulletMarker}>•</Text>
                      <Text style={styles.bulletLine}>
                        <Text style={styles.bulletLead}>
                          Private Echo Vault (50 GB)
                        </Text>
                        {' — your memories, your story'}
                      </Text>
                    </View>
                  </View>

                  {/* Gold divider */}
                  <LinearGradient
                    colors={[palette.gold.DEFAULT, palette.gold.rich]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.dividerLine}
                  />

                  {/* Pricing */}
                  <View style={styles.priceLine}>
                    <Text style={styles.priceAmount}>$15.99</Text>
                    <Text style={styles.pricePerMonth}> /month </Text>
                    <View style={styles.priceOrContainer}>
                      <Text style={styles.priceOr}> or </Text>
                    </View>
                    <Text style={styles.priceYearAmount}> $139</Text>
                    <Text style={styles.priceYearSuffix}> /year</Text>
                  </View>

                  {/* CTA button — standard Button component, gradient variant */}
                  <Button
                    variant="gradient"
                    title={loading || purchasing ? 'LOADING...' : buttonText}
                    onPress={handleButtonPress}
                    disabled={loading || purchasing || hasActiveSubscription}
                    style={styles.ctaButtonWrapper}
                    containerStyle={styles.ctaButtonContainer}
                    contentStyle={styles.ctaButtonContent}
                    textStyle={styles.ctaButtonText}
                    gradientColors={[
                      glassGradient.button.start,
                      glassGradient.button.end,
                    ]}
                  />

                  <Text style={styles.cancelText}>Cancel anytime.</Text>
                </ScrollView>
              </View>
            </View>
          </View>

          {/* ── Footer ───────────────────────────────────────────────── */}
          <View style={styles.footerLinksRow}>
            <Text style={styles.footerLinkText}>Terms</Text>
            <Text style={styles.footerLinkText}>•</Text>
            <Text style={styles.footerLinkText}>Privacy</Text>
            <Text style={styles.footerLinkText}>•</Text>
            <Text style={styles.footerLinkText}>Restore Purchase</Text>
          </View>
        </SafeAreaView>
      </BackgroundWrapper>
    );
};

export default StartFreeTrialScreen;

const styles = StyleSheet.create<{
  bg: ViewStyle;
  bgImage: ImageStyle;
  safe: ViewStyle;
  headerRow: ViewStyle;
  backButton: ViewStyle;
  backArrow: ImageStyle;
  title: TextStyle;
  subtitle: TextStyle;
  cardShadow: ViewStyle;
  cardGradientBorder: ViewStyle;
  cardClip: ViewStyle;
  cardScroll: ViewStyle;
  cardContent: ViewStyle;
  cardTitle: TextStyle;
  cardSubtitle: TextStyle;
  starDividerRow: ViewStyle;
  starDividerLine: ViewStyle;
  dividerLine: ViewStyle;
  bullets: ViewStyle;
  bulletRow: ViewStyle;
  bulletMarker: TextStyle;
  bulletLine: TextStyle;
  bulletLead: TextStyle;
  priceLine: ViewStyle;
  priceAmount: TextStyle;
  pricePerMonth: TextStyle;
  priceOrContainer: ViewStyle;
  priceOr: TextStyle;
  priceYearAmount: TextStyle;
  priceYearSuffix: TextStyle;
  ctaButtonWrapper: ViewStyle;
  ctaButtonContainer: ViewStyle;
  ctaButtonContent: ViewStyle;
  ctaButtonText: TextStyle;
  cancelText: TextStyle;
  footerLinksRow: ViewStyle;
  footerLinkText: TextStyle;
}>({
  bg: {
    flex: 1,
    backgroundColor: palette.navy.deep,
  },
  bgImage: {
    resizeMode: 'cover',
  },

  // SafeAreaView — sole flex container, all children are direct siblings.
  // gap and paddingBottom match TermsAndConditionsScreen exactly so the
  // flex:1 card gets the same concrete bounded height.
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: scale(24),
    paddingBottom: verticalScale(24),
    gap: verticalScale(16),
  },

  // ── Header row — matches TermsAndConditionsScreen pattern exactly ─────────
  // back button is absolute so the title Text is the sole layout child
  // → headerRow height = title natural height (concrete, stable).
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
    textShadowRadius: 16,
  },
  // Screen subtitle — semantic.typography.styles.body with gold.subtlest colour override
  subtitle: {
    ...semantic.typography.styles.body,
    color: palette.gold.subtlest,
    textAlign: 'center',
  },

  // ── Card — three-layer gradient border pattern ────────────────────────────
  // flex:1 is concrete because siblings (header + footer) have natural heights.
  // backgroundColor is required for iOS CALayer to compute a shadow shape —
  // without it the gold glow will not render even with shadowOpacity:1.
  // palette.navy.deep matches the app background image tone (darkest layer),
  // so any corner bleed is invisible against the screen background.
  cardShadow: {
    flex: 1,
    alignSelf: 'center',
    width: scale(313),
    borderRadius: radius.s,
    backgroundColor: palette.navy.deep,
    shadowColor: modalColors.textGoldMuted,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: moderateScale(16),
    elevation: 12,
  },
  // paddingHorizontal:0.5 = left+right gradient border (cross-axis padding)
  cardGradientBorder: {
    flex: 1,
    borderRadius: radius.s,
    overflow: 'hidden',
    paddingHorizontal: 0.5,
  },
  // marginVertical:0.25 = top+bottom gradient border (main-axis margin)
  cardClip: {
    flex: 1,
    marginVertical: 0.25,
    borderRadius: radius.s - 0.25,
    overflow: 'hidden',
    backgroundColor: palette.navy.card,
  },
  cardScroll: {
    flex: 1,
  },
  cardContent: {
    alignItems: 'center',
    gap: verticalScale(10),
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(20),
  },

  // ── Card content ──────────────────────────────────────────────────────────
  cardTitle: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize['3xl']),
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(fontSize['3xl']) * 1.3,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize.l),
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(fontSize.l) * 1.3,
    color: palette.gold.subtlest,
    textAlign: 'center',
  },
  starDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(12),
    alignSelf: 'stretch',
  },
  starDividerLine: {
    flex: 1,
    height: 0.5,
    borderRadius: 1,
  },
  dividerLine: {
    width: scale(235),
    height: 0.5,
    borderRadius: 1,
  },
  bullets: {
    alignSelf: 'stretch',
    gap: verticalScale(6),
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },
  bulletMarker: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.s),
    fontWeight: fontWeight.light,
    lineHeight: moderateScale(fontSize.s) * 1.5,
    color: palette.gold.subtlest,
    marginRight: scale(10),
  },
  bulletLine: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.s),
    fontWeight: fontWeight.light,
    lineHeight: moderateScale(fontSize.s) * 1.5,
    color: palette.gold.subtlest,
    flex: 1,
  },
  bulletLead: {
    fontWeight: fontWeight.regular,
    color: palette.gold.subtlest,
  },

  // ── Pricing ───────────────────────────────────────────────────────────────
  priceLine: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize.xl),
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(fontSize.xl) * 1.3,
    color: palette.gold.subtlest,
    textAlign: 'center',
  },
  pricePerMonth: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize.l),
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(fontSize.l) * 1.3,
    color: palette.gold.subtlest,
    textAlign: 'center',
  },
  priceOrContainer: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  priceOr: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.s),
    fontWeight: fontWeight.light,
    lineHeight: moderateScale(fontSize.s) * 1.5,
    color: palette.gold.subtlest,
    textAlign: 'center',
  },
  priceYearAmount: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize.xl),
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(fontSize.xl) * 1.3,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
  },
  priceYearSuffix: {
    fontFamily: fontFamily.headingItalic,
    fontSize: moderateScale(fontSize.l),
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(fontSize.l) * 1.3,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
  },

  // ── CTA button — overrides for standard Button (gradient variant) ─────────
  ctaButtonWrapper: {
    alignSelf: 'stretch',
    backgroundColor: palette.neutral.transparent,
    shadowOpacity: 0,
    elevation: 0,
    borderRadius: radius.m,
  },
  ctaButtonContainer: {
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
    borderRadius: radius.m,
  },
  ctaButtonContent: {
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(16),
    minWidth: 0,
  },
  ctaButtonText: {
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
  // semantic.typography.styles.label — italic Inter 14px — with gold.subtlest colour override
  cancelText: {
    ...semantic.typography.styles.label,
    color: palette.gold.subtlest,
    textAlign: 'center',
    opacity: 0.85,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footerLinksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scale(6),
  },
  footerLinkText: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.xs),
    fontWeight: fontWeight.light,
    lineHeight: moderateScale(fontSize.xs) * 1.4,
    color: palette.navy.light,
    textAlign: 'center',
  },
});
