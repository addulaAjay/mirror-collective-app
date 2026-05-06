import React from 'react';
import {
  palette,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  scale,
  verticalScale,
  moderateScale,
  textShadow,
  spacing,
} from '@theme';
import {
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import GoldenHandHeartSvg from '@assets/pledge/golden-hand-heart.svg';
import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';

const ILLUSTRATION_WIDTH  = scale(240);
const ILLUSTRATION_HEIGHT = verticalScale(280);

const TheMirrorPledgeCommingsoonScreen: React.FC = () => {
  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />

        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>THE MIRROR PLEDGE</Text>

          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <GoldenHandHeartSvg
              testID="pledge-illustration"
              width={ILLUSTRATION_WIDTH}
              height={ILLUSTRATION_HEIGHT}
            />
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              2% of your subscription is added to the Mirror Giving Pool. Each quarter, the collective votes on causes to support— and we show you exactly where it goes.
            </Text>
          </View>

          <View style={styles.spacer} />

          {/* Coming soon footer */}
          <View style={styles.footerContainer}>
            <StarIcon width={scale(20)} height={scale(20)} color={palette.gold.DEFAULT} />
            <Text style={styles.footerText}>COMING SOON</Text>
            <StarIcon width={scale(20)} height={scale(20)} color={palette.gold.DEFAULT} />
          </View>
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default TheMirrorPledgeCommingsoonScreen;

const styles = StyleSheet.create<{
  bg: ViewStyle;
  bgImage: ImageStyle;
  safe: ViewStyle;
  content: ViewStyle;
  title: TextStyle;
  illustrationContainer: ViewStyle;
  descriptionContainer: ViewStyle;
  description: TextStyle;
  spacer: ViewStyle;
  footerContainer: ViewStyle;
  footerText: TextStyle;
}>({
  bg: {
    flex: 1,
    backgroundColor: palette.navy.deep,
  },
  bgImage: {
    resizeMode: 'cover',
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
    width: '100%',
  },

  content: {
    flex: 1,
    width: '100%',
    maxWidth: scale(345),
    alignSelf: 'center',
    paddingHorizontal: scale(spacing.xl),
    paddingTop: verticalScale(spacing.xxl),
    paddingBottom: verticalScale(spacing.xl),
    alignItems: 'center',
    gap: verticalScale(spacing.xl),
  },

  title: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize['2xl']),
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.xl,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: textShadow.glow.color,
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: textShadow.glow.radius,
  },

  illustrationContainer: {
    width: ILLUSTRATION_WIDTH,
    height: ILLUSTRATION_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },

  descriptionContainer: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  description: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.s),
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.m,
    color: palette.neutral.white,
    textAlign: 'center',
  },

  spacer: { flex: 1 },

  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(spacing.m),
  },
  footerText: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize.xl),
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.l,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    textShadowColor: textShadow.warmGlow.color,
    textShadowOffset: textShadow.warmGlow.offset,
    textShadowRadius: textShadow.warmGlow.radius,
  },
});
