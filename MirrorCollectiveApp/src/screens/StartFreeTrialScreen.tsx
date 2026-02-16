import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@types';
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';

import { useSubscription } from '@/context/SubscriptionContext';
import { useInAppPurchase } from '@/hooks/useInAppPurchase';
import { subscriptionApiService } from '@/services/api/subscriptionApi';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'StartFreeTrial'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const DESIGN_WIDTH = 393;
const DESIGN_HEIGHT = 852;

const outerContainerPaddingHorizontal = Math.max(24, (24 * screenWidth) / DESIGN_WIDTH);
const outerContainerPaddingBottom = Math.max(53, (53 * screenHeight) / DESIGN_HEIGHT);

const outerBoxWidth = (345 * screenWidth) / DESIGN_WIDTH;
const sectionGap = Math.max(16, (16 * screenHeight) / DESIGN_HEIGHT);

const cardMaxWidth = 313;
const cardWidth = Math.min(cardMaxWidth, outerBoxWidth);
const innerBoxSidePadding = Math.max(0, (outerBoxWidth - cardWidth) / 2);

const StartFreeTrialScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { hasUsedTrial, hasActiveSubscription, refreshSubscriptionStatus } = useSubscription();
  const { purchaseSubscription, purchasing, PRODUCT_IDS } = useInAppPurchase();
  const [loading, setLoading] = useState(false);
  const [selectedPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const cardGradient = useMemo(
    () => ['rgba(255, 255, 255, 0.05)', 'rgba(153, 153, 153, 0.05)'],
    [],
  );

  // Determine button mode: trial or subscribe
  const isTrialMode = !hasUsedTrial && !hasActiveSubscription;
  const buttonText = isTrialMode ? 'START FREE TRIAL' : 'SUBSCRIBE NOW';

  const handleButtonPress = async () => {
    if (hasActiveSubscription) {
      Alert.alert('Already Subscribed', 'You already have an active subscription.');
      return;
    }

    if (isTrialMode) {
      // Start trial (no payment)
      try {
        setLoading(true);
        const response = await subscriptionApiService.startTrial();

        if (response.success) {
          await refreshSubscriptionStatus();
          Alert.alert(
            'Trial Started!',
            '14 days of full access to Mirror Core. Enjoy!',
            [
              {
                text: 'Continue',
                onPress: () => navigation.navigate('EnterMirror' as never),
              },
            ],
          );
        } else {
          throw new Error(response.message || 'Failed to start trial');
        }
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to start trial');
      } finally {
        setLoading(false);
      }
    } else {
      // Purchase subscription
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
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.outerBoxContainer}>
          <LogoHeader />

          <View style={styles.outerBox}>
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

              <View style={styles.titleContainer}>
                <Text style={styles.title}>Start{`\n`}14 Day free trial</Text>
                <Text style={styles.subtitle}>
                  Reflect, remember, and track what’s{`\n`}changing in real time.
                </Text>
              </View>
            </View>

            <View style={styles.innerBox}>
              <View style={styles.cardWrapper}>
                <LinearGradient
                  colors={cardGradient}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.cardGradient}
                  pointerEvents="none"
                />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Mirror Core</Text>
                  <Text style={styles.cardSubtitle}>Your daily reflective companion.</Text>

                  <View style={styles.starDividerRow}>
                    <LinearGradient
                      colors={['#F2E2B1', '#CFA64F']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.starDividerLine}
                    />
                    <StarIcon width={18} height={18} color="#F2E2B1" />
                    <LinearGradient
                      colors={['#CFA64F', '#F2E2B1']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.starDividerLine}
                    />
                  </View>

                  <View style={styles.bullets}>
                    <View style={styles.bulletRow}>
                      <Text style={styles.bulletMarker}>•</Text>
                      <Text style={styles.bulletLine}>
                        <Text style={styles.bulletLead}>MirrorGPT</Text> — reflect, process,{`\n`}and gain clarity
                      </Text>
                    </View>
                    <View style={styles.bulletRow}>
                      <Text style={styles.bulletMarker}>•</Text>
                      <Text style={styles.bulletLine}>
                        <Text style={styles.bulletLead}>Echo Map + micro-practices</Text> —{`\n`}see patterns and shift them
                      </Text>
                    </View>
                    <View style={styles.bulletRow}>
                      <Text style={styles.bulletMarker}>•</Text>
                      <Text style={styles.bulletLine}>
                        <Text style={styles.bulletLead}>Private Echo Vault (50 GB)</Text> —{`\n`}your memories, your story
                      </Text>
                    </View>
                  </View>

                  <LinearGradient
                      colors={['#F2E2B1', '#CFA64F']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.DividerLine}
                    />

                  <View style={styles.priceLine}>
                    <Text style={styles.priceAmount}>$15.99</Text>
                    <Text style={styles.pricePerMonth}> /month </Text>
                    <View style={styles.priceOrContainer}>
                      <Text style={styles.priceOr}> or </Text>
                    </View>
                    <Text style={styles.priceYearAmount}> $139</Text>
                    <Text style={styles.priceYearSuffix}> /year</Text>
                  </View>

                  <TouchableOpacity
                    accessibilityRole="button"
                    activeOpacity={0.85}
                    onPress={handleButtonPress}
                    disabled={loading || purchasing || hasActiveSubscription}
                  >
                    <LinearGradient
                      colors={['rgba(253, 253, 249, 0.03)', 'rgba(253, 253, 249, 0.20)']}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      style={styles.ctaButton}
                    >
                      {(loading || purchasing) ? (
                        <ActivityIndicator color="#F2E2B1" />
                      ) : (
                        <Text style={styles.ctaButtonText}>{buttonText}</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <Text style={styles.cancelText}>Cancel anytime.</Text>
                </View>
              </View>

              <View style={styles.footerLinksRow}>
                <Text style={styles.footerLinkText}>Terms</Text>
                <Text style={styles.footerLinkText}>·</Text>
                <Text style={styles.footerLinkText}>Privacy</Text>
                <Text style={styles.footerLinkText}>·</Text>
                <Text style={styles.footerLinkText}>Restore Purchase</Text>
              </View>
            </View>
          </View>
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
  outerBoxContainer: ViewStyle;
  outerBox: ViewStyle;
  headerRow: ViewStyle;
  backButton: ViewStyle;
  backArrow: ImageStyle;
  titleContainer: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  innerBox: ViewStyle;
  cardWrapper: ViewStyle;
  cardGradient: ViewStyle;
  cardContent: ViewStyle;
  cardTitle: TextStyle;
  cardSubtitle: TextStyle;
  starDividerRow: ViewStyle;
  starDividerLine: ViewStyle;
  DividerLine: ViewStyle;
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
  priceRemainder: TextStyle;
  ctaButton: ViewStyle;
  ctaButtonText: TextStyle;
  cancelText: TextStyle;
  footerLinksRow: ViewStyle;
  footerLinkText: TextStyle;
}>(
  {
    bg: {
      flex: 1,
      backgroundColor: '#0B0F1C',
    },
    bgImage: {
      resizeMode: 'cover',
    },
    safe: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    outerBoxContainer: {
      flex: 1,
      paddingHorizontal: outerContainerPaddingHorizontal,
      paddingTop: 20,
      paddingBottom: outerContainerPaddingBottom,
      alignItems: 'center',
    },

    outerBox: {
      width: outerBoxWidth,
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      gap: sectionGap,
      marginTop: 20,
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
      top: 15,
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backArrow: {
      width: 20,
      height: 20,
      resizeMode: 'contain',
      tintColor: '#E5D6B0',
    },

    titleContainer: {
      alignItems: 'center',
      paddingTop: 14,
    },
    title: {
      alignSelf: 'stretch',
      color: '#F2E2B1',
      textAlign: 'center',
      textShadowColor: '#F0D4A8',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 16,
      fontFamily: 'CormorantGaramond-Regular',
      fontSize: 32,
      fontStyle: 'normal',
      fontWeight: '400',
      lineHeight: 41.6,
      includeFontPadding: false,
    },
    subtitle: {
      marginTop: 16,
      width: 335,
      maxWidth: '100%',
      alignSelf: 'center',
      fontFamily: 'Inter',
      fontSize: 16,
      fontStyle: 'normal',
      fontWeight: '400',
      lineHeight: 24,
      color: '#FDFDF9',
      textAlign: 'center',
    },

    innerBox: {
      flexDirection: 'column',
      alignItems: 'center',
      gap: sectionGap,
      flexGrow: 1,
      alignSelf: 'stretch',
      paddingHorizontal: innerBoxSidePadding,
      justifyContent: 'flex-start',
    },

    cardWrapper: {
      flex: 1,
      width: cardWidth,
      alignSelf: 'center',
      padding: 20,
      borderRadius: 13,
      borderWidth: 0.25,
      borderColor: '#9BAAC2',
      backgroundColor: 'transparent',
      shadowColor: 'rgba(163, 179, 204, 0.30)',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 25,
    },
    cardGradient: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 13,
    },
    cardContent: {
      alignItems: 'center',
      flexGrow: 1,
      justifyContent: 'center',
      gap: 12,
    },

    cardTitle: {
      fontFamily: 'CormorantGaramond-Regular',
      width: 194,
      maxWidth: '100%',
      alignSelf: 'center',
      fontSize: 32,
      fontWeight: '400',
      lineHeight: 41.6,
      color: '#F2E2B1',
      textAlign: 'center',
      includeFontPadding: false,
    },
    cardSubtitle: {
      alignSelf: 'stretch',
      color: '#FDFDF9',
      textAlign: 'center',
      fontFamily: 'CormorantGaramond-Regular',
      fontSize: 20,
      fontStyle: 'normal',
      fontWeight: '400',
      lineHeight: 26,
      includeFontPadding: false,
    },

    starDividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      marginTop: 6,
      marginBottom: 6,
      alignSelf: 'stretch',
    },
    starDividerLine: {
      width: 73,
      height: 0.5,
      borderRadius: 1,
    },

    DividerLine: {
      width: 235,
      height: 0.5,
      borderRadius: 1,
    },

    bullets: {
      alignSelf: 'stretch',
      gap: 10,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      alignSelf: 'stretch',
    },
    bulletMarker: {
      fontFamily: 'Inter',
      fontSize: 16,
      fontStyle: 'normal',
      fontWeight: '300',
      lineHeight: 24,
      color: '#FDFDF9',
      includeFontPadding: false,
      marginRight: 10,
    },
    bulletLine: {
      fontFamily: 'Inter',
      fontSize: 16,
      fontStyle: 'normal',
      fontWeight: '300',
      lineHeight: 24,
      color: '#FDFDF9',
      textAlign: 'left',
      flex: 1,
      includeFontPadding: false,
    },
    bulletLead: {
      fontWeight: '400',
      color: '#FDFDF9',
    },

    priceLine: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'flex-end',
      marginTop: 8,
      marginBottom: 4,
    },
    priceAmount: {
      color: '#FDFDF9',
      textAlign: 'center',
      fontFamily: 'CormorantGaramond-Regular',
      fontSize: 24,
      fontStyle: 'normal',
      fontWeight: '400',
      lineHeight: 31.2,
      includeFontPadding: false,
    },
    pricePerMonth: {
      width: 65,
      color: '#FDFDF9',
      textAlign: 'center',
      fontFamily: 'CormorantGaramond-Regular',
      fontSize: 20,
      fontStyle: 'normal',
      fontWeight: '400',
      lineHeight: 26,
      includeFontPadding: false,
    },
    priceOrContainer: {
      display: 'flex',
      width: 19,
      height: 30,
      flexDirection: 'column',
      justifyContent: 'flex-end',
      flexShrink: 0,
      alignItems: 'center',
    },
    priceOr: {
      color: '#FDFDF9',
      textAlign: 'center',
      fontFamily: 'Inter',
      fontSize: 16,
      fontStyle: 'normal',
      fontWeight: '300',
      lineHeight: 24,
      includeFontPadding: false,
    },
    priceYearAmount: {
      color: '#F2E2B1',
      textAlign: 'center',
      fontFamily: 'CormorantGaramond-Regular',
      fontSize: 24,
      fontStyle: 'normal',
      fontWeight: '400',
      lineHeight: 31.2,
      includeFontPadding: false,
    },
    priceYearSuffix: {
      color: '#F2E2B1',
      textAlign: 'center',
      fontFamily: 'CormorantGaramond-Italic',
      fontSize: 20,
      fontWeight: '400',
      lineHeight: 26,
      includeFontPadding: false,
    },
    priceRemainder: {
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: '300',
      lineHeight: 16,
      color: '#FDFDF9',
      opacity: 0.9,
      includeFontPadding: false,
    },

    ctaButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      borderRadius: 12,
      borderWidth: 0.5,
      borderColor: '#A3B3CC',
      paddingVertical: 12,
      paddingHorizontal: 16,
      width: '100%',
      height: 55,
      shadowColor: '#F2E2B1',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
    },
    ctaButtonText: {
      fontFamily: 'CormorantGaramond-Regular',
      fontSize: 24,
      fontStyle: 'normal',
      fontWeight: '400',
      lineHeight: 31.2,
      color: '#F2E2B1',
      textAlign: 'center',
      textShadowColor: 'rgba(229, 214, 176, 0.50)',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 9,
      includeFontPadding: false,
    },
    cancelText: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontStyle: 'italic',
      fontWeight: '400',
      lineHeight: 19.6,
      color: '#FDFDF9',
      textAlign: 'center',
      opacity: 0.85,
      marginTop: 2,
      includeFontPadding: false,
    },

    footerLinksRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      marginTop: 16,
      paddingBottom: 4,
    },
    footerLinkText: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: '300',
      lineHeight: 19.6,
      color: '#A3B3CC',
      textAlign: 'center',
      includeFontPadding: false,
    },
  },
);
