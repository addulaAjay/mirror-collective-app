import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { Camera, useCameraDevice, useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';
import { echoApiService } from '@services/api';
import { RootStackParamList } from '@types';
import LogoHeader from '@components/LogoHeader';
import BackgroundWrapper from '@components/BackgroundWrapper';

type Props = NativeStackScreenProps<RootStackParamList, 'NewEchoComposeScreen'>;

const { width: W } = Dimensions.get('window');

const GOLD = '#D7C08A';
const OFFWHITE = 'rgba(253, 253, 249, 0.92)';
const SURFACE_BORDER = 'rgba(253, 253, 249, 0.18)';
const SURFACE_BORDER_2 = 'rgba(253, 253, 249, 0.08)';

const NewEchoComposeScreen: React.FC<Props> = ({ navigation, route }) => {
  const mode = route.params?.mode ?? 'text';
  const { recipientName, title, category, hasRecipient, recipientId } = route.params || {};

  const [message, setMessage] = useState('');
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  
  // Media State
  const [isRecording, setIsRecording] = useState(false);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Audio Recorder
  const audioRecorderPlayer = React.useRef(AudioRecorderPlayer).current;

  // Video Camera
  const device = useCameraDevice('front');
  const camera = React.useRef<Camera>(null);
  const { hasPermission: hasCamPermission, requestPermission: requestCamPermission } = useCameraPermission();
  const { hasPermission: hasMicPermission, requestPermission: requestMicPermission } = useMicrophonePermission();

  const contentWidth = useMemo(() => Math.min(W * 0.88, 360), []);

  const titleText = useMemo(() => {
    if (recipientName?.trim()) return `For ${recipientName.trim()}`;
    return 'NEW ECHO';
  }, [recipientName]);

  /* ---------- Logic ---------- */

  // Audio Recording
  const toggleAudioRecording = async () => {
    if (isRecording) {
      await stopAudioRecording();
    } else {
      await startAudioRecording();
    }
  };

  const startAudioRecording = async () => {
    // Request microphone permission for iOS
    if (Platform.OS === 'ios') {
      if (!hasMicPermission) {
        const granted = await requestMicPermission();
        if (!granted) {
          Alert.alert('Permission Required', 'Microphone access is needed to record audio.');
          return;
        }
      }
    } else if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        if (
          grants['android.permission.WRITE_EXTERNAL_STORAGE'] !== PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.READ_EXTERNAL_STORAGE'] !== PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.RECORD_AUDIO'] !== PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('All required permissions not granted');
          Alert.alert('Permission Required', 'Audio recording permissions are needed.');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    try {
      // For iOS, we need to set audio options explicitly
      const audioSet: any = {
        AVEncoderAudioQualityKeyIOS: 96, // Audio quality (0-127)
        AVNumberOfChannelsKeyIOS: 1,
        AVSampleRateKeyIOS: 44100,
      };
      
      // Start recording - let the library choose the path
      const result = await audioRecorderPlayer.startRecorder(
        undefined, // Use default path
        audioSet,  // iOS audio settings
        false,     // metering (not needed)
      );
      console.log('Recording started:', result);
      
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
      setMediaUri(result);
      setIsRecording(false);
    } catch (error) {
      console.error('Failed to stop audio recording:', error);
    }
  };

  // Video Recording
  const toggleVideoRecording = async () => {
    if (isRecording) {
      await stopVideoRecording();
    } else {
      await startVideoRecording();
    }
  };

  const startVideoRecording = async () => {
    if (!hasCamPermission) await requestCamPermission();
    if (!hasMicPermission) await requestMicPermission();

    if (camera.current) {
        camera.current.startRecording({
            onRecordingFinished: (video) => {
                console.log('Video recorded:', video);
                setMediaUri(video.path);
                setIsRecording(false);
            },
            onRecordingError: (error) => {
                console.error('Video recording error:', error);
                setIsRecording(false);
            }
        });
        setIsRecording(true);
    }
  };

  const stopVideoRecording = async () => {
    if (camera.current) {
        await camera.current.stopRecording();
    }
  };

  const onSave = async () => {
    if (mode === 'text' && !message.trim()) {
       Alert.alert('Empty Echo', 'Please write something.');
       return;
    }
    if ((mode === 'audio' || mode === 'video') && !mediaUri) {
       Alert.alert('No Recording', 'Please record a message first.');
       return;
    }

    setIsSaving(true);
    try {
       // 1. Create Echo Metadata
       const createResponse = await echoApiService.createEcho({
         title: title || 'Untitled Echo',
         category: category || 'General',
         echo_type: mode === 'text' ? 'TEXT' : mode === 'audio' ? 'AUDIO' : 'VIDEO',
         recipient_id: recipientId,
         content: mode === 'text' ? message : undefined,
       });

       if (!createResponse.success || !createResponse.data) {
         throw new Error('Failed to create echo');
       }
       const echoId = createResponse.data.echo_id;

       // 2. Upload Media if applicable
       if (mode !== 'text' && mediaUri) {
         // Use proper MIME types for S3 upload
         const contentType = mode === 'audio' ? 'audio/mp4' : 'video/mp4';
         
         const uploadUrlResponse = await echoApiService.getUploadUrl(contentType, echoId);
         if (uploadUrlResponse.success && uploadUrlResponse.data) {
            await echoApiService.uploadMedia(
              uploadUrlResponse.data.upload_url,
              mediaUri,
              contentType
            );
            // Update echo with media URL
            await echoApiService.updateEcho(echoId, {
               media_url: uploadUrlResponse.data.media_url,
            });
         }
       }

       Alert.alert('Success', 'Echo saved to vault!', [
         { text: 'OK', onPress: () => navigation.navigate('MirrorEchoVaultHome' as any) }
       ]);

    } catch (error) {
       console.error('Save failed:', error);
       Alert.alert('Error', 'Failed to save echo.');
    } finally {
       setIsSaving(false);
    }
  };

  const onUpload = () => {
    // TODO: open document picker / gallery / etc.
    setShowUploadSheet(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <BackgroundWrapper style={styles.root}>

        {/* Header (menu + centered brand) */}
        <LogoHeader navigation={navigation} />

        {/* Back + Title (centered) */}
        <View style={[styles.titleRow, { width: contentWidth }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>{titleText}</Text>

          <View style={styles.titleRightSpacer} />
        </View>

        {/* Body */}
        <View style={[styles.content, { width: contentWidth }]}>
          {mode === 'text' && (
            <>
              <Text style={styles.smallLabel}>Message</Text>

              <LinearGradient
                colors={['rgba(253,253,249,0.08)', 'rgba(253,253,249,0.03)']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.bigBoxShell}
              >
                <View style={styles.bigBoxInnerBorder}>
                  <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Write message here"
                    placeholderTextColor="rgba(253,253,249,0.45)"
                    style={styles.bigTextInput}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              </LinearGradient>

              <View style={styles.bottomButtonsRow}>
                <SmallPillButton label="Upload File" onPress={onUpload} />
                <SmallPillButton label="SAVE" onPress={onSave} />
              </View>
            </>
          )}

          {mode === 'audio' && (
            <>
              <View style={styles.audioWaveWrap}>
                <Waveform />
              </View>

              <View style={styles.centerIconWrap}>
                 <TouchableOpacity onPress={toggleAudioRecording}>
                  <CircleIcon label={isRecording ? "⏹" : "🎤"} />
                </TouchableOpacity>
              </View>

              <View style={styles.bottomButtonsRow}>
                <SmallPillButton label="Upload File" onPress={onUpload} />
                <SmallPillButton label={isSaving ? "SAVING..." : "SAVE"} onPress={onSave} />
              </View>
            </>
          )}

          {mode === 'video' && (
            <>
              <LinearGradient
                colors={['rgba(253,253,249,0.08)', 'rgba(253,253,249,0.03)']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.bigBoxShell}
              >
                <View style={[styles.bigBoxInnerBorder, { padding: 10 }]}>
                    {device && (
                        <Camera
                            ref={camera}
                            style={StyleSheet.absoluteFill}
                            device={device}
                            isActive={true}
                            video={true}
                            audio={true}
                        />
                    )}
                    {!device && (
                      <View style={styles.videoPreviewPlaceholder}>
                        <Text style={styles.previewHint}>No Camera Device</Text>
                      </View>
                    )}
                </View>
              </LinearGradient>

              <View style={styles.centerIconWrap}>
                <TouchableOpacity onPress={toggleVideoRecording}>
                    <CircleIcon label={isRecording ? "⏹" : "📹"} />
                </TouchableOpacity>
              </View>

              <View style={styles.bottomButtonsRowSingle}>
                <SmallPillButton label={isSaving ? "SAVING..." : "SAVE"} onPress={onSave} />
              </View>
            </>
          )}
        </View>

        {/* Simple "upload" modal */}
        <Modal
          visible={showUploadSheet}
          transparent
          animationType="fade"
          onRequestClose={() => setShowUploadSheet(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowUploadSheet(false)}
          >
            <Pressable style={[styles.modalCard, { width: contentWidth }]}>
              <Text style={styles.modalTitle}>Upload</Text>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.modalItem}
                onPress={() => setShowUploadSheet(false)}
              >
                <Text style={styles.modalItemText}>Choose a file (stub)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.modalItem}
                onPress={() => setShowUploadSheet(false)}
              >
                <Text style={styles.modalItemText}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      </BackgroundWrapper>
    </SafeAreaView>
  );
};

/** ---------- Small UI bits (pure RN, no extra deps) ---------- */

const SmallPillButton = ({
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

const CircleIcon = ({ label }: { label: string }) => {
  return (
    <View style={styles.circleOuter}>
      <View style={styles.circleInner}>
        <Text style={styles.circleIcon}>{label}</Text>
      </View>
    </View>
  );
};

const Waveform = () => {
  // Simple waveform made from bars, matches the design’s “audio bars” vibe.
  const bars = new Array(28).fill(0).map((_, i) => {
    const t = i % 10;
    const h = t <= 2 ? 10 : t <= 4 ? 18 : t <= 6 ? 26 : t <= 8 ? 18 : 10;
    return h;
  });

  return (
    <View style={styles.waveRow}>
      {bars.map((h, idx) => (
        <View key={idx} style={[styles.waveBar, { height: h }]} />
      ))}
    </View>
  );
};

/** ---------- Styles ---------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#05060A' },
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
    marginTop: 10,
    paddingBottom: 22,
  },

  smallLabel: {
    color: 'rgba(253,253,249,0.65)',
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },

  bigBoxShell: {
    width: '100%',
    borderRadius: 18,
    padding: 1,
    borderWidth: 1,
    borderColor: SURFACE_BORDER_2,
  },
  bigBoxInnerBorder: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
    backgroundColor: 'rgba(7,9,14,0.35)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    height: Math.min(420, Math.max(320, W * 1.05)),
  },
  bigTextInput: {
    flex: 1,
    color: OFFWHITE,
    fontSize: 16,
    lineHeight: 22,
  },

  bottomButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomButtonsRowSingle: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderColor: 'rgba(253,253,249,0.12)',
    backgroundColor: 'rgba(7,9,14,0.28)',
    paddingVertical: 10,
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

  audioWaveWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 14,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    opacity: 0.9,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(253,253,249,0.92)',
  },

  centerIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  circleOuter: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.35)',
    backgroundColor: 'rgba(215,192,138,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(253,253,249,0.12)',
    backgroundColor: 'rgba(7,9,14,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleIcon: {
    color: 'rgba(215,192,138,0.92)',
    fontSize: 22,
  },

  videoPreviewPlaceholder: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(253,253,249,0.10)',
    backgroundColor: 'rgba(253,253,249,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewHint: {
    color: 'rgba(253,253,249,0.55)',
    fontSize: 14,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(10,12,18,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.25)',
    padding: 14,
  },
  modalTitle: {
    color: 'rgba(215,192,138,0.92)',
    fontSize: 16,
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(253,253,249,0.10)',
    marginBottom: 10,
    backgroundColor: 'rgba(253,253,249,0.04)',
  },
  modalItemText: {
    color: OFFWHITE,
    fontSize: 15,
    textAlign: 'center',
  },
});

export default NewEchoComposeScreen;
