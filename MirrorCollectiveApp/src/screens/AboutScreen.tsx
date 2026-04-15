import { useFocusEffect } from '@react-navigation/native';
import {
  palette,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  textShadow,
  spacing,
  radius,
  borderWidth,
  scale,
  verticalScale,
  moderateScale,
} from '@theme';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Video from 'react-native-video';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';

const VIDEO_URL =
  'https://mirror-app-video.s3.us-east-1.amazonaws.com/Mirror+App+Explainer+Video.mp4';

const AboutScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [paused, setPaused] = useState(false);
  const videoRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      setPaused(false);
      return () => setPaused(true);
    }, []),
  );

  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />
        <View style={styles.container}>

          {/* Title Row */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>OUR STORY</Text>
          </View>

          {/* Video */}
          <View style={styles.videoContainer}>
            {isLoading && !hasError && (
              <ActivityIndicator
                style={StyleSheet.absoluteFill}
                size="large"
                color={palette.gold.warm}
              />
            )}
            {hasError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Unable to load video.</Text>
              </View>
            ) : (
              <Video
                ref={videoRef}
                source={{ uri: VIDEO_URL }}
                style={styles.video}
                resizeMode="contain"
                controls
                paused={paused}
                onLoad={() => setIsLoading(false)}
                onError={() => { setIsLoading(false); setHasError(true); }}
              />
            )}
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              We look at the world differently.{'\n'}Where others build machines to make us{'\n'}faster, we built one to help us remember.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default AboutScreen;

const styles = StyleSheet.create<{
  bg: ViewStyle;
  bgImage: ImageStyle;
  safe: ViewStyle;
  container: ViewStyle;
  titleRow: ViewStyle;
  title: TextStyle;
  videoContainer: ViewStyle;
  video: ViewStyle;
  errorContainer: ViewStyle;
  errorText: TextStyle;
  descriptionContainer: ViewStyle;
  description: TextStyle;
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
    backgroundColor: palette.neutral.transparent,
    alignItems: 'center',
    width: '100%',
  },
  container: {
    flex: 1,
    paddingHorizontal: scale(spacing.xl),         // 24px
    paddingBottom: verticalScale(spacing.xxxl),   // 40px
    alignItems: 'center',
    width: '100%',
  },

  // ── Title row ──────────────────────────────────────────────────────────────
  titleRow: {
    width: '100%',
    alignItems: 'center',
    marginTop: verticalScale(spacing.xxxl),       // 40px from LogoHeader
    marginBottom: verticalScale(spacing.xl),      // 24px — Figma gap to video
  },

  // Heading L — Cormorant Light 32px, gold, letter-spaced, warm glow shadow
  title: {
    fontFamily: fontFamily.headingLight,
    fontSize: moderateScale(fontSize['3xl']),      // 32px
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.xxl,                    // 40px
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    letterSpacing: 4,
    textShadowColor: textShadow.warmGlow.color,
    textShadowOffset: textShadow.warmGlow.offset,
    textShadowRadius: textShadow.warmGlow.radius,
  },

  // ── Video container ────────────────────────────────────────────────────────
  videoContainer: {
    flex: 1,
    width: '100%',
    borderRadius: radius.m,                       // 16px
    overflow: 'hidden',
    borderWidth: borderWidth.hairline,            // 0.25px
    borderColor: palette.navy.muted,
    backgroundColor: palette.neutral.black,
    shadowColor: palette.neutral.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(12),
    elevation: 8,
  },
  video: {
    flex: 1,
    width: '100%',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Body XS Italic — Inter Italic 16px, gold @ low opacity
  errorText: {
    fontFamily: fontFamily.bodyItalic,
    fontSize: moderateScale(fontSize.s),          // 16px
    fontWeight: fontWeight.light,
    color: palette.gold.DEFAULT,
    opacity: 0.7,
  },

  // ── Description ────────────────────────────────────────────────────────────
  descriptionContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: verticalScale(spacing.xl),          // 24px — Figma gap from video
  },

  // Body M Light — Inter Light 16px / lineHeight 24px, gold subtlest
  description: {
    fontFamily: fontFamily.bodyLight,
    fontSize: moderateScale(fontSize.s),          // 16px
    fontWeight: fontWeight.light,
    lineHeight: lineHeight.m,                     // 24px
    color: palette.gold.subtlest,
    textAlign: 'center',
  },
});
