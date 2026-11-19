/**
 * Reflection Room — Welcome onboarding (3 swipeable overlays).
 *
 * Source: 03_UI_DEVELOPER_HANDOFF.md §12.1 (canonical copy) +
 *         Figma node 4654-3338 (layout).
 *
 * Behavior:
 *  - Card-style overlay over the standard navy background.
 *  - Three pages, swipeable horizontally OR navigated by arrow buttons.
 *  - X close button (top-right) on every page → marks welcome-seen and
 *    routes to the Quiz Entry.
 *  - Final page → also dismisses on X.
 */

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import GlassCard from '@components/_internal/GlassCard';
import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';
import { WELCOME_OVERLAYS } from '@features/reflection-room/copy/strings';
import { useJourney } from '@features/reflection-room/state/JourneyContext';
import {
  fontFamily,
  fontSize,
  lineHeight,
  modalColors,
  moderateScale,
  palette,
  radius,
  scale,
  spacing,
  textShadow,
  verticalScale,
} from '@theme';
import type { RootStackParamList } from '@types';


type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: screenWidth } = Dimensions.get('window');
const PAGE_WIDTH = Math.min(screenWidth, 412);

interface OverlayPageProps {
  page: (typeof WELCOME_OVERLAYS)[number];
  isLast: boolean;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
}

const OverlayPage: React.FC<OverlayPageProps> = ({
  page,
  isLast,
  onPrev,
  onNext,
}) => (
  <View style={styles.page}>
    <GlassCard style={styles.card} padding={spacing.xxl} borderRadius={radius.l}>
      <Text
        style={styles.eyebrow}
        accessibilityRole="header"
        accessibilityLabel={page.eyebrow}
      >
        {page.eyebrow}
      </Text>
      <Text style={styles.headline}>{page.headline}</Text>
      <Text style={styles.body}>{page.body}</Text>

      <View style={styles.sparkle} accessibilityElementsHidden>
        <StarIcon width={20} height={20} color={palette.gold.warm} />
      </View>

      <Text style={styles.tagline}>{page.tagline}</Text>

      <View style={styles.navRow}>
        {onPrev ? (
          <Pressable
            onPress={onPrev}
            accessibilityRole="button"
            accessibilityLabel="Previous"
            hitSlop={8}
            style={styles.navButton}
          >
            <Image
              source={require('@assets/back-arrow.png')}
              style={styles.arrow}
              resizeMode="contain"
            />
          </Pressable>
        ) : (
          <View style={styles.navPlaceholder} />
        )}
        {!isLast && onNext ? (
          <Pressable
            onPress={onNext}
            accessibilityRole="button"
            accessibilityLabel="Next"
            hitSlop={8}
            style={styles.navButton}
          >
            <Image
              source={require('@assets/right-arrow.png')}
              style={styles.arrow}
              resizeMode="contain"
            />
          </Pressable>
        ) : (
          <View style={styles.navPlaceholder} />
        )}
      </View>
    </GlassCard>
  </View>
);

const ReflectionRoomWelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { setWelcomeSeen } = useJourney();
  const scrollRef = useRef<ScrollView>(null);
  const [pageIndex, setPageIndex] = useState(0);

  const goToPage = useCallback((index: number) => {
    scrollRef.current?.scrollTo({ x: index * PAGE_WIDTH, y: 0, animated: true });
    setPageIndex(index);
  }, []);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = event.nativeEvent.contentOffset.x;
      const next = Math.round(x / PAGE_WIDTH);
      if (next !== pageIndex) setPageIndex(next);
    },
    [pageIndex],
  );

  const dismiss = useCallback(async () => {
    await setWelcomeSeen();
    navigation.replace('ReflectionRoomQuizEntry');
  }, [navigation, setWelcomeSeen]);

  // Restore page-0 scroll position on mount in case OS retains layout cache.
  useEffect(() => {
    scrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
  }, []);

  return (
    <BackgroundWrapper style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />
        <View style={styles.closeRow}>
          <Pressable
            onPress={dismiss}
            accessibilityRole="button"
            accessibilityLabel="Close welcome"
            hitSlop={12}
            style={styles.closeButton}
          >
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          contentContainerStyle={styles.scroll}
          accessibilityRole="adjustable"
          accessibilityLabel="Reflection Room welcome onboarding"
        >
          {WELCOME_OVERLAYS.map((overlay, i) => (
            <OverlayPage
              key={overlay.eyebrow}
              page={overlay}
              isLast={i === WELCOME_OVERLAYS.length - 1}
              onPrev={i > 0 ? () => goToPage(i - 1) : null}
              onNext={
                i < WELCOME_OVERLAYS.length - 1 ? () => goToPage(i + 1) : null
              }
            />
          ))}
        </ScrollView>

        <View style={styles.dotsRow} accessibilityElementsHidden>
          {WELCOME_OVERLAYS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === pageIndex && styles.dotActive]}
            />
          ))}
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default ReflectionRoomWelcomeScreen;

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  closeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: scale(spacing.l),
    paddingTop: verticalScale(spacing.s),
  },
  closeButton: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(radius.full),
    backgroundColor: modalColors.closeButtonBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: palette.gold.DEFAULT,
    fontSize: moderateScale(fontSize.xl),
    lineHeight: moderateScale(lineHeight.xl),
    fontFamily: fontFamily.body,
  },
  scroll: {
    alignItems: 'center',
  },
  page: {
    width: PAGE_WIDTH,
    paddingHorizontal: scale(spacing.l),
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  card: {
    width: '100%',
    alignItems: 'center',
  },
  eyebrow: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize['2xl']),
    lineHeight: moderateScale(lineHeight.xl),
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: verticalScale(spacing.m),
    textShadowColor: textShadow.glow.color,
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: textShadow.glow.radius,
  },
  headline: {
    fontFamily: fontFamily.headingItalic,
    fontSize: moderateScale(fontSize.xl),
    lineHeight: moderateScale(lineHeight.l),
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    marginBottom: verticalScale(spacing.m),
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.s),
    lineHeight: moderateScale(lineHeight.m),
    color: palette.gold.subtlest,
    textAlign: 'center',
    marginBottom: verticalScale(spacing.l),
  },
  sparkle: {
    marginVertical: verticalScale(spacing.s),
    alignItems: 'center',
  },
  tagline: {
    fontFamily: fontFamily.bodyItalic,
    fontSize: moderateScale(fontSize.xs),
    lineHeight: moderateScale(lineHeight.s),
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    marginBottom: verticalScale(spacing.l),
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingHorizontal: scale(spacing.l),
    marginTop: verticalScale(spacing.s),
  },
  navButton: {
    width: scale(32),
    height: scale(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  navPlaceholder: { width: scale(32), height: scale(32)},
  arrow: { width: scale(24), height: scale(24), tintColor: palette.gold.DEFAULT },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale(spacing.xs),
    paddingBottom: verticalScale(spacing.l),
  },
  dot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(radius.full),
    backgroundColor: 'rgba(242, 226, 177, 0.3)',
  },
  dotActive: {
    backgroundColor: palette.gold.DEFAULT,
    width: scale(18),
  },
});
