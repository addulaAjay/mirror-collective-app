/**
 * Home Screen — TalkToMirror
 * Figma: Design-Master-File → Home Screen - FINAL (4326:2276)
 * Reference render: docs/visual-qa/talk-to-mirror/talk-to-mirror-figma.png
 *
 * Layout (top → bottom, after LogoHeader):
 *   1. Greeting row   — small avatar (64) + "Welcome back, X" italic text
 *   2. Oval mirror    — 183×275 elliptical centerpiece (gold rim + gradient fill)
 *   3. Talk button    — bordered pill flanked by 20px stars, gap 16
 *   4. Category row   — horizontal scroll: Mirror Echo / Reflection Room /
 *                       Mirror Pledge (100×100 circles + labels)
 *
 * Outer column (Figma 4326:2301): h-[654px] flex-col items-center
 * justify-between, w-345 — distributes the 4 sections vertically.
 */

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingService } from '@services';
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
  glassGradient,
  scale,
  verticalScale,
  moderateScale,
} from '@theme';
import type { RootStackParamList } from '@types';
import React, { useEffect } from 'react';
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
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import OvalMirrorSvg from '@assets/talk-to-mirror/oval-mirror.svg';
import BackgroundWrapper from '@components/BackgroundWrapper';
import { CachedImage } from '@components/CachedImage';
import MirrorEchoIcon from '@components/icons/MirrorEchoIcon';
import MirrorPledgeIcon from '@components/icons/MirrorPledgeIcon';
import ReflectionRoomIcon from '@components/icons/ReflectionRoomIcon';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';
import { useUser } from '@context/UserContext';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TalkToMirror'>;
}

// Sizing constants — referenced by both the screen markup and styles below.
const AVATAR_SIZE = moderateScale(64);
const MIRROR_W    = moderateScale(183);
const MIRROR_H    = moderateScale(275);
const ICON_RING   = moderateScale(100);

// Figma 4326:2337 — horizontal scroll category list
const CATEGORIES = [
  { key: 'mirror-echo',     label: 'ECHO VAULT',     route: 'MirrorEchoVaultHome' as const },
  { key: 'reflection-room', label: 'REFLECTION ROOM', route: 'ReflectionRoomCommingsoon' as const },
  { key: 'mirror-pledge',   label: 'MIRROR PLEDGE',   route: 'TheMirrorPledge' as const },
];

/** Figma 4326:2339-2393 — 100×100 full-circle SVG + 20px label.
 *  The SVG includes the ring border itself, so no wrapping View is needed. */
interface CategoryCardProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}
const CategoryCard: React.FC<CategoryCardProps> = ({ icon, label, onPress }) => (
  <TouchableOpacity
    style={styles.categoryCard}
    activeOpacity={0.85}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <View style={styles.categoryIconBox}>{icon}</View>
    <Text style={styles.categoryLabel}>{label}</Text>
  </TouchableOpacity>
);

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const TalkToMirrorScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useUser();
  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Friend';

  useEffect(() => {
    OnboardingService.markOnboardingComplete().catch(() => {
      // non-fatal — onboarding flag is best-effort
    });
  }, []);

  const handleTalkPress = () => navigation.navigate('MirrorChat');
  const handleCategoryPress = (route: keyof RootStackParamList) =>
    navigation.navigate(route as never);

  const renderCategoryIcon = (key: string) => {
    switch (key) {
      case 'mirror-echo':
        return <MirrorEchoIcon size={ICON_RING} />;
      case 'reflection-room':
        return <ReflectionRoomIcon size={ICON_RING} />;
      case 'mirror-pledge':
        return <MirrorPledgeIcon size={ICON_RING} />;
      default:
        return null;
    }
  };

  return (
    <BackgroundWrapper style={styles.bg} scrollable>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LogoHeader />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>

            {/* Figma 4326:2302 — gap:16, items-center, justify-center */}
            <View style={styles.greetingRow}>
              <View style={styles.avatarGlow}>
                <View style={styles.avatarRing}>
                  {user?.profileImageUrl ? (
                    // accessibilityIgnoresInvertColors is honored by RN's
                    // native View but expo-image does not forward it to
                    // the underlying native image view. Wrap with a View
                    // that carries the prop so Smart-Invert on iOS leaves
                    // the avatar untouched. The wrapper fills avatarRing via
                    // absoluteFillObject; the inner image fills the wrapper
                    // 1:1 (styles.avatarImage) and contentFit="cover" handles
                    // the circular crop.
                    <View
                      accessibilityIgnoresInvertColors
                      style={StyleSheet.absoluteFillObject}
                    >
                      <CachedImage
                        source={{ uri: user.profileImageUrl }}
                        style={styles.avatarImage}
                        contentFit="cover"
                      />
                    </View>
                  ) : null}
                </View>
              </View>
              <Text style={styles.greeting} numberOfLines={2}>
                Welcome back, {firstName}
              </Text>
            </View>

            {/* Figma 4326:2306 — oval mirror centerpiece */}
            <OvalMirrorSvg width={MIRROR_W} height={MIRROR_H} />

            {/* Figma 4326:2332 — talk button row (gap:16, stars flanking) */}
            <View style={styles.talkRow}>
              <StarIcon
                width={moderateScale(fontSize.l)}
                height={moderateScale(fontSize.l)}
                color={palette.gold.DEFAULT}
              />
              <TouchableOpacity
                style={styles.talkButton}
                onPress={handleTalkPress}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Talk to Mirror"
              >
                <LinearGradient
                  colors={[glassGradient.echoSecondary.start, glassGradient.echoSecondary.end]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />
                <Text style={styles.talkText}>TALK TO MIRROR</Text>
              </TouchableOpacity>
              <StarIcon
                width={moderateScale(fontSize.l)}
                height={moderateScale(fontSize.l)}
                color={palette.gold.DEFAULT}
              />
            </View>

            {/* Figma 4326:2337 — horizontal category scroll */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScrollContent}
            >
              {CATEGORIES.map(({ key, label, route }) => (
                <CategoryCard
                  key={key}
                  icon={renderCategoryIcon(key)}
                  label={label}
                  onPress={() => handleCategoryPress(route)}
                />
              ))}
            </ScrollView>

          </View>
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default TalkToMirrorScreen;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create<{
  bg: ViewStyle;
  safe: ViewStyle;
  scroll: ViewStyle;
  scrollContent: ViewStyle;
  content: ViewStyle;
  greetingRow: ViewStyle;
  avatarGlow: ViewStyle;
  avatarRing: ViewStyle;
  avatarImage: ImageStyle;
  greeting: TextStyle;
  talkRow: ViewStyle;
  talkButton: ViewStyle;
  talkText: TextStyle;
  categoryScrollContent: ViewStyle;
  categoryCard: ViewStyle;
  categoryIconBox: ViewStyle;
  categoryLabel: TextStyle;
}>({
  bg:   { flex: 1 },
  safe: { flex: 1, backgroundColor: palette.neutral.transparent },

  // ── ScrollView (vertical) ────────────────────────────────────────────────
  scroll:        { flex: 1 },
  scrollContent: {
    paddingHorizontal: scale(spacing.xl),    // Figma 24px (left:24, right:24)
    paddingTop:        verticalScale(spacing.l),
    paddingBottom:     verticalScale(spacing.xxxl),
  },

  // Outer column: Figma flex-col items-center justify-between (h:654 in mock)
  content: {
    alignItems:    'center',
    justifyContent:'space-between',
    minHeight:     verticalScale(560),
    width:         '100%',
    gap:           verticalScale(spacing.xl),
  },

  // ── Greeting row ─────────────────────────────────────────────────────────
  // Figma 4326:2302 — gap:16, items-center, justify-center
  greetingRow: {
    flexDirection: 'row',
    alignItems:    'center',
    justifyContent:'center',
    gap:           scale(spacing.m),
    width:         '100%',
  },
  // Figma 4326:2303 — 64×64, gold border, glow (mirrors EchoVaultLibraryScreen avatar)
  // Glow wrapper: shadow lives here — overflow:hidden on the ring would clip it
  avatarGlow: {
    width:         AVATAR_SIZE,
    height:        AVATAR_SIZE,
    borderRadius:  AVATAR_SIZE / 2,
    boxShadow:     '0px 0px 10px 3px rgba(240, 212, 168, 0.3)',
    shadowColor:   palette.gold.glow,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius:  10,
    elevation:     6,
  },
  // Ring: overflow:hidden clips image to circle
  avatarRing: {
    width:           '100%',
    height:          '100%',
    borderRadius:    AVATAR_SIZE / 2,
    borderWidth:     borderWidth.regular,
    borderColor:     palette.gold.DEFAULT,
    overflow:        'hidden',
    backgroundColor: palette.navy.deep,
  },
  avatarImage: {
    // Fill the ring 1:1 (matches ProfileScreen). contentFit="cover" crops a
    // user photo to the circle without zooming. The old height:'150%' + top
    // offset over-scaled real uploads, clipping the bottom third on device.
    width:  '100%',
    height: '100%',
  },
  // Figma 4326:2305 — Cormorant Garamond Light Italic 28px (2xl), lh 1.3, white, glow
  greeting: {
    flexShrink:        1,
    width:             scale(210),             // Figma 4326:2304: w-[210px]
    fontFamily:        fontFamily.headingLightItalic,
    fontStyle:         'italic',
    fontSize:          moderateScale(fontSize['2xl']),
    lineHeight:        moderateScale(fontSize['2xl']) * 1.3,
    fontWeight:        fontWeight.light,
    color:             palette.neutral.white,
    textAlign:         'center',
    textShadowColor:   textShadow.glowSubtle.color,
    textShadowOffset:  textShadow.glowSubtle.offset,
    textShadowRadius:  textShadow.glowSubtle.radius,
  },

  // ── Talk button ──────────────────────────────────────────────────────────
  // Figma 4326:2332 — flex row gap:16, items-center
  talkRow: {
    flexDirection: 'row',
    alignItems:    'center',
    justifyContent:'center',
    gap:           scale(spacing.m),
    width:         '100%',
  },
  // Figma 4407:2755 — bordered pill, radius:m (16), padding 16h/12v, gradient bg
  talkButton: {
    overflow:          'hidden',
    borderRadius:      radius.m,
    borderWidth:       borderWidth.thin,
    borderColor:       palette.navy.light,
    paddingHorizontal: scale(spacing.m),
    paddingVertical:   verticalScale(spacing.s),
    backgroundColor:   palette.neutral.transparent,
    alignItems:        'center',
    justifyContent:    'center',
  },
  // Figma I4407:2755;125:342 — Cormorant Regular XL (24px), lh:l (28), gold, warm glow
  talkText: {
    fontFamily:       fontFamily.heading,
    fontSize:         moderateScale(fontSize.xl),
    lineHeight:       moderateScale(lineHeight.l),
    fontWeight:       fontWeight.regular,
    color:            palette.gold.DEFAULT,
    textAlign:        'center',
    textTransform:    'uppercase',
    textShadowColor:  textShadow.warmGlow.color,
    textShadowOffset: textShadow.warmGlow.offset,
    textShadowRadius: textShadow.warmGlow.radius,
  },

  // ── Category row ─────────────────────────────────────────────────────────
  // Figma 4326:2338 — horizontal scroll, gap:xl (24)
  //
  // Cross-axis: `flex-start` (not `center`) is essential. With `center`,
  // a card whose label wraps to 2 lines is taller than its siblings, and
  // flex centring pushes the shorter cards' icons DOWN to align their
  // midpoints — so the longer card's icon visually "rises" relative to
  // the others. Top-aligning every card pins all icons to the same Y
  // coordinate regardless of label wrap. Pair with a 2-line minHeight
  // on the label below so the card bottoms also line up.
  categoryScrollContent: {
    gap:               scale(spacing.xl),
    paddingHorizontal: scale(spacing.xs),
    alignItems:        'flex-start',
  },
  // Figma 4326:2339 — flex-col gap:s (12) items-center
  categoryCard: {
    alignItems:     'center',
    justifyContent: 'flex-start',
    gap:            verticalScale(spacing.s),
  },
  // Figma 4326:2340 — 100×100 SVG box. SVG includes ring + content.
  categoryIconBox: {
    width:          ICON_RING,
    height:         ICON_RING,
    alignItems:     'center',
    justifyContent: 'center',
  },
  // Figma 4326:2343/2360/2382/2393 — Cormorant Regular L (20px), lh:m (24), gold, center
  categoryLabel: {
    fontFamily:    fontFamily.heading,
    fontSize:      moderateScale(fontSize.l),
    lineHeight:    moderateScale(lineHeight.m),
    fontWeight:    fontWeight.regular,
    color:         palette.gold.DEFAULT,
    textAlign:     'center',
    textTransform: 'uppercase',
    // scale(110) is ~105pt on iPhone SE (375pt) — too narrow for the
    // word "REFLECTION" at 20px Cormorant, which forced a mid-word break
    // (REFLECTIO\nN ROOM). Bump to scale(130) so the longest single word
    // ("REFLECTION") fits on one line on the narrowest supported device.
    maxWidth:      scale(130),
    // Reserve 2 lines of vertical space so every card is the same total
    // height — otherwise a 1-line "MIRROR ECHO" next to a wrapped
    // "REFLECTION ROOM" leaves ragged card bottoms. Combined with
    // alignItems:'flex-start' on the scroll content, this keeps the row
    // visually rectangular: icons aligned at top, label baselines
    // aligned at top of the reserved block.
    minHeight:     moderateScale(lineHeight.m) * 2,
  },
});
