import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  palette,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  textShadow,
  spacing,
  semantic,
  scale,
  verticalScale,
  moderateScale,
} from '@theme';
import type { RootStackParamList } from '@types';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthenticatedRoute from '@components/AuthenticatedRoute';
import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EnterMirror'>;
};

const EnterMirrorScreen: React.FC<Props> = ({ navigation }) => {
  const handleEnter = () => {
    navigation.navigate('AppVideo');
  };

  return (
    <AuthenticatedRoute>
      {/*
        scrollable — no keyboard on this screen; avoids TouchableWithoutFeedback
        intercepting the tap on the ENTER button.
      */}
      <BackgroundWrapper style={styles.bg} scrollable>
        <SafeAreaView style={styles.safe}>
          <LogoHeader />

          {/*
            Figma node 203:2943 — content column
            left:24, top:196, width:345, gap:40
          */}
          <View style={styles.content}>

            {/* ── Message section — Figma node 203:2944 ─────────────── */}
            {/* Inner gap:40 between heading and body block */}
            <View style={styles.messageSection}>

              {/* Figma: Heading/Heading L (Cormorant), Text/Paragraph-1, Glow Drop Shadow */}
              <Text style={styles.title}>
                YOU'RE IN.{'\n'}THIS IS YOUR SPACE TO GROW.
              </Text>

              {/* Body block — Body M Light (Inter 18px/24px), Text/Paragraph-2 */}
              {/* Gap between body paragraphs via bodySection gap */}
              <View style={styles.bodySection}>
                <Text style={styles.body}>
                  Your reflection is captured.{'\n'}The Mirror is now tuned to you — your patterns, your growth, your progress.
                </Text>
                <Text style={styles.body}>
                  No pressure. No judgment. Just clarity, over time.
                </Text>
                {/* Figma: Body XS Italic — italic span at end of body block */}
                <Text style={styles.bodyItalic}>
                  It's time to step into a journey toward a better you.
                </Text>
              </View>
            </View>

            {/* ── ENTER button — Figma node 1286:1464 ───────────────── */}
            {/* gap:16 between star icons and text */}
            <TouchableOpacity
              style={styles.enterButton}
              onPress={handleEnter}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Enter Mirror"
            >
              <StarIcon width={scale(20)} height={scale(21)} color={palette.gold.DEFAULT} />
              <Text style={styles.enterText}>ENTER</Text>
              <StarIcon width={scale(19)} height={scale(20)} color={palette.gold.DEFAULT} />
            </TouchableOpacity>

          </View>
        </SafeAreaView>
      </BackgroundWrapper>
    </AuthenticatedRoute>
  );
};

export default EnterMirrorScreen;

const styles = StyleSheet.create<{
  bg: ViewStyle;
  safe: ViewStyle;
  content: ViewStyle;
  messageSection: ViewStyle;
  title: TextStyle;
  bodySection: ViewStyle;
  body: TextStyle;
  bodyItalic: TextStyle;
  enterButton: ViewStyle;
  enterText: TextStyle;
}>({
  bg: {
    flex: 1,
    backgroundColor: palette.navy.deep,
  },
  safe: {
    flex: 1,
    backgroundColor: palette.neutral.transparent,
  },

  // ── Content column ───────────────────────────────────────────────────────
  // Figma: left:24, top:196, width:345, gap:40
  // paddingTop pushes past LogoHeader (~60px) to reach ~196px from screen top.
  content: {
    flex: 1,
    paddingHorizontal: scale(spacing.xl),    // 24px — Figma left:24
    paddingTop: verticalScale(80),           // ~196px from top after safe area + header
    paddingBottom: verticalScale(spacing.xxxl),
    gap: verticalScale(spacing.xxxl),        // 40px — Figma gap:40 between sections
  },

  // ── Message section ──────────────────────────────────────────────────────
  // gap:40 between title and body block
  messageSection: {
    gap: verticalScale(spacing.xxxl),        // 40px — Figma gap:40
  },

  // ── Title — Figma: Heading/Heading L (Cormorant) ─────────────────────────
  // font/family/Heading, font/weight/regular, font/size/3XL (32), font/line-height/XXL (40)
  // colour: Text/Paragraph-1 (#f2e2b1), shadow: Glow Drop Shadow
  title: {
    fontFamily: fontFamily.heading,                       // CormorantGaramond-Regular
    fontSize: moderateScale(fontSize['3xl']),             // 32px
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.xxl,                           // 40px
    color: palette.gold.DEFAULT,                          // Text/Paragraph-1 (#f2e2b1)
    textAlign: 'center',
    textShadowColor: palette.gold.warm,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  // ── Body paragraphs ───────────────────────────────────────────────────────
  // gap between paragraphs (blank-line equivalent from Figma &nbsp; rows)
  bodySection: {
    gap: verticalScale(spacing.m),           // 16px paragraph spacing
  },

  // Figma: Body M/Body M Light — Inter Light 18px / lineHeight 24px
  // colour: Text/Paragraph-2 (#fdfdf9)
  body: {
    ...semantic.typography.styles.body,      // Inter Regular 16px base — override size below
    fontFamily: fontFamily.bodyLight,        // Inter18pt-Light (Figma: font/weight/light)
    fontSize: moderateScale(fontSize.m),     // 18px — Figma font/size/M
    lineHeight: moderateScale(fontSize.l),   // 24px — Figma font/size/XL
    color: palette.gold.subtlest,            // Text/Paragraph-2 (#fdfdf9)
    textAlign: 'center',
  },

  // Figma: Body XS Italic — italic closing line
  bodyItalic: {
    ...semantic.typography.styles.bodyItalic, // Inter Italic — fontStyle:'italic' included
    fontFamily: fontFamily.bodyItalic,         // Inter18pt-Italic
    fontSize: moderateScale(fontSize.m),       // 18px — match body size
    lineHeight: moderateScale(fontSize.l),     // 24px
    color: palette.gold.subtlest,              // Text/Paragraph-2 (#fdfdf9)
    textAlign: 'center',
  },

  // ── ENTER button — Figma node 1286:1464 ──────────────────────────────────
  // flexDirection row, gap:16, items-center, justify-center
  enterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(spacing.m),                   // 16px — Figma gap:16
  },

  // Figma: Heading/Heading L (Cormorant), Text/Paragraph-1
  // text-shadow: rgba(229,214,176,0.5) radius:4 → textShadow.warmGlow
  enterText: {
    fontFamily: fontFamily.heading,                       // CormorantGaramond-Regular
    fontSize: moderateScale(fontSize['3xl']),             // 32px
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.xxl,                           // 40px
    color: palette.gold.DEFAULT,                          // Text/Paragraph-1 (#f2e2b1)
    textTransform: 'uppercase',
    textShadowColor: textShadow.warmGlow.color,           // rgba(229,214,176,0.5)
    textShadowOffset: textShadow.warmGlow.offset,
    textShadowRadius: textShadow.warmGlow.radius,         // 9px (Figma:4 — warmGlow is closest token)
  },
});
