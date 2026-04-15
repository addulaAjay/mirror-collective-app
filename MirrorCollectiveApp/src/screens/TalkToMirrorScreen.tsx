import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  palette,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  borderWidth,
  textShadow,
  spacing,
  scale,
  verticalScale,
  moderateScale,
} from '@theme';
import type { RootStackParamList } from '@types';
import React from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';
import { useUser } from '@context/UserContext';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TalkToMirror'>;
}

const ARCHETYPE_IMAGE = require('@assets/flamebearer-archetype.png');

// Figma node 2336:3076 — 4 items, 2×2 grid (ECHO MAP removed — not in Figma design)
const MENU_OPTIONS = [
  { label: 'CODE LIBRARY',    route: 'MirrorCodeLibrary' },
  { label: 'MIRROR ECHO',     route: 'MirrorEchoVaultHome' },
  { label: 'REFLECTION ROOM', route: 'ReflectionRoom' },
  { label: 'MIRROR PLEDGE',   route: 'TheMirrorPledge' },
] as const;

const TalkToMirrorScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useUser();
  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Friend';

  const handleTalkPress = () => {
    navigation.navigate('MirrorChat');
  };

  const handleMenuPress = (route: string) => {
    navigation.navigate(route as never);
  };

  return (
    /*
      scrollable — skips TouchableWithoutFeedback so it cannot intercept
      scroll gestures on the inner ScrollView.
    */
    <BackgroundWrapper style={styles.bg} scrollable>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LogoHeader />

        {/*
          Scroll fix: remove flexGrow:1 from contentContainerStyle and flex:1
          from the content View. The ScrollView measures content naturally and
          scrolls when content height > visible height on small devices.
        */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/*
            Figma node 2336:3067 — outer column
            inset 6.11% sides = 24px, gap:55 between sections
          */}
          <View style={styles.content}>

            {/* ── Top: greeting + circular avatar — gap:32 ──────────────── */}
            {/* Figma node 2336:3068: flex-col gap-[32px] items-center */}
            <View style={styles.topSection}>
              {/* Figma node 2336:3070: Cormorant Light Italic 32px, white, Glow Drop Shadow */}
              <Text style={styles.greeting}>Welcome back, {firstName}</Text>

              {/*
                Figma node 3906:487: 180×180 circle
                border: 1px palette.gold.DEFAULT
                shadow: Glow Drop Shadow rgba(240,212,168,0.6) radius:16
                Image inside: h:149.82%, top:-6.74% (crops to face)

                Two-layer approach required because iOS shadow + overflow:hidden
                cannot coexist on the same view:
                  avatarShadow  — shadow layer, no overflow clip
                  avatarRing    — overflow:hidden clips image to circle
              */}
              <View style={styles.avatarShadow}>
                <View style={styles.avatarRing}>
                  <Image
                    source={ARCHETYPE_IMAGE}
                    style={styles.avatarImage}
                    resizeMode="cover"
                    accessibilityIgnoresInvertColors
                  />
                </View>
              </View>
            </View>

            {/* ── TALK TO MIRROR button ─────────────────────────────────── */}
            {/* Figma node 2336:3072: gap:16, Heading L, warmGlow shadow */}
            <TouchableOpacity
              style={styles.talkButton}
              onPress={handleTalkPress}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Talk to Mirror"
            >
              <StarIcon width={scale(24)} height={scale(24)} color={palette.gold.DEFAULT} />
              <Text style={styles.talkText}>TALK TO MIRROR</Text>
              <StarIcon width={scale(24)} height={scale(24)} color={palette.gold.DEFAULT} />
            </TouchableOpacity>

            {/* ── Menu grid: 2 rows × 2 cols ───────────────────────────── */}
            {/*
              Figma node 2336:3076: flex-col gap-[12px]
              Each row: flex gap-[24px] h-[76px]
              Cards: surface.overlay bg, border 0.5px navy.light, radius.s
              Text: Caps/Heading Caps M — Cormorant Regular 20px lineHeight:1.5
            */}
            <View style={styles.menuGrid}>
              <View style={styles.menuRow}>
                {MENU_OPTIONS.slice(0, 2).map(({ label, route }) => (
                  <TouchableOpacity
                    key={label}
                    style={styles.menuCard}
                    activeOpacity={0.85}
                    onPress={() => handleMenuPress(route)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.menuText}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.menuRow}>
                {MENU_OPTIONS.slice(2, 4).map(({ label, route }) => (
                  <TouchableOpacity
                    key={label}
                    style={styles.menuCard}
                    activeOpacity={0.85}
                    onPress={() => handleMenuPress(route)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.menuText}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default TalkToMirrorScreen;

const AVATAR_SIZE = scale(180);

const styles = StyleSheet.create<{
  bg: ViewStyle;
  safe: ViewStyle;
  scroll: ViewStyle;
  scrollContent: ViewStyle;
  content: ViewStyle;
  topSection: ViewStyle;
  greeting: TextStyle;
  avatarShadow: ViewStyle;
  avatarRing: ViewStyle;
  avatarImage: ImageStyle;
  talkButton: ViewStyle;
  talkText: TextStyle;
  menuGrid: ViewStyle;
  menuRow: ViewStyle;
  menuCard: ViewStyle;
  menuText: TextStyle;
}>({
  bg: {
    flex: 1,
    backgroundColor: palette.navy.deep,
  },
  safe: {
    flex: 1,
    backgroundColor: palette.neutral.transparent,
  },

  // ── ScrollView ────────────────────────────────────────────────────────────
  // NO flexGrow:1 on scrollContent — that was preventing scroll by always
  // expanding content to fill the viewport. Content now has its natural height
  // and will scroll on small devices.
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(spacing.xl),    // 24px — Figma 6.11% of 393px
    paddingTop: verticalScale(spacing.xl),   // breathing room below LogoHeader
    paddingBottom: verticalScale(spacing.xxxl),
  },

  // ── Outer column ─────────────────────────────────────────────────────────
  // Figma gap:55 between [greeting+avatar], [TALK TO MIRROR], [menu grid]
  content: {
    alignItems: 'center',
    gap: verticalScale(55),
  },

  // ── Top section: greeting + avatar ───────────────────────────────────────
  // Figma gap:32
  topSection: {
    alignItems: 'center',
    gap: verticalScale(spacing.xxl),         // 32px
    width: '100%',
  },

  // Figma: Cormorant Light Italic 32px, white, Glow Drop Shadow
  greeting: {
    fontFamily: fontFamily.headingLightItalic,
    fontStyle: 'italic',                     // required on iOS alongside fontFamily
    fontSize: moderateScale(fontSize['3xl']), // 32px
    lineHeight: moderateScale(fontSize['3xl']) * 1.3,
    fontWeight: fontWeight.light,
    color: palette.neutral.white,
    textAlign: 'center',
    textShadowColor: palette.gold.warm,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  // Shadow wrapper — no overflow:hidden so shadow bleeds outward.
  // backgroundColor required for iOS CALayer shadow rendering.
  avatarShadow: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: palette.navy.deep,
    shadowColor: textShadow.glow.color,      // Glow Drop Shadow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: moderateScale(16),
    elevation: 12,
  },
  // Clip ring — overflow:hidden clips image to circle, gold border visible
  avatarRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: borderWidth.regular,        // 1px
    borderColor: palette.gold.DEFAULT,       // border/brand #f2e2b1
    overflow: 'hidden',
  },
  // Figma: h:149.82%, top:-6.74% — image taller than circle, offset up to show face
  avatarImage: {
    position: 'absolute',
    width: '100%',
    height: '150%',
    top: -verticalScale(12),                 // ~-6.74% of 180px
  },

  // ── TALK TO MIRROR ────────────────────────────────────────────────────────
  // Figma: gap:16, Heading L (Cormorant Regular 32px), warmGlow shadow
  talkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(spacing.m),                   // 16px
  },
  talkText: {
    fontFamily: fontFamily.heading,           // CormorantGaramond-Regular
    fontSize: moderateScale(fontSize['3xl']), // 32px
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.xxl,              // 40px
    color: palette.gold.DEFAULT,             // Text/Paragraph-1
    textTransform: 'uppercase',
    textShadowColor: textShadow.warmGlow.color,
    textShadowOffset: textShadow.warmGlow.offset,
    textShadowRadius: textShadow.warmGlow.radius,
  },

  // ── Menu grid ─────────────────────────────────────────────────────────────
  // Figma: flex-col gap-[12px], full width
  menuGrid: {
    gap: verticalScale(spacing.s),           // 12px between rows
    width: '100%',
  },
  // Figma: flex gap-[24px] h-[76px]
  menuRow: {
    flexDirection: 'row',
    gap: scale(spacing.m),                    // 16px between cards
    minHeight: moderateScale(76),             // content-based height; allows 2-line text on all screens
  },
  // Figma: surface.overlay bg, border 0.5px navy.light, radius.s
  // backdrop-blur-[30px] — not supported natively in RN without a library
  menuCard: {
    flex: 1,                                 // equal width columns
    borderRadius: radius.s,                  // 12px
    borderWidth: borderWidth.thin,           // 0.5px
    borderColor: palette.navy.light,         // Border/Subtle #a3b3cc
    backgroundColor: palette.surface.overlay, // rgba(191,199,217,0.05)
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(spacing.xs),        // 8px — more text room on small screens
    paddingVertical: verticalScale(spacing.xs),
  },
  // Figma: Caps/Heading Caps M — Cormorant Regular 20px lineHeight:1.5
  menuText: {
    fontFamily: fontFamily.heading,           // CormorantGaramond-Regular
    fontSize: moderateScale(20),
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(20) * 1.5,     // 1.5 line height
    color: palette.gold.DEFAULT,             // Text/Paragraph-1
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
