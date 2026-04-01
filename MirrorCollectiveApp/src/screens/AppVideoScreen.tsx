import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Video from 'react-native-video';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import type { RootStackParamList } from '@types';

const VIDEO_URL =
  'https://mirror-app-video.s3.us-east-1.amazonaws.com/%21%20MIRROR%20EXPLAINER.MP4';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AppVideo'>;
}

const AppVideoScreen: React.FC<Props> = ({ navigation }) => {
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

  const handleNext = useCallback(() => {
    navigation.navigate('MirrorChat');
  }, [navigation]);

  return (
    <BackgroundWrapper style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />

        <View style={styles.content}>
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

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleNext}
            style={styles.nextButton}
            accessibilityRole="button"
          >
            <Text style={styles.nextText}>NEXT</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#090E1A',
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    width: '100%',
  },
  content: {
    flex: 1,
    width: '100%',
    marginTop: 16,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  videoContainer: {
    flex: 1,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 20,
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
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 16,
    color: '#A3B3CC',
    textAlign: 'center',
  },
  nextButton: {
    width: 313,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 214, 176, 0.4)',
    backgroundColor: 'rgba(58, 74, 92, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  nextText: {
    textAlign: 'center',
    fontFamily: 'CormorantGaramond-Light',
    color: '#E5D6B0',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    textShadowColor: 'rgba(229, 214, 176, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});

export default AppVideoScreen;
