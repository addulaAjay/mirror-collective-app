import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Video from 'react-native-video';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button';
import LogoHeader from '@components/LogoHeader';
import {
  palette,
  fontFamily,
  fontSize,
  spacing,
  radius,
  scale,
  verticalScale,
  moderateScale,
} from '@theme';
import type { RootStackParamList } from '@types';


const VIDEO_URL =
  'https://mirror-app-video.s3.us-east-1.amazonaws.com/Mirror+App+Explainer+Video.mp4';

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
                color={palette.gold.warm}
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
                resizeMode="cover"
                controls
                paused={paused}
                onLoad={() => setIsLoading(false)}
                onError={() => { setIsLoading(false); setHasError(true); }}
              />
            )}
          </View>

          <Button
            variant="primary"
            size="L"
            title="NEXT"
            onPress={handleNext}
          />
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create<{
  bg: ViewStyle;
  safe: ViewStyle;
  content: ViewStyle;
  videoContainer: ViewStyle;
  video: ViewStyle;
  errorContainer: ViewStyle;
  errorText: TextStyle;
}>({
  bg: {
    flex: 1,
    backgroundColor: palette.navy.deep,
  },
  safe: {
    flex: 1,
    backgroundColor: palette.neutral.transparent,
    alignItems: 'center',
    width: '100%',
  },
  content: {
    flex: 1,
    width: '100%',
    marginTop: verticalScale(spacing.m),          // 16px
    alignItems: 'center',
    paddingHorizontal: scale(spacing.xl),         // 24px
    paddingBottom: verticalScale(spacing.xl),     // 24px
  },

  // ── Video container ────────────────────────────────────────────────────────
  videoContainer: {
    flex: 1,
    width: '100%',
    borderRadius: radius.s,                       // 12px
    overflow: 'hidden',
    // eslint-disable-next-line no-restricted-syntax -- true black required for video player background
    backgroundColor: '#000',
    marginBottom: verticalScale(spacing.l),       // 20px
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

  // Body XS Italic — Cormorant Italic 16px, navy light
  errorText: {
    fontFamily: fontFamily.headingItalic,
    fontSize: moderateScale(fontSize.s),          // 16px
    color: palette.navy.light,
    textAlign: 'center',
  },

});

export default AppVideoScreen;
