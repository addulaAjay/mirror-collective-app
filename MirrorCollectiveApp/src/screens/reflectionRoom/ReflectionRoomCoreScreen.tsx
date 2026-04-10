import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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

const ReflectionRoomCoreScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          

          <Text style={styles.title}>REFLECTION ROOM</Text>
          <Text style={styles.subtitle}>See it. Choose what comes next.</Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('ReflectionRoomEchoSignature' as never)}
            activeOpacity={0.8}
          >
            <SvgXml xml={MOTIF_SVG.spiral} width={160} height={160} style={styles.motifSvg} />
          </TouchableOpacity>

          <Text style={styles.tapHint}>
            Tap on motif to view your current Echo Signature.
          </Text>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              onPress={() => navigation.navigate('ReflectionRoomEchoMap' as never)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(253, 253, 249, 0.02)', 'rgba(253, 253, 249, 0.00)']}
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
            >
              <LinearGradient
                colors={['rgba(253, 253, 249, 0.02)', 'rgba(253, 253, 249, 0.00)']}
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
            >
              <LinearGradient
                colors={['rgba(253, 253, 249, 0.02)', 'rgba(253, 253, 249, 0.00)']}
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
    backgroundColor: '#0B0F1C',
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
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 32,
    color: '#F2E2B1',
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: Math.max(16, screenHeight * 0.02),
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#FDFDF9',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Math.max(28, screenHeight * 0.035),
  },
  motifSvg: {
    width: 160,
    height: 160,
    aspectRatio: 1,
    marginBottom: Math.max(20, screenHeight * 0.025),
  },
  tapHint: {
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    fontSize: 18,
    color: '#F2E2B1',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: Math.max(28, screenHeight * 0.035),
    paddingHorizontal: 16,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  ctaButton: {
    width: 270,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 0.5,
    borderColor: '#A3B3CC',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'stretch',
  },
  ctaText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 24,
    color: '#F2E2B1',
    letterSpacing: 2,
  },
});
