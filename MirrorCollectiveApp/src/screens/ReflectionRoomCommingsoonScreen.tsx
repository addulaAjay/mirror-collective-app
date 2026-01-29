import React from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');


const ReflectionRoomCommingsoonScreen: React.FC = () => {
  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <View style={styles.container}>
        <LogoHeader />

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>REFLECTION {'\n'}ROOM</Text>
        </View>

        {/* Illustration */}
        <View style={styles.imageContainer}>
          {/* Background archway (largest) - Layer 1 */}
          <Image
            source={require('@assets/reflection-room-arch-1.png')}
            style={styles.archLayer1}
            resizeMode="contain"
          />

          {/* Middle archway - Layer 2 */}
          <Image
            source={require('@assets/reflection-room-arch-2.png')}
            style={styles.archLayer2}
            resizeMode="contain"
          />

          {/* Stairs */}
          <Image
            source={require('@assets/reflection-room-stairs.png')}
            style={styles.stairsImage}
            resizeMode="contain"
          />

          {/* Front archway (smallest) - Layer 3 */}
          <Image
            source={require('@assets/reflection-room-arch-3.png')}
            style={styles.archLayer3}
            resizeMode="contain"
          />
        </View>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>
            This is where your thoughts are held gently, {'\n'} reflected back with care, and allowed to {'\n'} settle knowing.
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

export default ReflectionRoomCommingsoonScreen;

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
    textShadowRadius: 20,
    letterSpacing: 4,
  },
  imageContainer: {
    width: 317,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    aspectRatio: 56 / 53,
  },
  archLayer1: {
    position: 'absolute',
    width: 263.35,
    height: 300,
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -131.675 }],
  },
  archLayer2: {
    position: 'absolute',
    width: 238.164,
    height: 282.201,
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -119.082 }],
  },
  archLayer3: {
    position: 'absolute',
    width: 213.045,
    height: 264.877,
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -106.5225 }],
  },
  stairsImage: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -76.66 }],
    width: 183.184,
    height: 172.041,
  },
  illustrationImage: {
    width: Math.min(screenWidth * 0.7, 275),
    height: Math.min(screenHeight * 0.4, 320),
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
    lineHeight: 20,
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
