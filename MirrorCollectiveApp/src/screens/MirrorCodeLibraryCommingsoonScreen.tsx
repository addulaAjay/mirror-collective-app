import React from 'react';
import { Dimensions, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

const MirrorCodeLibraryCommingsoonScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <LogoHeader />

          {/* Title Row */}
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>MIRROR CODE{'\n'}LIBRARY</Text>
            <View style={{ width: 30 }} />
          </View>

          {/* Illustration Placeholder */}
          <View style={styles.imageContainer}>
            {/* Placeholder for future illustration */}
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              A living archive of scientific, spiritual,  and {'\n'} poetic writings—crafted to awaken {'\n'} remembrance and expand consciousness.
            </Text>
          </View>

          {/* Coming soon footer */}
          <View style={styles.footerContainer}>
            <StarIcon width={24} height={24} />
            <Text style={styles.footerText}>COMING SOON</Text>
            <StarIcon width={24} height={24} />
          </View>
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default MirrorCodeLibraryCommingsoonScreen;

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
    width: '100%',
  },
  container: {
    flex: 1,
    paddingHorizontal: Math.max(20, screenWidth * 0.051),
    paddingTop: 20,
    paddingBottom: Math.max(30, screenHeight * 0.035),
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: Math.max(40, screenHeight * 0.05),
    marginBottom: Math.max(48, screenHeight * 0.06),
  },
  backBtn: {
    width: 30,
    height: 30,
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 24,
    color: '#F2E2B1',
    fontWeight: '300',
  },
  title: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: Math.min(screenWidth * 0.06, 24),
    fontWeight: '400',
    color: '#F2E2B1',
    textAlign: 'center',
    textShadowColor: '#E5D6B0',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 2,
  },
  imageContainer: {
    width: 317,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    aspectRatio: 56 / 53,
  },
  descriptionContainer: {
    width: Math.min(screenWidth * 0.95, 370),
    alignItems: 'center',
    marginTop: Math.max(48, screenHeight * 0.06),
  },
  description: {
    fontFamily: 'Inter',
    fontSize: Math.min(screenWidth * 0.041, 16),
    fontWeight: '300',
    lineHeight: 24,
    color: '#FDFDF9',
    textAlign: 'center',
  },
  footerContainer: {
    position: 'absolute',
    bottom: Math.max(80, screenHeight * 0.11),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 16,
    alignSelf: 'center',
  },
  footerText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: Math.min(screenWidth * 0.082, 32),
    fontWeight: '400',
    color: '#F2E2B1',
    textAlign: 'center',
    lineHeight: Math.min(screenWidth * 0.082 * 1.3, 41.6),
    textShadowColor: 'rgba(229, 214, 176, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
    marginHorizontal: 12,
  },
});
