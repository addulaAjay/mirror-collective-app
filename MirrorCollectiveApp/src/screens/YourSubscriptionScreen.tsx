/**
 * Your Subscription — read-only management view.
 * Visual treatment repurposed from Figma 4928-8699 / 4928-8823 (the
 * Checkout cart designs — we don't ship a cart, see
 * docs/IAP_DESIGN_FEASIBILITY.md §0 for the locked decision).
 *
 * Surfaces:
 *   - Current plan card (Mirror Core)
 *   - Add-on card (Echo Vault Storage) — present if held, "Add" CTA if not
 *   - Total monthly equivalent display
 *   - Three trust pillars (Private by design / Cancel anytime / Export your data)
 *   - "Manage subscription" deep link to App Store / Play Store
 *
 * NO custom checkout button. Cancellation and plan changes always
 * happen in the platform's own subscription management UI — Apple and
 * Google require this. We just deep-link the user there.
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
    semantic,
    scale,
    verticalScale,
    moderateScale,
    modalColors,
    spacing,
} from '@theme';
import type { RootStackParamList } from '@types';
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Linking,
    Platform,
    ScrollView,
    type ViewStyle,
    type TextStyle,
    type ImageStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';

import { useSubscription } from '@/context/SubscriptionContext';
import { ALL_PRODUCT_SKUS, findProductBySku } from '@/constants/products';
import {
    useInAppPurchase,
    formatLocalizedPrice,
} from '@/hooks/useInAppPurchase';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'YourSubscription'>;

const PLAY_PACKAGE = 'com.themirrorcollective.mirror';

function openSubscriptionManagement(sku?: string) {
    if (Platform.OS === 'ios') {
        // Universal link — opens the Subscriptions section of Settings.
        Linking.openURL('https://apps.apple.com/account/subscriptions').catch(
            () => Linking.openURL('itms-apps://apps.apple.com/account/subscriptions'),
        );
        return;
    }
    if (Platform.OS === 'android') {
        // Allowlist the sku against our canonical product catalog
        // BEFORE interpolating it into the Play Store URL. The value
        // ultimately comes from a backend API response; if it's ever
        // malformed or unexpected we'd otherwise be passing
        // user-influenced data straight into Linking.openURL.
        const safeSku =
            sku && (ALL_PRODUCT_SKUS as readonly string[]).includes(sku)
                ? encodeURIComponent(sku)
                : undefined;
        const url = safeSku
            ? `https://play.google.com/store/account/subscriptions?sku=${safeSku}&package=${PLAY_PACKAGE}`
            : 'https://play.google.com/store/account/subscriptions';
        Linking.openURL(url);
    }
}

const YourSubscriptionScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const canGoBack = navigation.canGoBack();
    const { coreSubscription, storageSubscription, tier, status } = useSubscription();
    const { findProduct } = useInAppPurchase();

    const coreDescriptor = coreSubscription?.product_id
        ? findProductBySku(coreSubscription.product_id)
        : undefined;
    const storageDescriptor = storageSubscription?.product_id
        ? findProductBySku(storageSubscription.product_id)
        : undefined;

    const coreProductMeta = coreSubscription?.product_id
        ? findProduct(coreSubscription.product_id)
        : undefined;
    const storageProductMeta = storageSubscription?.product_id
        ? findProduct(storageSubscription.product_id)
        : undefined;

    const corePrice = formatLocalizedPrice(coreProductMeta, '—');
    const storagePrice = formatLocalizedPrice(storageProductMeta, '—');

    const corePeriodLabel =
        coreDescriptor?.billingPeriod === 'yearly' ? 'Billed yearly' : 'Billed monthly';
    const storagePeriodLabel =
        storageDescriptor?.billingPeriod === 'yearly' ? 'Billed yearly' : 'Billed monthly';

    const formatExpiry = (iso?: string): string => {
        if (!iso) return '—';
        try {
            return new Date(iso).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return iso;
        }
    };

    const hasCore = !!coreSubscription;
    const hasStorage = !!storageSubscription;
    const hasAnything = hasCore || hasStorage;

    return (
        <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage} scrollable>
            <SafeAreaView style={styles.safe}>
                <LogoHeader />

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
                    <Text style={styles.title}>YOUR SUBSCRIPTION</Text>
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Plans card ──────────────────────────────────── */}
                    <View style={styles.card}>
                        {hasCore ? (
                            <View style={styles.planRow}>
                                <View style={styles.planTextColumn}>
                                    <Text style={styles.planTitle}>Mirror Core</Text>
                                    <Text style={styles.planSubtitle}>{corePeriodLabel}</Text>
                                    {coreSubscription?.expiry_date && (
                                        <Text style={styles.planMeta}>
                                            {coreSubscription.auto_renew_enabled
                                                ? `Renews ${formatExpiry(coreSubscription.expiry_date)}`
                                                : `Ends ${formatExpiry(coreSubscription.expiry_date)}`}
                                        </Text>
                                    )}
                                </View>
                                <Text style={styles.planAmount}>{corePrice}</Text>
                            </View>
                        ) : (
                            <View style={styles.planRow}>
                                <View style={styles.planTextColumn}>
                                    <Text style={styles.planTitle}>Mirror Core</Text>
                                    <Text style={styles.planSubtitle}>
                                        {status === 'trial_expired' || status === 'expired'
                                            ? 'Subscription ended'
                                            : 'Not subscribed'}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    accessibilityRole="button"
                                    onPress={() => navigation.navigate('StartFreeTrial')}
                                    style={styles.linkButton}
                                >
                                    <Text style={styles.linkButtonText}>Subscribe</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={styles.divider} />

                        <Text style={styles.sectionLabel}>ADD ON</Text>

                        {hasStorage ? (
                            <View style={styles.planRow}>
                                <View style={styles.planTextColumn}>
                                    <Text style={styles.planTitle}>Echo Vault Storage</Text>
                                    <Text style={styles.planSubtitle}>{storagePeriodLabel}</Text>
                                    {storageSubscription?.expiry_date && (
                                        <Text style={styles.planMeta}>
                                            {storageSubscription.auto_renew_enabled
                                                ? `Renews ${formatExpiry(storageSubscription.expiry_date)}`
                                                : `Ends ${formatExpiry(storageSubscription.expiry_date)}`}
                                        </Text>
                                    )}
                                </View>
                                <Text style={styles.planAmount}>{storagePrice}</Text>
                            </View>
                        ) : (
                            <TouchableOpacity
                                accessibilityRole="button"
                                onPress={() => navigation.navigate('EchoVaultUpsell')}
                                style={styles.addOnRow}
                            >
                                <Text style={styles.addOnText}>Add Echo Vault Storage</Text>
                                <View style={styles.addOnPlus}>
                                    <Text style={styles.addOnPlusGlyph}>+</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* ── Manage / cancel (deep-link) ──────────────────── */}
                    {hasAnything && (
                        <TouchableOpacity
                            accessibilityRole="button"
                            onPress={() =>
                                openSubscriptionManagement(coreSubscription?.product_id)
                            }
                            style={styles.manageButtonWrapper}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={[
                                    'rgba(253, 253, 249, 0.03)',
                                    'rgba(253, 253, 249, 0.20)',
                                ]}
                                start={{ x: 0.5, y: 0 }}
                                end={{ x: 0.5, y: 1 }}
                                style={styles.manageButton}
                            >
                                <Text style={styles.manageButtonText}>
                                    {Platform.OS === 'ios'
                                        ? 'Manage in App Store'
                                        : 'Manage in Play Store'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}

                    {/* ── Trust pillars (Figma 4928-8699 footer row) ──── */}
                    <View style={styles.pillarsRow}>
                        <View style={styles.pillarItem}>
                            <Text style={styles.pillarGlyph}>🔒</Text>
                            <Text style={styles.pillarLabel}>PRIVATE BY DESIGN</Text>
                        </View>
                        <View style={styles.pillarItem}>
                            <Text style={styles.pillarGlyph}>✕</Text>
                            <Text style={styles.pillarLabel}>CANCEL ANYTIME</Text>
                        </View>
                        <View style={styles.pillarItem}>
                            <Text style={styles.pillarGlyph}>↥</Text>
                            <Text style={styles.pillarLabel}>EXPORT YOUR DATA</Text>
                        </View>
                    </View>

                    {/* Disclosure */}
                    <Text style={styles.disclosure}>
                        Subscriptions auto-renew until cancelled. You can cancel anytime in {Platform.OS === 'ios' ? 'App Store' : 'Play Store'} settings.
                    </Text>
                </ScrollView>
            </SafeAreaView>
        </BackgroundWrapper>
    );
};

export default YourSubscriptionScreen;

const styles = StyleSheet.create<{
    bg: ViewStyle;
    bgImage: ImageStyle;
    safe: ViewStyle;
    headerRow: ViewStyle;
    backButton: ViewStyle;
    backArrow: ImageStyle;
    title: TextStyle;
    scroll: ViewStyle;
    scrollContent: ViewStyle;
    card: ViewStyle;
    planRow: ViewStyle;
    planTextColumn: ViewStyle;
    planTitle: TextStyle;
    planSubtitle: TextStyle;
    planMeta: TextStyle;
    planAmount: TextStyle;
    sectionLabel: TextStyle;
    divider: ViewStyle;
    addOnRow: ViewStyle;
    addOnText: TextStyle;
    addOnPlus: ViewStyle;
    addOnPlusGlyph: TextStyle;
    linkButton: ViewStyle;
    linkButtonText: TextStyle;
    manageButtonWrapper: ViewStyle;
    manageButton: ViewStyle;
    manageButtonText: TextStyle;
    pillarsRow: ViewStyle;
    pillarItem: ViewStyle;
    pillarGlyph: TextStyle;
    pillarLabel: TextStyle;
    disclosure: TextStyle;
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
        fontSize: moderateScale(fontSize.xl),
        fontWeight: fontWeight.regular,
        lineHeight: lineHeight.l,
        color: palette.gold.warm,
        textAlign: 'center',
        letterSpacing: 2,
        textShadowColor: textShadow.glow.color,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 16,
    },

    scroll: { flex: 1 },
    scrollContent: {
        gap: verticalScale(20),
        paddingBottom: verticalScale(24),
    },

    // Card containing both Core + Storage rows
    card: {
        borderRadius: radius.s,
        borderWidth: borderWidth.hairline,
        borderColor: palette.navy.light,
        backgroundColor: 'rgba(163, 179, 204, 0.05)',
        padding: scale(spacing.m),
        gap: verticalScale(spacing.s),
        shadowColor: modalColors.textGoldMuted,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 4,
    },

    planRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: scale(12),
    },
    planTextColumn: { flex: 1, gap: verticalScale(2) },
    planTitle: {
        fontFamily: fontFamily.heading,
        fontSize: moderateScale(fontSize.l),
        fontWeight: fontWeight.regular,
        lineHeight: moderateScale(fontSize.l) * 1.3,
        color: palette.gold.subtlest,
    },
    planSubtitle: {
        fontFamily: fontFamily.body,
        fontSize: moderateScale(fontSize.xs),
        fontWeight: fontWeight.light,
        lineHeight: moderateScale(fontSize.xs) * 1.4,
        color: palette.gold.subtlest,
        opacity: 0.7,
    },
    planMeta: {
        fontFamily: fontFamily.bodyItalic,
        fontStyle: 'italic',
        fontSize: moderateScale(fontSize.xs),
        fontWeight: fontWeight.light,
        lineHeight: moderateScale(fontSize.xs) * 1.4,
        color: palette.gold.subtlest,
        opacity: 0.6,
        marginTop: verticalScale(2),
    },
    planAmount: {
        fontFamily: fontFamily.heading,
        fontSize: moderateScale(fontSize.l),
        fontWeight: fontWeight.regular,
        lineHeight: moderateScale(fontSize.l) * 1.3,
        color: palette.gold.DEFAULT,
    },

    sectionLabel: {
        fontFamily: fontFamily.body,
        fontSize: moderateScale(fontSize.xs),
        fontWeight: fontWeight.regular,
        letterSpacing: 1.5,
        color: palette.gold.subtlest,
        opacity: 0.7,
    },

    divider: {
        height: 0.5,
        backgroundColor: palette.navy.light,
        opacity: 0.5,
    },

    addOnRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: verticalScale(8),
        paddingHorizontal: scale(spacing.s),
        borderRadius: radius.s,
        borderWidth: borderWidth.hairline,
        borderColor: palette.navy.light,
        backgroundColor: 'rgba(163, 179, 204, 0.04)',
    },
    addOnText: {
        fontFamily: fontFamily.heading,
        fontSize: moderateScale(fontSize.s),
        fontWeight: fontWeight.regular,
        color: palette.gold.subtlest,
    },
    addOnPlus: {
        width: scale(28),
        height: scale(28),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: scale(14),
        borderWidth: borderWidth.hairline,
        borderColor: palette.gold.DEFAULT,
    },
    addOnPlusGlyph: {
        fontFamily: fontFamily.heading,
        fontSize: moderateScale(fontSize.l),
        color: palette.gold.DEFAULT,
        lineHeight: moderateScale(fontSize.l),
    },

    linkButton: {
        paddingHorizontal: scale(12),
        paddingVertical: verticalScale(6),
        borderRadius: radius.s,
        borderWidth: borderWidth.hairline,
        borderColor: palette.gold.DEFAULT,
    },
    linkButtonText: {
        fontFamily: fontFamily.heading,
        fontSize: moderateScale(fontSize.s),
        color: palette.gold.DEFAULT,
    },

    // "Manage in App Store / Play Store" deep-link CTA
    manageButtonWrapper: {
        alignSelf: 'center',
        width: '100%',
    },
    manageButton: {
        paddingVertical: verticalScale(12),
        paddingHorizontal: scale(16),
        borderRadius: radius.m,
        borderWidth: borderWidth.thin,
        borderColor: palette.navy.light,
        alignItems: 'center',
    },
    manageButtonText: {
        fontFamily: fontFamily.heading,
        fontSize: moderateScale(fontSize.l),
        fontWeight: fontWeight.regular,
        lineHeight: lineHeight.l,
        color: palette.gold.DEFAULT,
        textShadowColor: textShadow.warmGlow.color,
        textShadowOffset: textShadow.warmGlow.offset,
        textShadowRadius: textShadow.warmGlow.radius,
    },

    // Trust pillars
    pillarsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: scale(8),
    },
    pillarItem: {
        flex: 1,
        alignItems: 'center',
        gap: verticalScale(6),
    },
    pillarGlyph: {
        fontSize: moderateScale(24),
        color: palette.gold.DEFAULT,
    },
    pillarLabel: {
        fontFamily: fontFamily.body,
        fontSize: moderateScale(fontSize.xs),
        fontWeight: fontWeight.regular,
        letterSpacing: 1,
        color: palette.gold.subtlest,
        textAlign: 'center',
        opacity: 0.8,
    },

    disclosure: {
        ...semantic.typography.styles.label,
        color: palette.gold.subtlest,
        textAlign: 'center',
        opacity: 0.6,
        paddingHorizontal: scale(spacing.m),
    },
});
