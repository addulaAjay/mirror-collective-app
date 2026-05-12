/**
 * Echo Vault Storage upsell screen.
 * Figma: Design Master File node 4928-8944.
 *
 * Contextual single-product paywall for the Echo Vault Storage add-on
 * (+100 GB). Reached from three places:
 *   1. After Core purchase succeeds — final onboarding step.
 *   2. From the Echo Vault home quota banner (approaching / exceeded).
 *   3. From "Your Subscription" management — "Add Echo Vault" CTA.
 *
 * UX is contextual, not cart-based: ADD fires `requestSubscription`
 * (one native sheet); "Not now" / "CONTINUE" without ADD navigates to
 * the configured next route.
 *
 * Per locked entitlement matrix (docs/IAP_SUBSCRIPTION_REVIEW.md): we
 * do NOT show a manually computed total or bundle Core + Storage into a
 * single transaction. Apple/Google show one native sheet per SKU.
 */

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
    Linking,
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
import { useToast } from '@components/Toast';

import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '@/constants/legalUrls';
import { useSubscription } from '@/context/SubscriptionContext';
import {
    useInAppPurchase,
    formatLocalizedPrice,
} from '@/hooks/useInAppPurchase';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'EchoVaultUpsell'>;
type ScreenRoute = RouteProp<RootStackParamList, 'EchoVaultUpsell'>;

const EchoVaultUpsellScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<ScreenRoute>();
    const canGoBack = navigation.canGoBack();
    const { showToast } = useToast();
    const { refreshSubscriptionStatus } = useSubscription();
    const {
        purchaseSubscription,
        restorePurchases,
        purchasing,
        findProduct,
        loading: productsLoading,
        PRODUCT_IDS,
    } = useInAppPurchase();

    // Default to ADD — surfaces the upsell intent up-front. User can
    // back out to "Not now" with one tap if they don't want it.
    const [intent, setIntent] = useState<'add' | 'skip'>('add');
    const [restoring, setRestoring] = useState(false);

    // Default to yearly (better value), then surface monthly as a
    // secondary option inside the price line below.
    const monthlyProduct = findProduct(PRODUCT_IDS.STORAGE_MONTHLY);
    const yearlyProduct = findProduct(PRODUCT_IDS.STORAGE_YEARLY);

    const monthlyPrice = formatLocalizedPrice(monthlyProduct, '$4.99');
    const yearlyPrice = formatLocalizedPrice(yearlyProduct, '$49');

    const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('yearly');
    const selectedProduct = selectedPeriod === 'monthly' ? monthlyProduct : yearlyProduct;
    const selectedSku =
        selectedPeriod === 'monthly'
            ? PRODUCT_IDS.STORAGE_MONTHLY
            : PRODUCT_IDS.STORAGE_YEARLY;

    const proceedToNext = () => {
        // The caller can specify where to go after the upsell (e.g. main
        // app after onboarding, or back to Echo Vault home if launched
        // from a quota banner). Default = goBack so the screen behaves
        // sensibly when launched as a modal.
        const next = route.params?.onCompleteRoute;
        if (next) {
            navigation.reset({ index: 0, routes: [{ name: next as any }] });
        } else if (canGoBack) {
            navigation.goBack();
        }
    };

    const handleContinue = async () => {
        if (intent === 'skip') {
            proceedToNext();
            return;
        }

        try {
            // ADD path: fire the native subscription sheet for the chosen
            // SKU. The purchaseUpdatedListener in useInAppPurchase POSTs
            // the receipt to /verify-purchase, which activates the
            // storage add-on server-side. We just need to refresh state
            // and continue.
            await purchaseSubscription(selectedSku);
            await refreshSubscriptionStatus();
            proceedToNext();
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Unable to complete purchase';
            showToast({
                title: 'Purchase failed',
                message,
                tone: 'error',
            });
        }
    };

    const handleRestore = async () => {
        try {
            setRestoring(true);
            await restorePurchases();
            await refreshSubscriptionStatus();
        } finally {
            setRestoring(false);
        }
    };

    return (
        <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage} scrollable>
            <SafeAreaView style={styles.safe}>
                <LogoHeader />

                {/* ── Back + Eyebrow + Title ──────────────────────────── */}
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
                    <View style={styles.headerTextColumn}>
                        <Text style={styles.eyebrow}>Optional Add On</Text>
                        <Text style={styles.title}>Echo Vault Storage</Text>
                    </View>
                </View>

                <Text style={styles.subtitle}>
                    Save voice notes, videos, photos, reflections, letters, and life moments.
                </Text>

                {/* ── Card ─────────────────────────────────────────────── */}
                <View style={styles.cardShadow}>
                    <View style={styles.cardGradientBorder}>
                        <View style={styles.cardClip}>
                            <ScrollView
                                style={styles.cardScroll}
                                contentContainerStyle={styles.cardContent}
                                showsVerticalScrollIndicator
                                scrollIndicatorInsets={{ right: 1 }}
                                bounces
                            >
                                <Text style={styles.cardTitle}>+100 GB Storage</Text>

                                {/* Live-priced toggle: monthly vs yearly */}
                                <View style={styles.periodToggleRow}>
                                    <TouchableOpacity
                                        accessibilityRole="button"
                                        accessibilityState={{ selected: selectedPeriod === 'monthly' }}
                                        onPress={() => setSelectedPeriod('monthly')}
                                        style={[
                                            styles.periodOption,
                                            selectedPeriod === 'monthly' && styles.periodOptionSelected,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.periodAmount,
                                                selectedPeriod === 'monthly' && styles.periodAmountSelected,
                                            ]}
                                        >
                                            {monthlyPrice}
                                        </Text>
                                        <Text style={styles.periodLabel}>/month</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        accessibilityRole="button"
                                        accessibilityState={{ selected: selectedPeriod === 'yearly' }}
                                        onPress={() => setSelectedPeriod('yearly')}
                                        style={[
                                            styles.periodOption,
                                            selectedPeriod === 'yearly' && styles.periodOptionSelected,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.periodAmount,
                                                selectedPeriod === 'yearly' && styles.periodAmountSelected,
                                            ]}
                                        >
                                            {yearlyPrice}
                                        </Text>
                                        <Text style={styles.periodLabel}>/year</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* ADD / Not now segmented control */}
                                <View style={styles.intentRow}>
                                    <TouchableOpacity
                                        accessibilityRole="button"
                                        accessibilityState={{ selected: intent === 'add' }}
                                        onPress={() => setIntent('add')}
                                        style={[
                                            styles.intentOption,
                                            styles.intentOptionLeft,
                                            intent === 'add' && styles.intentOptionSelected,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.intentText,
                                                intent === 'add' && styles.intentTextSelected,
                                            ]}
                                        >
                                            ADD
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        accessibilityRole="button"
                                        accessibilityState={{ selected: intent === 'skip' }}
                                        onPress={() => setIntent('skip')}
                                        style={[
                                            styles.intentOption,
                                            styles.intentOptionRight,
                                            intent === 'skip' && styles.intentOptionSelected,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.intentText,
                                                intent === 'skip' && styles.intentTextSelected,
                                            ]}
                                        >
                                            Not now
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
                                    title={purchasing ? 'LOADING...' : 'CONTINUE'}
                                    onPress={handleContinue}
                                    disabled={
                                        purchasing
                                        || (intent === 'add' && (productsLoading || !selectedProduct))
                                    }
                                    style={styles.ctaButtonWrapper}
                                    containerStyle={styles.ctaButtonContainer}
                                    contentStyle={styles.ctaButtonContent}
                                    textStyle={styles.ctaButtonText}
                                    gradientColors={[
                                        glassGradient.button.start,
                                        glassGradient.button.end,
                                    ]}
                                />

                                <Text style={styles.cancelText}>
                                    You can change this anytime.
                                </Text>
                            </ScrollView>
                        </View>
                    </View>
                </View>

                {/* ── Footer ──────────────────────────────────────────── */}
                {/* Tappable Terms + Privacy required by App Store Review
                    Guideline 3.1.2(a) for subscription flows. */}
                <View style={styles.footerLinksRow}>
                    <TouchableOpacity
                        accessibilityRole="link"
                        accessibilityLabel="Open Terms of Service"
                        onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}
                        hitSlop={8}
                    >
                        <Text style={styles.footerLinkText}>Terms</Text>
                    </TouchableOpacity>
                    <Text style={styles.footerLinkText}>•</Text>
                    <TouchableOpacity
                        accessibilityRole="link"
                        accessibilityLabel="Open Privacy Policy"
                        onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
                        hitSlop={8}
                    >
                        <Text style={styles.footerLinkText}>Privacy</Text>
                    </TouchableOpacity>
                    <Text style={styles.footerLinkText}>•</Text>
                    <TouchableOpacity
                        accessibilityRole="button"
                        onPress={handleRestore}
                        disabled={restoring}
                        hitSlop={8}
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

export default EchoVaultUpsellScreen;

const styles = StyleSheet.create<{
    bg: ViewStyle;
    bgImage: ImageStyle;
    safe: ViewStyle;
    headerRow: ViewStyle;
    headerTextColumn: ViewStyle;
    backButton: ViewStyle;
    backArrow: ImageStyle;
    eyebrow: TextStyle;
    title: TextStyle;
    subtitle: TextStyle;
    cardShadow: ViewStyle;
    cardGradientBorder: ViewStyle;
    cardClip: ViewStyle;
    cardScroll: ViewStyle;
    cardContent: ViewStyle;
    cardTitle: TextStyle;
    periodToggleRow: ViewStyle;
    periodOption: ViewStyle;
    periodOptionSelected: ViewStyle;
    periodAmount: TextStyle;
    periodAmountSelected: TextStyle;
    periodLabel: TextStyle;
    intentRow: ViewStyle;
    intentOption: ViewStyle;
    intentOptionLeft: ViewStyle;
    intentOptionRight: ViewStyle;
    intentOptionSelected: ViewStyle;
    intentText: TextStyle;
    intentTextSelected: TextStyle;
    starDividerRow: ViewStyle;
    starDividerLine: ViewStyle;
    ctaButtonWrapper: ViewStyle;
    ctaButtonContainer: ViewStyle;
    ctaButtonContent: ViewStyle;
    ctaButtonText: TextStyle;
    cancelText: TextStyle;
    footerLinksRow: ViewStyle;
    footerLinkText: TextStyle;
}>({
    bg: { flex: 1, backgroundColor: palette.navy.deep },
    bgImage: { resizeMode: 'cover' },
    safe: {
        flex: 1,
        backgroundColor: 'transparent',
        paddingHorizontal: scale(24),
        paddingBottom: verticalScale(24),
        gap: verticalScale(16),
    },

    // Header (eyebrow + title)
    headerRow: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    headerTextColumn: { alignItems: 'center', gap: verticalScale(4) },
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
    eyebrow: {
        fontFamily: fontFamily.bodyItalic,
        fontStyle: 'italic',
        fontSize: moderateScale(fontSize.s),
        fontWeight: fontWeight.light,
        lineHeight: moderateScale(fontSize.s) * 1.3,
        color: palette.gold.subtlest,
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

    // Card (same three-layer gradient pattern as StartFreeTrialScreen)
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
        gap: verticalScale(14),
        paddingHorizontal: scale(20),
        paddingTop: verticalScale(20),
        paddingBottom: verticalScale(20),
    },

    cardTitle: {
        fontFamily: fontFamily.heading,
        fontSize: moderateScale(fontSize['2xl']),
        fontWeight: fontWeight.regular,
        lineHeight: moderateScale(fontSize['2xl']) * 1.3,
        color: palette.gold.DEFAULT,
        textAlign: 'center',
    },

    // Billing-period toggle (matches StartFreeTrialScreen pattern)
    periodToggleRow: {
        flexDirection: 'row',
        alignSelf: 'stretch',
        gap: scale(12),
    },
    periodOption: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(10),
        paddingHorizontal: scale(8),
        borderRadius: radius.s,
        borderWidth: borderWidth.hairline,
        borderColor: palette.navy.light,
        backgroundColor: 'rgba(163, 179, 204, 0.04)',
    },
    periodOptionSelected: {
        borderColor: palette.gold.DEFAULT,
        backgroundColor: 'rgba(242, 226, 177, 0.08)',
    },
    periodAmount: {
        fontFamily: fontFamily.heading,
        fontSize: moderateScale(fontSize.xl),
        fontWeight: fontWeight.regular,
        lineHeight: moderateScale(fontSize.xl) * 1.2,
        color: palette.gold.subtlest,
        textAlign: 'center',
    },
    periodAmountSelected: { color: palette.gold.DEFAULT },
    periodLabel: {
        fontFamily: fontFamily.bodyItalic,
        fontStyle: 'italic',
        fontSize: moderateScale(fontSize.s),
        fontWeight: fontWeight.light,
        lineHeight: moderateScale(fontSize.s) * 1.3,
        color: palette.gold.subtlest,
        textAlign: 'center',
    },

    // ADD / Not now segmented control. Gold-filled when selected.
    intentRow: {
        flexDirection: 'row',
        alignSelf: 'stretch',
        borderRadius: radius.s,
        borderWidth: borderWidth.hairline,
        borderColor: palette.gold.DEFAULT,
        overflow: 'hidden',
    },
    intentOption: {
        flex: 1,
        paddingVertical: verticalScale(10),
        alignItems: 'center',
        justifyContent: 'center',
    },
    intentOptionLeft: {
        borderRightWidth: borderWidth.hairline,
        borderRightColor: palette.gold.DEFAULT,
    },
    intentOptionRight: {},
    intentOptionSelected: {
        backgroundColor: 'rgba(242, 226, 177, 0.85)',
    },
    intentText: {
        fontFamily: fontFamily.heading,
        fontSize: moderateScale(fontSize.l),
        fontWeight: fontWeight.regular,
        color: palette.gold.subtlest,
    },
    intentTextSelected: { color: palette.navy.deep },

    // Star divider (mirror StartFreeTrialScreen)
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

    // CTA
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
    cancelText: {
        ...semantic.typography.styles.label,
        color: palette.gold.subtlest,
        textAlign: 'center',
        opacity: 0.85,
    },

    // Footer
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
