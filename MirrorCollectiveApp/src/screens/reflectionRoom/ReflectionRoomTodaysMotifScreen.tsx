import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { palette } from '@theme';
import type { RootStackParamList } from '@types';
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
              colors={['rgba(253, 253, 249, 0.02)', 'rgba(253, 253, 249, 0.00)']}
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
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 36,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: Math.max(32, screenHeight * 0.04),
  },
  motifName: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 42,
    color: palette.gold.DEFAULT,
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
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    color: palette.gold.subtlest,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Math.max(32, screenHeight * 0.04),
    paddingHorizontal: 8,
    width: Math.min(screenWidth * 0.85, 340),
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
