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
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import { palette } from '@theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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

const ReflectionRoomLandingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [ambientOn, setAmbientOn] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [infoPage, setInfoPage] = useState(0);

  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          

          {/* Frame 600: 345x84, HORIZONTAL, pa=CENTER, ca=CENTER
              No back button. Title centered with info icon absolutely pinned right. */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>REFLECTION ROOM</Text>
            {/* Frame 612: 24x84, vertically centered info icon */}
            <View style={styles.infoWrapper}>
              <TouchableOpacity onPress={() => { setShowInfo(true); setInfoPage(0); }}>
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
            {'Where awareness turns into real change.\nSmall moments. Real change. Over time.\nA quick reflection unlocks the room \nyou need right now.'}
          </Text>

          {/* START: Component 2 — 104x55, r=12, border=palette.navy.light 0.5 */}
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate('ReflectionRoomQuiz' as never)}
            activeOpacity={0.8}
          >
            <Text style={styles.startText}>START</Text>
          </TouchableOpacity>

          {/* Frame 95: 345x32, HORIZONTAL, gap=20, pa=CENTER — centered together */}
          <View style={styles.ambientRow}>
            <Text style={styles.ambientLabel}>Ambient Sounds</Text>
            {/* Custom toggle: 60x32, bg=palette.navy.light, r=16, border=palette.navy.border 1px */}
            <TouchableOpacity
              style={[styles.toggle, ambientOn && styles.toggleOn]}
              onPress={() => setAmbientOn(v => !v)}
              activeOpacity={0.9}
            >
              <View style={[styles.thumb, ambientOn && styles.thumbOn]} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
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

export default ReflectionRoomLandingScreen;

const CONTENT_WIDTH = Math.min(screenWidth - 40, 345);

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
  // Frame 527: VERTICAL, gap=40, pa=SPACE_BETWEEN, ca=CENTER
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: Math.max(20, screenWidth * 0.051),
    paddingBottom: Math.max(40, screenHeight * 0.05),
    gap: 40,
  },

  // Frame 600: 345x84, title centered, info icon absolute right
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: CONTENT_WIDTH,
    height: 84,
  },
  // Title: Figma 217x84 — fixed width forces 2-line wrap, centered in row
  title: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 32,
    fontWeight: '400',
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    lineHeight: 38,
    width: 217,
  },
  // Frame 612: 24x84, absolute top-right — separate from title text
  infoWrapper: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 24,
    height: 84,
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
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400',
    color: palette.gold.subtlest,
    textAlign: 'center',
    lineHeight: 24,
    width: 317,
  },

  // START: 104x55, r=12, border=palette.navy.light 0.5
  startButton: {
    width: 104,
    height: 55,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: palette.navy.light,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 24,
    fontWeight: '400',
    color: palette.gold.DEFAULT,
    letterSpacing: 1,
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
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    fontWeight: '400',
    color: palette.gold.warm,
  },

  // Custom toggle: 60x32, bg=palette.navy.light, r=16, border=palette.navy.border 1px, padding=4
  toggle: {
    width: 60,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.navy.light,
    borderWidth: 1,
    borderColor: palette.navy.border,
    padding: 4,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: palette.gold.dark,
    borderColor: palette.gold.dark,
  },
  // Thumb: Ellipse 1 — 24x24, palette.gold.subtlest
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.gold.subtlest,
    alignSelf: 'flex-start',
  },
  thumbOn: {
    alignSelf: 'flex-end',
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
    textShadowColor: 'rgba(242, 226, 177, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
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
