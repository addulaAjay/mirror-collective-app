import { palette, textShadow } from '@theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@types';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { AGENCY_ICON_SVG, AGENCY_NODE_SVG, CLARITY_ICON_SVG, CLARITY_NODE_SVG, CONNECTING_LINES_SVG, ECHO_MAP_SVG, GRIEF_ICON_SVG, GRIEF_NODE_SVG, OVERWHELM_ICON_SVG, OVERWHELM_NODE_SVG, PRESSURE_ICON_SVG, PRESSURE_NODE_SVG, SELF_SILENCING_ICON_SVG, SELF_SILENCING_NODE_SVG } from '@assets/reflection-room-ech0-map-assets/ReflectionRoomEchoMapAssets';
import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Design-space constants derived from the Figma SVG (viewBox 0 0 345 520)
// Ring bounding box: (37,66)→(309,338) = 272×272
// Node centers (raw design coords):
//   Clarity(173,50) Self-silencing(62,64) Pressure(290,133)
//   Grief(295,362) Agency(50,334) Overwhelm(167,402)
// Content height covers through bottom of Overwhelm circle (402+50=452)
const DESIGN_CONTENT_WIDTH = 345;
const DESIGN_CONTENT_HEIGHT = 452;
const RING_SVG_SIZE = 272;
const RING_OFFSET_X = 37;
const RING_OFFSET_Y = 66;
const NODE_DESIGN_RADIUS = 50;

const PADDING_H = Math.max(20, screenWidth * 0.051);
const AVAILABLE_WIDTH = screenWidth - PADDING_H * 2;
const SCALE = Math.min(1, AVAILABLE_WIDTH / DESIGN_CONTENT_WIDTH);

const MAP_WIDTH = Math.round(DESIGN_CONTENT_WIDTH * SCALE);
const MAP_HEIGHT = Math.round(DESIGN_CONTENT_HEIGHT * SCALE);
const RING_RENDER_SIZE = Math.round(RING_SVG_SIZE * SCALE);
const NODE_SIZE = Math.round(100 * SCALE);
const POPUP_WIDTH = Math.round(180 * SCALE);
const POPUP_ICON_SIZE = Math.round(36 * SCALE);

type EchoNode = {
  label: string;
  cx: number;
  cy: number;
  customSvg: string;
  iconSvg: string;
  description: string;
};

const INFO_PAGES = [
  {
    title: 'WHAT IS THE\nECHO MAP?',
    body: 'The Echo Map shows how your inner patterns move over time \u2014 stress, clarity, grief, confidence, pressure. The closer a pattern is to you, the more it\u2019s influencing your mood, energy, and decisions right now.  As it softens, it moves outward.\n\nThis isn\u2019t a score.  It\u2019s awareness \u2014 made visible.',
    sub: 'If you can see the pattern, you can change it. If you can\u2019t, it quietly runs the show.',
  },
  {
    title: 'HOW TO READ\nYOUR ECHO MAP',
    body: null,
    richBody: true,
    sub: 'Patterns move as you do.\nSmall shifts add up.\nThis map isn\u2019t you \u2014 it reflects what you\u2019re working through.',
  },
];

const ECHO_NODES: EchoNode[] = [
  { label: 'Clarity', cx: 173, cy: 50, customSvg: CLARITY_NODE_SVG, iconSvg: CLARITY_ICON_SVG, description: 'Your mind is sorting the noise. Decisions and next steps feel easier to see.' },
  { label: 'Self-silencing', cx: 62, cy: 64, customSvg: SELF_SILENCING_NODE_SVG, iconSvg: SELF_SILENCING_ICON_SVG, description: 'You may be holding back your needs or opinions to avoid conflict, judgment, or disappointment.' },
  { label: 'Pressure', cx: 290, cy: 133, customSvg: PRESSURE_NODE_SVG, iconSvg: PRESSURE_ICON_SVG, description: 'You\'re in "I have to" mode \u2014 urgency, expectations, or fear of falling behind may be driving you.' },
  { label: 'Grief', cx: 295, cy: 362, customSvg: GRIEF_NODE_SVG, iconSvg: GRIEF_ICON_SVG, description: 'You\'re processing loss or change. Slowing down and being gentle may help it soften.' },
  { label: 'Agency', cx: 50, cy: 334, customSvg: AGENCY_NODE_SVG, iconSvg: AGENCY_ICON_SVG, description: 'You\'re regaining choice and traction. Even a small action can shift momentum right now.' },
  { label: 'Overwhelm', cx: 167, cy: 402, customSvg: OVERWHELM_NODE_SVG, iconSvg: OVERWHELM_ICON_SVG, description: 'Too many inputs at once. Your system may need simplification before it can move.' },
];

const ReflectionRoomEchoMapScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedNode, setSelectedNode] = useState<EchoNode | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [infoPage, setInfoPage] = useState(0);

  const getPopupPosition = (node: EchoNode) => {
    let left = Math.round(node.cx * SCALE - POPUP_WIDTH / 2);
    left = Math.max(2, Math.min(left, MAP_WIDTH - POPUP_WIDTH - 2));

    const estHeight = POPUP_WIDTH;
    let top = Math.round((node.cy + NODE_DESIGN_RADIUS) * SCALE + 4);
    if (top + estHeight > MAP_HEIGHT) {
      top = Math.round((node.cy - NODE_DESIGN_RADIUS) * SCALE - estHeight - 4);
    }
    top = Math.max(2, top);

    return { left, top };
  };

  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >


          <View style={styles.titleRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Image
                source={require('@assets/back-arrow.png')}
                style={styles.backArrowImg}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text style={styles.title}>ECHO MAP</Text>
            <TouchableOpacity style={styles.infoBtn} onPress={() => { setShowInfo(true); setInfoPage(0); }}>              
              <Text style={styles.infoIcon}>              
                <Image
                source={require('@assets/rr-info-icon.png')}
                style={styles.backArrowImg}
                resizeMode="contain"
              /></Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Patterns don't disappear when you ignore them. They change when you see them.
          </Text>

          <View style={styles.mapWrapper}>
            <View style={styles.linesOverlay}>
              <SvgXml xml={CONNECTING_LINES_SVG} width={MAP_WIDTH} height={MAP_HEIGHT} />
            </View>

            <View style={styles.svgWrapper}>
              <SvgXml xml={ECHO_MAP_SVG} width={RING_RENDER_SIZE} height={RING_RENDER_SIZE} />
            </View>

            {ECHO_NODES.map(node => (
              <TouchableOpacity
                key={node.label}
                activeOpacity={0.7}
                onPress={() => setSelectedNode(selectedNode?.label === node.label ? null : node)}
                style={[
                  styles.echoNode,
                  {
                    top: Math.round((node.cy - NODE_DESIGN_RADIUS) * SCALE),
                    left: Math.round((node.cx - NODE_DESIGN_RADIUS) * SCALE),
                    width: NODE_SIZE,
                    height: NODE_SIZE,
                    borderRadius: NODE_SIZE / 2,
                  },
                ]}
              >
                <SvgXml xml={node.customSvg} width={NODE_SIZE} height={NODE_SIZE} />
              </TouchableOpacity>
            ))}

            {selectedNode && (
                <LinearGradient
                  colors={['rgba(223, 227, 236, 0.85)', 'rgba(159, 171, 198, 0.85)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={[styles.popupCard, getPopupPosition(selectedNode)]}
                >
                  <SvgXml xml={selectedNode.iconSvg} width={POPUP_ICON_SIZE} height={POPUP_ICON_SIZE} />
                  <Text style={styles.popupText}>{selectedNode.description}</Text>
                </LinearGradient>
            )}
          </View>

          <Text style={styles.tagline}>
            This map isn't you — it reflects what you're working through.
          </Text>

          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => navigation.navigate('ReflectionRoomMirrorMoment')}
          >
            <Text style={styles.ctaText}>MIRROR MOMENT</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
      {selectedNode && (
        <Pressable
          style={styles.popupDismiss}
          onPress={() => setSelectedNode(null)}
        />
      )}
      {showInfo && (
        <Pressable style={styles.infoOverlay} onPress={() => setShowInfo(false)}>
          <Pressable style={styles.infoPopupContainer} onPress={e => e.stopPropagation()}>
            <TouchableOpacity style={styles.infoCloseBtn} onPress={() => setShowInfo(false)}>
              <Text style={styles.infoCloseText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.infoTitle}>{INFO_PAGES[infoPage].title}</Text>
            {INFO_PAGES[infoPage].body && (
              <Text style={styles.infoBody}>{INFO_PAGES[infoPage].body}</Text>
            )}
            {INFO_PAGES[infoPage].richBody && (
              <View style={styles.infoRichBody}>
                <Text style={styles.infoItalicLine}>Distance = influence</Text>
                <View style={styles.infoBullet}>
                  <Text style={styles.infoBulletDot}>•  </Text>
                  <Text style={styles.infoBody}><Text style={styles.infoBold}>Near YOU:</Text> Actively shaping how you feel, think, or react right now.</Text>
                </View>
                <View style={styles.infoBullet}>
                  <Text style={styles.infoBulletDot}>•  </Text>
                  <Text style={styles.infoBody}><Text style={styles.infoBold}>Middle orbit:</Text> Still present, but no longer in control.</Text>
                </View>
                <View style={styles.infoBullet}>
                  <Text style={styles.infoBulletDot}>•  </Text>
                  <Text style={styles.infoBody}><Text style={styles.infoBold}>Outer orbit:</Text> Easing. Less pull. Integration happening.</Text>
                </View>
              </View>
            )}
            <Text style={styles.infoSub}>{INFO_PAGES[infoPage].sub}</Text>
            <View style={styles.infoNavRow}>
              {infoPage > 0 ? (
                <TouchableOpacity onPress={() => setInfoPage(infoPage - 1)}>
                  <Image source={require('@assets/back-arrow.png')} style={styles.infoArrowImg} resizeMode="contain" />
                </TouchableOpacity>
              ) : <View style={styles.infoArrowPlaceholder} />}
              {infoPage < INFO_PAGES.length - 1 ? (
                <TouchableOpacity onPress={() => setInfoPage(infoPage + 1)}>
                  <Image source={require('@assets/right-arrow.png')} style={styles.infoArrowImg} resizeMode="contain" />
                </TouchableOpacity>
              ) : <View style={styles.infoArrowPlaceholder} />}
            </View>
          </Pressable>
        </Pressable>
      )}
    </BackgroundWrapper>
  );
};

export default ReflectionRoomEchoMapScreen;

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: palette.navy.deep,
  },
  bgImage: {
    resizeMode: 'cover',
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: Math.max(20, screenWidth * 0.051),
    paddingBottom: Math.max(40, screenHeight * 0.05),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: Math.max(16, screenHeight * 0.02),
    marginBottom: Math.max(16, screenHeight * 0.02),
  },
  backBtn: {
    width: 30,
    height: 30,
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 24,
    color: palette.gold.DEFAULT,
  },
  title: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 32,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    letterSpacing: 1,
    flex: 1,
    marginHorizontal: 8,
  },
  infoBtn: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  infoIcon: {
    fontSize: 20,
    color: palette.gold.DEFAULT,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: palette.gold.subtlest,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Math.max(24, screenHeight * 0.03),
    paddingHorizontal: 8,
  },
  mapWrapper: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    position: 'relative',
    marginBottom: Math.max(20, screenHeight * 0.025),
  },
  linesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
  },
  svgWrapper: {
    position: 'absolute',
    top: Math.round(RING_OFFSET_Y * SCALE),
    left: Math.round(RING_OFFSET_X * SCALE),
  },
  echoNode: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.navy.DEFAULT,
    overflow: 'hidden',
  },
  echoNodeCustom: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  popupDismiss: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 10,
  },
  popupCard: {
    position: 'absolute',
    width: POPUP_WIDTH,
    padding: 10,
    borderRadius: 12,
    borderWidth: 0,
    borderColor: palette.navy.light,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 16,
  },
  popupText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: palette.neutral.white,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
  echoNodeText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: palette.neutral.white,
    textAlign: 'center',
    lineHeight: 20,
  },
  tagline: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 20,
    color: palette.gold.subtlest,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: Math.max(24, screenHeight * 0.03),
    paddingHorizontal: 8,
  },
  ctaButton: {
    width: Math.min(screenWidth * 0.85, 340),
    height: 56,
    backgroundColor: 'rgba(253,253,249,0.15)',
    borderWidth: 0.5,
    borderColor: palette.navy.light,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 22,
    color: palette.gold.DEFAULT,
    letterSpacing: 1,
  },
  secondaryButton: {
    width: Math.min(screenWidth * 0.85, 340),
    height: 56,
    backgroundColor: 'transparent',
    borderWidth: 0.5,
    borderColor: palette.navy.light,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 22,
    color: palette.navy.light,
    letterSpacing: 1,
  },
  backArrowImg: {
    width: 24,
    height: 24,
    tintColor: palette.gold.DEFAULT,
  },
  infoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoPopupContainer: {
    width: 329,
    backgroundColor: 'rgba(20, 25, 40, 0.95)',
    borderRadius: 13,
    borderWidth: 0.25,
    borderColor: palette.navy.muted,
    padding: 24,
    shadowColor: palette.gold.DEFAULT,
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
    color: palette.gold.DEFAULT,
    fontWeight: '300',
  },
  infoTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 28,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 16,
    marginTop: 8,
    textShadowColor: textShadow.glowSubtle.color,
    textShadowOffset: textShadow.glowSubtle.offset,
    textShadowRadius: textShadow.glowSubtle.radius,
  },
  infoBody: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: palette.neutral.white,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  infoSub: {
    fontFamily: 'Inter-Italic',
    fontSize: 15,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 16,
  },
  infoRichBody: {
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 8,
  },
  infoItalicLine: {
    fontFamily: 'Inter-Italic',
    fontSize: 18,
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
    fontFamily: 'Inter',
    fontSize: 16,
    color: palette.neutral.white,
    lineHeight: 24,
  },
  infoBold: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: palette.neutral.white,
  },
  infoNavRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  infoArrowImg: {
    width: 28,
    height: 28,
    tintColor: palette.gold.DEFAULT,
  },
  infoArrowPlaceholder: {
    width: 28,
    height: 28,
  },
});
