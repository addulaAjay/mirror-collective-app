import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import {
  LANDING,
  QUIZ_ENTRY,
  WELCOME_OVERLAYS,
} from '@features/reflection-room/copy/strings';
import { useJourney } from '@features/reflection-room/state/JourneyContext';
import {
  borderWidth,
  fontFamily,
  modalColors,
  palette,
  radius,
  scale,
  spacing,
  textShadow,
  theme,
  verticalScale,
} from '@theme';
import type { RootStackParamList } from '@types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const INFO_PAGES = WELCOME_OVERLAYS.map(page => ({
  title: page.eyebrow,
  body: `${page.headline}\n\n${page.body}`,
  sub: page.tagline,
}));

const ReflectionRoomLandingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { welcomeChecked, welcomeSeen } = useJourney();
  const [showInfo, setShowInfo] = useState(false);
  const [infoPage, setInfoPage] = useState(0);
  // Fail-state variant (Figma node 7128:10048 "Reflection Room - fail state").
  // Defaults to false so the live entry flow is unchanged; flipped only when a
  // caller/entry data-load fails. Retrying resets to the normal entry.
  const [failState, setFailState] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (welcomeChecked && !welcomeSeen) {
        navigation.replace('ReflectionRoomWelcome');
      }
    }, [welcomeChecked, welcomeSeen, navigation]),
  );

  if (failState) {
    return (
      <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
        <SafeAreaView style={styles.safe}>
          <LogoHeader />
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Frame 546: RESULTS NOT AVAILABLE — Cormorant 2XL, gold, centered */}
            <Text
              style={styles.failTitle}
              accessibilityRole="header"
              accessibilityLabel={LANDING.failHeader}
            >
              {LANDING.failHeader}
            </Text>

            {/* Frame 486: 317x300 archway illustration (shared with entry) */}
            <View style={styles.imageContainer} accessibilityElementsHidden>
              <Image
                source={require('@assets/reflection-room-arch-1.png')}
                style={styles.archLayer1}
                resizeMode="contain"
              />
              <Image
                source={require('@assets/reflection-room-arch-2.png')}
                style={styles.archLayer2}
                resizeMode="contain"
              />
              <Image
                source={require('@assets/reflection-room-stairs.png')}
                style={styles.stairsImage}
                resizeMode="contain"
              />
              <Image
                source={require('@assets/reflection-room-arch-3.png')}
                style={styles.archLayer3}
                resizeMode="contain"
              />
            </View>

            {/* Fail body: Inter 16/24 paragraph-2, 345w, centered */}
            <Text style={styles.failBody}>{LANDING.failBody}</Text>

            {/* TRY AGAIN: Component 5 — 159x52, r=12, border=Border/Subtle */}
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => setFailState(false)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={LANDING.failRetry}
            >
              <Text style={styles.startText}>{LANDING.failRetry}</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Frame 600: 345x64, HORIZONTAL, pa=CENTER, ca=CENTER
              No back button. Title centered with info icon absolutely pinned right. */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>REFLECTION ROOM</Text>
            {/* Frame 612: 24x64, vertically centered info icon */}
            <View style={styles.infoWrapper}>
              <TouchableOpacity
                onPress={() => {
                  setShowInfo(true);
                  setInfoPage(0);
                }}
              >
                <Image
                  source={require('@assets/rr-info-icon.png')}
                  style={styles.infoIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Frame 486: 317x300 archway illustration */}
          <View style={styles.imageContainer}>
            <Image
              source={require('@assets/reflection-room-arch-1.png')}
              style={styles.archLayer1}
              resizeMode="contain"
            />
            <Image
              source={require('@assets/reflection-room-arch-2.png')}
              style={styles.archLayer2}
              resizeMode="contain"
            />
            <Image
              source={require('@assets/reflection-room-stairs.png')}
              style={styles.stairsImage}
              resizeMode="contain"
            />
            <Image
              source={require('@assets/reflection-room-arch-3.png')}
              style={styles.archLayer3}
              resizeMode="contain"
            />
          </View>

          {/* Description: Inter 16 palette.gold.subtlest, 317w, centered */}
          <Text style={styles.description}>
            {QUIZ_ENTRY.body}
          </Text>

          {/* START: Component 2 — 104x52, r=12, border=Border/Subtle 0.5 */}
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate('ReflectionRoomQuiz')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Start reflection"
          >
            <Text style={styles.startText}>START</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
      <Modal
        visible={showInfo}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowInfo(false)}
      >
        <View style={styles.infoModalRoot}>
          <Pressable
            style={styles.infoBackdrop}
            onPress={() => setShowInfo(false)}
            accessibilityLabel="Close info"
            accessibilityRole="button"
          />
          <View style={styles.infoPopupContainer}>
            <TouchableOpacity
              style={styles.infoCloseBtn}
              onPress={() => setShowInfo(false)}
            >
              <Text style={styles.infoCloseText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.infoTitle}>{INFO_PAGES[infoPage].title}</Text>
            <Text style={styles.infoBody}>{INFO_PAGES[infoPage].body}</Text>
            <Text style={styles.infoSub}>{INFO_PAGES[infoPage].sub}</Text>
            <View style={styles.infoNavRow}>
              {infoPage > 0 ? (
                <TouchableOpacity onPress={() => setInfoPage(infoPage - 1)}>
                  <Image
                    source={require('@assets/back-arrow.png')}
                    style={styles.infoArrowImg}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.infoArrowPlaceholder} />
              )}
              {infoPage < INFO_PAGES.length - 1 ? (
                <TouchableOpacity onPress={() => setInfoPage(infoPage + 1)}>
                  <Image
                    source={require('@assets/right-arrow.png')}
                    style={styles.infoArrowImg}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.infoArrowPlaceholder} />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </BackgroundWrapper>
  );
};

export default ReflectionRoomLandingScreen;

const CONTENT_WIDTH = Math.min(screenWidth - 40, 345);

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  bgImage: {
    resizeMode: 'cover',
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  // Frame 527: VERTICAL, gap=40, pa=SPACE_BETWEEN, ca=CENTER
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: Math.max(20, screenWidth * 0.051),
    paddingBottom: Math.max(40, screenHeight * 0.05),
    gap: spacing.xxxl,
  },

  // Frame 600: 345x64, title centered, info icon absolute right
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: CONTENT_WIDTH,
    height: verticalScale(64),
  },
  // Title: Figma Heading M (Cormorant) — 2XL=28 / lineHeight XL=32, gold,
  // 217w fixed forces the 2-line "REFLECTION ROOM" wrap, centered in row.
  // (theme.typography sizes are offset one step: Figma 2XL -> sizes['3xl'].)
  title: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.sizes['3xl'],
    fontWeight: theme.typography.weights.regular,
    color: theme.colors.text.paragraph1,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeights['2xl'],
    width: 217,
  },
  // Frame 612: 24x64, absolute top-right — separate from title text
  infoWrapper: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 24,
    height: verticalScale(64),
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIcon: {
    width: 24,
    height: 24,
  },

  // Frame 486: 317x300
  imageContainer: {
    width: 317,
    height: 300,
    position: 'relative',
  },
  archLayer1: {
    position: 'absolute',
    width: 263,
    height: 300,
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -131.5 }],
  },
  archLayer2: {
    position: 'absolute',
    width: 238,
    height: 282,
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -119 }],
  },
  archLayer3: {
    position: 'absolute',
    width: 213,
    height: 265,
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -106.5 }],
  },
  stairsImage: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -76.5 }],
    width: 183,
    height: 172,
  },

  // Description: Inter 16 palette.gold.subtlest, 317w, centered
  description: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.regular,
    color: theme.colors.text.paragraph2,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeights.lg,
    width: 317,
  },

  // START: Component 2 — 104x52, r=12 (Radius/S), border=Border/Subtle 0.5
  startButton: {
    minWidth: scale(104),
    minHeight: verticalScale(52),
    borderRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: theme.colors.border.subtle,
    backgroundColor: palette.neutral.transparent,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
  },
  // Text button label: Figma Heading S (Cormorant) — XL=24, gold.
  startText: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.sizes['2xl'],
    fontWeight: theme.typography.weights.regular,
    color: theme.colors.text.paragraph1,
    letterSpacing: 1,
  },
  // Fail state (Figma 7128:10048) --------------------------------------------
  // Title: RESULTS NOT AVAILABLE — Cormorant 2XL=28 / lineHeight 32, gold,
  // full-width (345) centered. (Figma 2XL -> sizes['3xl'].)
  failTitle: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.sizes['3xl'],
    fontWeight: theme.typography.weights.regular,
    color: theme.colors.text.paragraph1,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeights['2xl'],
    width: CONTENT_WIDTH,
  },
  // Fail body: Inter S=16 / lineHeight M=24, paragraph-2, 345w centered.
  failBody: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.regular,
    color: theme.colors.text.paragraph2,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeights.lg,
    width: CONTENT_WIDTH,
  },
  // TRY AGAIN: Component 5 — 159x52, same text-button treatment as START.
  retryButton: {
    minWidth: scale(159),
    minHeight: verticalScale(52),
    borderRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: theme.colors.border.subtle,
    backgroundColor: palette.neutral.transparent,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
  },

  // Frame 95: 345x32, HORIZONTAL, gap=20, pa=CENTER (items centered together)
  ambientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    gap: 20,
  },
  ambientLabel: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.regular,
    color: theme.colors.secondary['secondary-color-2'],
  },

  // Custom toggle: 60x32, bg=palette.navy.light, r=16, border=palette.navy.border 1px, padding=4
  toggle: {
    width: 60,
    height: 32,
    borderRadius: radius.xl,
    backgroundColor: theme.colors.border.subtle,
    borderWidth: borderWidth.regular,
    borderColor: palette.navy.border,
    padding: spacing.xxs,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: theme.colors.text.heading,
    borderColor: theme.colors.text.heading,
  },
  // Thumb: Ellipse 1 — 24x24, paragraph-2
  thumb: {
    width: 24,
    height: 24,
    borderRadius: radius.xl / 2,
    backgroundColor: theme.colors.text.paragraph2,
    alignSelf: 'flex-start',
  },
  thumbOn: {
    alignSelf: 'flex-end',
  },
  infoModalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: modalColors.navyDeep60,
  },
  infoPopupContainer: {
    width: 329,
    backgroundColor: modalColors.card,
    borderRadius: radius.m - 3,
    borderWidth: borderWidth.hairline,
    borderColor: palette.navy.muted,
    padding: spacing.xl,
    shadowColor: theme.colors.text.paragraph1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  infoCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 2,
  },
  infoCloseText: {
    fontSize: 28,
    color: theme.colors.text.paragraph1,
    fontWeight: theme.typography.weights.light,
  },
  infoTitle: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.sizes['3xl'],
    color: theme.colors.text.paragraph1,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: spacing.m,
    marginTop: spacing.xs,
    textShadowColor: textShadow.glowSubtle.color,
    textShadowOffset: textShadow.glowSubtle.offset,
    textShadowRadius: textShadow.glowSubtle.radius,
  },
  infoBody: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.base,
    color: palette.neutral.white,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeights.lg,
    marginBottom: spacing.m,
  },
  infoSub: {
    fontFamily: fontFamily.bodyItalic,
    fontSize: 15,
    color: theme.colors.text.paragraph1,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.xs,
    marginBottom: spacing.m,
  },
  infoRichBody: {
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 8,
  },
  infoItalicLine: {
    fontFamily: fontFamily.bodyItalic,
    fontSize: theme.typography.sizes.lg,
    color: palette.neutral.white,
    textAlign: 'center',
    width: '100%',
    marginBottom: 16,
  },
  infoBullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  infoBulletDot: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.base,
    color: palette.neutral.white,
    lineHeight: theme.typography.lineHeights.lg,
  },
  infoBold: {
    fontFamily: fontFamily.bodyBold,
    fontSize: theme.typography.sizes.base,
    color: palette.neutral.white,
  },
  infoNavRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
  },
  infoArrowImg: {
    width: 28,
    height: 28,
    tintColor: theme.colors.text.paragraph1,
  },
  infoArrowPlaceholder: {
    width: 28,
    height: 28,
  },
});
