import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  palette,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  textShadow,
  scale,
  verticalScale,
  spacing,
} from '@theme';
import type { RootStackParamList } from '@types';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button';
import LogoHeader from '@components/LogoHeader';

/**
 * Screen 2: Echo Ledger
 * Figma reference: Design-Master-File node 2169:3346
 *
 * Layout (top → bottom):
 *   1. Title "ECHO LEDGER" — Heading M (Cormorant 28/32, gold.DEFAULT)
 *   2. Gold circular ring (~280px) containing:
 *        - "$88K" large hero number (Cormorant, white/cream)
 *        - "across causes supported by the Mirror community"
 *          (Body S Italic, Inverse Paragraph-2 #a3b3cc)
 *   3. Body S paragraph (Inter 16/24, gold.subtlest)
 *   4. "PLEDGE SUPPORT" Primary L button
 */

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'EchoLedger'>;

const RING_SIZE = scale(280);
const RING_BORDER = 2;

const EchoLedgerScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <BackgroundWrapper style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>ECHO LEDGER</Text>

          <View testID="circular-badge" style={styles.ring}>
            <Text style={styles.amount}>$88K</Text>
            <Text style={styles.amountSubline}>
              across causes supported by{'\n'}the Mirror community
            </Text>
          </View>

          <Text style={styles.body}>
            This is what collective reflection can do. Small acts. Shared
            intention. Real-world impact. Updated live. Accountable always.
          </Text>

          <Button
            variant="primary"
            size="L"
            active
            title="PLEDGE SUPPORT"
            onPress={() => navigation.navigate('ViewAllCauses')}
          />
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create<{
  bg: ViewStyle;
  safe: ViewStyle;
  scrollContent: ViewStyle;
  title: TextStyle;
  ring: ViewStyle;
  amount: TextStyle;
  amountSubline: TextStyle;
  body: TextStyle;
}>({
  bg: { flex: 1 },
  safe: { flex: 1, backgroundColor: palette.neutral.transparent },
  // Figma node 2169:3346 frame margins — left/right 24, top 20px below
  // LogoHeader bottom. Section gap 24 (tight rhythm because the ring
  // already consumes most of the vertical space).
  scrollContent: {
    paddingHorizontal: scale(spacing.xl),     // 24 — matches Intro frame margin
    paddingTop: verticalScale(spacing.l),     // 20 — title sits close to logo header
    paddingBottom: verticalScale(spacing.xxxl), // 40
    alignItems: 'center',
    gap: verticalScale(spacing.xl),           // 24 — title→ring→body→button rhythm
  },

  // Figma: Heading M (Cormorant) — 28px / 32 lh, gold.DEFAULT, Glow Drop Shadow
  title: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['2xl'],
    lineHeight: lineHeight.xl,
    fontWeight: fontWeight.regular,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    textShadowColor: textShadow.glow.color,
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: textShadow.glow.radius,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },

  // Figma: gold circular outline, ~280px, content centered
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_BORDER,
    borderColor: palette.gold.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.l,
    // Subtle gold glow around the ring
    shadowColor: palette.gold.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },

  // Figma: $88K hero — large Cormorant, near-white/cream so it pops on dark bg
  amount: {
    fontFamily: fontFamily.heading,
    fontSize: scale(72),
    fontWeight: fontWeight.regular,
    color: palette.gold.subtlest,
    textAlign: 'center',
    letterSpacing: 0,
  },

  // Figma: Body S Italic — 16px Inter Italic / 24 lh, Inverse Paragraph-2 (#a3b3cc)
  amountSubline: {
    fontFamily: fontFamily.bodyItalic,
    fontStyle: 'italic',
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    fontWeight: fontWeight.regular,
    color: palette.navy.light,
    textAlign: 'center',
    marginTop: verticalScale(spacing.xs),
  },

  // Figma: Body S — Inter Regular 16px / 24 lh, gold.subtlest, full-width
  // (no inner padding — text fills the 345px content area).
  body: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    fontWeight: fontWeight.regular,
    color: palette.gold.subtlest,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
});

export default EchoLedgerScreen;
