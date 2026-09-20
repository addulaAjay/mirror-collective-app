/**
 * Add Storage (Echo Vault Storage add-on) — Figma Dev-Master-File node 4928-8944.
 *
 * "Optional Add On" purchase screen for the +100 GB storage add-on. Structurally
 * mirrors StartFreeTrialScreen (same Mirror card + monthly/yearly toggle) but:
 *  - sells the STORAGE_* products, not Core,
 *  - is an in-app upgrade (does NOT call setAuthenticated on success),
 *  - requires an active Core plan (the backend grants no add-on quota without
 *    Core; the entry point on MySubscriptionScreen only shows this when Core is
 *    active).
 */
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
  Linking,
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
import { LEGAL_LINKS } from '@constants/config';

import { useSubscription } from '@/context/SubscriptionContext';
import { useInAppPurchase, localizedPrice } from '@/hooks/useInAppPurchase';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddStorage'>;

const AddStorageScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const canGoBack = navigation.canGoBack();
  const { storageSubscription, refreshSubscriptionStatus } = useSubscription();
  const {
    purchaseSubscription,
    restorePurchases,
    openManageSubscriptions,
    purchasing,
    PRODUCT_IDS,
    products,
  } = useInAppPurchase({
    // In-app upgrade: on verify just refresh status (the user is already
    // authenticated — unlike the paywall we must NOT call setAuthenticated).
    onPurchaseVerified: async () => {
      await refreshSubscriptionStatus();
      navigation.goBack();
    },
  });
  const [restoring, setRestoring] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>(
    'monthly',
  );

  // Live store prices (fall back to the confirmed defaults until IAP loads).
  const monthlyPrice = localizedPrice(products, PRODUCT_IDS.STORAGE_MONTHLY, '$4.99');
  const yearlyPrice = localizedPrice(products, PRODUCT_IDS.STORAGE_YEARLY, '$49');

  // The add-on is already active — offer plan management instead of a re-buy.
  const isAddonActive = !!storageSubscription;

  const handleAdd = async () => {
    if (isAddonActive) {
      await openManageSubscriptions();
      return;
    }
    const productId =
      selectedPeriod === 'monthly'
        ? PRODUCT_IDS.STORAGE_MONTHLY
        : PRODUCT_IDS.STORAGE_YEARLY;
    try {
      await purchaseSubscription(productId);
    } catch (error: any) {
      Alert.alert('Purchase Failed', error.message || 'Unable to complete purchase');
    }
  };

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open link', 'Please try again later.');
    }
  };

  const handleRestore = async () => {
    if (restoring) return;
    try {
      setRestoring(true);
      const result = await restorePurchases();
      if (result && result.success && (result.data?.restored_count ?? 0) > 0) {
        await refreshSubscriptionStatus();
      }
    } catch (error: any) {
      Alert.alert('Restore Failed', error?.message || 'Unable to restore purchases.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage} scrollable>
      <SafeAreaView style={styles.safe}>
        <LogoHeader wrapperStyle={styles.headerBleed} />

        {/* ── Back + Title ─────────────────────────────────────────── */}
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
          <View style={styles.titleGroup}>
            <Text style={styles.addOnLabel}>Optional Add On</Text>
            <Text style={styles.title}>Echo Vault Storage</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          Save voice notes, videos, photos, reflections, letters, and life
          moments.
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
                <Text style={styles.cardTitle}>+100 GB Storage</Text>

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

                {/* Monthly / Yearly toggle */}
                <View style={styles.periodToggle}>
                  <TouchableOpacity
                    style={[
                      styles.periodOption,
                      selectedPeriod === 'monthly' && styles.periodOptionActive,
                    ]}
                    onPress={() => setSelectedPeriod('monthly')}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedPeriod === 'monthly' }}
                    testID="storage-period-monthly"
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
                    testID="storage-period-yearly"
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

                {/* CTA */}
                <Button
                  variant="gradient"
                  title={
                    purchasing
                      ? 'LOADING...'
                      : isAddonActive
                        ? 'MANAGE'
                        : 'ADD'
                  }
                  onPress={handleAdd}
                  disabled={purchasing}
                  style={styles.ctaButtonWrapper}
                  containerStyle={styles.ctaButtonContainer}
                  contentStyle={styles.ctaButtonContent}
                  textStyle={styles.ctaButtonText}
                  gradientColors={[
                    glassGradient.button.start,
                    glassGradient.button.end,
                  ]}
                />

                {!isAddonActive && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => navigation.goBack()}
                  >
                    <Text style={styles.notNow}>Not Now</Text>
                  </TouchableOpacity>
                )}

                <Text style={styles.changeAnytime}>
                  You can change this anytime.
                </Text>

                {/* Auto-renewal disclosure — App Store Review Guideline 3.1.2. */}
                <Text style={styles.disclosureText}>
                  {selectedPeriod === 'monthly'
                    ? `Echo Vault Storage is ${monthlyPrice} per month`
                    : `Echo Vault Storage is ${yearlyPrice} per year`}
                  . Payment is charged to your Apple ID at confirmation of
                  purchase. Your subscription automatically renews unless
                  auto-renew is turned off at least 24 hours before the end of the
                  current period. Manage or cancel anytime in your Apple ID
                  Account Settings.
                </Text>

                {/* Footer links (inside card, per design) */}
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
              </ScrollView>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default AddStorageScreen;

const styles = StyleSheet.create<{
  bg: ViewStyle;
  bgImage: ImageStyle;
  safe: ViewStyle;
  headerBleed: ViewStyle;
  headerRow: ViewStyle;
  titleGroup: ViewStyle;
  backButton: ViewStyle;
  backArrow: ImageStyle;
  addOnLabel: TextStyle;
  title: TextStyle;
  subtitle: TextStyle;
  cardShadow: ViewStyle;
  cardGradientBorder: ViewStyle;
  cardClip: ViewStyle;
  cardScroll: ViewStyle;
  cardContent: ViewStyle;
  cardTitle: TextStyle;
  starDividerRow: ViewStyle;
  starDividerLine: ViewStyle;
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
  notNow: TextStyle;
  changeAnytime: TextStyle;
  disclosureText: TextStyle;
  footerLinksRow: ViewStyle;
  footerLinkText: TextStyle;
}>({
  bg: { flex: 1 },
  bgImage: { resizeMode: 'cover' },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: scale(24),
    paddingBottom: verticalScale(24),
    gap: verticalScale(16),
  },
  headerBleed: { marginHorizontal: -scale(24) },
  headerRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  titleGroup: { alignItems: 'center', gap: verticalScale(4) },
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
  addOnLabel: {
    fontFamily: fontFamily.headingItalic,
    fontSize: moderateScale(fontSize.l),
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(fontSize.l) * 1.3,
    color: palette.gold.warm,
    textAlign: 'center',
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
  subtitle: {
    ...semantic.typography.styles.body,
    color: palette.gold.subtlest,
    textAlign: 'center',
  },
  cardShadow: {
    flex: 1,
    alignSelf: 'center',
    width: scale(313),
    borderRadius: radius.s,
    backgroundColor: palette.navy.deep,
    shadowColor: palette.gold.DEFAULT,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: moderateScale(16),
    elevation: 12,
  },
  cardGradientBorder: {
    flex: 1,
    borderRadius: radius.s,
    overflow: 'hidden',
    paddingHorizontal: 0.5,
  },
  cardClip: {
    flex: 1,
    marginVertical: 0.25,
    borderRadius: radius.s - 0.25,
    overflow: 'hidden',
    backgroundColor: palette.navy.card,
  },
  cardScroll: { flex: 1 },
  cardContent: {
    alignItems: 'center',
    gap: verticalScale(10),
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(20),
  },
  cardTitle: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize['3xl']),
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(fontSize['3xl']) * 1.3,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
  },
  starDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(12),
    alignSelf: 'stretch',
  },
  starDividerLine: { flex: 1, height: 0.5, borderRadius: 1 },
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
  priceOrContainer: { justifyContent: 'flex-end', alignItems: 'center' },
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
  periodOptionActive: { backgroundColor: palette.gold.DEFAULT },
  periodText: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.s),
    color: palette.gold.DEFAULT,
  },
  periodTextActive: {
    color: palette.navy.DEFAULT,
    fontWeight: fontWeight.medium,
  },
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
  notNow: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.s),
    fontWeight: fontWeight.regular,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: verticalScale(4),
  },
  changeAnytime: {
    fontFamily: fontFamily.bodyItalic,
    fontStyle: 'italic',
    fontSize: moderateScale(fontSize.s),
    fontWeight: fontWeight.light,
    color: palette.gold.subtlest,
    textAlign: 'center',
    opacity: 0.9,
  },
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
  footerLinksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scale(6),
    marginTop: verticalScale(6),
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
