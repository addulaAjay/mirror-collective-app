import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

const TheMirrorPledgeCommingsoonScreen: React.FC = () => {
  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <View style={styles.container}>
        <LogoHeader />

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>THE MIRROR PLEDGE</Text>
        </View>

        {/* Illustration Placeholder */}
        <View style={styles.imageContainer}>
          {/* Placeholder for future illustration */}
        </View>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>
            2% of your subscription is added to the {'\n'} Mirror Giving Pool. Each quarter, the {'\n'} collective votes on causes to support— and {'\n'} we show you exactly where it goes.
          </Text>
        </View>

        {/* Coming soon footer */}
        <View style={styles.footerContainer}>
          <StarIcon width={24} height={24} />
          <Text style={styles.footerText}>COMING SOON</Text>
          <StarIcon width={24} height={24} />
        </View>
      </View>
    </BackgroundWrapper>
  );
};

export default TheMirrorPledgeCommingsoonScreen;

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#0B0F1C',
  },
  bgImage: {
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    paddingHorizontal: Math.max(20, screenWidth * 0.051),
    paddingTop: Math.max(48, screenHeight * 0.056),
    paddingBottom: Math.max(30, screenHeight * 0.035),
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: Math.max(60, screenHeight * 0.1),
    marginBottom: Math.max(48, screenHeight * 0.06),
  },
  title: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: Math.min(screenWidth * 0.082, 32),
    fontWeight: '400',
    lineHeight: Math.min(screenWidth * 0.082 * 1.3, 41.6),
    color: '#F2E2B1',
    textAlign: 'center',
    textShadowColor: '#E5D6B0',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 4,
    alignSelf: 'stretch',
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
