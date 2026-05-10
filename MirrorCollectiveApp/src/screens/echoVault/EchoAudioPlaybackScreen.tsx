// EchoAudioPlaybackScreen.tsx
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  palette, fontFamily, fontSize, fontWeight, lineHeight,
  spacing, radius, borderWidth, textShadow,
  scale, verticalScale, moderateScale,
} from '@theme';
import { RootStackParamList } from '@types';
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button';
import LogoHeader from '@components/LogoHeader';
import { echoApiService, EchoResponse } from '@services/api/echo';

type Props = NativeStackScreenProps<RootStackParamList, 'EchoAudioPlaybackScreen'>;

const { width: W, height: H } = Dimensions.get('window');

const GOLD = palette.gold.mid;
const OFFWHITE = 'rgba(253,253,249,0.92)';
const BORDER = 'rgba(253,253,249,0.16)';
const BORDER_SOFT = 'rgba(253,253,249,0.08)';
const SURFACE = 'rgba(7,9,14,0.36)';

const EchoAudioPlaybackScreen: React.FC<Props> = ({ navigation, route }) => {
  const { echoId, title: paramsTitle } = route.params;
  
  const [echo, setEcho] = useState<EchoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  const isRecipient = !!echo?.sender;
  const [vaulting, setVaulting] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);

  // AudioRecorderPlayer is exported as an instance, not a class
  const audioPlayer = useRef(AudioRecorderPlayer).current;

  const contentWidth = useMemo(() => Math.min(W * 0.88, 360), []);
  const transcriptBoxH = useMemo(() => Math.min(H * 0.22, 160), []);

  useEffect(() => {
    fetchEchoDetails();
    return () => { stopPlayback(); };
  }, [echoId]);

  // Stop audio when navigating away so the .playback audio session is released
  // before any recording screen acquires the microphone.
  useFocusEffect(
    useCallback(() => {
      return () => { stopPlayback(); };
    }, []),
  );

  const handleDownload = async () => {
    if (!echo) return;
    try {
      const content = echo.media_url
        ? { url: echo.media_url, message: echo.title }
        : { message: echo.content || echo.title };
      await Share.share(content);
    } catch { /* dismissed */ }
  };

  const handleVault = async () => {
    if (!echo || vaulting) return;
    setVaulting(true);
    try {
      const res = await echoApiService.createEcho({
        title: echo.title,
        category: echo.category,
        echo_type: echo.echo_type,
      });
      if (!res.success || !res.data) throw new Error('Failed to save to vault.');
      if (echo.media_url) {
        await echoApiService.updateEcho(res.data.echo_id, { media_url: echo.media_url });
      }
      Alert.alert('Saved', 'Echo added to your vault.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add to vault.');
    } finally {
      setVaulting(false);
    }
  };

  const handleEdit = () => {
    if (!echo) return;
    // Match the create-flow pattern: Recipient → Compose. The picker
    // forwards editEchoId so compose PATCHes the existing echo.
    navigation.navigate('ChooseRecipientScreen', {
      mode: 'audio',
      title: echo.title,
      category: echo.category,
      editEchoId: echo.echo_id,
      prefillRecipient: echo.recipient,
      prefillLockDate: echo.release_date,
    });
  };

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

  // Tracks whether a player session is currently loaded (started or paused).
  // Used as the source of truth for resume vs fresh-start instead of inferring
  // from currentPosition/duration which race against the listener callbacks.
  const isPlayerActiveRef = useRef(false);

  const startPlayback = async (url: string) => {
    try {
      // True resume — player is active and just paused
      if (isPlayerActiveRef.current && currentPosition > 0 && currentPosition < duration) {
        await audioPlayer.resumePlayer();
        setPlaying(true);
        return;
      }

      // Fresh start — re-fetch echo to ensure the pre-signed S3 URL is fresh
      let playUrl = url;
      try {
        const fresh = await echoApiService.getEcho(echoId);
        if (fresh.data?.media_url) {
          playUrl = fresh.data.media_url;
          setEcho(fresh.data);
        }
      } catch {
        // fall back to the cached URL
      }

      // Always remove any existing listener before adding a new one to avoid
      // multiple callbacks firing per tick.
      audioPlayer.removePlayBackListener();
      await audioPlayer.startPlayer(playUrl);
      isPlayerActiveRef.current = true;

      audioPlayer.addPlayBackListener((e) => {
        setCurrentPosition(e.currentPosition);
        setDuration(e.duration);
        if (e.duration > 0 && e.currentPosition >= e.duration) {
          // Natural end — release the player
          audioPlayer.stopPlayer().catch(() => {});
          audioPlayer.removePlayBackListener();
          isPlayerActiveRef.current = false;
          setPlaying(false);
          setCurrentPosition(0);
        }
      });
      setPlaying(true);
    } catch (error) {
      console.error('Playback failed:', error);
      isPlayerActiveRef.current = false;
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
      if (isPlayerActiveRef.current) {
        await audioPlayer.stopPlayer();
      }
      audioPlayer.removePlayBackListener();
      isPlayerActiveRef.current = false;
      setPlaying(false);
      setCurrentPosition(0);
    } catch {
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
    <BackgroundWrapper style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />

        {/* Header */}
        <LogoHeader navigation={navigation} />

        {/* Back + Title */}
        <View style={[styles.titleRow, { width: contentWidth }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Image source={require('@assets/back-arrow.png')} style={styles.backArrowImg} resizeMode="contain" />
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
            <Image
              source={playing ? require('@assets/pause_circle.png') : require('@assets/play_circle.png')}
              style={styles.playCircleImg}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Transcript preview */}
        <View style={[styles.transcriptShell, { width: contentWidth, height: transcriptBoxH }]}>
          <LinearGradient
            colors={['rgba(253,253,249,0.04)', 'rgba(253,253,249,0.01)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: radius.xs }]}
            pointerEvents="none"
          />
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.transcriptPad}
          >
            <Text style={styles.transcriptText}>{transcript}</Text>
          </ScrollView>
        </View>

        {/* Bottom actions */}
        <View style={[styles.actionsRow, { width: contentWidth }]}>
          <EchoIconButton icon={require('@assets/download.png')} onPress={handleDownload} />
          <Button
            variant="primary"
            size="L"
            title={vaulting ? 'SAVING...' : 'VAULT'}
            onPress={handleVault}
            style={styles.vaultBtn}
          />
          {/* Edit icon hidden once the echo is RELEASED — the backend
              rejects updates on locked/released echoes. */}
          {!isRecipient && echo?.status === 'DRAFT' && (
            <EchoIconButton icon={require('@assets/edit-icon.png')} onPress={handleEdit} />
          )}
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
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

const EchoIconButton = ({
  icon,
  onPress,
}: {
  icon: ReturnType<typeof require>;
  onPress: () => void;
}) => (
  <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.iconBtnShell}>
    <Image source={icon} style={styles.iconBtnImg} resizeMode="contain" />
  </TouchableOpacity>
);

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent', alignItems: 'center' },
  loadingContainer: {
    flex: 1,
    backgroundColor: palette.navy.deep,
    justifyContent: 'center',
    alignItems: 'center',
  },
  root: {
    flex: 1,
    alignItems: 'center',
  },

  headerRow: {
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
    marginTop: 30,
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
  backArrowImg: { width: 20, height: 20, tintColor: 'rgba(215,192,138,0.9)' },
  screenTitle: {
    color: 'rgba(215,192,138,0.92)',
    fontSize: 28,
    letterSpacing: 2,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
    maxWidth: '78%',
    textAlign: 'center',
    textShadowColor: textShadow.glowSubtle.color,
    textShadowOffset: textShadow.glowSubtle.offset,
    textShadowRadius: 16,
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
  playCircleImg: {
    width: 96,
    height: 96,
    tintColor: GOLD,
  },

  transcriptShell: {
    borderRadius: radius.xs,
    borderWidth: 0.2,
    borderColor: palette.navy.light,
    padding: scale(spacing.m),
    marginBottom: verticalScale(spacing.m),
    overflow: 'hidden',
    boxShadow: '0px 0px 15px 0px rgba(229,214,176,0.3)',
    shadowColor: '#e5d6ae',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  transcriptPad: { paddingBottom: scale(spacing.xxs) },
  transcriptText: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.xs),
    fontStyle: 'italic',
    lineHeight: lineHeight.m,
    color: palette.neutral.white,
  },

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(spacing.xl),   // Figma: gap 24px
    justifyContent: 'center',
    paddingBottom: verticalScale(spacing.m),
  },
  iconBtnShell: {
    paddingVertical: verticalScale(spacing.s),
    paddingHorizontal: scale(spacing.m),
    borderRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(253,253,249,0.03)',
  },
  iconBtnImg: {
    width: scale(24),
    height: scale(24),
    tintColor: palette.gold.DEFAULT,
  },
  vaultBtn: {
    minWidth: scale(110),
  },
});
