import { palette } from '@theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@types';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
  Linking,
  Image,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import DocumentPicker from 'react-native-document-picker';
import { launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, useCameraDevice, useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';
import { echoApiService } from '@services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'NewEchoComposeScreen'>;

const { width: W } = Dimensions.get('window');

const GOLD = palette.gold.mid;
const OFFWHITE = 'rgba(253, 253, 249, 0.92)';
const SURFACE_BORDER = 'rgba(253, 253, 249, 0.18)';
const SURFACE_BORDER_2 = 'rgba(253, 253, 249, 0.08)';

const NewEchoComposeScreen: React.FC<Props> = ({ navigation, route }) => {
  const mode = route.params?.mode ?? 'text';
  const { recipientName, title, category, hasRecipient, recipientId, guardianId, lockDate, unlockOnDeath } = route.params || {};

  const [message, setMessage] = useState('');
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  
  // Media State
  const [isRecording, setIsRecording] = useState(false);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<{ name: string; type: string } | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const [pendingPicker, setPendingPicker] = useState<'audio' | 'video' | 'text' | null>(null);

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

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      // Stop audio
      audioRecorderPlayer.stopRecorder().catch(() => {});
      audioRecorderPlayer.removeRecordBackListener();
      // Stop video
      if (camera.current) {
        camera.current.stopRecording().catch(() => {});
      }
    };
  }, []);

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
          Alert.alert(
            'Permission Required', 
            'Microphone access is needed to record audio. Please enable it in your settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
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
          Alert.alert(
            'Permission Required', 
            'Audio recording permissions are needed. Please enable them in your settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
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
    if (!hasCamPermission || !hasMicPermission) {
      Alert.alert(
        'Permission Required',
        'Camera and Microphone permissions are needed to record video. Please enable them in your settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

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
         ...(guardianId && { guardian_id: guardianId }),
         ...(lockDate && { release_date: lockDate }),
         ...(unlockOnDeath !== undefined && { unlock_on_death: unlockOnDeath }),
         content: mode === 'text' ? message : undefined,
       });

       if (!createResponse.success || !createResponse.data) {
         throw new Error('Failed to create echo');
       }
       const echoId = createResponse.data.echo_id;

        // 2. Upload Media if applicable
        if (mode !== 'text' && mediaUri) {
          // Use picked file type if available, otherwise default to mp4
          const contentType = mediaFile?.type || (mode === 'audio' ? 'audio/mp4' : 'video/mp4');
          
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
         { text: 'OK', onPress: () => navigation.navigate('MirrorEchoVaultLibrary' as any) }
       ]);

    } catch (error) {
       console.error('Save failed:', error);
       Alert.alert('Error', 'Failed to save echo.');
    } finally {
       setIsSaving(false);
    }
  };

  const onUpload = () => {
    setShowUploadSheet(true);
  };

  /**
   * On iOS, we must wait for the Modal to be fully dismissed before
   * presenting the system picker, otherwise it can hang or stay transparent.
   */
  const handleModalDismissed = () => {
    if (!pendingPicker) return;
    
    const type = pendingPicker;
    setPendingPicker(null);
    
    // Brief additional timeout for safety
    setTimeout(() => {
      if (type === 'audio') executePickAudio();
      else if (type === 'video') executePickVideo();
      else if (type === 'text') executePickText();
    }, 100);
  };

  const handlePickAudio = async () => {
    if (isPicking) return;
    if (isRecording) {
      await stopAudioRecording();
    }
    setPendingPicker('audio');
    setShowUploadSheet(false);
  };

  const executePickAudio = async () => {
    try {
      setIsPicking(true);
      const res = await DocumentPicker.pickSingle({
         type: [DocumentPicker.types.audio],
      });
      if (res) {
        setMediaUri(res.uri);
        setMediaFile({ name: res.name || 'audio.m4a', type: res.type || 'audio/m4a' });
        setRecordingDuration(0); // Reset duration if file picked
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.error('Picker error:', err);
        Alert.alert('Error', 'Failed to pick audio file');
      }
    } finally {
      setIsPicking(false);
    }
  };

  const handlePickVideo = async () => {
    if (isPicking) return;
    if (isRecording) {
      await stopVideoRecording();
    }
    setPendingPicker('video');
    setShowUploadSheet(false);
  };

  const executePickVideo = async () => {
    try {
      setIsPicking(true);
      const result = await launchImageLibrary({
        mediaType: 'video',
        quality: 1,
      });
      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setMediaUri(asset.uri || null);
        setMediaFile({ name: asset.fileName || 'video.mp4', type: asset.type || 'video/mp4' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPicking(false);
    }
  };

  const handlePickText = async () => {
    if (isPicking) return;
    setPendingPicker('text');
    setShowUploadSheet(false);
  };

  const executePickText = async () => {
    try {
      setIsPicking(true);
      const res = await DocumentPicker.pickSingle({
         type: [DocumentPicker.types.plainText, DocumentPicker.types.allFiles],
       });
      if (res && res.uri) {
         setMediaFile({ name: res.name || 'document.txt', type: res.type || 'text/plain' });
         const response = await fetch(res.uri);
         const text = await response.text();
         setMessage(text);
     }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.error('Picker error:', err);
        Alert.alert('Error', 'Failed to pick text file');
      }
    } finally {
      setIsPicking(false);
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

        {/* Header (menu + centered brand) */}
        <LogoHeader navigation={navigation} />

        {/* Back + Title (centered) */}
        <View style={[styles.titleRow, { width: contentWidth }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Image
              source={require('@assets/back-arrow.png')}
              style={styles.backArrowImg}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <Text style={styles.screenTitle}>{titleText}</Text>

          <View style={styles.titleRightSpacer} />
        </View>

        {/* Body */}
        <View style={[styles.content, { width: contentWidth }]}>
          {mode === 'text' && (
            <>
              <Text style={styles.smallLabel}>Message</Text>
              <View style={styles.textInputShell}>
                <LinearGradient
                  colors={['rgba(253,253,249,0.04)', 'rgba(253,253,249,0.01)']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.textInputGradient}
                >
                  <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Write message here"
                    placeholderTextColor=palette.navy.medium
                    style={styles.bigTextInput}
                    multiline
                    textAlignVertical="top"
                  />
                </LinearGradient>
              </View>

              <View style={styles.bottomButtonsRow}>
                <SmallPillButton label="Upload File" onPress={onUpload} />
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.saveWrap, isSaving && styles.disabled]}
                  onPress={onSave}
                  disabled={isSaving}
                >
                  <LinearGradient
                    colors={[
                      'rgba(253,253,249,0.04)',
                      'rgba(253,253,249,0.01)',
                    ]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.saveGradient}
                  >
                    <Text style={styles.saveActionText}>
                      {isSaving ? 'SAVING...' : 'SAVE'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}

          {mode === 'audio' && (
            <>
              <View style={styles.audioWaveWrap}>
                {mediaUri && mediaFile ? (
                  <View style={styles.pickedMediaContainer}>
                    <Text style={styles.pickedMediaIcon}>ðŸ“„</Text>
                    <Text style={styles.pickedMediaName} numberOfLines={1}>
                      {mediaFile.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setMediaUri(null);
                        setMediaFile(null);
                      }}
                    >
                      <Text style={styles.removeMediaText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Waveform />
                )}
              </View>

              <View style={styles.centerIconWrap}>
                <TouchableOpacity onPress={toggleAudioRecording}>
                  <CircleIcon
                    icon={
                      isRecording
                        ? require('@assets/pause_circle.png')
                        : require('@assets/mic2.png')
                    }
                    fullSize={isRecording}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.bottomButtonsRow}>
                <SmallPillButton label="Upload File" onPress={onUpload} />
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.saveWrap, isSaving && styles.disabled]}
                  onPress={onSave}
                  disabled={isSaving}
                >
                  <LinearGradient
                    colors={[
                      'rgba(253,253,249,0.04)',
                      'rgba(253,253,249,0.01)',
                    ]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.saveGradient}
                  >
                    <Text style={styles.saveActionText}>
                      {isSaving ? 'SAVING...' : 'SAVE'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
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
                <View style={[styles.bigBoxInnerBorder, styles.videoBigBox]}>
                  {mediaUri && mediaFile ? (
                    <View
                      style={[
                        styles.videoPreviewPlaceholder,
                        { backgroundColor: 'transparent' },
                      ]}
                    >
                      <Text style={styles.pickedMediaIcon}>ðŸŽ¬</Text>
                      <Text style={styles.pickedMediaName} numberOfLines={1}>
                        {mediaFile.name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setMediaUri(null);
                          setMediaFile(null);
                        }}
                      >
                        <Text style={styles.removeMediaText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ) : device ? (
                    <Camera
                      ref={camera}
                      style={StyleSheet.absoluteFill}
                      device={device}
                      isActive={true}
                      video={true}
                      audio={true}
                    />
                  ) : (
                    <View style={styles.videoPreviewPlaceholder}>
                      <Text style={styles.previewHint}>No Camera Device</Text>
                    </View>
                  )}

                  {/* Record button overlay */}
                  <TouchableOpacity
                    style={styles.videoOverlayBtn}
                    activeOpacity={0.8}
                    onPress={toggleVideoRecording}
                  >
                    <CircleIcon
                      icon={
                        isRecording
                          ? require('@assets/pause_circle.png')
                          : require('@assets/videocam_2.png')
                      }
                      fullSize={isRecording}
                    />
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              <View style={styles.bottomButtonsRow}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.saveWrap, isSaving && styles.disabled]}
                  onPress={onSave}
                  disabled={isSaving}
                >
                  <LinearGradient
                    colors={[
                      'rgba(253,253,249,0.04)',
                      'rgba(253,253,249,0.01)',
                    ]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.saveGradient}
                  >
                    <Text style={styles.saveActionText}>
                      {isSaving ? 'SAVING...' : 'SAVE'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
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
          onDismiss={handleModalDismissed}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowUploadSheet(false)}
          >
            <Pressable style={[styles.modalCard, { width: contentWidth }]}>
              <Text style={styles.modalTitle}>Choose an Option</Text>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.modalItem}
                onPress={
                  mode === 'text'
                    ? handlePickText
                    : mode === 'audio'
                    ? handlePickAudio
                    : handlePickVideo
                }
              >
                <Text style={styles.modalItemText}>
                  {mode === 'text'
                    ? 'Import Text File'
                    : mode === 'audio'
                    ? 'Import Audio File'
                    : 'Choose from Gallery'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.modalItem}
                onPress={() => setShowUploadSheet(false)}
              >
                <Text style={styles.modalItemCancel}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </BackgroundWrapper>
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
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{}}>
      <LinearGradient
        colors={['rgba(253,253,249,0.03)', 'rgba(253,253,249,0.20)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.pillShell}
      >
        <Text style={styles.pillText}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const CircleIcon = ({ label, icon, fullSize }: { label?: string; icon?: any; fullSize?: boolean }) => {
  return (
    <View style={styles.circleGlow}>
      <View style={[styles.circleOuter, fullSize && { overflow: 'hidden', padding: 0 }]}>
        {icon ? (
          <Image
            source={icon}
            style={fullSize
              ? { width: 72, height: 72, borderRadius: 36 }
              : { width: 24, height: 24, tintColor: 'rgba(215,192,138,0.92)' }
            }
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.circleIcon}>{label}</Text>
        )}
      </View>
    </View>
  );
};

const Waveform = () => {
  const heights = [
    12, 20, 35, 48, 30, 18, 42, 55, 38, 22,
    14, 44, 60, 45, 28, 16, 50, 40, 26, 52,
    62, 48, 32, 18, 46, 58, 36, 24, 56, 42,
    30, 14, 48, 64, 50, 34, 20, 44, 60, 40,
    26, 52, 38, 22, 46, 56, 32, 18, 42, 54,
    36, 28, 16, 48, 62,
  ];

  return (
    <View style={styles.waveContainer}>
      <View style={styles.waveRow}>
        {heights.map((h, idx) => (
          <View key={idx} style={[styles.waveBar, { height: h }]} />
        ))}
      </View>
    </View>
  );
};

/** ---------- Styles ---------- */

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
    marginTop: 10,
    paddingBottom: 22,
  },

  smallLabel: {
    color: palette.gold.DEFAULT,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Medium',
      android: 'serif',
    }),
    fontSize: 20,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 26,
    marginBottom: 8,
    marginLeft: 4,
  },
  textInputShell: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: palette.navy.light,
    minHeight: 120,
    overflow: 'hidden',
    width: '100%',
  },
  textInputGradient: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: '100%',
  },
  bigBoxShell: {
    width: '100%',
    borderRadius: 18,
    // padding: 1,
    borderWidth: 1,
    borderColor: 'rgba(163, 179, 204, 0.45)',
  },
  bigBoxInnerBorder: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
    backgroundColor: 'rgba(7,9,14,0.35)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    height: Math.min(520, Math.max(420, W * 1.3)),
  },
  videoBigBox: {
    padding: 10,
    overflow: 'hidden',
  },
  videoOverlayBtn: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  bigTextInput: {
    flex: 1,
    color: OFFWHITE,
    fontSize: 16,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 24,
  },

  bottomButtonsRow: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveWrap: {},
  saveGradient: {
    minWidth: 140,
    minHeight: 48,
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: palette.navy.light,
    // paddingVertical: 12,
    // paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveActionText: {
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    textShadowColor: 'rgba(229, 214, 176, 0.50)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 9,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
    fontSize: 20,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 26,
  },
  disabled: {
    opacity: 0.5,
  },

  pillShell: {
    minWidth: 140,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: palette.navy.light,
    // paddingVertical: 12,
    // paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pillText: {
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    textShadowColor: 'rgba(229, 214, 176, 0.50)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 9,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
    fontSize: 20,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 26,
  },

  audioWaveWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingTop: 14,
  },
  waveContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 2,
  },
  waveBar: {
    flex: 1,
    borderRadius: 2,
    backgroundColor: 'rgba(253,253,249,0.92)',
  },

  centerIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  circleGlow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 0.2,
    borderColor: palette.navy.muted,
    backgroundColor: 'rgba(242, 226, 177, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        // iOS uses shadowColor for blur glow
        shadowColor: palette.gold.DEFAULT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
        elevation: 5,
      },
      android: {
        // RN 0.76+ boxShadow â€” respects borderRadius, no octagon artifact
        boxShadow: '0px 0px 24px 8px rgba(242, 226, 177, 0.50)',
      },
    }),
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
    color: GOLD,
    fontSize: 15,
    textAlign: 'center',
    letterSpacing: 1,
  },
  modalItemCancel: {
    color: palette.status.errorHover,
    fontSize: 15,
    textAlign: 'center',
  },
  pickedMediaContainer: {
    alignItems: 'center',
    gap: 12,
  },
  pickedMediaIcon: {
    fontSize: 56,
    color: GOLD,
    opacity: 0.8,
  },
  pickedMediaName: {
    color: OFFWHITE,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },
  removeMediaText: {
    color: palette.status.errorHover,
    fontSize: 14,
    textDecorationLine: 'underline',
    marginTop: 8,
  },
});

export default NewEchoComposeScreen;
