// NewEchoAudioScreen.tsx
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { palette, textShadow } from '@theme';
import { RootStackParamList } from '@types';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Platform,
  Pressable,
  Alert,
  Linking,
  PermissionsAndroid,
  ActivityIndicator,
  Image,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import DocumentPicker from 'react-native-document-picker';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';
import { echoApiService } from '@services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'NewEchoAudioScreen'>;

const { width: W, height: H } = Dimensions.get('window');

const GOLD = palette.gold.mid;
const OFFWHITE = 'rgba(253, 253, 249, 0.92)';

const SURFACE_BORDER = 'rgba(253, 253, 249, 0.18)';
const SURFACE_BORDER_2 = 'rgba(253, 253, 249, 0.08)';

const NewEchoAudioScreen: React.FC<Props> = ({ navigation, route }) => {
  const { recipientId, category, title } = route.params || {};
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pickedFile, setPickedFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [saving, setSaving] = useState(false);

  // Singleton instance (default export). Ref stops React from treating it as state.
  const audioRecorderPlayer = useRef(AudioRecorderPlayer).current;
  // Synchronous source-of-truth for whether a recording session is currently
  // live — avoids stale closures in the unmount cleanup.
  const isRecordingRef = useRef(false);

  const contentWidth = useMemo(() => Math.min(W * 0.88, 360), []);

  // Cleanup on unmount — only stop if a recording is actually in progress.
  // Calling stopRecorder() on an idle recorder is a no-op on most versions but
  // can throw on iOS if the AVAudioRecorder isn't initialized.
  React.useEffect(() => {
    return () => {
      if (isRecordingRef.current) {
        audioRecorderPlayer.stopRecorder().catch(() => {});
      }
      audioRecorderPlayer.removeRecordBackListener();
    };
  }, [audioRecorderPlayer]);

  // If user navigates away mid-recording, make sure we stop and release the
  // microphone so other screens can record.
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (isRecordingRef.current) {
          audioRecorderPlayer.stopRecorder().catch(() => {});
          audioRecorderPlayer.removeRecordBackListener();
          isRecordingRef.current = false;
        }
      };
    }, [audioRecorderPlayer]),
  );

  // iOS: NSMicrophoneUsageDescription is in Info.plist — startRecorder()
  // triggers the system permission prompt automatically on first call. We
  // catch the rejection in the surrounding try/catch and surface a friendly
  // alert. No Vision Camera dependency needed.
  const checkAndRequestPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        if (grants['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        }
        Alert.alert(
          'Permission Required',
          'Microphone access is needed to record audio.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
        return false;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS handled at startRecorder() time
  };

  const onMicPress = async () => {
    if (pickedFile) setPickedFile(null);
    if (isRecording) {
      await stopAudioRecording();
    } else {
      const hasPermission = await checkAndRequestPermission();
      if (!hasPermission) return;
      await startAudioRecording();
    }
  };

  const startAudioRecording = async () => {
    try {
      // v4 AudioSet — only keys actually supported by react-native-audio-recorder-player@4.x.
      // The library manages AVAudioSession.category internally; older keys like
      // AVAudioSessionCategoryIOS / AVAudioSessionModeIOS are ignored in v4.
      const audioSet = {
        AVEncoderAudioQualityKeyIOS: 96 as any, // 'high'
        AVNumberOfChannelsKeyIOS: 1,
        AVSampleRateKeyIOS: 44100,
        AVModeIOS: 'measurement' as const,
      };

      // Reset previous recording state
      setRecordedUri(null);
      setRecordingDuration(0);

      // Brief delay gives any prior media component (Vision Camera with audio,
      // react-native-video) a chance to release AVAudioSession before the
      // recorder tries to acquire it. Without this, switching from a video
      // playback/recording screen straight to audio recording often fails
      // with "audio session was hijacked".
      await new Promise(r => setTimeout(r, 300));

      await audioRecorderPlayer.startRecorder(undefined, audioSet, false);
      isRecordingRef.current = true;
      // Make sure we don't stack listeners on retries
      audioRecorderPlayer.removeRecordBackListener();
      audioRecorderPlayer.addRecordBackListener((e) => {
        setRecordingDuration(Math.floor(e.currentPosition / 1000));
      });
      setIsRecording(true);
    } catch (error: any) {
      console.error('Failed to start audio recording:', error);
      isRecordingRef.current = false;

      const msg = (error?.message ?? '').toLowerCase();
      let userMessage = `Recording setup failed: ${error?.message || 'Unknown error'}`;
      if (msg.includes('permission') || msg.includes('denied')) {
        userMessage = 'Microphone permission was denied. Please enable it in Settings.';
      } else if (
        msg.includes('hijacked') ||
        msg.includes('playback') ||
        msg.includes('attempts')
      ) {
        // Most common real-world cause on iOS: a Bluetooth audio device
        // (AirPods/headphones/car) is holding the audio session in a routing
        // mode the recorder can't switch out of. Closing other media apps
        // doesn't help — disconnecting Bluetooth does.
        userMessage =
          'The microphone is in use by another audio source.\n\n' +
          'Try this:\n' +
          '• Disconnect AirPods or any Bluetooth audio device\n' +
          '• Close other audio apps (Music, Spotify, Podcasts)\n' +
          '• Then try again';
      }
      Alert.alert('Recording Error', userMessage);
    }
  };

  const stopAudioRecording = async () => {
    try {
      // stopRecorder() returns the path to the saved audio file — capture it!
      const uri = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      isRecordingRef.current = false;
      setIsRecording(false);
      setRecordedUri(uri);
    } catch (error) {
      console.error('Failed to stop audio recording:', error);
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  };

  const onUpload = async () => {
    if (isUploading) return;
    try {
      if (isRecording) {
        await stopAudioRecording();
      }
      setIsUploading(true);
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.audio],
      });
      if (res) {
        setPickedFile({
          uri: res.uri,
          name: res.name || 'audio_echo.m4a',
          type: res.type || 'audio/m4a',
        });
        // A picked file replaces any prior recording
        setRecordedUri(null);
        setRecordingDuration(0);
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.error('Picker error:', err);
        Alert.alert('Error', 'Failed to pick audio file');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const onSave = async () => {
    // Resolve the URI we'll upload — picked file > recorded clip
    const uri = pickedFile?.uri ?? recordedUri;
    const contentType = pickedFile?.type ?? 'audio/m4a';

    if (!uri) {
      Alert.alert('Nothing to save', 'Please record or upload an audio file first.');
      return;
    }

    // If still recording, stop and use the resulting URI
    if (isRecording) {
      await stopAudioRecording();
    }

    try {
      setSaving(true);

      const createResponse = await echoApiService.createEcho({
        title: title || 'Untitled Audio Echo',
        category: category || 'General',
        echo_type: 'AUDIO',
        recipient_id: recipientId,
      });
      if (!createResponse.success || !createResponse.data) {
        throw new Error('Failed to create echo');
      }
      const echoId = createResponse.data.echo_id;

      const finalUri = pickedFile?.uri ?? recordedUri;
      if (!finalUri) throw new Error('No audio file to upload');

      // Audio files are typically small (m4a @ 64-128 kbps); compression
      // is skipped automatically below the 10 MB threshold. The umbrella
      // helper still gives us atomic finalize semantics.
      const result = await echoApiService.uploadEchoMedia(
        echoId,
        finalUri,
        contentType,
      );
      if (!result.success) {
        throw new Error(result.error ?? 'Upload failed');
      }

      Alert.alert('Success', 'Echo saved successfully');
      navigation.navigate('MirrorEchoVaultHome');
    } catch (err) {
      console.error('Save audio echo failed:', err);
      Alert.alert('Error', 'Failed to save Echo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BackgroundWrapper style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />

        {/* Header: hamburger + centered brand */}
        <LogoHeader navigation={navigation} />

        {/* Back + title */}
        <View style={[styles.titleRow, { width: contentWidth }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Image source={require('@assets/back-arrow.png')} style={styles.backArrowImg} resizeMode="contain" />
          </TouchableOpacity>

          <Text style={styles.screenTitle}>NEW ECHO</Text>

          <View style={styles.titleRightSpacer} />
        </View>

        {/* Main content */}
        <View style={[styles.content, { width: contentWidth }]}>
          {/* Waveform / Picked File Info */}
          <View style={styles.waveWrap}>
            {pickedFile ? (
              <View style={styles.pickedContainer}>
                <Text style={styles.pickedIcon}>📄</Text>
                <Text style={styles.pickedName} numberOfLines={1}>{pickedFile.name}</Text>
                <TouchableOpacity onPress={() => setPickedFile(null)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Waveform active={isRecording} duration={recordingDuration} />
            )}
          </View>

          {/* Mic button (glow + ring) */}
          <View style={styles.micWrap}>
            <Pressable
              onPress={onMicPress}
              style={({ pressed }) => [pressed && { opacity: 0.9 }]}
            >
              <View
                style={[styles.micGlow, isRecording && styles.micGlowActive]}
              >
                <View style={styles.micOuter}>
                  <View style={styles.micInner}>
                    {isRecording
                      ? <Text style={styles.micIcon}>⏹</Text>
                      : <Image source={require('@assets/mic.png')} style={{ width: 26, height: 26, tintColor: 'rgba(215,192,138,0.92)' }} resizeMode="contain" />
                    }
                  </View>
                </View>
              </View>
            </Pressable>
          </View>

          {/* Bottom buttons */}
          <View style={styles.bottomRow}>
            <PillButton label="Upload File" onPress={onUpload} />
          </View>

          <TouchableOpacity
            style={[styles.saveAction, styles.flexRow]}
            onPress={onSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={GOLD} />
            ) : (
              <>
                <StarIcon width={24} height={24} color={GOLD} />
                <Text style={styles.saveActionText}>SAVE</Text>
                <StarIcon width={24} height={24} color={GOLD} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

/* ---------- UI Bits ---------- */

const PillButton = ({
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
        style={styles.pillShell}
      >
        <View style={styles.pillInner}>
          <Text style={styles.pillText}>{label}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const Waveform = ({ active, duration }: { active: boolean; duration: number }) => {
  // Looks like the design’s mid-screen bars.
  // If recording, slightly "varies" heights.
  const bars = new Array(34).fill(0).map((_, i) => {
    const base = [8, 14, 22, 30, 22, 14][i % 6];
    const bump = active ? ((i % 5) - 2) * 1.5 : 0;
    return Math.max(6, base + bump);
  });

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={styles.waveRow}>
        {bars.map((h, idx) => (
          <View
            key={idx}
            style={[
              styles.waveBar,
              { height: h, opacity: idx % 7 === 0 ? 0.75 : 0.95 },
            ]}
          />
        ))}
      </View>
      {(active || duration > 0) && (
        <Text style={styles.durationText}>{formatTime(duration)}</Text>
      )}
    </View>
  );
};

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent', alignItems: 'center' },
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
    marginTop: 20,
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
  backIcon: {
    color: 'rgba(215,192,138,0.9)',
    fontSize: 30,
    marginLeft: 2,
  },
  backArrowImg: {
    width: 20,
    height: 20,
    tintColor: 'rgba(215,192,138,0.9)',
  },
  screenTitle: {
    color: 'rgba(215,192,138,0.92)',
    fontSize: 28,
    letterSpacing: 2,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },
  titleRightSpacer: { width: 44, height: 44 },

  content: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 26,
  },

  waveWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  pickedContainer: {
    alignItems: 'center',
    gap: 8,
  },
  pickedIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  pickedName: {
    color: OFFWHITE,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 4,
  },
  removeText: {
    color: palette.status.errorHover,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(253,253,249,0.94)',
  },

  micWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  // Glow container (soft halo like design)
  micGlow: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(215,192,138,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.18)',
  },
  micGlowActive: {
    backgroundColor: 'rgba(215,192,138,0.10)',
    borderColor: 'rgba(215,192,138,0.28)',
  },

  // Outer ring
  micOuter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 1,
    borderColor: 'rgba(253,253,249,0.16)',
    backgroundColor: 'rgba(7,9,14,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Inner solid
  micInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: 'rgba(253,253,249,0.10)',
    backgroundColor: 'rgba(7,9,14,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIcon: { fontSize: 22 },

  bottomRow: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  pillShell: {
    borderRadius: 14,
    padding: 1,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.25)',
  },
  pillInner: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: SURFACE_BORDER_2,
    backgroundColor: 'rgba(7,9,14,0.28)',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    color: 'rgba(215,192,138,0.92)',
    fontSize: 14,
    letterSpacing: 1,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },
  saveAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  saveActionText: {
    color: GOLD,
    fontSize: 24,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
    textShadowColor: textShadow.warmGlow.color,
    textShadowOffset: textShadow.warmGlow.offset,
    textShadowRadius: textShadow.warmGlow.radius,
    letterSpacing: 2,
  },
  flexRow: {
    flexDirection: 'row',
  },
  durationText: {
    color: GOLD,
    fontSize: 18,
    marginTop: 16,
    letterSpacing: 1,
    fontFamily: Platform.select({ ios: 'CormorantGaramond-Regular', android: 'serif' }),
  },
});

export default NewEchoAudioScreen;
