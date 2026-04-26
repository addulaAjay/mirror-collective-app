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
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthenticatedRoute from '@components/AuthenticatedRoute';
import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button';
import LogoHeader from '@components/LogoHeader';

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
                  Your reflections are captured.{'\n'}The Mirror now understands your patterns — and evolves with you.
                </Text>
                <Text style={styles.body}>
                  No pressure. No judgment.
                </Text>
                {/* Figma: Body XS Italic — italic span at end of body block */}
                <Text style={styles.bodyItalic}>
                  Just clarity, over time.{'\n'}This is where things start to change.
                </Text>
              </View>
            </View>

            {/* ── ENTER button — Figma node 1286:1464 (auth-CTA pattern) ── */}
            <Button
              variant="auth"
              title="ENTER"
              onPress={handleEnter}
            />

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
    textShadowColor: textShadow.glowSubtle.color,
    textShadowOffset: textShadow.glowSubtle.offset,
    textShadowRadius: textShadow.glowSubtle.radius,
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
});
