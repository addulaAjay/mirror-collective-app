/**
 * Reflection Room — Practice Complete (§12.10 complete state).
 *
 * Refined to match Figma node 7128:8153 (Mirror Moment - Practice Completion):
 *   - Title row: back arrow + centered "PRACTICE COMPLETE" heading
 *     (Cormorant Garamond 28 / lineHeight 32, gold, glow shadow).
 *   - Decorative echo-signature waveform + glowing focal dot (the same curve
 *     used on the Mirror Moment screen).
 *   - Body confirmation copy (Inter 16 / 24, Text/Paragraph-2 = #fdfdf9).
 *   - Glass CTA(s): Transparent White Gradient fill, 0.5px Border/Subtle
 *     (#a3b3cc), Radius/M (16), Spacing M/S padding, gold Cormorant 24 uppercase.
 *
 * Renders the canonical PRACTICE COMPLETE confirmation + the three post-
 * completion CTAs from §12.10:
 *   - Back to Reflection Room
 *   - Back Home
 *   - View Updated Echo Map (optional)
 *
 * The cached snapshot has already been refreshed by
 * ReflectionRoomPracticeOverlayScreen via setSnapshot() before navigating
 * here, so subsequent screens (Echo Signature, Echo Map, Mirror Moment)
 * see the new state without re-fetching.
 */

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import { MIRROR_MOMENT } from '@features/reflection-room/copy/strings';
import {
  borderWidth,
  fontFamily,
  fontSize,
  glassGradient,
  lineHeight,
  palette,
  radius,
  spacing,
  textShadow,
} from '@theme';
import type { RootStackParamList } from '@types';


type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: screenWidth } = Dimensions.get('window');

// Decorative echo-signature curve (Figma node 7128:8487). Identical to the
// Mirror Moment screen's waveform so the two states read as one continuous
// visual language. Rendered as a single vector path so it scales cleanly.
const WAVE_SVG = `<svg width="345" height="161" viewBox="0 0 345 161" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 138.379C11.8463 139.798 24.4967 139.249 35.2048 130.353C37.9302 128.097 40.5302 125.159 42.7125 121.721C43.6367 120.432 44.4198 118.947 45.1403 117.405C47.26 112.563 48.5287 106.942 50.0166 101.51L61.8316 57.2224C65.9614 42.4436 69.5221 27.3037 75.4949 13.9281C78.6431 7.1172 83.3941 2.22649 88.7091 0.765835C96.5248 -1.58105 105.103 1.43872 110.929 10.2026C123.428 29.1172 126.404 62.5563 131.625 87.5761C133.954 98.695 136.277 110.298 141.55 118.767C145.027 124.347 149.862 126.152 154.707 124.347C155.934 123.977 157.197 123.534 158.518 123.239C162.544 122.164 166.767 124.035 170.109 127.67C174.609 132.315 177.152 140.258 179.12 147.734C180.112 151.024 180.854 154.807 182.801 156.883C186.821 160.289 191.045 149.924 193.123 145.452C201.941 125.553 211.84 87.8879 228.907 84.6958C234.264 83.8506 239.829 86.1482 243.964 91.5231C249.143 97.9811 252.135 107.582 254.652 116.879C257.46 125.61 263.673 129.73 269.322 132.585C274.126 134.899 279.127 136.171 284.108 137.222C304.235 141.399 324.758 140.077 345 138.371C321.61 141.522 282.521 147.545 261.449 131.158C257.915 128.22 254.547 124.117 252.772 118.315C252.187 116.387 251.749 114.59 251.211 112.793C249.175 105.752 246.502 98.9412 242.664 94.0915C238.89 89.1844 233.909 87.2232 229.126 87.9617C216.946 90.3579 208.994 111.767 202.928 126.825C200.27 133.628 197.748 140.594 194.851 147.307C192.084 153.387 187.369 164.449 181.736 159.706C179.324 157.326 178.311 152.846 177.209 149.038C174.614 138.896 171.158 129.869 164.094 126.841C161.108 125.586 158.283 126.529 155.114 127.563C147.909 130.189 141.723 125.783 137.509 116.338C124.76 87.4858 125.558 29.9706 106.664 9.04559C99.7879 1.80798 89.4557 1.20075 82.4074 8.06909C76.1475 14.6338 73.1454 26.1467 69.8823 36.5518C63.7686 57.5014 57.7541 81.6104 51.9693 102.806C49.8235 110.093 47.8813 118.225 43.8455 123.551C42.0077 126.308 39.7366 128.77 37.5438 130.764C26.1883 140.611 12.5825 140.758 0.0156628 138.371L0 138.379Z" fill="${palette.gold.warm}"/>
</svg>`;

const WAVE_WIDTH = Math.min(345, screenWidth * 0.88);
const WAVE_HEIGHT = 160;

const GLASS_GRADIENT = [
  glassGradient.button.start, // Figma: Transparent White Gradient 4%
  glassGradient.button.end, //   → 1%
];

interface CtaProps {
  label: string;
  onPress: () => void;
  testID?: string;
}

/**
 * Glass CTA matching Figma "Component 9" (node I7128:8490;125:342):
 * Transparent White Gradient fill, 0.5px Border/Subtle, Radius/M,
 * Spacing M/S padding, gold Cormorant uppercase label with glow.
 */
const GlassCta: React.FC<CtaProps> = ({ label, onPress, testID }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    testID={testID}
    style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
  >
    <LinearGradient
      colors={GLASS_GRADIENT}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
    <Text style={styles.ctaText}>{label}</Text>
  </Pressable>
);

const ReflectionRoomPracticeCompleteScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <BackgroundWrapper style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Title row — back arrow + centered heading (Figma node 7128:8482) */}
          <View style={styles.titleRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel={MIRROR_MOMENT.backNav}
              hitSlop={8}
              style={styles.iconButton}
            >
              <Image
                source={require('@assets/back-arrow.png')}
                style={styles.iconImg}
                resizeMode="contain"
              />
            </Pressable>
            <Text
              style={styles.eyebrow}
              accessibilityRole="header"
              accessibilityLabel={MIRROR_MOMENT.completeHeader}
            >
              {MIRROR_MOMENT.completeHeader}
            </Text>
            {/* Spacer to keep the heading optically centered against the arrow */}
            <View style={styles.iconButton} />
          </View>

          {/* Decorative echo-signature waveform + glowing focal dot */}
          <View style={styles.waveContainer} accessibilityElementsHidden>
            <SvgXml xml={WAVE_SVG} width={WAVE_WIDTH} height={WAVE_HEIGHT} />
            <View style={styles.waveGlowDot} pointerEvents="none" />
          </View>

          <Text style={styles.body}>{MIRROR_MOMENT.completeBody}</Text>

          <View style={styles.ctaStack}>
            <GlassCta
              label={MIRROR_MOMENT.postCompleteCtas.backToReflectionRoom}
              onPress={() => navigation.navigate('ReflectionRoom')}
            />
            <GlassCta
              label={MIRROR_MOMENT.postCompleteCtas.backHome}
              onPress={() => navigation.navigate('EnterMirror')}
            />
            <GlassCta
              label={MIRROR_MOMENT.postCompleteCtas.viewUpdatedEchoMap}
              onPress={() => navigation.navigate('ReflectionRoomEchoMap')}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default ReflectionRoomPracticeCompleteScreen;

const ICON_BUTTON_SIZE = 40;

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.xl,
    gap: spacing.xl,
    flexGrow: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.s,
  },
  iconButton: {
    width: ICON_BUTTON_SIZE,
    height: ICON_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImg: { width: 20, height: 20, tintColor: palette.gold.DEFAULT },
  eyebrow: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['2xl'], // Figma: font/size/2XL (28)
    lineHeight: lineHeight.xl, // Figma: font/line-height/XL (32)
    color: palette.gold.DEFAULT, // Figma: Text/Paragraph-1 (#f2e1b0)
    textAlign: 'center',
    letterSpacing: 2,
    flex: 1,
    textShadowColor: textShadow.glow.color,
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: textShadow.glow.radius,
  },
  waveContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.s,
  },
  // Glowing focal dot on the waveform (Figma node 7128:8488 ellipse, 15×15).
  waveGlowDot: {
    position: 'absolute',
    width: 15,
    height: 15,
    borderRadius: radius.full,
    backgroundColor: palette.gold.subtlest,
    shadowColor: palette.gold.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 6,
  },
  body: {
    fontFamily: fontFamily.body, // Figma: font/family/Body (Inter)
    fontSize: fontSize.s, // Figma: font/size/S (16)
    lineHeight: lineHeight.m, // Figma: font/line-height/M (24)
    color: palette.gold.subtlest, // Figma: Text/Paragraph-2 (#fdfdf9)
    textAlign: 'center',
    paddingHorizontal: spacing.s,
  },
  ctaStack: {
    width: '100%',
    alignItems: 'stretch',
    gap: spacing.s,
    marginTop: spacing.s,
  },
  // Figma "Component 9" (node 7128:8490): full-width (332 within the 345 frame),
  // 52px tall, Radius/M, 0.5px Border/Subtle, glass gradient fill.
  cta: {
    alignSelf: 'stretch',
    minHeight: 52,
    paddingVertical: spacing.s, // Figma: Spacing/S (12)
    paddingHorizontal: spacing.m, // Figma: Spacing/M (16)
    borderRadius: radius.m, // Figma: Radius/M (16)
    borderWidth: borderWidth.thin, // Figma: 0.5px
    borderColor: palette.navy.light, // Figma: Border/Subtle (#a3b3cc)
    backgroundColor: palette.neutral.transparent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: palette.gold.warm,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25, // Figma: shadow rgba(242,226,177,0.25) blur 16
    shadowRadius: 16,
    elevation: 6,
  },
  ctaText: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xl, // Figma: font/size/XL (24)
    lineHeight: fontSize['2xl'], // Figma: lineHeight 28
    color: palette.gold.DEFAULT,
    letterSpacing: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
    textShadowColor: textShadow.warmGlow.color,
    textShadowOffset: textShadow.warmGlow.offset,
    textShadowRadius: textShadow.warmGlow.radius,
  },
  pressed: { opacity: 0.7 },
});
