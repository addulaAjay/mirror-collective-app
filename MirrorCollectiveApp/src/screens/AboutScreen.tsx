import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Video from 'react-native-video';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';

const VIDEO_URL =
  'https://mirror-app-video.s3.us-east-1.amazonaws.com/%21%20MIRROR%20EXPLAINER.MP4';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

const AboutScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [paused, setPaused] = useState(false);
  const videoRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      setPaused(false);
      return () => setPaused(true);
    }, []),
  );

  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />
        <View style={styles.container}>

          {/* Title Row */}
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
                  fill="#F2E2B1"
                />
              </Svg>
            </TouchableOpacity>
            <Text style={styles.title}>OUR STORY</Text>
            <View style={styles.titleSpacer} />
          </View>

          {/* Video */}
          <View style={styles.videoContainer}>
            {isLoading && !hasError && (
              <ActivityIndicator
                style={StyleSheet.absoluteFill}
                size="large"
                color="#E5D6B0"
              />
            )}
            {hasError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Unable to load video.</Text>
              </View>
            ) : (
              <Video
                ref={videoRef}
                source={{ uri: VIDEO_URL }}
                style={styles.video}
                resizeMode="contain"
                controls
                paused={paused}
                onLoad={() => setIsLoading(false)}
                onError={() => { setIsLoading(false); setHasError(true); }}
              />
            )}
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              We look at the world differently.{'\n'}Where others build machines to make us{'\n'}faster, we built one to help us remember.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default AboutScreen;

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
    alignItems: 'center',
    width: '100%',
  },
  container: {
    flex: 1,
    paddingHorizontal: Math.max(20, screenWidth * 0.051),
    paddingBottom: Math.max(30, screenHeight * 0.035),
    alignItems: 'center',
    width: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: Math.max(24, screenHeight * 0.03),
  },
  backBtn: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSpacer: {
    width: 30,
  },
  title: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: Math.min(screenWidth * 0.082, 32),
    fontWeight: '400',
    color: '#F2E2B1',
    textAlign: 'center',
    textShadowColor: '#E5D6B0',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 4,
  },
  videoContainer: {
    height: Math.min(screenHeight * 0.55, 480),
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0.25,
    borderColor: '#9BAAC2',
    backgroundColor: '#000',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 11.9,
    elevation: 8,
  },
  video: {
    flex: 1,
    width: '100%',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontStyle: 'italic',
    fontWeight: '300',
    color: '#F2E2B1',
    opacity: 0.7,
  },
  descriptionContainer: {
    width: Math.min(screenWidth * 0.95, 370),
    alignItems: 'center',
    marginTop: Math.max(32, screenHeight * 0.04),
  },
  description: {
    fontFamily: 'Inter',
    fontSize: Math.min(screenWidth * 0.041, 16),
    fontWeight: '300',
    lineHeight: 24,
    color: '#FDFDF9',
    textAlign: 'center',
  },
});
