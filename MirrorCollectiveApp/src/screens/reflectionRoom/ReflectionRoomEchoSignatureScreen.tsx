import { palette } from '@theme';
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

import { MOTIF_SVG } from '@assets/motifs-icons/MotifIconAssets';
import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type PracticeCard = {
  label: string;
  motifKey: string;
  subtitle: string;
  practice: string;
};

const PRACTICE_CARDS: PracticeCard[] = [
  {
    label: 'OVERWHELM',
    motifKey: 'spiral',
    subtitle: "You've been holding too much on your own.",
    practice: 'Hand to heart.\nInhale for 4, exhale for 6.\nWhisper: \u201CI allow myself to soften.\u201D',
  },
  {
    label: 'CLARITY',
    motifKey: 'pyramid',
    subtitle: 'The fog is thinning, trust the small openings',
    practice: 'Hand to heart.\nInhale for 4, exhale for 6.\nWhisper: \u201CI allow myself to soften.\u201D',
  },
  {
    label: 'GRIEF',
    motifKey: 'feather',
    subtitle: 'Something heavy is beginning to ease',
    practice: 'Hand to heart.\nInhale for 4, exhale for 6.\nWhisper: \u201CI allow myself to soften.\u201D',
  },
];

const ReflectionRoomEchoSignatureScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedCard, setSelectedCard] = useState<PracticeCard | null>(null);

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
            <Text style={styles.title}>ECHO SIGNATURE</Text>
            <View style={styles.backBtn} />
          </View>

          <Text style={styles.subtitle}>
            Shift your state and try a 2 minute practice.
          </Text>

          <View style={styles.cardsContainer}>
            {PRACTICE_CARDS.map(card => (
              <TouchableOpacity
                key={card.label}
                style={styles.practiceCard}
                activeOpacity={0.7}
                onPress={() => setSelectedCard(card)}
              >
                <View style={styles.cardRow}>
                  <View style={styles.cardIconContainer}>
                    <SvgXml
                      xml={MOTIF_SVG[card.motifKey] || ''}
                      width="100%"
                      height="100%"
                    />
                  </View>
                  <Text style={styles.cardLabel}>{card.label}</Text>
                </View>
                <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigation.navigate('ReflectionRoomEchoMap' as never)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(253, 253, 249, 0.02)', 'rgba(253, 253, 249, 0.00)']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>OPEN ECHO MAP</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
      {selectedCard && (
        <Pressable style={styles.popupOverlay} onPress={() => setSelectedCard(null)}>
          <View style={styles.popupContent} onStartShouldSetResponder={() => true}>
            <LinearGradient
              colors={[palette.gold.glow, palette.gold.amber]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.popupCard}
            >
              <Text style={styles.popupTitle}>TWO MINUTE PRACTICE</Text>
              <View style={styles.popupIconContainer}>
                <SvgXml
                  xml={MOTIF_SVG[selectedCard.motifKey] || ''}
                  width="100%"
                  height="100%"
                />
              </View>
              <Text style={styles.popupPractice}>{selectedCard.practice}</Text>
            </LinearGradient>
            <TouchableOpacity
              style={styles.doneButton}
              activeOpacity={0.8}
              onPress={() => setSelectedCard(null)}
            >
              <LinearGradient
                colors={['rgba(253, 253, 249, 0.02)', 'rgba(253, 253, 249, 0.00)']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.doneGradient}
              >
                <Text style={styles.doneText}>DONE</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Pressable>
      )}
    </BackgroundWrapper>
  );
};

export default ReflectionRoomEchoSignatureScreen;

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
  backArrowImg: {
    width: 24,
    height: 24,
    tintColor: palette.gold.DEFAULT,
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
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: palette.gold.subtlest,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Math.max(24, screenHeight * 0.03),
    paddingHorizontal: 8,
  },
  cardsContainer: {
    width: '100%',
    gap: 12,
    marginBottom: Math.max(28, screenHeight * 0.035),
  },
  practiceCard: {
    width: '100%',
    borderWidth: 0.5,
    borderColor: palette.navy.light,
    borderRadius: 13,
    backgroundColor: palette.navy.DEFAULT,
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 6,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIconContainer: {
    width: 52,
    height: 52,
    marginBottom: 4,
  },
  cardTextBlock: {
    flex: 1,
  },
  cardLabel: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 24,
    color: palette.gold.DEFAULT,
    letterSpacing: 1,
  },
  cardSubtitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontStyle: 'italic',
    color: palette.gold.subtlest,
    lineHeight: 22,
  },
  popupOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  popupContent: {
    alignItems: 'center',
    gap: 16,
    width: '80%',
    maxWidth: 320,
  },
  popupCard: {
    width: '100%',
    padding: 16,
    borderRadius: 13,
    alignItems: 'center',
    gap: 8,
    shadowColor: palette.gold.DEFAULT,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 8,
  },
  popupTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 22,
    color: palette.navy.DEFAULT,
    letterSpacing: 1,
    textAlign: 'center',
  },
  popupIconContainer: {
    width: 40,
    height: 40,
  },
  popupPractice: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontStyle: 'italic',
    color: palette.navy.DEFAULT,
    textAlign: 'center',
    lineHeight: 22,
  },
  doneButton: {
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: palette.navy.light,
    overflow: 'hidden',
  },
  doneGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    color: palette.gold.DEFAULT,
    letterSpacing: 2,
  },
  ctaButton: {
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: palette.navy.light,
    overflow: 'hidden',
  },
  ctaGradient: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  ctaText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 24,
    color: palette.gold.DEFAULT,
    letterSpacing: 2,
  },
});
