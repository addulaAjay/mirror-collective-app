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
  radius,
} from '@theme';
import type { RootStackParamList } from '@types';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import GlassCard from '@components/_internal/GlassCard';
import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';
import { updatePledgeAcceptance } from '@services/api/user';

/**
 * Screen 5: Pledge Thank You / Vote Confirmation
 * Figma reference: Design-Master-File node 2185:3605
 *
 * GlassCard centered on screen with:
 *   - "THANK YOU!" headline (Heading M Cormorant 28/32, gold.DEFAULT)
 *   - "Your echo has been counted." (Cormorant italic)
 *   - "Together, we decide where to make a difference." (Body S Italic, gold.subtlest)
 *   - StarIcon at bottom of card
 * Below card: "HOMEPAGE" Primary L button.
 */

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PledgeThankYou'>;

const STAR_SIZE = scale(40);

const PledgeThankYouScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoToHomepage = async () => {
    setIsLoading(true);
    try {
      await updatePledgeAcceptance();
    } catch (error) {
      console.error('Error saving pledge acceptance:', error);
      // Pledge acceptance can be retried later — proceed to home regardless.
    } finally {
      setIsLoading(false);
      navigation.reset({ index: 0, routes: [{ name: 'MirrorChat' }] });
    }
  };

  return (
    <BackgroundWrapper style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View testID="thank-you-card" style={styles.cardWrap}>
            <GlassCard
              borderRadius={radius.s}
              padding={spacing.l}
              style={styles.card}
            >
              <Text style={styles.title}>THANK YOU!</Text>
              <Text style={styles.headline}>Your echo has been counted.</Text>
              <Text style={styles.tagline}>
                Together, we decide where to make a difference.
              </Text>
              <View style={styles.starWrap}>
                <StarIcon
                  testID="star-icon"
                  width={STAR_SIZE}
                  height={STAR_SIZE}
                />
              </View>
            </GlassCard>
          </View>

          <Button
            variant="primary"
            size="L"
            active
            title="HOMEPAGE"
            onPress={handleGoToHomepage}
            disabled={isLoading}
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
  cardWrap: ViewStyle;
  card: ViewStyle;
  title: TextStyle;
  headline: TextStyle;
  tagline: TextStyle;
  starWrap: ViewStyle;
}>({
  bg: { flex: 1 },
  safe: { flex: 1, backgroundColor: palette.neutral.transparent },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: scale(spacing.l),
    paddingBottom: verticalScale(spacing.xl),
    justifyContent: 'center',
    gap: verticalScale(spacing.l),
  },

  cardWrap: {
    alignItems: 'center',
  },
  card: {
    width: '100%',
    alignItems: 'center',
    gap: verticalScale(spacing.s),
  },

  // Figma: Heading M (Cormorant) — 28px / 32 lh, gold.DEFAULT
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
    letterSpacing: 0,
  },

  // Figma: Cormorant Italic, ~Heading S size, gold.DEFAULT
  headline: {
    fontFamily: fontFamily.headingItalic,
    fontStyle: 'italic',
    fontSize: fontSize.xl,
    lineHeight: fontSize['2xl'],
    fontWeight: fontWeight.regular,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
  },

  // Figma: Body S Italic — Inter Italic 16px / 24 lh, gold.subtlest
  tagline: {
    fontFamily: fontFamily.bodyItalic,
    fontStyle: 'italic',
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    fontWeight: fontWeight.regular,
    color: palette.gold.subtlest,
    textAlign: 'center',
  },

  starWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: verticalScale(spacing.xs),
  },
});

export default PledgeThankYouScreen;
