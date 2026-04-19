import { useNavigation } from '@react-navigation/native';
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
  glassGradient,
  spacing,
  scale,
  verticalScale,
  moderateScale,
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
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button/Button';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';

type MirrorEchoNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MirrorEchoVaultHome'
>;

// ── Info icon (Material outlined) ───────────────────────────────────────────
const InfoIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9.5" stroke={palette.gold.DEFAULT} strokeWidth={1} />
    <Path
      d="M12 8.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM11 11h2v6h-2v-6Z"
      fill={palette.gold.DEFAULT}
    />
  </Svg>
);

// ── Button width: Figma 176px at 393px reference ────────────────────────────
const BTN_WIDTH = scale(176);

// ── Shared button prop overrides (applied to both CTA buttons) ──────────────
// Figma: radius.m (16px), borderWidth.thin (0.5px), py-12, px-16, text 24px
const BTN_CONTAINER_STYLE: ViewStyle = {
  borderRadius: radius.m,
  borderWidth: borderWidth.thin,
};
const BTN_CONTENT_STYLE: ViewStyle = {
  paddingVertical: verticalScale(spacing.s),   // 12px
  paddingHorizontal: scale(spacing.m),         // 16px
  minWidth: 0,
};
const BTN_TEXT_STYLE: TextStyle = {
  fontFamily: fontFamily.heading,              // CormorantGaramond-Regular
  fontSize: moderateScale(fontSize.xl),        // 24px
  lineHeight: moderateScale(fontSize['2xl']),  // 28px (font/size/2xl)
  color: palette.gold.DEFAULT,
};

// ── Screen ──────────────────────────────────────────────────────────────────
export function MirrorEchoContent() {
  const navigation = useNavigation<MirrorEchoNavigationProp>();
  const [showInfo, setShowInfo] = React.useState(false);

  return (
    <BackgroundWrapper style={styles.bg} scrollable>
      <SafeAreaView style={styles.safe}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

        <LogoHeader navigation={navigation} />

        {/*
          NO flexGrow:1 on scrollContent — that prevents scrolling by always
          expanding to fill the viewport. Content has natural height and will
          scroll when it overflows on small devices (iPhone SE etc.)
        */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/*
            Figma node 767:2844 — flex-col gap-[20px] items-center
            width:'100%' is required so nested children with width:'100%'
            resolve against scroll content width, not an undefined parent.
          */}
          <View style={styles.content}>

            {/* ── Title row: spacer | MIRROR ECHO | info ───────────────── */}
            {/* Figma node 767:2863: justify-between, items-center, w-full */}
            <View style={styles.titleRow}>
              {/* Equal-size spacer keeps title visually centred */}
              <View style={styles.iconPlaceholder} />

              {/*
                Figma node 767:2865:
                Cormorant Regular 28px, lineHeight 32px, gold.DEFAULT,
                textShadow: 0 0 20px #e5d6b0
              */}
              <Text style={styles.title}>MIRROR ECHO</Text>

              {/* Figma node 1232:1108 — info button, 24px */}
              <TouchableOpacity
                onPress={() => setShowInfo(true)}
                activeOpacity={0.75}
                style={styles.infoHit}
                accessibilityRole="button"
                accessibilityLabel="About Mirror Echo"
              >
                <InfoIcon size={scale(24)} />
              </TouchableOpacity>
            </View>

            {/* ── Echo map image ────────────────────────────────────────── */}
            {/*
              Figma node 767:2846: px-[20px] (spacing.l), w-full
              Figma node 767:2847: aspect-[328/328] (1:1), w-full
              Image overflows slightly (left -12.91%, size 125.81%) to show
              the face — cropped by overflow:hidden on imageSquare.
              Edge blending: 4 LinearGradient overlays fade the hard image
              boundary into the background colour (navy.deep).
            */}
            <View >
              <View >
                <Image
                  testID="mirror-echo-image"
                  source={require('../../assets/mirror_echo_map.png')}
                  
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />
              </View>
            </View>

            {/* ── Copy text ─────────────────────────────────────────────── */}
            {/*
              Figma node 767:2848:
              Inter Regular 16px, lineHeight 24px, gold.subtlest (#fdfdf9)
              Two paragraphs, centre-aligned, maxWidth 335px
            */}
            <View style={styles.copyWrap}>
              <Text style={styles.copyText}>
                {'Become the architect of your own story.\nSave what you\u2019ve learned, loved, and lived \u2014 in a private vault that\u2019s yours.'}
              </Text>
            </View>

            {/* ── CTA buttons ───────────────────────────────────────────── */}
            {/*
              Figma node 767:2849: flex-col gap-[12px] items-center w-[176px]

              Using <Button variant="gradient"> from @components/Button.
              Override: borderRadius → radius.m (16px), borderWidth → 0.5px,
              padding → py-12 / px-16, text → Cormorant 24px gold.
            */}
            <View style={styles.ctaWrap}>
              {/* START ECHO — gradient from rgba(253,253,249,0.03) to rgba(253,253,249,0.2) */}
              <Button
                variant="gradient"
                title="START ECHO"
                onPress={() => navigation.navigate('NewEchoScreen')}
                gradientColors={[glassGradient.echoPrimary.start, glassGradient.echoPrimary.end]}
                style={{ width: BTN_WIDTH, borderRadius: radius.m }}
                containerStyle={BTN_CONTAINER_STYLE}
                contentStyle={BTN_CONTENT_STYLE}
                textStyle={BTN_TEXT_STYLE}
              />

              {/*
                VIEW VAULT — gradient from rgba(253,253,249,0.01) to rgba(253,253,249,0)
                Text adds warm glow: 0 0 9px rgba(229,214,176,0.5) (Figma spec)
              */}
              <Button
                variant="gradient"
                title="VIEW VAULT"
                onPress={() => navigation.navigate('MirrorEchoVaultLibrary')}
                gradientColors={[glassGradient.echoSecondary.start, glassGradient.echoSecondary.end]}
                style={{ width: BTN_WIDTH, borderRadius: radius.m }}
                containerStyle={BTN_CONTAINER_STYLE}
                contentStyle={BTN_CONTENT_STYLE}
                textStyle={{
                  ...BTN_TEXT_STYLE,
                  textShadowColor: textShadow.warmGlow.color,
                  textShadowOffset: textShadow.warmGlow.offset,
                  textShadowRadius: textShadow.warmGlow.radius,
                }}
              />
            </View>

          </View>
        </ScrollView>

        {/* ── Info Modal ─────────────────────────────────────────────────── */}
        <Modal
          visible={showInfo}
          transparent
          animationType="fade"
          onRequestClose={() => setShowInfo(false)}
          statusBarTranslucent
        >
          <View style={styles.modalOverlay}>
            <View style={styles.infoCard}>
              {/* Close button container */}
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

              <Text style={styles.infoTitle}>WELCOME TO MIRROR ECHO</Text>

              <Text style={styles.infoSubtitle}>A space to see yourself clearly</Text>

              {/* Decorative star icon */}
              <StarIcon width={28} height={28} />

              <Text style={styles.infoBody}>
                Each day, you'll receive your Echo Signature—a gentle snapshot of the emotional patterns, metaphors, and themes moving through you now.
              </Text>

              <Text style={styles.infoQuote}>
                "These are the patterns shaping your becoming."
              </Text>
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

// ── Styles ───────────────────────────────────────────────────────────────────

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
  copyWrap: ViewStyle;
  copyText: TextStyle;
  ctaWrap: ViewStyle;
  // Modal
  modalOverlay: ViewStyle;
  infoCard: ViewStyle;
  closeContainer: ViewStyle;
  closeButton: ViewStyle;
  infoTitle: TextStyle;
  infoSubtitle: TextStyle;
  infoBody: TextStyle;
  infoQuote: TextStyle;
}>({
  bg: {
    flex: 1,
    backgroundColor: palette.navy.deep,
  },
  safe: {
    flex: 1,
    backgroundColor: palette.neutral.transparent,
  },

  // ── Scroll ─────────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  // No flexGrow:1 — prevents scroll by always filling viewport
  scrollContent: {
    paddingHorizontal: scale(spacing.xl),         // 24px — Figma 6.11%
    paddingTop: verticalScale(spacing.xl),
    paddingBottom: verticalScale(spacing.xxxl),
  },

  // ── Outer column ───────────────────────────────────────────────────────────
  // width:'100%' is critical — without it, children's width:'100%' resolves
  // against undefined and may collapse or overflow unpredictably.
  content: {
    width: '100%',
    alignItems: 'center',
    gap: verticalScale(spacing.l),                // 20px = spacing.l
  },

  // ── Title row ──────────────────────────────────────────────────────────────
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },

  iconPlaceholder: {
    width: scale(44),   // matches infoHit hit-area width
    height: scale(24),
  },

  // Figma: Cormorant Regular 28px, lineHeight 32px, gold, glow 0 0 20px #e5d6b0
  title: {
    flex: 1,
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize['2xl']),      // 28px
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.xl,                     // 32px
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    textShadowColor: palette.gold.warm,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  // 44pt minimum touch target
  infoHit: {
    width: scale(44),
    height: scale(44),
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  // ── Copy text ──────────────────────────────────────────────────────────────
  // Figma: Inter Regular 16px, lineHeight 24px, gold.subtlest (#fdfdf9), center
  copyWrap: {
    width: '100%',
    alignItems: 'center',
  },
  copyText: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.s),           // 16px
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.m,                      // 24px
    color: palette.gold.subtlest,
    textAlign: 'center',
    maxWidth: scale(335),
  },

  // ── CTA ────────────────────────────────────────────────────────────────────
  // Figma: flex-col gap-[12px] items-center
  ctaWrap: {
    alignItems: 'center',
    gap: verticalScale(spacing.s),                // 12px
  },

  // ── Info Modal ─────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11,15,28,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(spacing.xl),
  },
  infoCard: {
    width: '100%',
    maxWidth: scale(329),
    backgroundColor: 'rgba(253,253,249,0.01)',
    borderRadius: scale(13),
    borderWidth: borderWidth.hairline,
    borderColor: 'rgba(163,179,204,1)',
    padding: scale(spacing.xl),         // 24px all sides
    gap: verticalScale(spacing.m),      // 16px between items
    alignItems: 'center',
    shadowColor: palette.gold.warm,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
  },
  closeContainer: {
    width: '100%',
    alignItems: 'flex-end',
  },
  closeButton: {
    width: scale(20),
    height: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTitle: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize.xl),
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(28),
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: palette.gold.warm,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  infoSubtitle: {
    fontFamily: fontFamily.headingItalic,
    fontSize: moderateScale(fontSize.xl),
    fontWeight: fontWeight.regular,
    fontStyle: 'italic',
    lineHeight: moderateScale(31.2),
    color: palette.neutral.white,
    textAlign: 'center',
    letterSpacing: 0,
  },
  infoBody: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.s),
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(24),
    color: palette.neutral.white,
    textAlign: 'center',
    letterSpacing: 0,
  },
  infoQuote: {
    fontFamily: fontFamily.bodyItalic,
    fontSize: moderateScale(fontSize.xs),
    fontWeight: fontWeight.regular,
    fontStyle: 'italic',
    lineHeight: moderateScale(20),
    color: palette.gold.warm,
    textAlign: 'center',
    letterSpacing: 0,
  },
});
