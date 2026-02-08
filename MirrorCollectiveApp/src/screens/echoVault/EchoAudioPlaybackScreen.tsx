// EchoAudioPlaybackScreen.tsx
import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import BackgroundWrapper from '@components/BackgroundWrapper';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { RootStackParamList } from '@types';
import { echoApiService, EchoResponse } from '@services/api/echo';
import LogoHeader from '@components/LogoHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'EchoAudioPlaybackScreen'>;

const { width: W, height: H } = Dimensions.get('window');

const GOLD = '#D7C08A';
const OFFWHITE = 'rgba(253,253,249,0.92)';
const BORDER = 'rgba(253,253,249,0.16)';
const BORDER_SOFT = 'rgba(253,253,249,0.08)';
const SURFACE = 'rgba(7,9,14,0.36)';

const EchoAudioPlaybackScreen: React.FC<Props> = ({ navigation, route }) => {
  const { echoId, title: paramsTitle } = route.params;
  
  const [echo, setEcho] = useState<EchoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);

  // AudioRecorderPlayer is exported as an instance, not a class
  const audioPlayer = useRef(AudioRecorderPlayer).current;

  const contentWidth = useMemo(() => Math.min(W * 0.88, 360), []);
  const transcriptBoxH = useMemo(() => Math.min(H * 0.18, 150), []);

  useEffect(() => {
    fetchEchoDetails();
    
    // Cleanup on unmount
    return () => {
      stopPlayback();
    };
  }, [echoId]);

  const fetchEchoDetails = async () => {
    try {
      setLoading(true);
      const response = await echoApiService.getEcho(echoId);
      if (response.data) {
        setEcho(response.data);
      } else {
        Alert.alert('Error', 'Echo not found');
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Failed to fetch echo details:', error);
      Alert.alert('Error', error.message || 'Failed to load echo details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const onPlayPause = async () => {
    if (!echo?.media_url) {
      Alert.alert('No Audio', 'This echo does not have an audio file.');
      return;
    }

    if (playing) {
      await pausePlayback();
    } else {
      await startPlayback(echo.media_url);
    }
  };

  const startPlayback = async (url: string) => {
    try {
      // If resuming
      if (currentPosition > 0 && currentPosition < duration) {
        await audioPlayer.resumePlayer();
      } else {
        // Start from beginning
        await audioPlayer.startPlayer(url);
        audioPlayer.addPlayBackListener((e) => {
          setCurrentPosition(e.currentPosition);
          setDuration(e.duration);
          if (e.currentPosition === e.duration) {
            setPlaying(false);
            audioPlayer.stopPlayer();
            setCurrentPosition(0);
          }
          return;
        });
      }
      setPlaying(true);
    } catch (error) {
      console.error('Playback failed:', error);
      Alert.alert('Playback Error', 'Could not play audio.');
    }
  };

  const pausePlayback = async () => {
    try {
      await audioPlayer.pausePlayer();
      setPlaying(false);
    } catch (error) {
      console.error('Pause failed:', error);
    }
  };

  const stopPlayback = async () => {
    try {
      await audioPlayer.stopPlayer();
      audioPlayer.removePlayBackListener();
      setPlaying(false);
      setCurrentPosition(0);
    } catch (error) {
      // Ignore if already stopped
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GOLD} />
      </View>
    );
  }

  const displayTitle = echo?.title || paramsTitle || 'Untitled Echo';
  const transcript = echo?.content || 'No transcript available for this echo.';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <BackgroundWrapper style={styles.root}>

        {/* Header */}
        {/* Header */}
        <LogoHeader navigation={navigation} />

        {/* Back + Title */}
        <View style={[styles.titleRow, { width: contentWidth }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle} numberOfLines={1}>
            {displayTitle}
          </Text>

          <View style={styles.titleRightSpacer} />
        </View>

        {/* Waveform (Visual only for now, could be animated based on volume) */}
        <View style={styles.waveWrap}>
          <Waveform active={playing} />
        </View>

        {/* Play button */}
        <View style={styles.playWrap}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPlayPause}
          >
            <View style={styles.playOuter}>
              <View style={styles.playInner}>
                <Text style={styles.playIcon}>{playing ? '❚❚' : '▶'}</Text>
              </View>
            </View>
          </TouchableOpacity>
          {/* Debug/Progress Info Optional */}
          {/* <Text style={{color:'white', marginTop:10}}>{Math.floor(currentPosition/1000)}s / {Math.floor(duration/1000)}s</Text> */}
        </View>

        {/* Transcript preview */}
        <View
          style={[
            styles.transcriptShell,
            { width: contentWidth, height: transcriptBoxH },
          ]}
        >
          <LinearGradient
            colors={['rgba(253,253,249,0.07)', 'rgba(253,253,249,0.02)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.transcriptGradient}
          >
            <View style={styles.transcriptInnerBorder}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.transcriptPad}
              >
                <Text style={styles.transcriptText}>{transcript}</Text>
              </ScrollView>
            </View>
          </LinearGradient>
        </View>

        {/* Bottom actions */}
        <View style={[styles.actionsRow, { width: contentWidth }]}>
          <ActionIconButton label="⬇" onPress={() => {}} />
          <ActionPrimaryButton label="VAULT" onPress={() => {}} />
          <ActionIconButton label="✎" onPress={() => {}} />
        </View>
      </BackgroundWrapper>
    </SafeAreaView>
  );
};

export default EchoAudioPlaybackScreen;

/* ---------- UI Bits ---------- */

const Waveform = ({ active }: { active: boolean }) => {
  // Simple random animation effect could be added here
  // For now, static or simple toggle
  const bars = new Array(36).fill(0).map((_, i) => {
    const base = [8, 14, 22, 30, 22, 14][i % 6];
    // If active, make them dance slightly? Or just taller?
    // Doing a simple static height change to indicate state
    const bump = active ? ((i % 5) + 2) * 2 : 0;
    return Math.max(6, base + bump); 
  });

  return (
    <View style={styles.waveRow}>
      {bars.map((h, idx) => (
        <View key={idx} style={[styles.waveBar, { height: h }]} />
      ))}
    </View>
  );
};

const ActionIconButton = ({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{ width: 64 }}
    >
      <LinearGradient
        colors={['rgba(253,253,249,0.10)', 'rgba(253,253,249,0.03)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.iconBtnShell}
      >
        <View style={styles.iconBtnInner}>
          <Text style={styles.iconBtnLabel}>{label}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const ActionPrimaryButton = ({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{ flex: 1 }}>
      <LinearGradient
        colors={['rgba(253,253,249,0.10)', 'rgba(253,253,249,0.03)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.primaryBtnShell}
      >
        <View style={styles.primaryBtnInner}>
          <Text style={styles.primaryBtnText}>{label}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#05060A' },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#05060A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  root: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  },

  headerRow: {
    marginTop: 10,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { color: OFFWHITE, fontSize: 24, opacity: 0.9 },

  brandWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(215,192,138,0.10)',
  },
  logoMark: { color: GOLD, fontSize: 16 },
  brandTextWrap: { alignItems: 'center' },
  brandTop: {
    color: 'rgba(215,192,138,0.85)',
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 1,
  },
  brandMain: {
    color: 'rgba(215,192,138,0.92)',
    fontSize: 12,
    letterSpacing: 2,
    lineHeight: 14,
  },
  headerRightSpacer: { width: 44, height: 44 },

  titleRow: {
    marginTop: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backIcon: { color: 'rgba(215,192,138,0.9)', fontSize: 30, marginLeft: 2 },
  screenTitle: {
    color: 'rgba(215,192,138,0.92)',
    fontSize: 26,
    letterSpacing: 1.2,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
    maxWidth: '78%',
    textAlign: 'center',
  },
  titleRightSpacer: { width: 44, height: 44 },

  waveWrap: {
    marginTop: 52,
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
  },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  waveBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(253,253,249,0.94)',
  },

  playWrap: {
    marginTop: 30,
    marginBottom: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(215,192,138,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(253,253,249,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    color: 'rgba(7,9,14,0.85)',
    fontSize: 26,
    marginLeft: 2,
  },

  transcriptShell: {
    borderRadius: 18,
    padding: 1,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    marginBottom: 18,
  },
  transcriptGradient: { flex: 1, borderRadius: 18, padding: 1 },
  transcriptInnerBorder: {
    flex: 1,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    overflow: 'hidden',
  },
  transcriptPad: { paddingHorizontal: 16, paddingVertical: 12 },
  transcriptText: {
    color: 'rgba(253,253,249,0.84)',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'space-between',
    paddingBottom: 18,
  },
  iconBtnShell: {
    width: 64,
    height: 52,
    borderRadius: 14,
    padding: 1,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.22)',
  },
  iconBtnInner: {
    flex: 1,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    backgroundColor: 'rgba(7,9,14,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnLabel: {
    color: 'rgba(215,192,138,0.92)',
    fontSize: 20,
  },

  primaryBtnShell: {
    height: 52,
    borderRadius: 14,
    padding: 1,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.28)',
  },
  primaryBtnInner: {
    flex: 1,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    backgroundColor: 'rgba(7,9,14,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: 'rgba(215,192,138,0.92)',
    fontSize: 18,
    letterSpacing: 1.4,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },
});
