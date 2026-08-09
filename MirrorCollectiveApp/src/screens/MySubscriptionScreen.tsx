/**
 * My Subscription screen — Figma Dev-Master-File node 2323-2774.
 *
 * Reached from the nav menu ("Subscription"). Shows the user's current plan,
 * trial/active status, and the Mirror Basic details, with END SUBSCRIPTION
 * (deep-links to the iOS Manage Subscriptions page — auto-renewable
 * subscriptions can only be cancelled by the user through the App Store) and
 * Restore Purchase.
 *
 * Subscription data comes from SubscriptionContext (server = source of truth).
 */
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button/Button';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';
import { LEGAL_LINKS } from '@constants/config';
import { useSubscription } from '@context/SubscriptionContext';
import { useInAppPurchase, localizedPrice } from '@hooks/useInAppPurchase';
import { palette, fontFamily, fontSize, scale, radius } from '@theme';
import type { RootStackParamList } from '@types';

// iOS Manage Subscriptions deep link. Auto-renewable subscriptions cannot be
// cancelled programmatically — Apple requires the user to do it in Settings /
// the App Store, so END SUBSCRIPTION routes there.
const MANAGE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';


type Props = NativeStackScreenProps<RootStackParamList, 'MySubscription'>;

const Bullet: React.FC<{ lead: string; rest: string }> = ({ lead, rest }) => (
  <View style={styles.bulletRow}>
    <Text style={styles.bulletMarker}>•</Text>
    <Text style={styles.bulletLine}>
      <Text style={styles.bulletLead}>{lead}</Text>
      {rest}
    </Text>
  </View>
);

const MySubscriptionScreen: React.FC<Props> = ({ navigation }) => {
  const { status, isInTrial, trialDaysRemaining, hasActiveSubscription, loading } =
    useSubscription();
  const { restorePurchases, products, PRODUCT_IDS } = useInAppPurchase();
  const monthlyPrice = localizedPrice(products, PRODUCT_IDS.CORE_MONTHLY, '$9.99');
  const yearlyPrice = localizedPrice(products, PRODUCT_IDS.CORE_YEARLY, '$89');
  const [restoring, setRestoring] = useState(false);

  const statusLine = isInTrial
    ? `${trialDaysRemaining || 14}-day free trial`
    : status === 'active'
      ? 'Active subscription'
      : status === 'expired' || status === 'trial_expired'
        ? 'Subscription expired'
        : 'No active subscription';

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open link', 'Please try again later.');
    }
  };

  const handleEndSubscription = () => {
    Alert.alert(
      'End subscription',
      'You manage and cancel your subscription in the App Store. Open Manage Subscriptions now?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open',
          onPress: () => openLink(MANAGE_SUBSCRIPTIONS_URL),
        },
      ],
    );
  };

  // Expired / never-subscribed users have no StoreKit purchase to restore —
  // route them to the paywall to actually subscribe (it shows SUBSCRIBE NOW).
  const handleSubscribe = () => {
    navigation.navigate('StartFreeTrial');
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await restorePurchases();
    } finally {
      setRestoring(false);
    }
  };

  return (
    <BackgroundWrapper style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        {/* Negative margin cancels `safe`'s 24px padding so the header is
            full-bleed and its menu button sits at the same inset as every
            other screen. */}
        <LogoHeader
          navigation={navigation}
          wrapperStyle={styles.headerBleed}
        />

        {/* Header row: ← | SUBSCRIPTION | spacer */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Image
              source={require('@assets/back-arrow.png')}
              style={styles.backArrow}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={styles.title}>SUBSCRIPTION</Text>
          <View style={styles.backBtn} />
        </View>

        <Text style={styles.subtitle}>{statusLine}</Text>
        <Text style={styles.tagline}>
          Reflect, remember, and track what's changing in real time.
        </Text>

        {loading ? (
          <ActivityIndicator color={palette.gold.DEFAULT} style={styles.loader} />
        ) : (
          <View style={styles.card}>
            <ScrollView
              contentContainerStyle={styles.cardContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.cardTitle}>Mirror Basic</Text>
              <Text style={styles.cardSubtitle}>Your daily reflective companion.</Text>

              {/* Star divider */}
              <View style={styles.starDividerRow}>
                <LinearGradient
                  colors={[palette.gold.DEFAULT, palette.gold.rich]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.starDividerLine}
                />
                <StarIcon width={scale(18)} height={scale(18)} color={palette.gold.DEFAULT} />
                <LinearGradient
                  colors={[palette.gold.rich, palette.gold.DEFAULT]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.starDividerLine}
                />
              </View>

              <View style={styles.bullets}>
                <Bullet lead="MirrorGPT" rest=" — reflect, process, and gain clarity" />
                <Bullet
                  lead="Echo Map + micro-practices"
                  rest=" — see patterns and shift them"
                />
                <Bullet
                  lead="Private Echo Vault (50 GB)"
                  rest=" — your memories, your story"
                />
              </View>

              <LinearGradient
                colors={[palette.gold.DEFAULT, palette.gold.rich]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.dividerLine}
              />

              <View style={styles.priceLine}>
                <Text style={styles.priceAmount}>{monthlyPrice}</Text>
                <Text style={styles.pricePer}> /month </Text>
                <Text style={styles.priceOr}>or</Text>
                <Text style={styles.priceYear}> {yearlyPrice}</Text>
                <Text style={styles.priceYearSuffix}> /year</Text>
              </View>

              <Text style={styles.cancelText}>Cancel anytime.</Text>
            </ScrollView>
          </View>
        )}

        <View style={styles.footer}>
          {hasActiveSubscription ? (
            <Button
              variant="primary"
              size="L"
              title="END SUBSCRIPTION"
              onPress={handleEndSubscription}
            />
          ) : (
            <Button
              variant="primary"
              size="L"
              title="SUBSCRIBE"
              onPress={handleSubscribe}
            />
          )}
          <View style={styles.footerLinksRow}>
            <TouchableOpacity accessibilityRole="link" onPress={() => openLink(LEGAL_LINKS.TERMS)}>
              <Text style={styles.footerLinkText}>Terms</Text>
            </TouchableOpacity>
            <Text style={styles.footerLinkText}>•</Text>
            <TouchableOpacity accessibilityRole="link" onPress={() => openLink(LEGAL_LINKS.PRIVACY)}>
              <Text style={styles.footerLinkText}>Privacy</Text>
            </TouchableOpacity>
            <Text style={styles.footerLinkText}>•</Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleRestore}
              disabled={restoring}
            >
              <Text style={styles.footerLinkText}>
                {restoring ? 'Restoring…' : 'Restore Purchase'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default MySubscriptionScreen;

const GOLD = palette.gold.DEFAULT;

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 24 },
  // Cancels `safe`'s 24px horizontal padding so LogoHeader spans edge-to-edge.
  headerBleed: { marginHorizontal: -24 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  // Match the canonical header back-button treatment used across the app
  // (TermsAndConditionsScreen / StartFreeTrialScreen): a 40px touch box with a
  // 20px warm-gold arrow. The symmetric 40px spacer on the right keeps the
  // flex:1 title centred.
  backBtn: {
    width: scale(40),
    height: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    width: scale(20),
    height: scale(20),
    resizeMode: 'contain',
    tintColor: palette.gold.warm,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: 1,
    color: palette.gold.warm,
  },
  subtitle: {
    textAlign: 'center',
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    color: palette.gold.warm,
    marginTop: 4,
  },
  tagline: {
    textAlign: 'center',
    fontFamily: fontFamily.bodyLight,
    fontSize: 16,
    lineHeight: 24,
    color: palette.neutral.white,
    marginTop: 8,
    marginBottom: 16,
  },
  loader: { marginTop: 40 },

  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(242, 226, 177, 0.4)',
    borderRadius: radius.m,
    backgroundColor: 'rgba(253, 253, 249, 0.03)',
    overflow: 'hidden',
  },
  cardContent: { padding: 24, alignItems: 'center' },
  cardTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 28,
    lineHeight: 32,
    color: palette.gold.warm,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontFamily: fontFamily.bodyLight,
    fontSize: 16,
    color: palette.neutral.white,
    textAlign: 'center',
    marginTop: 8,
  },

  starDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 16,
    width: '70%',
  },
  starDividerLine: { flex: 1, height: 1 },

  bullets: { alignSelf: 'stretch', gap: 12, marginBottom: 16 },
  bulletRow: { flexDirection: 'row', gap: 8 },
  bulletMarker: { color: palette.neutral.white, fontSize: 16, lineHeight: 24 },
  bulletLine: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 24,
    color: palette.neutral.white,
  },
  bulletLead: { fontWeight: '600', color: palette.neutral.white },

  dividerLine: { height: 1, width: '70%', marginVertical: 16 },

  priceLine: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', justifyContent: 'center' },
  priceAmount: { fontFamily: 'CormorantGaramond-Regular', fontSize: 24, color: palette.neutral.white },
  pricePer: { fontFamily: fontFamily.bodyLight, fontSize: 16, color: palette.neutral.white },
  priceOr: { fontFamily: fontFamily.bodyItalic, fontSize: 16, color: palette.neutral.white },
  priceYear: { fontFamily: 'CormorantGaramond-Regular', fontSize: 24, color: GOLD },
  priceYearSuffix: { fontFamily: fontFamily.bodyLight, fontSize: 16, color: GOLD },

  cancelText: {
    fontFamily: fontFamily.bodyItalic,
    fontSize: 14,
    color: palette.neutral.white,
    marginTop: 16,
    textAlign: 'center',
  },

  footer: { paddingVertical: 20, alignItems: 'center', gap: 16 },
  footerLinksRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerLinkText: {
    fontFamily: fontFamily.bodyLight,
    fontSize: fontSize.xs,
    color: palette.gold.warm,
  },
});
