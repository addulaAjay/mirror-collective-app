/**
 * Echo Vault Home Screen
 * Figma: Design-Master-File → Echo Vault Home (767:2513)
 *
 * Layout (top → bottom):
 *   LogoHeader (hamburger / logo / home)
 *   Title row: [spacer] | ECHO VAULT | ⓘ
 *   Hero image (mirror_echo_map.png, 1:1 aspect, full-width minus 20px padding)
 *   Copy text (Body S Inter, 4 lines, #fdfdf9, center)
 *   CTA stack: [START ECHO] / [VIEW VAULT]
 *
 * Tokens used (from Figma variable defs):
 *   Heading/Heading M: Cormorant Regular 28/32 — title
 *   Body S: Inter Regular 16/24 — copy
 *   Text/Paragraph-1 (#f2e1b0) — title
 *   Text/Paragraph-2 (#fdfdf9) — copy
 *   Spacing/L (20), Spacing/M (16), Spacing/S (12), Radius/M (16)
 */

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  borderWidth,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  moderateScale,
  palette,
  scale,
  spacing,
  verticalScale,
} from '@theme';
import type { RootStackParamList } from '@types';
import React from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button/Button';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';

type MirrorEchoNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MirrorEchoVaultHome'
>;

// ── Info icon ────────────────────────────────────────────────────────────────
const InfoIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9.5" stroke={palette.gold.DEFAULT} strokeWidth={1} />
    <Path
      d="M12 8.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM11 11h2v6h-2v-6Z"
      fill={palette.gold.DEFAULT}
    />
  </Svg>
);

// Button width — Figma 176px at 393px reference
const BTN_WIDTH = scale(176);

// ── Screen ───────────────────────────────────────────────────────────────────
export function MirrorEchoContent() {
  const navigation = useNavigation<MirrorEchoNavigationProp>();
  const [showInfo, setShowInfo] = React.useState(false);

  return (
    <BackgroundWrapper style={styles.bg} scrollable>
      <SafeAreaView style={styles.safe}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

        <LogoHeader navigation={navigation} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Figma 767:2844 — flex-col gap:20 items-center */}
          <View style={styles.content}>

            {/* ── Title row ────────────────────────────────────────────── */}
            {/* Figma 767:2863 — justify-between, items-center, w-full */}
            <View style={styles.titleRow}>
              <View style={styles.iconPlaceholder} />

              {/*
                Figma 767:2865 — Heading/Heading M: Cormorant Regular 28/32
                Colour Text/Paragraph-1 (#f2e1b0), textShadow gold warm
              */}
              <Text style={styles.title}>ECHO VAULT</Text>

              <TouchableOpacity
                onPress={() => setShowInfo(true)}
                activeOpacity={0.75}
                style={styles.infoHit}
                accessibilityRole="button"
                accessibilityLabel="About Echo Vault"
              >
                <InfoIcon size={scale(24)} />
              </TouchableOpacity>
            </View>

            {/* ── Hero image ───────────────────────────────────────────── */}
            {/*
              Figma 767:2846 — px:20 (Spacing/L), w-full
              Figma 767:2847 — aspect-[1:1] (328×328), w-full, overflow hidden
              Image source is the mirror echo map (face + constellation).
            */}
            <View style={styles.imageWrapper}>
              <View style={styles.imageSquare}>
                <Image
                  testID="mirror-echo-image"
                  source={require('@assets/mirror_echo_map.png')}
                  style={styles.heroImage}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />
              </View>
            </View>

            {/* ── Copy text ────────────────────────────────────────────── */}
            {/*
              Figma 767:2848 — Body S: Inter Regular 16/24
              Colour Text/Paragraph-2 (#fdfdf9), center, maxWidth 335px
            */}
            <View style={styles.copyWrap}>
              <Text style={styles.copyText}>
                {'Your space.\nYour memories.\nYour story.\nSave it for yourself or someone you love.'}
              </Text>
            </View>

            {/* ── CTA buttons ──────────────────────────────────────────── */}
            {/*
              Figma 767:2849 — flex-col gap:12 items-center, w:176px
              START ECHO uses Translucent White Gradient (more opaque)
              VIEW VAULT uses Transparent White Gradient (more transparent)
              Both use Radius/M (16), border 0.5px, Cormorant 24px gold.
            */}
            <View style={styles.ctaWrap}>
              {/* VIEW VAULT — primary (prominent CTA) */}
              {/* START ECHO — secondary (supporting action) */}
              <Button
                variant="secondary"
                size="L"
                title="START ECHO"
                onPress={() => navigation.navigate('NewEchoScreen')}
                style={{ width: BTN_WIDTH }}
              />
              <Button
                variant="primary"
                size="L"
                title="VIEW VAULT"
                onPress={() => navigation.navigate('MirrorEchoVaultLibrary')}
                style={{ width: BTN_WIDTH }}
              />
            </View>

          </View>
        </ScrollView>

        {/* ── Info Modal ───────────────────────────────────────────────── */}
        <Modal
          visible={showInfo}
          transparent
          animationType="fade"
          onRequestClose={() => setShowInfo(false)}
          statusBarTranslucent
        >
          <View style={styles.modalOverlay}>
            {/*
              Outer wrapper owns the glow shadow (no overflow:hidden so the
              warm gold halo can bleed outward into the dark scrim).
              Inner card clips the gradient to the 13px radius.
              Figma 347:1239: shadow 0 0 15px rgba(229,214,176,0.3)
            */}
            <View style={styles.infoCardGlow}>
              <View style={styles.infoCard}>
                <LinearGradient
                  colors={['rgba(253,253,249,0.01)', 'rgba(253,253,249,0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />

                <View style={styles.closeContainer}>
                  <TouchableOpacity
                    onPress={() => setShowInfo(false)}
                    style={styles.closeButton}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                  >
                    <Svg width={20} height={20} viewBox="0 0 20 20">
                      <Path
                        d="M15.8334 5.34175L14.6584 4.16675L10.0001 8.82508L5.34175 4.16675L4.16675 5.34175L8.82508 10.0001L4.16675 14.6584L5.34175 15.8334L10.0001 11.1751L14.6584 15.8334L15.8334 14.6584L11.1751 10.0001L15.8334 5.34175Z"
                        fill={palette.gold.DEFAULT}
                      />
                    </Svg>
                  </TouchableOpacity>
                </View>

                <Text style={styles.infoTitle}>WELCOME TO{'\n'}ECHO VAULT</Text>
                <Text style={styles.infoSubtitle}>
                  A quiet space to keep what matters most.
                </Text>
                <StarIcon width={scale(20)} height={scale(20)} />
                <Text style={styles.infoBody}>
                  Store your reflections, memories, and messages—kept safe and accessible when they matter most, relayed at a time for moments that matter the most.
                </Text>
                <Text style={styles.infoQuote}>
                  "These are the patterns shaping your becoming."
                </Text>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </BackgroundWrapper>
  );
}

export default function MirrorEchoScreen() {
  return <MirrorEchoContent />;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create<{
  bg: ViewStyle;
  safe: ViewStyle;
  scroll: ViewStyle;
  scrollContent: ViewStyle;
  content: ViewStyle;
  titleRow: ViewStyle;
  iconPlaceholder: ViewStyle;
  title: TextStyle;
  infoHit: ViewStyle;
  imageWrapper: ViewStyle;
  imageSquare: ViewStyle;
  heroImage: ImageStyle;
  copyWrap: ViewStyle;
  copyText: TextStyle;
  ctaWrap: ViewStyle;
  // Modal
  modalOverlay: ViewStyle;
  infoCardGlow: ViewStyle;
  infoCard: ViewStyle;
  closeContainer: ViewStyle;
  closeButton: ViewStyle;
  infoTitle: TextStyle;
  infoSubtitle: TextStyle;
  infoBody: TextStyle;
  infoQuote: TextStyle;
}>({
  bg: {
    flex:            1,
    backgroundColor: palette.navy.deep,
  },
  safe: {
    flex:            1,
    backgroundColor: palette.neutral.transparent,
  },

  scroll: { flex: 1 },
  // No flexGrow:1 — prevents scroll by always filling viewport on small devices
  scrollContent: {
    paddingHorizontal: scale(spacing.xl),
    paddingTop:        verticalScale(spacing.xl),
    paddingBottom:     verticalScale(spacing.xxxl),
  },

  // Figma 767:2844 — flex-col gap:20 items-center, w-full
  content: {
    width:      '100%',
    alignItems: 'center',
    gap:        verticalScale(spacing.l),          // 20px (Spacing/L)
  },

  // Figma 767:2863 — justify-between items-center w-full
  titleRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    width:          '100%',
  },
  iconPlaceholder: {
    width:  scale(44),
    height: scale(24),
  },

  // Heading/Heading M — Cormorant Regular 28/32, Text/Paragraph-1 (#f2e1b0)
  title: {
    flex:       1,
    fontFamily: fontFamily.heading,
    fontSize:   moderateScale(fontSize['2xl']),   // 28px
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.xl,                    // 32px
    color:      palette.gold.DEFAULT,
    textAlign:  'center',
    textShadowColor:  palette.gold.warm,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  infoHit: {
    width:           scale(44),
    height:          scale(44),
    alignItems:      'flex-end',
    justifyContent:  'center',
  },

  // Figma 767:2846 — Spacing/L (20px) horizontal padding, w-full
  imageWrapper: {
    paddingHorizontal: scale(spacing.l),          // 20px
    width:             '100%',
  },

  // Figma 767:2847 — aspect 1:1 (328×328 in Figma), overflow hidden
  imageSquare: {
    width:       '100%',
    aspectRatio: 1,
    overflow:    'hidden',
  },

  heroImage: {
    width:    '100%',
    height:   '100%',
  },

  // Body S — Inter Regular 16/24, Text/Paragraph-2 (#fdfdf9), center, maxWidth 335
  copyWrap: {
    width:      '100%',
    alignItems: 'center',
  },
  copyText: {
    fontFamily: fontFamily.body,
    fontSize:   moderateScale(fontSize.s),        // 16px
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.m,                     // 24px
    color:      palette.gold.subtlest,            // #fdfdf9
    textAlign:  'center',
    maxWidth:   scale(335),
  },

  // Figma 767:2849 — flex-col gap:12 items-center
  ctaWrap: {
    alignItems: 'center',
    gap:        verticalScale(spacing.s),         // 12px (Spacing/S)
  },

  // ── Info Modal ────────────────────────────────────────────────────────────
  // Figma 347:1239 — Echo Vault Information Overlay
  modalOverlay: {
    flex:            1,
    backgroundColor: 'rgba(11,15,28,0.92)',
    justifyContent:  'center',
    alignItems:      'center',
    padding:         scale(spacing.xl),
  },

  // Outer wrapper — owns the warm gold glow. No overflow:hidden so the
  // halo bleeds outward into the dark scrim.
  // Figma: box-shadow 0 0 15px 0 rgba(229,214,176,0.3)
  infoCardGlow: {
    width:         '100%',
    maxWidth:      scale(329),
    borderRadius:  scale(13),
    boxShadow:     '0px 0px 15px 0px rgba(229,214,176,0.3)',
    shadowColor:   palette.gold.warm,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius:  15,
    elevation:     15,
  },

  // Inner card — clips LinearGradient to 13px corners.
  // Figma: bg Transparent White Gradient (0.01→0), border 0.25px #a3b3cc
  //        padding 24px (Spacing/XL), gap 16px between items
  infoCard: {
    width:        '100%',
    borderRadius: scale(13),
    borderWidth:  borderWidth.hairline,             // 0.25px
    borderColor:  palette.navy.light,               // #a3b3cc
    padding:      scale(spacing.xl),                // 24px
    gap:          16,                               // Figma: fixed 16px gap
    alignItems:   'center',
    overflow:     'hidden',
  },

  closeContainer: {
    width:      '100%',
    alignItems: 'flex-end',
  },
  closeButton: {
    width:          scale(20),
    height:         scale(20),
    justifyContent: 'center',
    alignItems:     'center',
  },

  // Figma 347:1240 — Cormorant Regular 24/28, #f2e1b0, text-shadow 0 0 10 #e5d6b0
  infoTitle: {
    fontFamily:       fontFamily.heading,
    fontSize:         moderateScale(fontSize.xl),    // 24px
    fontWeight:       fontWeight.regular,
    lineHeight:       moderateScale(28),             // 28px (font/size/2XL)
    color:            palette.gold.DEFAULT,           // #f2e1b0
    textAlign:        'center',
    letterSpacing:    0,
    textShadowColor:  palette.gold.warm,             // #e5d6b0
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,                            // Figma: 10px
  },

  // Figma 347:1241 — Cormorant Italic 24px, lh 1.3, white
  infoSubtitle: {
    fontFamily:    fontFamily.headingItalic,
    fontSize:      moderateScale(fontSize.xl),
    fontWeight:    fontWeight.regular,
    fontStyle:     'italic',
    lineHeight:    moderateScale(fontSize.xl * 1.3),
    color:         palette.neutral.white,
    textAlign:     'center',
    letterSpacing: 0,
  },

  // Figma 347:1244 — Inter Regular 16/24, white
  infoBody: {
    fontFamily:    fontFamily.body,
    fontSize:      moderateScale(fontSize.s),        // 16px
    fontWeight:    fontWeight.regular,
    lineHeight:    moderateScale(24),                // 24px (line-height/M)
    color:         palette.neutral.white,
    textAlign:     'center',
    letterSpacing: 0,
  },

  // Figma 347:1245 — Inter Italic 14/20, #e5d6b0
  infoQuote: {
    fontFamily:    fontFamily.bodyItalic,
    fontSize:      moderateScale(fontSize.xs),       // 14px
    fontWeight:    fontWeight.regular,
    fontStyle:     'italic',
    lineHeight:    moderateScale(20),                // 20px (line-height/S)
    color:         palette.gold.warm,               // #e5d6b0
    textAlign:     'center',
    letterSpacing: 0,
  },
});
