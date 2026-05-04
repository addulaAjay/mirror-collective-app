import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
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
import { borderWidth, fontFamily, palette, spacing, theme } from '@theme';
import type { RootStackParamList } from '@types';

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
            <Text style={styles.ctaText}>OPEN ECHO MAP</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
      {selectedCard && (
        <Pressable style={styles.popupOverlay} onPress={() => setSelectedCard(null)}>
          <Pressable style={styles.popupContainer} onPress={e => e.stopPropagation()}>
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
            {/* <Text style={styles.popupSubtext}>{selectedCard.subtitle}</Text> */}
            <TouchableOpacity
              style={styles.doneButton}
              activeOpacity={0.8}
              onPress={() => setSelectedCard(null)}
            >
              <Text style={styles.doneText}>DONE</Text>
            </TouchableOpacity>
          </Pressable>
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
    tintColor: theme.colors.text.paragraph1,
  },
  title: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.sizes['4xl'],
    color: theme.colors.text.paragraph1,
    textAlign: 'center',
    letterSpacing: 1,
    flex: 1,
    marginHorizontal: 8,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text.paragraph2,
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
    borderWidth: borderWidth.thin,
    borderColor: theme.colors.border.subtle,
    borderRadius: spacing.m - 3,
    backgroundColor: theme.colors.text.inverse,
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
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.sizes['2xl'],
    color: theme.colors.text.paragraph1,
    letterSpacing: 1,
  },
  cardSubtitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: 15,
    fontStyle: 'italic',
    color: theme.colors.text.paragraph2,
    lineHeight: 22,
  },
  popupOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  popupContainer: {
    width: Math.min(329, screenWidth * 0.9),
    alignItems: 'center',
    gap: 16,
  },
  popupCard: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 13,
    alignItems: 'center',
    gap: 8,
    shadowColor: theme.colors.text.paragraph1,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 10,
  },
  popupTitle: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: 22,
    color: theme.colors.text.inverse,
    letterSpacing: 1,
    textAlign: 'center',
  },
  popupIconContainer: {
    width: 40,
    height: 40,
  },
  popupPractice: {
    fontFamily: fontFamily.headingItalic,
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.text.inverse,
    textAlign: 'center',
    lineHeight: 26,
  },
  popupSubtext: {
    fontFamily: fontFamily.headingItalic,
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.text.paragraph2,
    textAlign: 'center',
    lineHeight: 26,
  },
  doneButton: {
    minWidth: 120,
    maxWidth: 140,
    height: 52,
    backgroundColor: 'rgba(10, 18, 40, 0.7)',
    borderWidth: 0.5,
    borderColor: theme.colors.border.subtle,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    ...(Platform.OS === 'ios'
      ? { elevation: 12 }
      : { boxShadow: `0 0 8px 2px ${palette.gold.glow}` }),
  },
  doneText: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.sizes['2xl'],
    color: theme.colors.text.paragraph1,
    letterSpacing: 2,
  },
  ctaButton: {
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: 12,
    borderWidth: borderWidth.thin,
    borderColor: theme.colors.border.subtle,
    overflow: 'hidden',
  },
  ctaText: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.sizes['2xl'],
    color: theme.colors.text.paragraph1,
    letterSpacing: 2,
  },
});
