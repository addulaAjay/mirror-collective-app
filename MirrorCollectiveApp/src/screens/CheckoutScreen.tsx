import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@types';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Checkout'>;

const { width: screenWidth } = Dimensions.get('window');

const DESIGN_WIDTH = 393;
const scale = screenWidth / DESIGN_WIDTH;

const rs = (size: number) => Math.round(size * scale);

// Figma design tokens
const CHECKOUT_COLORS = {
  gold: '#F2E2B1',
  goldGlow: '#F0D4A8',
  white: '#FDFDF9',
  borderSubtle: '#A3B3CC',
  surfaceBg: 'rgba(163, 179, 204, 0.05)',
  iconSubtle: '#A3B3CC',
} as const;

const CARD_GRADIENT = [
  'rgba(253, 253, 249, 0.03)',
  'rgba(253, 253, 249, 0.20)',
];

const BUTTON_GRADIENT = [
  'rgba(253, 253, 249, 0.04)',
  'rgba(253, 253, 249, 0.01)',
];

const CheckoutScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <BackgroundWrapper style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Header */}
          <LogoHeader />

          {/* Header Row: Back Arrow + Title */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Image
                source={require('../assets/back-arrow.png')}
                style={styles.backArrow}
                accessibilityIgnoresInvertColors
              />
            </TouchableOpacity>

            <Text style={styles.title}>CHECKOUT</Text>

            {/* Invisible spacer to center the title */}
            <View style={styles.backButton} />
          </View>

          {/* Main Card */}
          <View style={styles.card}>
            {/* Plan Row */}
            <View style={styles.planSection}>
              <View style={styles.planInfo}>
                <View style={styles.planRow}>
                  <Text style={styles.planName}>Mirror Basic</Text>
                  <Text style={styles.planPrice}>$15.99</Text>
                </View>
                <Text style={styles.billingLabel}>billed monthly</Text>
              </View>

              {/* Edit / Delete text links */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionLink}
                  accessibilityRole="button"
                >
                  <Text style={styles.actionLinkText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionLink}
                  accessibilityRole="button"
                >
                  <Text style={styles.actionLinkText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Total Row */}
            <View style={styles.totalSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalPrice}>$15.99</Text>
              </View>
            </View>

            {/* Add-On Section */}
            <View style={styles.addOnSection}>
              <Text style={styles.addOnTitle}>ADD ON:</Text>

              <View style={styles.addOnRow}>
                <LinearGradient
                  colors={CARD_GRADIENT}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.addOnCard}
                >
                  <Text style={styles.addOnName}>Echo Vault Storage</Text>
                  <Text style={styles.addOnPrice}>$3.99/mo</Text>
                </LinearGradient>

                <TouchableOpacity
                  style={styles.addButton}
                  accessibilityRole="button"
                  accessibilityLabel="Add Echo Vault Storage"
                >
                  <Text style={styles.addButtonIcon}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Proceed to Payment Button */}
          <View style={styles.proceedWrapper}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.proceedContainer}
              accessibilityRole="button"
            >
              <LinearGradient
                colors={BUTTON_GRADIENT}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.proceedText}>PROCEED TO PAYMENT</Text>
            </TouchableOpacity>
          </View>

          {/* Trust Badges */}
          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <View style={styles.badgeIconContainer}>
                <Image
                  source={require('../assets/icon-private.png')}
                  style={styles.badgeIconImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.badgeLabel}>PRIVATE BY{'\n'}DESIGN</Text>
            </View>

            <View style={styles.badge}>
              <View style={styles.badgeIconContainer}>
                <Image
                  source={require('../assets/icon-cancel.png')}
                  style={styles.badgeIconImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.badgeLabel}>CANCEL{'\n'}ANYTIME</Text>
            </View>

            <View style={styles.badge}>
              <View style={styles.badgeIconContainer}>
                <Image
                  source={require('../assets/icon-export.png')}
                  style={styles.badgeIconImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.badgeLabel}>EXPORT{'\n'}YOUR DATA</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: rs(24),
    paddingBottom: rs(40),
    alignItems: 'center',
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: rs(8),
    marginBottom: rs(24),
  },
  backButton: {
    width: rs(40),
    height: rs(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    width: rs(24),
    height: rs(24),
    tintColor: CHECKOUT_COLORS.gold,
  },
  title: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: rs(32),
    fontWeight: '400',
    color: CHECKOUT_COLORS.gold,
    textAlign: 'center',
    textShadowColor: CHECKOUT_COLORS.goldGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
    letterSpacing: 1,
  },

  // Main Card
  card: {
    width: '100%',
    backgroundColor: CHECKOUT_COLORS.surfaceBg,
    borderRadius: 12,
    overflow: 'hidden',
  },

  // Plan Section
  planSection: {
    paddingHorizontal: rs(16),
    paddingVertical: rs(16),
    borderBottomWidth: 0.5,
    borderBottomColor: CHECKOUT_COLORS.borderSubtle,
  },
  planInfo: {
    gap: rs(2),
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: rs(24),
    fontWeight: '400',
    color: CHECKOUT_COLORS.gold,
    textShadowColor: CHECKOUT_COLORS.goldGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
    lineHeight: rs(31),
  },
  planPrice: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: rs(24),
    fontWeight: '400',
    color: CHECKOUT_COLORS.white,
    lineHeight: rs(31),
  },
  billingLabel: {
    fontFamily: 'Inter',
    fontSize: rs(14),
    fontWeight: '400',
    color: CHECKOUT_COLORS.white,
    lineHeight: rs(20),
  },

  // Action Links (Edit / Delete) - plain underlined text per Figma
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: rs(16),
    marginTop: rs(8),
    paddingRight: rs(4),
  },
  actionLink: {
    paddingVertical: rs(4),
    paddingHorizontal: rs(4),
  },
  actionLinkText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: rs(20),
    fontWeight: '400',
    color: CHECKOUT_COLORS.gold,
    textAlign: 'center',
    textDecorationLine: 'underline',
    textShadowColor: 'rgba(229, 214, 176, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 9,
  },

  // Divider
  divider: {
    height: 0,
    borderBottomWidth: 0,
  },

  // Total Section
  totalSection: {
    paddingHorizontal: rs(16),
    paddingVertical: rs(16),
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: rs(24),
    fontWeight: '400',
    color: CHECKOUT_COLORS.gold,
    textShadowColor: CHECKOUT_COLORS.goldGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
    lineHeight: rs(31),
  },
  totalPrice: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: rs(24),
    fontWeight: '400',
    color: CHECKOUT_COLORS.white,
    lineHeight: rs(31),
  },

  // Add-On Section
  addOnSection: {
    paddingHorizontal: rs(8),
    paddingTop: rs(20),
    paddingBottom: rs(16),
    gap: rs(8),
  },
  addOnTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: rs(20),
    fontWeight: '400',
    color: CHECKOUT_COLORS.gold,
    textShadowColor: CHECKOUT_COLORS.goldGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
    paddingHorizontal: rs(12),
    lineHeight: rs(26),
  },
  addOnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
  },
  addOnCard: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: rs(12),
    paddingVertical: rs(8),
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: CHECKOUT_COLORS.borderSubtle,
  },
  addOnName: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: rs(20),
    fontWeight: '400',
    color: CHECKOUT_COLORS.white,
    lineHeight: rs(26),
    flex: 1,
  },
  addOnPrice: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: rs(20),
    fontWeight: '400',
    color: CHECKOUT_COLORS.white,
    textAlign: 'center',
    lineHeight: rs(26),
  },
  addButton: {
    width: rs(24),
    height: rs(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonIcon: {
    fontSize: rs(22),
    color: CHECKOUT_COLORS.white,
    fontWeight: '300',
    lineHeight: rs(24),
  },

  // Proceed Button
  proceedWrapper: {
    width: '100%',
    marginTop: rs(24),
    borderRadius: 12,
  },
  proceedContainer: {
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: CHECKOUT_COLORS.borderSubtle,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(14),
    paddingHorizontal: rs(16),
  },
  proceedText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: rs(24),
    fontWeight: '400',
    color: CHECKOUT_COLORS.gold,
    textAlign: 'center',
    textShadowColor: 'rgba(229, 214, 176, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 9,
    letterSpacing: 1,
  },

  // Trust Badges
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: rs(32),
    marginTop: rs(24),
  },
  badge: {
    width: rs(80),
    backgroundColor: CHECKOUT_COLORS.surfaceBg,
    borderRadius: 12,
    paddingVertical: rs(8),
    alignItems: 'center',
    gap: rs(8),
  },
  badgeIconContainer: {
    width: rs(28),
    height: rs(28),
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeIconImage: {
    width: rs(24),
    height: rs(24),
    tintColor: CHECKOUT_COLORS.iconSubtle,
  },
  badgeLabel: {
    fontFamily: 'Inter',
    fontSize: rs(12),
    fontWeight: '400',
    color: CHECKOUT_COLORS.iconSubtle,
    textAlign: 'center',
    lineHeight: rs(16),
  },
});

export default CheckoutScreen;
