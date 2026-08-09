import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
    Linking,
    type ViewStyle,
    type TextStyle,
    type ImageStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/context/SessionContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { useInAppPurchase, localizedPrice } from '@/hooks/useInAppPurchase';
import { subscriptionApiService } from '@/services/api/subscriptionApi';
import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button/Button';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';
import { LEGAL_LINKS } from '@constants/config';
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

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'StartFreeTrial'>;

// iOS Manage Subscriptions deep link — monthly↔yearly plan changes for an
// active subscription are handled by Apple, not the in-app paywall.
const MANAGE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';

const StartFreeTrialScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const canGoBack = navigation.canGoBack();
    const { status, hasUsedTrial, hasActiveSubscription, refreshSubscriptionStatus } = useSubscription();
    const { setAuthenticated } = useSession();
    const { purchaseSubscription, restorePurchases, purchasing, PRODUCT_IDS, products } = useInAppPurchase({
        // A paid purchase is confirmed asynchronously (StoreKit listener →
        // backend verify). When that completes, refresh status and enter the
        // app — mirroring the trial path, which calls setAuthenticated()
        // directly. Without this the user could be left on the paywall after
        // a successful subscribe.
        onPurchaseVerified: async () => {
            await refreshSubscriptionStatus();
            setAuthenticated();
        },
    });
    const [loading, setLoading] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('monthly');

    // Live store prices (fall back to the confirmed defaults until IAP loads).
    const monthlyPrice = localizedPrice(products, PRODUCT_IDS.CORE_MONTHLY, '$9.99');
    const yearlyPrice = localizedPrice(products, PRODUCT_IDS.CORE_YEARLY, '$89');

    const isTrialMode = !hasUsedTrial && !hasActiveSubscription;
    const buttonText = isTrialMode ? 'START FREE TRIAL' : 'SUBSCRIBE NOW';

    // Only a genuinely PAID subscription blocks re-purchasing. A trial counts as
    // "active" for access purposes, but the CTA must stay enabled so a new user
    // can start their trial and a trial user can convert to paid. The paywall is
    // intentionally shown to new users after verification — do NOT auto-route
    // them into the app; the trial screen is part of onboarding.
    const isActivePaid = status === 'active';

    const handleButtonPress = async () => {
        if (isActivePaid) {
            // Already on a paid plan. Monthly↔yearly changes are an Apple-managed
            // upgrade/downgrade — deep-link to Manage Subscriptions rather than
            // showing a dead-end disabled button.
            await openLink(MANAGE_SUBSCRIPTIONS_URL);
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
                    const msg = response.message ?? '';
                    // Trial already started (user navigated back after success)
                    // — treat as success and proceed rather than blocking them.
                    if (msg.toLowerCase().includes('already used') || msg.toLowerCase().includes('already has')) {
                        await refreshSubscriptionStatus();
                        setAuthenticated();
                        return;
                    }
                    throw new Error(msg || 'Failed to start trial');
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
                // Verification, status refresh, and app entry happen in the
                // onPurchaseVerified callback once StoreKit delivers the
                // receipt — purchaseSubscription() resolves before that.
                await purchaseSubscription(productId);
            } catch (error: any) {
                Alert.alert('Purchase Failed', error.message || 'Unable to complete purchase');
            }
        }
    };

    const openLink = async (url: string) => {
        try {
            await Linking.openURL(url);
        } catch {
            Alert.alert('Unable to open link', 'Please try again later.');
        }
    };

    // Apple requires a visible "Restore Purchases" control on any screen that
    // sells a subscription. Re-syncs any prior purchase on this Apple ID and,
    // if one is active, routes the user into the app.
    const handleRestore = async () => {
        if (restoring) return;
        try {
            setRestoring(true);
            const result = await restorePurchases();
            if (result && result.success && (result.data?.restored_count ?? 0) > 0) {
                await refreshSubscriptionStatus();
                setAuthenticated();
            }
            // The hook already surfaces "no purchases found" / success alerts.
        } catch (error: any) {
            Alert.alert('Restore Failed', error?.message || 'Unable to restore purchases.');
        } finally {
            setRestoring(false);
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
          {/* Negative margin cancels `safe`'s horizontal padding so the header
              is full-bleed and its menu button lines up with other screens. */}
          <LogoHeader wrapperStyle={styles.headerBleed} />

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
                  <Text style={styles.cardTitle}>Mirror Basic</Text>
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
                    <Text style={styles.priceAmount}>{monthlyPrice}</Text>
                    <Text style={styles.pricePerMonth}> /month </Text>
                    <View style={styles.priceOrContainer}>
                      <Text style={styles.priceOr}> or </Text>
                    </View>
                    <Text style={styles.priceYearAmount}> {yearlyPrice}</Text>
                    <Text style={styles.priceYearSuffix}> /year</Text>
                  </View>

                  {/* Monthly / Yearly toggle (Figma 4928-8595) — selects which
                      product the trial converts to / is purchased. */}
                  <View style={styles.periodToggle}>
                    <TouchableOpacity
                      style={[
                        styles.periodOption,
                        selectedPeriod === 'monthly' && styles.periodOptionActive,
                      ]}
                      onPress={() => setSelectedPeriod('monthly')}
                      accessibilityRole="button"
                      accessibilityState={{ selected: selectedPeriod === 'monthly' }}
                      testID="period-monthly"
                    >
                      <Text
                        style={[
                          styles.periodText,
                          selectedPeriod === 'monthly' && styles.periodTextActive,
                        ]}
                      >
                        Monthly
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.periodOption,
                        selectedPeriod === 'yearly' && styles.periodOptionActive,
                      ]}
                      onPress={() => setSelectedPeriod('yearly')}
                      accessibilityRole="button"
                      accessibilityState={{ selected: selectedPeriod === 'yearly' }}
                      testID="period-yearly"
                    >
                      <Text
                        style={[
                          styles.periodText,
                          selectedPeriod === 'yearly' && styles.periodTextActive,
                        ]}
                      >
                        Yearly
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* CTA button — standard Button component, gradient variant */}
                  <Button
                    variant="gradient"
                    title={
                      loading || purchasing
                        ? 'LOADING...'
                        : isActivePaid
                          ? 'MANAGE SUBSCRIPTION'
                          : buttonText
                    }
                    onPress={handleButtonPress}
                    disabled={loading || purchasing}
                    style={styles.ctaButtonWrapper}
                    containerStyle={styles.ctaButtonContainer}
                    contentStyle={styles.ctaButtonContent}
                    textStyle={styles.ctaButtonText}
                    gradientColors={[
                      glassGradient.button.start,
                      glassGradient.button.end,
                    ]}
                  />

                  {/* Auto-renewal disclosure — required by App Store Review
                      Guideline 3.1.2. Must state price + cadence, that payment
                      is charged to the Apple ID, that it auto-renews unless
                      turned off ≥24h before period end, and how to manage. */}
                  <Text style={styles.disclosureText}>
                    {selectedPeriod === 'monthly'
                      ? `Mirror Basic is ${monthlyPrice} per month`
                      : `Mirror Basic is ${yearlyPrice} per year`}
                    {isTrialMode
                      ? ', billed after your 14-day free trial. '
                      : '. '}
                    Payment is charged to your Apple ID at confirmation of
                    purchase. Your subscription automatically renews unless
                    auto-renew is turned off at least 24 hours before the end of
                    the current period. Manage or cancel anytime in your Apple ID
                    Account Settings.
                  </Text>
                </ScrollView>
              </View>
            </View>
          </View>

          {/* ── Footer ───────────────────────────────────────────────── */}
          <View style={styles.footerLinksRow}>
            <TouchableOpacity
              accessibilityRole="link"
              onPress={() => openLink(LEGAL_LINKS.TERMS)}
            >
              <Text style={styles.footerLinkText}>Terms</Text>
            </TouchableOpacity>
            <Text style={styles.footerLinkText}>•</Text>
            <TouchableOpacity
              accessibilityRole="link"
              onPress={() => openLink(LEGAL_LINKS.PRIVACY)}
            >
              <Text style={styles.footerLinkText}>Privacy</Text>
            </TouchableOpacity>
            <Text style={styles.footerLinkText}>•</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Restore purchase"
              disabled={restoring}
              onPress={handleRestore}
            >
              <Text style={styles.footerLinkText}>
                {restoring ? 'Restoring…' : 'Restore Purchase'}
              </Text>
            </TouchableOpacity>
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
  headerBleed: ViewStyle;
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
  periodToggle: ViewStyle;
  periodOption: ViewStyle;
  periodOptionActive: ViewStyle;
  periodText: TextStyle;
  periodTextActive: TextStyle;
  ctaButtonWrapper: ViewStyle;
  ctaButtonContainer: ViewStyle;
  ctaButtonContent: ViewStyle;
  ctaButtonText: TextStyle;
  disclosureText: TextStyle;
  footerLinksRow: ViewStyle;
  footerLinkText: TextStyle;
}>({
  bg: {
    flex: 1,
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

  // Cancels `safe`'s horizontal padding so LogoHeader spans edge-to-edge.
  headerBleed: { marginHorizontal: -scale(24) },

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
  // Monthly / Yearly segmented toggle (Figma 4928-8595)
  periodToggle: {
    flexDirection: 'row',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: palette.gold.DEFAULT,
    borderRadius: radius.s,
    overflow: 'hidden',
    marginTop: verticalScale(12),
    marginBottom: verticalScale(4),
  },
  periodOption: {
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(28),
  },
  periodOptionActive: {
    backgroundColor: palette.gold.DEFAULT,
  },
  periodText: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.s),
    color: palette.gold.DEFAULT,
  },
  periodTextActive: {
    color: palette.navy.DEFAULT,
    fontWeight: fontWeight.medium,
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
  disclosureText: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.xs),
    fontWeight: fontWeight.light,
    lineHeight: moderateScale(fontSize.xs) * 1.5,
    color: palette.gold.subtlest,
    textAlign: 'center',
    opacity: 0.8,
    marginTop: verticalScale(8),
    paddingHorizontal: scale(8),
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
