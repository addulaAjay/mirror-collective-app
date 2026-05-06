import React from 'react';
import {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  moderateScale,
  palette,
  scale,
  textShadow,
  verticalScale,
  spacing,
} from '@theme';
import {
  Image,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';

const ReflectionRoomCommingsoonScreen: React.FC = () => {
  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />

        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>REFLECTION ROOM</Text>

          {/* Layered arch + stairs illustration */}
          <View style={styles.imageContainer}>
            <Image
              source={require('@assets/reflection-room-arch-1.png')}
              style={styles.archLayer1}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <Image
              source={require('@assets/reflection-room-arch-2.png')}
              style={styles.archLayer2}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <Image
              source={require('@assets/reflection-room-stairs.png')}
              style={styles.stairsImage}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <Image
              source={require('@assets/reflection-room-arch-3.png')}
              style={styles.archLayer3}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              This is where your thoughts are held gently, reflected back with care, and allowed to settle knowing.
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

export default ReflectionRoomCommingsoonScreen;

// Illustration layer dimensions — scaled from Figma source values
const ARCH1_W  = scale(263);
const ARCH1_H  = verticalScale(300);
const ARCH2_W  = scale(238);
const ARCH2_H  = verticalScale(282);
const ARCH3_W  = scale(213);
const ARCH3_H  = verticalScale(265);
const STAIR_W  = scale(183);
const STAIR_H  = verticalScale(172);

const styles = StyleSheet.create<{
  bg: ViewStyle; bgImage: ImageStyle; safe: ViewStyle; content: ViewStyle;
  title: TextStyle; imageContainer: ViewStyle;
  archLayer1: ImageStyle; archLayer2: ImageStyle;
  archLayer3: ImageStyle; stairsImage: ImageStyle;
  descriptionContainer: ViewStyle; description: TextStyle;
  spacer: ViewStyle; footerContainer: ViewStyle; footerText: TextStyle;
}>({
  bg:     { flex: 1, backgroundColor: palette.navy.deep },
  bgImage: { resizeMode: 'cover' },
  safe:   { flex: 1, backgroundColor: 'transparent', width: '100%' },

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

  // ── Title ──────────────────────────────────────────────────────────────────
  title: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize['2xl']),
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.xl,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    textShadowColor: textShadow.glow.color,
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: textShadow.glow.radius,
    letterSpacing: 2,
  },

  // ── Layered illustration ────────────────────────────────────────────────────
  imageContainer: {
    width: scale(317),
    height: verticalScale(300),
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  archLayer1: {
    position: 'absolute',
    width: ARCH1_W,
    height: ARCH1_H,
    bottom: 0,
    left: (scale(317) - ARCH1_W) / 2,
  },
  archLayer2: {
    position: 'absolute',
    width: ARCH2_W,
    height: ARCH2_H,
    bottom: 0,
    left: (scale(317) - ARCH2_W) / 2,
  },
  stairsImage: {
    position: 'absolute',
    width: STAIR_W,
    height: STAIR_H,
    bottom: 0,
    left: (scale(317) - STAIR_W) / 2,
  },
  archLayer3: {
    position: 'absolute',
    width: ARCH3_W,
    height: ARCH3_H,
    bottom: 0,
    left: (scale(317) - ARCH3_W) / 2,
  },

  // ── Description ────────────────────────────────────────────────────────────
  descriptionContainer: {
    alignSelf: 'stretch',   // overrides parent's alignItems:'center' so text
    alignItems: 'center',   // gets the full content column width, not the image width
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

  // ── Footer ─────────────────────────────────────────────────────────────────
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
