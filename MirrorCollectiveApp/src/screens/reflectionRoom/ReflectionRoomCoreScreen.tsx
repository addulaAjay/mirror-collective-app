import {
  displayMotifUpper,
  LANDING,
} from '@features/reflection-room/copy/strings';
import { useJourney } from '@features/reflection-room/state/JourneyContext';
import type { MotifId } from '@features/reflection-room/types/ids';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { glassGradient, palette, radius, spacing, theme } from '@theme';
import type { RootStackParamList } from '@types';
import React from 'react';
import {
  Dimensions,
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

const MOTIF_ROOM_COPY: Record<MotifId, string> = {
  compass: 'Find your true north. Trust the direction you already know.',
  mirror: 'See yourself clearly — without distortion, without judgment.',
  blocks: 'Set steady boundaries that protect your energy and keep you grounded.',
  spiral: 'Growth isn’t linear. Each return brings deeper understanding.',
  radiant_burst: 'Clarity is breaking through. Let yourself see what’s emerging.',
  feather: 'Release what’s been weighing you down. Move forward lighter.',
  waves: 'Let emotion move. Flow, express, and breathe again.',
  pyramid: 'Focus your energy. Precision brings calm and control.',
  water_drop: 'Feel honestly. Emotion isn’t weakness — it’s information.',
  brick_stack: 'Build one solid step at a time. Self-trust creates stability.',
  sprout: 'Something new is forming. Growth has already begun.',
};

function motifSvgFor(motifId: MotifId | undefined) {
  if (!motifId) return MOTIF_SVG.spiral;
  return MOTIF_SVG[motifId] ?? MOTIF_SVG[motifId.replace('_', '-')] ?? MOTIF_SVG.spiral;
}

const ReflectionRoomCoreScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { motif } = useJourney();
  const motifId = motif?.motif_id;
  const motifName = motifId ? displayMotifUpper(motifId) : LANDING.eyebrow;
  const motifCopy =
    motifId != null ? MOTIF_ROOM_COPY[motifId] : LANDING.subhead;

  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.motifName}>{motifName}</Text>
          <Text style={styles.title}>REFLECTION ROOM</Text>
          <Text style={styles.subtitle}>{motifCopy}</Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('ReflectionRoomEchoSignature' as never)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="View Signature"
          >
            <SvgXml
              xml={motifSvgFor(motifId)}
              width={160}
              height={160}
              style={styles.motifSvg}
            />
          </TouchableOpacity>

          <Text style={styles.tapHint}>
            Tap on motif to view your current Echo Signature.
          </Text>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              onPress={() => navigation.navigate('ReflectionRoomEchoMap' as never)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Open Echo Map"
            >
              <LinearGradient
                colors={[glassGradient.echoSecondary.start, glassGradient.echoSecondary.end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.ctaButton}
              >
                <Text style={styles.ctaText}>OPEN ECHO MAP</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('ReflectionRoomMirrorMoment' as never)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Mirror Moment"
            >
              <LinearGradient
                colors={[glassGradient.echoSecondary.start, glassGradient.echoSecondary.end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.ctaButton}
              >
                <Text style={styles.ctaText}>MIRROR MOMENT</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('EnterMirror')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Homepage"
            >
              <LinearGradient
                colors={[glassGradient.echoSecondary.start, glassGradient.echoSecondary.end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.ctaButton}
              >
                <Text style={styles.ctaText}>HOMEPAGE</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default ReflectionRoomCoreScreen;

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
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.sizes['4xl'],
    color: theme.colors.text.paragraph1,
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: Math.max(16, screenHeight * 0.02),
    marginBottom: spacing.xs,
  },
  motifName: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.sizes['3xl'],
    color: theme.colors.text.paragraph1,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text.paragraph2,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeights.lg,
    marginBottom: Math.max(28, screenHeight * 0.035),
  },
  motifSvg: {
    width: 160,
    height: 160,
    aspectRatio: 1,
    marginBottom: Math.max(20, screenHeight * 0.025),
  },
  tapHint: {
    fontFamily: theme.typography.fontFamily.body,
    fontStyle: 'italic',
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.text.paragraph1,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: Math.max(28, screenHeight * 0.035),
    paddingHorizontal: spacing.m,
  },
  buttonsContainer: {
    width: '100%',
    gap: spacing.s,
    alignItems: 'center',
  },
  ctaButton: {
    width: 270,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderWidth: 0.5,
    borderColor: theme.colors.border.subtle,
    borderRadius: radius.s,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'stretch',
  },
  ctaText: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.sizes['2xl'],
    color: theme.colors.text.paragraph1,
    letterSpacing: 2,
  },
});
