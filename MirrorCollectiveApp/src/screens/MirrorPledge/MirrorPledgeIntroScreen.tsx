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
  type ImageStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import GoldenHandHeartSvg from '@assets/pledge/golden-hand-heart.svg';
import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button';
import LogoHeader from '@components/LogoHeader';

/**
 * Screen 1: Mirror Pledge Introduction
 * Figma reference: https://www.figma.com/design/CKupz8fZOJEx3IQyUsm4ia/Design-Master-File?node-id=2477-1378
 */

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MirrorPledgeIntro'>;

// Figma node 2477:1378 / Frame 527 — Group 16 (hand+heart) is 207×200
const ILLUSTRATION_WIDTH = scale(207);
const ILLUSTRATION_HEIGHT = verticalScale(200);

const MirrorPledgeIntroScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />
        
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Title - matches QuizWelcomeScreen WELCOME styling */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>THE MIRROR PLEDGE</Text>
          </View>

          {/* Golden Hand Holding Heart Illustration */}
          <View style={styles.illustrationContainer}>
            <GoldenHandHeartSvg
              testID="pledge-illustration"
              width={ILLUSTRATION_WIDTH}
              height={ILLUSTRATION_HEIGHT}
            />
          </View>

          {/* Body Text */}
          <View style={styles.textContainer}>
            <Text style={styles.bodyText}>
              2% of your subscription supports causes that matter. Each quarter, the community votes. You see exactly where the impact goes.
            </Text>
          </View>

          {/* CTA Button — Primary L, 252×52 per Figma */}
          <Button
            variant="primary"
            size="L"
            title="SEE HOW IT WORKS"
            onPress={() => navigation.navigate('EchoLedger')}
          />
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create<{
  bg: ViewStyle;
  bgImage: ImageStyle;
  safe: ViewStyle;
  scrollContent: ViewStyle;
  titleContainer: ViewStyle;
  title: TextStyle;
  illustrationContainer: ViewStyle;
  textContainer: ViewStyle;
  bodyText: TextStyle;
}>({
  bg: {
    flex: 1,
  },
  bgImage: {
    resizeMode: 'cover',
  },
  safe: {
    flex: 1,
    backgroundColor: palette.neutral.transparent,
  },
  // Figma Frame 527 — left:24, top:140 (40px below LogoHeader bottom)
  // Frame height 616 is filled with title + 3 gaps of 86.66 + illustration + body + button.
  scrollContent: {
    paddingHorizontal: scale(spacing.xl),     // 24 — Figma frame x:24
    paddingTop: verticalScale(spacing.xxxl),  // 40 — gap between LogoHeader bottom and content top
    paddingBottom: verticalScale(spacing.xxxl),
    alignItems: 'center',
    gap: verticalScale(86),                   // 86.66 — consistent rhythm between every section
  },
  titleContainer: {
    alignItems: 'center',
    width: '100%',
  },
  // Figma: Heading L (Cormorant) — 32px / 40 lh, gold.DEFAULT, Glow Drop Shadow
  title: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['3xl'],     // 32px — Figma: font/size/3XL
    lineHeight: lineHeight.xxl,    // 40px — Figma: font/line-height/XXL
    fontWeight: fontWeight.regular,
    letterSpacing: 0,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    textShadowColor: textShadow.glow.color,
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: textShadow.glow.radius,
    textTransform: 'uppercase',
  },
  illustrationContainer: {
    width: ILLUSTRATION_WIDTH,
    height: ILLUSTRATION_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Figma: body text fills the full 345px content area (no inner padding)
  textContainer: {
    alignSelf: 'stretch',
  },
  // Figma: Body S — Inter Regular 16px / 24 lh, gold.subtlest
  bodyText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.s,          // 16px — Figma: font/size/S
    lineHeight: lineHeight.m,      // 24px — Figma: font/line-height/M
    fontWeight: fontWeight.regular,
    color: palette.gold.subtlest,
    textAlign: 'center',
  },
});

export default MirrorPledgeIntroScreen;
