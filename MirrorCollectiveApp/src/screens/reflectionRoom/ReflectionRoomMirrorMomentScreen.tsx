import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@types';
import React from 'react';
import {
  Dimensions,
  Image,
  Platform,
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

import { MOTIF_SVG } from '@assets/motifs-icons/MotifIconAssets';
import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import { palette } from '@theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type PracticeChoice = {
  label: string;
  instructions: string;
};

const PRACTICE_CHOICES: PracticeChoice[] = [
  {
    label: 'AGENCY',
    instructions: 'Hand to heart.\nInhale for 4, exhale for 6.\nWhisper: "I can choose."',
  },
  {
    label: 'FLOW',
    instructions: 'Hand to heart.\nInhale for 4, exhale for 6.\nWhisper: "I trust my pace."',
  },
  {
    label: 'SOFTEN GRIEF',
    instructions: 'Hand to heart.\nInhale for 4, exhale for 6.\nWhisper: "I allow myself to soften."',
  },
];

const INFO_PAGES = [
  {
    title: 'WHAT IS A MIRROR MOMENT?',
    body: 'A Mirror Moment is a 2-minute reset for real life. It helps you interrupt stress, emotion, or autopilot before it runs the show. You\u2019ll use breath, simple focus, and language to calm your nervous system \u2014 so you can respond with intention instead of reacting on instinct.\n\nYour life isn\u2019t shaped by big breakthroughs. It\u2019s shaped by tiny moments where you pause and choose differently.',
  },
  {
    title: 'WHEN SHOULD I USE IT?',
    body: '\u2022 When you feel overwhelmed or emotionally tight\n\u2022 Before a hard conversation\n\u2022 When your thoughts are spiraling\n\u2022 When you want to reset without overthinking',
  },
  {
    title: 'WHAT HAPPENS AFTER?',
    body: 'Each Mirror Moment gently updates your Reflection Room \u2014 helping you see what\u2019s shifting over time, not just how you feel right now.',
  },
];

const WAVE_SVG = `<svg width="345" height="161" viewBox="0 0 345 161" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 138.379C11.8463 139.798 24.4967 139.249 35.2048 130.353C37.9302 128.097 40.5302 125.159 42.7125 121.721C43.6367 120.432 44.4198 118.947 45.1403 117.405C47.26 112.563 48.5287 106.942 50.0166 101.51L61.8316 57.2224C65.9614 42.4436 69.5221 27.3037 75.4949 13.9281C78.6431 7.1172 83.3941 2.22649 88.7091 0.765835C96.5248 -1.58105 105.103 1.43872 110.929 10.2026C123.428 29.1172 126.404 62.5563 131.625 87.5761C133.954 98.695 136.277 110.298 141.55 118.767C145.027 124.347 149.862 126.152 154.707 124.347C155.934 123.977 157.197 123.534 158.518 123.239C162.544 122.164 166.767 124.035 170.109 127.67C174.609 132.315 177.152 140.258 179.12 147.734C180.112 151.024 180.854 154.807 182.801 156.883C186.821 160.289 191.045 149.924 193.123 145.452C201.941 125.553 211.84 87.8879 228.907 84.6958C234.264 83.8506 239.829 86.1482 243.964 91.5231C249.143 97.9811 252.135 107.582 254.652 116.879C257.46 125.61 263.673 129.73 269.322 132.585C274.126 134.899 279.127 136.171 284.108 137.222C304.235 141.399 324.758 140.077 345 138.371C321.61 141.522 282.521 147.545 261.449 131.158C257.915 128.22 254.547 124.117 252.772 118.315C252.187 116.387 251.749 114.59 251.211 112.793C249.175 105.752 246.502 98.9412 242.664 94.0915C238.89 89.1844 233.909 87.2232 229.126 87.9617C216.946 90.3579 208.994 111.767 202.928 126.825C200.27 133.628 197.748 140.594 194.851 147.307C192.084 153.387 187.369 164.449 181.736 159.706C179.324 157.326 178.311 152.846 177.209 149.038C174.614 138.896 171.158 129.869 164.094 126.841C161.108 125.586 158.283 126.529 155.114 127.563C147.909 130.189 141.723 125.783 137.509 116.338C124.76 87.4858 125.558 29.9706 106.664 9.04559C99.7879 1.80798 89.4557 1.20075 82.4074 8.06909C76.1475 14.6338 73.1454 26.1467 69.8823 36.5518C63.7686 57.5014 57.7541 81.6104 51.9693 102.806C49.8235 110.093 47.8813 118.225 43.8455 123.551C42.0077 126.308 39.7366 128.77 37.5438 130.764C26.1883 140.611 12.5825 140.758 0.0156628 138.371L0 138.379Z" fill="url(#paint0_linear_570_8909)"/>
<defs>
<linearGradient id="paint0_linear_570_8909" x1="345" y1="80.4284" x2="0" y2="80.4284" gradientUnits="userSpaceOnUse">
<stop stop-color="{palette.gold.mid}"/>
<stop offset="0.495192" stop-color="{palette.gold.active}"/>
<stop offset="1" stop-color="{palette.gold.warm}"/>
</linearGradient>
</defs>
</svg>`;

const ReflectionRoomMirrorMomentScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedPractice, setSelectedPractice] = React.useState<PracticeChoice | null>(null);
  const [showInfo, setShowInfo] = React.useState(false);
  const [infoPage, setInfoPage] = React.useState(0);

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
            <Text style={styles.title}>MIRROR MOMENT</Text>
            <View style={styles.titleSpacer} />
          </View>
          <TouchableOpacity style={styles.infoButton} onPress={() => { setShowInfo(true); setInfoPage(0); }}>
            <Image
              source={require('@assets/rr-info-icon.png')}
              style={styles.backArrowImg}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <SvgXml
            xml={WAVE_SVG}
            width={Math.min(345, screenWidth * 0.88)}
            height={160}
            style={styles.waveImage}
          />

          <Text style={styles.description}>
            A two-minute reset to help you calm your body, clear your head, and choose how you want to respond next.
          </Text>

          <View style={styles.practiceChoices}>
            {PRACTICE_CHOICES.map(choice => (
              <TouchableOpacity
                key={choice.label}
                activeOpacity={0.8}
                onPress={() => setSelectedPractice(choice)}
              >
                <LinearGradient
                  colors={['rgba(253, 253, 249, 0.03)', 'rgba(253, 253, 249, 0.20)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.choiceButton}
                >
                  <Text style={styles.choiceText}>{choice.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.reflectionRoomRow}
            onPress={() => navigation.navigate('ReflectionRoomCore' as never)}
            activeOpacity={0.8}
          >
            <Text style={styles.reflectionRoomText}>My Reflection Room</Text>
            <Image
              source={require('@assets/right-arrow.png')}
              style={styles.backArrowImg}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
      {selectedPractice && (
        <Pressable
          style={styles.popupOverlay}
          onPress={() => setSelectedPractice(null)}
        >
          <Pressable style={styles.popupContainer} onPress={e => e.stopPropagation()}>
            <LinearGradient
              colors={[palette.gold.glow, palette.gold.amber]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.goldenBox}
            >
              <Text style={styles.popupTitle}>TWO MINUTE PRACTICE</Text>
              <SvgXml xml={MOTIF_SVG.feather} width={40} height={40} />
              <Text style={styles.popupInstructions}>{selectedPractice.instructions}</Text>
            </LinearGradient>
            <Text style={styles.popupSubtext}>{'Take a moment to notice how you feel.\nThe Mirror remembers'}</Text>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setSelectedPractice(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.doneButtonText}>DONE</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      )}
      {showInfo && (
        <Pressable
          style={styles.popupOverlay}
          onPress={() => setShowInfo(false)}
        >
          <Pressable style={styles.infoPopupContainer} onPress={e => e.stopPropagation()}>
            <TouchableOpacity
              style={styles.infoCloseBtn}
              onPress={() => setShowInfo(false)}
            >
              <Text style={styles.infoCloseText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.infoTitle}>{INFO_PAGES[infoPage].title}</Text>
            <Text style={styles.infoBody}>{INFO_PAGES[infoPage].body}</Text>
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
          </Pressable>
        </Pressable>
      )}
    </BackgroundWrapper>
  );
};

export default ReflectionRoomMirrorMomentScreen;

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
  titleSpacer: {
    width: 30,
  },
  waveImage: {
    width: Math.min(345, screenWidth * 0.88),
    height: 160,
    borderRadius: 12,
    marginBottom: Math.max(20, screenHeight * 0.025),
  },
  description: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: palette.gold.subtlest,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Math.max(24, screenHeight * 0.03),
    paddingHorizontal: 8,
    width: Math.min(screenWidth * 0.88, 345),
  },
  practiceChoices: {
    width: '100%',
    gap: 12,
    marginBottom: Math.max(24, screenHeight * 0.03),
    alignItems: 'center',
  },
  choiceButton: {
    width: 220,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: palette.navy.light,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...(Platform.OS === 'ios'
      ? {
        shadowColor: 'rgba(242, 226, 177, 1)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      }
      : {
        elevation: 8,
      }),
  },
  choiceText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 24,
    color: palette.gold.DEFAULT,
    letterSpacing: 1,
    textAlign: 'center',
  },
  divider: {
    width: '100%',
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginBottom: Math.max(20, screenHeight * 0.025),
  },
  reflectionRoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 4,
    gap: 8,
  },
  reflectionRoomText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 28,
    color: palette.gold.DEFAULT,
  },
  forwardArrow: {
    fontSize: 28,
    color: palette.gold.DEFAULT,
  },
  backArrowImg: {
    width: 24,
    height: 24,
    tintColor: palette.gold.DEFAULT,
  },
  infoButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginRight: Math.max(20, screenWidth * 0.051),
    marginBottom: Math.max(12, screenHeight * 0.015),
  },

  popupOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  popupContainer: {
    width: 329,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.gold.active,
    backgroundColor: palette.navy.card,
  },
  goldenBox: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'stretch',
    borderRadius: 13,
    shadowColor: 'rgba(242, 226, 177, 1)',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 10,
  },
  popupTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 24,
    fontWeight: '400',
    color: palette.neutral.dark,
    textAlign: 'center',
    lineHeight: 31,
  },
  popupInstructions: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 18,
    color: palette.neutral.dark,
    textAlign: 'center',
    lineHeight: 26,
  },
  popupSubtext: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 18,
    color: palette.gold.subtlest,
    textAlign: 'center',
    lineHeight: 26,
  },
  doneButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: palette.navy.light,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(191, 199, 217, 0.05)',
    ...(Platform.OS === 'ios'
      ? {
        elevation: 12,
      }
      : {
        boxShadow: `0 0 12px 4px ${palette.gold.glow}`,
      }),
  },
  doneButtonText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 24,
    color: palette.gold.DEFAULT,
    letterSpacing: 1,
    textAlign: 'center',
  },
  infoPopupContainer: {
    width: 329,
    padding: 24,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 24,
    borderRadius: 13,
    borderWidth: 0.25,
    borderColor: palette.navy.muted,
    backgroundColor: 'rgba(20, 25, 40, 0.95)',
    shadowColor: 'rgba(229, 214, 176, 1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 12,
  },
  infoCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  infoCloseText: {
    fontSize: 24,
    color: palette.gold.DEFAULT,
    lineHeight: 26,
  },
  infoTitle: {
    alignSelf: 'stretch',
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 28,
    fontWeight: '400',
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    lineHeight: 36,
    textShadowColor: 'rgba(240, 212, 168, 0.60)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  infoBody: {
    alignSelf: 'stretch',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400',
    color: palette.neutral.white,
    textAlign: 'center',
    lineHeight: 24,
  },
  infoNavRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  infoArrowImg: {
    width: 20,
    height: 20,
    tintColor: palette.gold.DEFAULT,
  },
  infoArrowPlaceholder: {
    width: 20,
    height: 20,
  },
});
