import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
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
  borderWidth,
} from '@theme';
import type { RootStackParamList } from '@types';
import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  type ViewStyle,
  type TextStyle,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button';
import CauseIcon from '@components/CauseIcon';
import GlassCard from '@components/_internal/GlassCard';
import LogoHeader from '@components/LogoHeader';

import { CAUSES, type Cause } from './causes';

/**
 * Screen 4: Causes Carousel (cause-detail pages)
 * Figma: Design-Master-File node 2169:1120 (Women's Cancer canonical) and
 * sibling cause variants 2169:2688 / 2744 / 2800 / 2856 / 2912 / 2968.
 *
 * Layout (top → bottom):
 *   - Logo header
 *   - "CAUSES" Cormorant Heading XS Bold (20px Medium)
 *   - GlassCard per cause containing:
 *       title • icon • description • pagination dots (dots are INSIDE the card per Figma)
 *   - Footer row: back arrow • PLEDGE button
 *
 * `route.params.initialCauseId` (from ViewAllCausesScreen) jumps the
 * carousel to that cause on mount.
 */

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CausesCarousel'>;
type Route = RouteProp<RootStackParamList, 'CausesCarousel'>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const SLIDE_HORIZONTAL_PADDING = scale(spacing.l);
const SLIDE_WIDTH = SCREEN_WIDTH;
const ICON_SIZE = scale(96);
const BACK_BUTTON_SIZE = scale(44);

const ChevronLeft: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18l-6-6 6-6"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

interface PaginationDotsProps {
  count: number;
  activeIndex: number;
}

const PaginationDots: React.FC<PaginationDotsProps> = ({ count, activeIndex }) => (
  <View testID="pagination-dots" style={styles.dots}>
    {Array.from({ length: count }, (_, i) => (
      <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
    ))}
  </View>
);

const CausesCarouselScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<Route>();
  const flatListRef = useRef<FlatList<Cause>>(null);

  const initialIndex = useMemo(() => {
    const id = route.params?.initialCauseId;
    if (!id) {
      return 0;
    }
    const found = CAUSES.findIndex((c) => c.id === id);
    return found >= 0 ? found : 0;
  }, [route.params?.initialCauseId]);

  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SLIDE_WIDTH);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const renderCause: ListRenderItem<Cause> = ({ item, index }) => (
    <View style={styles.slide}>
      <GlassCard
        borderRadius={radius.s}
        padding={spacing.l}
        style={styles.card}
      >
        <Text style={styles.causeTitle}>{item.name}</Text>
        <View style={styles.iconWrap}>
          <CauseIcon type={item.id} size={ICON_SIZE} />
        </View>
        <Text style={styles.causeBody}>{item.description}</Text>
        <PaginationDots count={CAUSES.length} activeIndex={index} />
      </GlassCard>
    </View>
  );

  return (
    <BackgroundWrapper style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />

        <View style={styles.content}>
          <Text style={styles.header}>CAUSES</Text>

          <View style={styles.carouselWrap}>
            <FlatList
              testID="causes-carousel"
              ref={flatListRef}
              data={CAUSES}
              keyExtractor={(c) => c.id}
              renderItem={renderCause}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              initialScrollIndex={initialIndex}
              getItemLayout={(_, idx) => ({
                length: SLIDE_WIDTH,
                offset: SLIDE_WIDTH * idx,
                index: idx,
              })}
            />
          </View>

          <View style={styles.footerRow}>
            <TouchableOpacity
              testID="back-button"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <ChevronLeft size={scale(20)} color={palette.gold.DEFAULT} />
            </TouchableOpacity>
            <Button
              variant="primary"
              size="L"
              active
              title="PLEDGE"
              onPress={() => navigation.navigate('PledgeThankYou')}
            />
            {/* Invisible spacer keeps PLEDGE centered in the row */}
            <View style={styles.footerSpacer} />
          </View>
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create<{
  bg: ViewStyle;
  safe: ViewStyle;
  content: ViewStyle;
  header: TextStyle;
  carouselWrap: ViewStyle;
  slide: ViewStyle;
  card: ViewStyle;
  causeTitle: TextStyle;
  iconWrap: ViewStyle;
  causeBody: TextStyle;
  dots: ViewStyle;
  dot: ViewStyle;
  dotActive: ViewStyle;
  footerRow: ViewStyle;
  backButton: ViewStyle;
  footerSpacer: ViewStyle;
}>({
  bg: { flex: 1 },
  safe: { flex: 1, backgroundColor: palette.neutral.transparent },
  content: {
    flex: 1,
    paddingTop: verticalScale(spacing.xs),
    paddingBottom: verticalScale(spacing.l),
  },

  // Figma: Heading XS Bold (Cormorant Medium 20px) — small CAUSES eyebrow
  header: {
    fontFamily: fontFamily.headingMedium,
    fontSize: fontSize.l,
    lineHeight: fontSize.xl,
    fontWeight: fontWeight.medium,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    textShadowColor: textShadow.warmGlow.color,
    textShadowOffset: textShadow.warmGlow.offset,
    textShadowRadius: textShadow.warmGlow.radius,
    textTransform: 'uppercase',
    letterSpacing: 0,
    marginBottom: verticalScale(spacing.s),
  },

  // Wrap FlatList so it gets explicit flex space — without this, the
  // horizontal list collapses to 0 height and the carousel won't scroll.
  carouselWrap: {
    flex: 1,
  },

  slide: {
    width: SLIDE_WIDTH,
    paddingHorizontal: SLIDE_HORIZONTAL_PADDING,
  },

  card: {
    alignItems: 'center',
    gap: verticalScale(spacing.m),
  },

  // Figma: Heading M (Cormorant) — 28px / 32 lh, gold.DEFAULT
  causeTitle: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['2xl'],
    lineHeight: lineHeight.xl,
    fontWeight: fontWeight.regular,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    textShadowColor: textShadow.warmGlow.color,
    textShadowOffset: textShadow.warmGlow.offset,
    textShadowRadius: textShadow.warmGlow.radius,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },

  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Figma: Body S — Inter 16px / 24 lh, gold.subtlest, centered
  causeBody: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    fontWeight: fontWeight.regular,
    color: palette.gold.subtlest,
    textAlign: 'center',
  },

  // Pagination dots — INSIDE the card per Figma, sit just below the body copy
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    marginTop: verticalScale(spacing.xs),
  },
  dot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: palette.navy.light,
    opacity: 0.5,
  },
  dotActive: {
    backgroundColor: palette.gold.DEFAULT,
    opacity: 1,
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(spacing.l),
    paddingTop: verticalScale(spacing.m),
    gap: spacing.m,
  },

  backButton: {
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
    borderRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
    backgroundColor: palette.navy.card,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty spacer matches back-button width so PLEDGE stays centered
  footerSpacer: {
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
  },
});

export default CausesCarouselScreen;
