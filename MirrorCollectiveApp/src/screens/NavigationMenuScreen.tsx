import {
  palette,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  spacing,
  radius,
  scale,
  verticalScale,
} from '@theme';
import React from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';

import CircularLogoMark from '@components/CircularLogoMark';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/*
 * Figma node 2336:3801 — absolute inset: 5.63% top, 10.18% right, 4.93% bottom, 0 left
 * On the 393×852 reference device this produces a 353×762 drawer.
 * We derive pixel values from the same percentages so any screen scales correctly.
 */
const DRAWER_TOP    = Math.round(SCREEN_HEIGHT * 0.0563);  // ~48px
const DRAWER_BOTTOM = Math.round(SCREEN_HEIGHT * 0.0493);  // ~42px
const DRAWER_HEIGHT = SCREEN_HEIGHT - DRAWER_TOP - DRAWER_BOTTOM; // ~762px
const DRAWER_WIDTH  = Math.round(SCREEN_WIDTH  * 0.8982);  // ~89.82% ≈ 353px

type MirrorSideMenuProps = {
  isOpen: boolean;
  userName?: string;
  onClose: () => void;
  onNavigate: (route: string) => void;
};

// ── Nav item definitions ────────────────────────────────────────────────────
// Figma node 2336:3805 — primary items with dividers between each
const PRIMARY_ITEMS = [
  { label: 'MirrorGPT',       route: 'MirrorChat' },
  { label: 'Echo Vault',      route: 'MirrorEchoVaultHome' },
  { label: 'Reflection Room', route: 'ReflectionRoom' },
  { label: 'Code Library',    route: 'MirrorCodeLibrary' },
  { label: 'Pledge',          route: 'TheMirrorPledge' },
] as const;

// Figma node 2336:3816 — secondary items, no dividers
const SECONDARY_ITEMS = [
  { label: 'Profile',      route: 'Profile' },
  { label: 'Subscription', route: 'Subscription' },
  { label: 'About Us',     route: 'About' },
  { label: 'FAQ',          route: 'FAQ' },
] as const;

// ── Hamburger icon (Material Dehaze) ────────────────────────────────────────
const HamburgerIcon: React.FC = () => (
  <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"
      fill={palette.gold.warm}
    />
  </Svg>
);

// ── Close icon ──────────────────────────────────────────────────────────────
const CloseIcon: React.FC = () => (
  <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
      fill={palette.gold.warm}
    />
  </Svg>
);

// ── Divider — Figma node 2941:2759 (imgLine3)
// Centre-bright gradient: transparent → navy.light → transparent
const NavDivider: React.FC = () => (
  <LinearGradient
    colors={['rgba(163, 179, 204, 0.6)', 'transparent']}
    start={{ x: 0, y: 0.5 }}
    end={{ x: 1, y: 0.5 }}
    style={styles.divider}
  />
);

const MirrorSideMenu: React.FC<MirrorSideMenuProps> = ({
  isOpen,
  userName = 'Guest',
  onClose,
  onNavigate,
}) => {
  const slideAnim = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -DRAWER_WIDTH,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [isOpen, slideAnim]);

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.45)" />

      {/* Backdrop — tapping closes the drawer */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/*
        Figma inset: 5.63% top, 10.18% right, 4.93% bottom, 0 left
        Computed: top=DRAWER_TOP, height=DRAWER_HEIGHT, width=DRAWER_WIDTH
      */}
      <Animated.View
        style={[
          styles.drawerOuter,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        {/*
          Figma 2336:3801 — panel
          bg: palette.navy.DEFAULT (#1a2238)
          px: spacing.xl (24px), py: spacing.m (16px)
          rounded TR + BR: radius.s (12px)
          gap between header / user-row / nav: spacing.xxl (32px)
        */}
        <View style={styles.panel}>

          {/* ── Header row: hamburger (left) + close (right) ─────────── */}
          {/* Figma node 2403:1781 */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.iconHit}
              onPress={() => {}}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Menu"
            >
              <HamburgerIcon />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconHit}
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Close menu"
            >
              <CloseIcon />
            </TouchableOpacity>
          </View>

          {/* ── User info row ─────────────────────────────────────────── */}
          {/* Figma node 2336:3826: gap-[10px], items-center */}
          <View style={styles.userRow}>
            <CircularLogoMark size={scale(32)} />
            {/*
              Figma: Cormorant Garamond Italic, font/size/2xl (28px),
              text/paragraph-1 (#f2e2b1 = palette.gold.DEFAULT)
            */}
            <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
          </View>

          {/* ── Navigation content ────────────────────────────────────── */}
          {/*
            ScrollView with flexGrow:1 + justifyContent:'space-between' on
            contentContainer — primary items at top, secondary at bottom on
            large screens; scrollable on small screens when content overflows.
          */}
          <ScrollView
            style={styles.navScroll}
            contentContainerStyle={styles.navContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Primary items — gap-[12px], with 100px dividers */}
            {/* Figma node 2336:3805 */}
            <View style={styles.primaryList}>
              {PRIMARY_ITEMS.map((item, idx) => (
                <React.Fragment key={item.label}>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => { onClose(); onNavigate(item.route); }}
                    style={styles.primaryItem}
                    accessibilityRole="button"
                  >
                    <Text style={styles.primaryText}>{item.label}</Text>
                  </TouchableOpacity>
                  {idx < PRIMARY_ITEMS.length - 1 && <NavDivider />}
                </React.Fragment>
              ))}
            </View>

            {/* Secondary items — no dividers, pushed to bottom */}
            {/* Figma node 2336:3816 */}
            <View style={styles.secondaryList}>
              {SECONDARY_ITEMS.map(item => (
                <TouchableOpacity
                  key={item.label}
                  activeOpacity={0.75}
                  onPress={() => { onClose(); onNavigate(item.route); }}
                  style={styles.secondaryItem}
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
};

export default MirrorSideMenu;

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create<{
  backdrop: ViewStyle;
  drawerOuter: ViewStyle;
  panel: ViewStyle;
  headerRow: ViewStyle;
  iconHit: ViewStyle;
  userRow: ViewStyle;
  userName: TextStyle;
  navScroll: ViewStyle;
  navContent: ViewStyle;
  primaryList: ViewStyle;
  primaryItem: ViewStyle;
  primaryText: TextStyle;
  divider: ViewStyle;
  secondaryList: ViewStyle;
  secondaryItem: ViewStyle;
}>({
  // ── Backdrop ─────────────────────────────────────────────────────────────
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },

  // ── Drawer outer — exact Figma inset positioning ────────────────────────
  // Figma: top 5.63%, right 10.18%, bottom 4.93%, left 0
  // → top=DRAWER_TOP, height=DRAWER_HEIGHT, width=DRAWER_WIDTH
  drawerOuter: {
    position: 'absolute',
    left: 0,
    top: DRAWER_TOP,
    width: DRAWER_WIDTH,
    height: DRAWER_HEIGHT,
  },

  // ── Panel ────────────────────────────────────────────────────────────────
  // Figma: bg/inverse-2 (#1a2238), px-24, py-16, gap-32, rounded TR+BR 12px
  panel: {
    flex: 1,
    backgroundColor: palette.navy.DEFAULT,  // #1a2238 = bg/inverse-2
    borderTopRightRadius: radius.s,          // 12px
    borderBottomRightRadius: radius.s,       // 12px
    paddingHorizontal: scale(spacing.xl),    // 24px
    paddingVertical: verticalScale(spacing.m), // 16px
    gap: verticalScale(spacing.xxl),         // 32px between header/user/nav
  },

  // ── Header row: hamburger + close ────────────────────────────────────────
  // Figma node 2403:1781: justify-between, items-center
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconHit: {
    width: scale(44),
    height: scale(44),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── User row ─────────────────────────────────────────────────────────────
  // Figma node 2336:3826: gap-[10px], items-center, justify-center, w-full
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,                                 // Figma: gap-[10px] (no exact token)
  },

  // Cormorant Italic 28px, gold.DEFAULT (#f2e2b1)
  userName: {
    fontFamily: fontFamily.headingItalic,
    fontSize: scale(fontSize['2xl']),        // 28px
    fontWeight: fontWeight.regular,
    lineHeight: scale(fontSize['2xl']) * 1.3, // 1.3 line height ratio
    color: palette.gold.DEFAULT,             // text/paragraph-1 (#f2e2b1)
    flex: 1,
  },

  // ── Nav scroll + content ─────────────────────────────────────────────────
  // ScrollView takes remaining panel height; content grows to fill it and
  // uses justify-between so secondary items sit at the bottom on tall screens.
  // On short screens the content simply scrolls.
  navScroll: {
    flex: 1,
  },
  navContent: {
    flexGrow: 1,                              // fills scroll height when content < view
    justifyContent: 'space-between',          // primary top, secondary bottom
  },

  // Primary list: gap-[12px] between items
  // Figma node 2336:3805
  primaryList: {
    gap: verticalScale(spacing.s),           // 12px between items (incl. dividers)
  },

  // Each primary item: px-12, py-8, rounded-4, full width
  // Figma node 2336:3806
  primaryItem: {
    paddingHorizontal: scale(spacing.s),     // 12px
    paddingVertical: verticalScale(spacing.xs), // 8px
    borderRadius: radius.xxs,               // 4px
    width: '100%',
  },

  // Cormorant Regular 24px, leading 28px, text/paragraph-2 (#fdfdf9)
  primaryText: {
    fontFamily: fontFamily.heading,          // CormorantGaramond-Regular
    fontSize: scale(fontSize.xl),            // 24px
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.l,               // 28px = font/size/2xl
    color: palette.gold.subtlest,           // #fdfdf9 = text/paragraph-2
  },

  // Divider — left-to-right fade matching Figma imgLine3
  // Width spans ~65% of content area; gradient fades to transparent on right
  divider: {
    width: '65%',
    height: 1,
  },

  // Secondary list: no gap (items have self-padding)
  // Figma node 2336:3816
  secondaryList: {},

  // Each secondary item: p-12 all sides
  // Figma node 2336:3817
  secondaryItem: {
    padding: scale(spacing.s),              // 12px all sides
    width: '100%',
  },
});
