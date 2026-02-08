// NewEchoAudioScreen.tsx
import React, { useMemo, useState } from 'react';
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
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import BackgroundWrapper from '@components/BackgroundWrapper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@types';
import { Camera } from 'react-native-vision-camera';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { echoApiService } from '@services/api';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';

type Props = NativeStackScreenProps<RootStackParamList, 'NewEchoAudioScreen'>;

const { width: W, height: H } = Dimensions.get('window');

const GOLD = '#D7C08A';
const OFFWHITE = 'rgba(253, 253, 249, 0.92)';

const SURFACE_BORDER = 'rgba(253, 253, 249, 0.18)';
const SURFACE_BORDER_2 = 'rgba(253, 253, 249, 0.08)';

const NewEchoAudioScreen: React.FC<Props> = ({ navigation, route }) => {
  const { recipientId, category, title } = route.params || {};
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pickedFile, setPickedFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [saving, setSaving] = useState(false);

  const audioRecorderPlayer = React.useRef(AudioRecorderPlayer).current;

  const contentWidth = useMemo(() => Math.min(W * 0.88, 360), []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      audioRecorderPlayer.stopRecorder().catch(() => {});
      audioRecorderPlayer.removeRecordBackListener();
    };
  }, []);

  const checkAndRequestPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        if (
          grants['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          return true;
        } else {
          Alert.alert(
            'Permission Required',
            'Microphone and Storage permissions are needed to record and save audio. Please enable them in your settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          return false;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else {
      const status = await Camera.getMicrophonePermissionStatus();
      if (status === 'denied') {
        Alert.alert(
          'Permission Required',
          'Microphone access is needed to record audio. Please enable it in your settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return false;
      }
      if (status === 'not-determined') {
        const result = await Camera.requestMicrophonePermission();
        return result === 'granted';
      }
      return status === 'granted';
    }
  };

  const onMicPress = async () => {
    if (pickedFile) {
      setPickedFile(null);
    }
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
      const audioSet: any = {
        AVEncoderAudioQualityKeyIOS: 96,
        AVNumberOfChannelsKeyIOS: 1,
        AVSampleRateKeyIOS: 44100,
      };
      
      await audioRecorderPlayer.startRecorder(undefined, audioSet, false);
      audioRecorderPlayer.addRecordBackListener((e: any) => {
        setRecordingDuration(Math.floor(e.currentPosition / 1000));
        return;
      });
      setIsRecording(true);
    } catch (error: any) {
      console.error('Failed to start audio recording:', error);
      Alert.alert('Recording Error', `Recording setup failed: ${error.message || 'Unknown error'}`);
    }
  };

  const stopAudioRecording = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
      // We don't automatically set pickedFile here because we want to distinguish between
      // a fresh recording and a picked file for the UI, but onSave needs a URI.
    } catch (error) {
      console.error('Failed to stop audio recording:', error);
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
    if (!pickedFile && !isRecording) {
      Alert.alert('Nothing to save', 'Please record or upload an audio file first.');
      return;
    }

    try {
      setSaving(true);
      
      // 1. Create Echo
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

      // 2. Upload Media
      const fileToUpload = pickedFile || { uri: '', type: 'audio/m4a' }; // recording logic needs URI from library
      const contentType = pickedFile ? pickedFile.type : 'audio/m4a';
      const uri = pickedFile ? pickedFile.uri : ''; // TODO: get recording URI

      if (uri) {
        const uploadUrlResponse = await echoApiService.getUploadUrl(contentType, echoId);
        if (uploadUrlResponse.success && uploadUrlResponse.data) {
           await echoApiService.uploadMedia(
             uploadUrlResponse.data.upload_url,
             uri,
             contentType
           );
           await echoApiService.updateEcho(echoId, {
              media_url: uploadUrlResponse.data.media_url,
           });
        }
      }

      Alert.alert('Success', 'Echo saved successfully');
      navigation.navigate('MirrorEchoVaultHome');
    } catch (err) {
      console.error(err);
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
            <Text style={styles.backIcon}>‹</Text>
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
                    <Text style={styles.micIcon}>🎙️</Text>
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
    color: '#ff6b6b',
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
    textShadowColor: 'rgba(229, 214, 176, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 9,
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
