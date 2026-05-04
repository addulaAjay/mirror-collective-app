import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
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

import motifsData from '@assets/motifs-data.json';
import { MOTIF_SVG } from '@assets/motifs-icons/MotifIconAssets';
import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import { glassGradient, palette, radius, spacing, theme } from '@theme';
import type { RootStackParamList } from '@types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ReflectionRoomTodaysMotifScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const motif = useMemo(() => {
    const list = motifsData.motifs;
    return list[Math.floor(Math.random() * list.length)];
  }, []);
  // const motif = motifsData.motifs.find(m => m.image === 'sprout')!;

  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.reflectionRoomLabel}>TODAY’S MOTIF</Text>
          <Text style={styles.motifName}>{motif.name}</Text>

          <View style={styles.motifImageContainer}>
            <SvgXml
              xml={MOTIF_SVG[motif.image] || ''}
              width="100%"
              height="100%"
            />
          </View>

          <Text style={styles.description}>{motif.description}</Text>

          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigation.navigate('ReflectionRoomEchoSignature' as never)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[glassGradient.echoSecondary.start, glassGradient.echoSecondary.end]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>VIEW SIGNATURE</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default ReflectionRoomTodaysMotifScreen;


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
  reflectionRoomLabel: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.sizes['3xl'],
    fontWeight: theme.typography.weights.regular,
    lineHeight: 36,
    color: theme.colors.text.paragraph1,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: Math.max(32, screenHeight * 0.04),
  },
  motifName: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: 42,
    color: theme.colors.text.paragraph1,
    textAlign: 'center',
    letterSpacing: 3,
    marginBottom: 6,
  },
  motifImageContainer: {
    width: Math.min(screenWidth * 0.75, 300),
    height: Math.min(screenWidth * 0.75, 300),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Math.max(32, screenHeight * 0.04),
    backgroundColor: 'transparent',
  },
  motifImage: {
    width: '100%',
    height: '100%',
  },
  description: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.paragraph2,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeights.lg,
    marginBottom: Math.max(32, screenHeight * 0.04),
    paddingHorizontal: spacing.xs,
    width: Math.min(screenWidth * 0.85, 340),
  },
  ctaButton: {
    borderRadius: radius.s,
    borderWidth: 0.5,
    borderColor: theme.colors.border.subtle,
    overflow: 'hidden',
  },
  ctaGradient: {
    flexDirection: 'row',
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ctaText: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.sizes['2xl'],
    color: theme.colors.text.paragraph1,
    letterSpacing: 2,
  },
});
