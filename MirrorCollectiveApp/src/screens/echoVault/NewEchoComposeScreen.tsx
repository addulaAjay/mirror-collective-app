import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  palette, fontFamily, fontSize, fontWeight, lineHeight,
  spacing, radius, borderWidth, textShadow,
  scale, verticalScale, moderateScale,
} from '@theme';
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
  PermissionsAndroid,
  Linking,
  Image,
  ActivityIndicator,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import DocumentPicker from 'react-native-document-picker';
import { launchImageLibrary } from 'react-native-image-picker';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Video from 'react-native-video';
import { Camera, useCameraDevice, useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button';
import LogoHeader from '@components/LogoHeader';
import UploadProgressOverlay from '@components/UploadProgressOverlay';
import { echoApiService } from '@services/api';
import type { UploadStage } from '@services/api/echo';

type Props = NativeStackScreenProps<RootStackParamList, 'NewEchoComposeScreen'>;

// Compression takes ~25% of perceived time for typical 1m clips; upload
// dominates the middle 70%; finalize lands the remainder. Matches the
// mapping already in use in NewEchoVideoScreen so the bar advances at
// the same pace across both entry points.
const stageToProgress = (stage: UploadStage): number => {
  switch (stage.type) {
    case 'compressing':
      return stage.fraction * 0.25;
    case 'requesting_url':
      return 0.25;
    case 'uploading':
      return stage.total > 0
        ? 0.25 + 0.7 * (stage.sent / stage.total)
        : 0.25;
    case 'finalizing':
      return 0.97;
  }
};

const { width: W } = Dimensions.get('window');

const SURFACE_BORDER = 'rgba(253, 253, 249, 0.18)';

const NewEchoComposeScreen: React.FC<Props> = ({ navigation, route }) => {
  const mode = route.params?.mode ?? 'text';
  const { recipientName, title, category, recipientId, guardianId, lockDate, unlockOnDeath, editEchoId, initialContent, letterToRecipient } = route.params || {};

  const [message, setMessage] = useState(initialContent ?? '');
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const [showVoiceSheet, setShowVoiceSheet] = useState(false);
  const [showVideoSheet, setShowVideoSheet] = useState(false);
  
  // Media State
  const [isRecording, setIsRecording] = useState(false);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<{ name: string; type: string } | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<UploadStage | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  // True from the moment the user starts picking through the first frame
  // of the picked video / first audio-ready event. Bridges the gap
  // between picker dismiss → file copied into sandbox → Video.onLoad,
  // which on physical devices can easily be 2–4s for a large clip.
  const [isPreparingMedia, setIsPreparingMedia] = useState(false);
  const [pendingPicker, setPendingPicker] = useState<'audio' | 'video' | 'text' | null>(null);

  // Audio Playback
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioPosition, setAudioPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // Video Playback
  const [videoPaused, setVideoPaused] = useState(true);

  // Auto-close voice/video sheets once a recording lands
  React.useEffect(() => {
    if (mediaUri && mediaFile) {
      setShowVoiceSheet(false);
      setShowVideoSheet(false);
    }
  }, [mediaUri, mediaFile]);

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
    return 'CREATE AN ECHO';
  }, [recipientName]);

  // Request camera + mic permissions when in video mode
  React.useEffect(() => {
    if (mode === 'video') {
      (async () => {
        if (!hasCamPermission) await requestCamPermission();
        if (!hasMicPermission) await requestMicPermission();
      })();
    }
  }, [mode, hasCamPermission, hasMicPermission]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      audioRecorderPlayer.stopRecorder().catch(() => {});
      audioRecorderPlayer.removeRecordBackListener();
      audioRecorderPlayer.stopPlayer().catch(() => {});
      audioRecorderPlayer.removePlayBackListener();
      const cam = camera.current;
      if (cam) cam.stopRecording().catch(() => {});
    };
  }, []);

  const formatDuration = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const toggleAudioPlayback = async () => {
    if (!mediaUri) return;
    if (isPlayingAudio) {
      await audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();
      setIsPlayingAudio(false);
      setAudioPosition(0);
    } else {
      await audioRecorderPlayer.startPlayer(mediaUri);
      audioRecorderPlayer.addPlayBackListener((e: any) => {
        setAudioPosition(Math.floor(e.currentPosition / 1000));
        setAudioDuration(Math.floor(e.duration / 1000));
        if (e.currentPosition >= e.duration) {
          audioRecorderPlayer.stopPlayer().catch(() => {});
          audioRecorderPlayer.removePlayBackListener();
          setIsPlayingAudio(false);
          setAudioPosition(0);
        }
      });
      setIsPlayingAudio(true);
    }
  };

  const stopAudioPlayback = async () => {
    await audioRecorderPlayer.stopPlayer().catch(() => {});
    audioRecorderPlayer.removePlayBackListener();
    setIsPlayingAudio(false);
    setAudioPosition(0);
    setAudioDuration(0);
  };

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
      const fileName = result.split('/').pop() || 'recording.m4a';
      setMediaFile({ name: fileName, type: 'audio/m4a' });
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
                const fileName = video.path.split('/').pop() || 'recording.mp4';
                setMediaUri(video.path);
                setMediaFile({ name: fileName, type: 'video/mp4' });
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
    if ((mode === 'audio' || mode === 'video') && !mediaUri && !editEchoId) {
      Alert.alert('No Recording', 'Please record a message first.');
      return;
    }

    setIsSaving(true);
    setUploadProgress(0);
    setUploadStage(null);
    try {
      // ── Edit mode: PATCH existing echo ───────────────────────────────────
      if (editEchoId) {
        const updateData: Record<string, any> = {};
        if (mode === 'text') updateData.content = message;
        if (mediaUri) {
          const contentType = mediaFile?.type || (mode === 'audio' ? 'audio/mp4' : 'video/mp4');
          // Compress + presign + stream + finalize in one call. The
          // backend HEADs S3 server-side and writes media_url to the row
          // atomically — we don't need to (and must not) pass it in the
          // metadata PATCH below.
          const mediaResult = await echoApiService.uploadEchoMedia(
            editEchoId,
            mediaUri,
            contentType,
            stage => {
              setUploadStage(stage);
              setUploadProgress(stageToProgress(stage));
            },
          );
          if (!mediaResult.success) {
            throw new Error(mediaResult.error ?? 'Media upload failed');
          }
        }
        // Propagate recipient + lock-date changes from the recipient-picker
        // step. Backend treats explicit null as "clear", so when the user
        // removes a previously-set lock date we send release_date: null
        // (rather than omitting the field, which would leave it unchanged).
        if (recipientId) {
          updateData.recipient_id = recipientId;
        }
        updateData.release_date = lockDate ?? null;
        // null clears the cover note on save (matches release_date semantics).
        updateData.letter_to_recipient = letterToRecipient ?? null;

        const updateResponse = await echoApiService.updateEcho(editEchoId, updateData);
        if (!updateResponse.success) throw new Error('Failed to update echo.');

        // If the resulting state matches the auto-release rule
        // (recipient + no lock date), fire the release endpoint to mirror
        // what create_echo would have done. The edit icon is hidden for
        // non-DRAFT echoes so by the time we get here the echo was DRAFT;
        // releaseEcho's preconditions on the backend handle any edge case,
        // and the try/catch swallows ValidationError if it slips through.
        const shouldRelease = !!recipientId && !lockDate;
        if (shouldRelease) {
          try {
            await echoApiService.releaseEcho(editEchoId);
          } catch {
            /* see comment above */
          }
        }

        Alert.alert(
          'Success',
          shouldRelease ? 'Echo sent!' : 'Echo updated!',
          [{
            text: 'OK',
            // Match the create flow: drop the user back into the vault
            // library so they can see the row update in context, rather
            // than popping all the way to the stack root (TalkToMirror).
            onPress: () => navigation.navigate('MirrorEchoVaultLibrary' as any),
          }],
        );
        return;
      }

      // ── Create mode: POST new echo ────────────────────────────────────────
      const createResponse = await echoApiService.createEcho({
        title: title || 'Untitled Echo',
        category: category || 'General',
        echo_type: mode === 'text' ? 'TEXT' : mode === 'audio' ? 'AUDIO' : 'VIDEO',
        recipient_id: recipientId,
        ...(guardianId && { guardian_id: guardianId }),
        ...(lockDate && { release_date: lockDate }),
        ...(unlockOnDeath !== undefined && { unlock_on_death: unlockOnDeath }),
        ...(letterToRecipient && { letter_to_recipient: letterToRecipient }),
        content: mode === 'text' ? message : undefined,
      });

      if (!createResponse.success || !createResponse.data) {
        throw new Error('Failed to create echo. Please check your connection and try again.');
      }
      const newEchoId = createResponse.data.echo_id;

      if (mediaUri && newEchoId) {
        const contentType = mediaFile?.type || (mode === 'audio' ? 'audio/mp4' : 'video/mp4');
        const mediaResult = await echoApiService.uploadEchoMedia(
          newEchoId,
          mediaUri,
          contentType,
          stage => {
            setUploadStage(stage);
            setUploadProgress(stageToProgress(stage));
          },
        );
        if (!mediaResult.success) {
          throw new Error(mediaResult.error ?? 'Media upload failed');
        }
      }

      Alert.alert('Success', 'Echo saved to vault!', [
        { text: 'OK', onPress: () => navigation.navigate('MirrorEchoVaultLibrary' as any) },
      ]);

    } catch (error: any) {
      console.error('Save failed:', error);
      Alert.alert('Error', error?.message || 'Failed to save echo. Please try again.');
      setUploadProgress(0);
      setUploadStage(null);
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
    // Only used on iOS; Android triggers pickers directly from handle* functions
    if (Platform.OS === 'android') return;
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
    // On Android, Modal onDismiss doesn't fire, so trigger directly
    if (Platform.OS === 'android') {
      setTimeout(() => executePickAudio(), 300);
    }
  };

  const executePickAudio = async () => {
    try {
      setIsPicking(true);
      const res = await DocumentPicker.pickSingle({
        // Restrict to common audio formats only
        type: [
          DocumentPicker.types.audio, // audio/* — covers mp3, m4a, wav, aac, ogg, flac, etc.
        ],
      });
      if (res) {
        setIsPreparingMedia(true);
        setMediaUri(res.uri);
        setMediaFile({ name: res.name || 'audio.m4a', type: res.type || 'audio/m4a' });
        setRecordingDuration(0); // Reset duration if file picked
        // For audio there's no Video.onLoad to wait on — clear the spinner
        // once React has committed the new mediaUri to the preview card.
        setTimeout(() => setIsPreparingMedia(false), 300);
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
    // On Android, Modal onDismiss doesn't fire, so trigger directly
    if (Platform.OS === 'android') {
      setTimeout(() => executePickVideo(), 300);
    }
  };

  const executePickVideo = async () => {
    try {
      setIsPicking(true);
      const result = await launchImageLibrary({
        mediaType: 'video',
        selectionLimit: 1,
        // iOS-only but harmless on Android. Default ('auto') transcodes
        // HEVC clips from the Photos library to H.264 MP4 before the
        // picker returns — a 5–15s blocking export for a 1-minute 4K
        // clip. 'current' returns the original asset as-is; the upload
        // pipeline's compression step (compressVideoIfNeeded) normalizes
        // to 720p H.264 MP4 anyway, so we lose nothing.
        assetRepresentationMode: 'current',
        // Skip EXIF / extra metadata fetch — saves a few hundred ms.
        includeExtra: false,
      });
      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // Show the prepare-media spinner immediately — Video.onLoad won't
        // fire for another 1–4s while AVFoundation reads the file off disk
        // (longer for HEVC clips that need transcoding for preview).
        setIsPreparingMedia(true);
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
    // On Android, Modal onDismiss doesn't fire, so trigger directly
    if (Platform.OS === 'android') {
      setTimeout(() => executePickText(), 300);
    }
  };

  const executePickText = async () => {
    try {
      setIsPicking(true);
      const res = await DocumentPicker.pickSingle({
        // Restrict to text-related formats only (txt, pdf, doc, docx)
        type: [
          DocumentPicker.types.plainText,
          DocumentPicker.types.pdf,
          DocumentPicker.types.doc,
          DocumentPicker.types.docx,
        ],
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

  const handlePickPhotoVideo = async () => {
    if (isPicking) return;
    try {
      setIsPicking(true);
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        selectionLimit: 1,
        assetRepresentationMode: 'current',
        includeExtra: false,
      });
      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // Normalize image/jpg → image/jpeg (backend allowlist uses image/jpeg)
        const rawType = asset.type || 'image/jpeg';
        const normalizedType = rawType === 'image/jpg' ? 'image/jpeg' : rawType;
        setIsPreparingMedia(true);
        setMediaUri(asset.uri || null);
        setMediaFile({ name: asset.fileName || 'media', type: normalizedType });
        setTimeout(() => setIsPreparingMedia(false), 300);
      }
    } catch (err) {
      console.error(err);
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

        {/*
          KeyboardAvoidingView from react-native-keyboard-controller is the
          right primitive for an editor-style screen (a single tall input
          that should fill available space). The library's KAV behaves like
          stock's but uses the new RN keyboard APIs that don't lag/jitter.
          KeyboardAwareScrollView would force everything into a scroll and
          break the flex-fill layout — wrong tool here.
        */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
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

        {/* Ornamental divider — line · diamond · line */}
        <View style={[styles.ornamentRow, { width: contentWidth }]}>
          <View style={styles.ornamentLine} />
          <View style={styles.ornamentDiamond} />
          <View style={styles.ornamentLine} />
        </View>

        {/* Body */}
        <View style={[styles.content, { width: contentWidth }, mode === 'audio' && styles.audioContent]}>
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
                    placeholder="Write what you want to remember."
                    placeholderTextColor={palette.navy.light}
                    style={styles.bigTextInput}
                    multiline
                    textAlignVertical="top"
                  />
                </LinearGradient>
              </View>

              {/* Attachment chip — shown below text box after picking a photo/video */}
              {mediaUri && mediaFile && (
                <View style={styles.attachmentChip}>
                  {/* Thumbnail for images, file icon for videos */}
                  {mediaFile.type?.startsWith('image/') ? (
                    <Image
                      source={{ uri: mediaUri }}
                      style={styles.attachmentThumb}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.attachmentIconBox}>
                      <Image
                        source={require('@assets/videocam_2.png')}
                        style={styles.attachmentIcon}
                        resizeMode="contain"
                      />
                    </View>
                  )}
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {mediaFile.name}
                  </Text>
                  {isPreparingMedia && (
                    <ActivityIndicator size="small" color={palette.gold.DEFAULT} style={{ marginRight: scale(4) }} />
                  )}
                  <TouchableOpacity
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => {
                      setVideoPaused(true);
                      setMediaUri(null);
                      setMediaFile(null);
                    }}
                  >
                    <Text style={styles.attachmentRemove}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}

              <AddToEchoRow
                mode={mode}
                onPickMedia={() => setShowUploadSheet(true)}
                onPickPhotoVideo={handlePickPhotoVideo}
                onRecord={() => setShowVoiceSheet(true)}
                onRecordVideo={() => setShowVideoSheet(true)}
                isRecording={isRecording}
              />
              <View style={styles.saveRow}>
                <Button variant="secondary" size="L" title={isSaving ? 'SAVING...' : 'SAVE'} onPress={onSave} disabled={isSaving} />
              </View>
            </>
          )}

          {mode === 'audio' && (
            <>
              {mediaUri && mediaFile ? (
                <View style={styles.audioPreviewCard}>
                  {/* Remove */}
                  <TouchableOpacity
                    style={styles.audioRemoveBtn}
                    onPress={() => {
                      stopAudioPlayback();
                      setMediaUri(null);
                      setMediaFile(null);
                    }}
                  >
                    <Text style={styles.audioRemoveBtnText}>&#x2715;</Text>
                  </TouchableOpacity>

                  {/* File info */}
                  <View style={styles.audioFileInfoRow}>
                    <View style={styles.audioTypeBadge}>
                      <Text style={styles.audioTypeBadgeText}>
                        {(mediaFile.type.split('/')[1] || 'AUDIO').toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.audioPreviewFileName} numberOfLines={2}>
                      {mediaFile.name}
                    </Text>
                  </View>

                  {/* Waveform */}
                  <View style={styles.audioPreviewWaveWrap}>
                    <Waveform />
                  </View>

                  {/* Playback controls */}
                  <View style={styles.audioPlaybackRow}>
                    <Text style={styles.audioTimerText}>{formatDuration(audioPosition)}</Text>
                    <TouchableOpacity style={styles.audioPlayPauseBtn} onPress={toggleAudioPlayback}>
                      <Image
                        source={
                          isPlayingAudio
                            ? require('@assets/pause_circle.png')
                            : require('@assets/play_circle.png')
                        }
                        style={styles.audioPlayPauseBtnIcon}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                    <Text style={styles.audioTimerText}>
                      {audioDuration > 0 ? formatDuration(audioDuration) : '--:--'}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.audioBody}>
                  <View style={styles.audioWaveWrap}>
                    <Waveform />
                  </View>
                  <View style={styles.micRow}>
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
                  {(isPicking || isPreparingMedia) && (
                    <View style={styles.mediaLoadingOverlay} pointerEvents="auto">
                      <ActivityIndicator size="large" color={palette.gold.DEFAULT} />
                      <Text style={styles.mediaLoadingText}>
                        {isPicking ? 'Selecting audio…' : 'Preparing preview…'}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <AddToEchoRow
                mode={mode}
                onPickMedia={onUpload}
                onRecord={toggleAudioRecording}
                isRecording={isRecording}
              />
              <View style={styles.saveRow}>
                <Button variant="secondary" size="L" title={isSaving ? 'SAVING...' : 'SAVE'} onPress={onSave} disabled={isSaving} />
              </View>
            </>
          )}
          {mode === 'video' && (
            <>
              <View style={styles.bigBoxShell}>
                <View style={[styles.bigBoxInnerBorder, styles.videoBigBox]}>
                  {mediaUri && mediaFile ? (
                    <>
                      <Video
                        source={{ uri: mediaUri }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="contain"
                        paused={videoPaused}
                        controls={false}
                        repeat={false}
                        onLoad={() => setIsPreparingMedia(false)}
                        onError={() => setIsPreparingMedia(false)}
                        onEnd={() => setVideoPaused(true)}
                      />
                      {/* Top scrim: filename + remove */}
                      <LinearGradient
                        colors={['rgba(0,0,0,0.65)', 'transparent']}
                        style={styles.videoTopScrim}
                      >
                        <Text style={styles.videoPickedName} numberOfLines={1}>
                          {mediaFile.name}
                        </Text>
                        <TouchableOpacity
                          style={styles.videoRemoveBtn}
                          onPress={() => {
                            setVideoPaused(true);
                            setMediaUri(null);
                            setMediaFile(null);
                          }}
                        >
                          <Text style={styles.videoRemoveBtnText}>&#x2715;</Text>
                        </TouchableOpacity>
                      </LinearGradient>
                      {/* Center tap to play/pause */}
                      <TouchableOpacity
                        style={styles.videoCenterPlayBtn}
                        activeOpacity={0.8}
                        onPress={() => setVideoPaused(p => !p)}
                      >
                        {videoPaused && (
                          <Image
                            source={require('@assets/play_circle.png')}
                            style={styles.videoPlayIconImg}
                            resizeMode="contain"
                          />
                        )}
                      </TouchableOpacity>
                    </>
                  ) : device && hasCamPermission ? (
                    <Camera
                      ref={camera}
                      style={StyleSheet.absoluteFill}
                      device={device}
                      isActive={true}
                      video={true}
                      audio={hasMicPermission}
                    />
                  ) : (
                    <View style={styles.videoPreviewPlaceholder}>
                      <Text style={styles.previewHint}>
                        {!hasCamPermission ? 'Camera Permission Required' : 'No Camera Device'}
                      </Text>
                      {!hasCamPermission && (
                        <TouchableOpacity
                          onPress={async () => {
                            const granted = await requestCamPermission();
                            if (!granted) Linking.openSettings();
                          }}
                          style={styles.grantPermissionBtn}
                        >
                          <Text style={styles.removeMediaText}>Grant Permission</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Record button — hidden when media is picked */}
                  {!mediaUri && (
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
                  )}

                  {(isPicking || isPreparingMedia) && (
                    <View style={styles.mediaLoadingOverlay} pointerEvents="auto">
                      <ActivityIndicator size="large" color={palette.gold.DEFAULT} />
                      <Text style={styles.mediaLoadingText}>
                        {isPicking ? 'Selecting video…' : 'Preparing preview…'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <AddToEchoRow
                mode={mode}
                onPickMedia={onUpload}
                onRecord={toggleVideoRecording}
                isRecording={isRecording}
              />
              <View style={styles.saveRow}>
                <Button variant="secondary" size="L" title={isSaving ? 'SAVING...' : 'SAVE'} onPress={onSave} disabled={isSaving} />
              </View>
            </>
          )}
        </View>
        </KeyboardAvoidingView>

        {/* ── "Choose type of file" sheet ── */}
        <Modal
          visible={showUploadSheet}
          transparent
          animationType="slide"
          onRequestClose={() => setShowUploadSheet(false)}
          onDismiss={handleModalDismissed}
        >
          <Pressable style={styles.sheetBackdrop} onPress={() => setShowUploadSheet(false)}>
            <Pressable style={[styles.bottomSheet, { width: contentWidth }]}>
              <View style={styles.sheetTopRow}>
                <Text style={styles.sheetTitle}>Choose type of file you wish to upload</Text>
                <TouchableOpacity onPress={() => setShowUploadSheet(false)} style={styles.sheetCloseBtn}>
                  <Text style={styles.sheetCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.sheetBtnRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.sheetTypeBtn}
                  onPress={() => {
                    setShowUploadSheet(false);
                    if (Platform.OS === 'android') setTimeout(() => executePickText(), 300);
                    else setPendingPicker('text');
                  }}
                >
                  <Image source={require('@assets/download.png')} style={styles.sheetTypeBtnIcon} resizeMode="contain" />
                  <Text style={styles.sheetTypeBtnLabel}>File</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.sheetTypeBtn}
                  onPress={() => {
                    setShowUploadSheet(false);
                    if (Platform.OS === 'android') setTimeout(() => executePickVideo(), 300);
                    else setPendingPicker('video');
                  }}
                >
                  <Image source={require('@assets/videocam.png')} style={styles.sheetTypeBtnIcon} resizeMode="contain" />
                  <Text style={styles.sheetTypeBtnLabel}>Gallery</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sheetHint}>
                You can attach a .pdf, .png, .jpg or .mp4 format.
              </Text>
            </Pressable>
          </Pressable>
        </Modal>

        {/* ── "Record your Voice" sheet ── */}
        <Modal
          visible={showVoiceSheet}
          transparent
          animationType="slide"
          onRequestClose={() => {
            if (isRecording) stopAudioRecording();
            setShowVoiceSheet(false);
          }}
        >
          <Pressable style={styles.sheetBackdrop} onPress={() => {}}>
            <View style={[styles.bottomSheet, { width: contentWidth }]}>
              <View style={styles.sheetTopRow}>
                <Text style={styles.sheetTitle}>Record your Voice</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (isRecording) stopAudioRecording();
                    setShowVoiceSheet(false);
                  }}
                  style={styles.sheetCloseBtn}
                >
                  <Text style={styles.sheetCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Waveform */}
              <View style={styles.sheetWaveWrap}>
                <Waveform />
              </View>

              {/* Mic button */}
              <TouchableOpacity
                style={styles.sheetMicBtn}
                onPress={isRecording ? stopAudioRecording : startAudioRecording}
                activeOpacity={0.8}
              >
                <Image
                  source={isRecording ? require('@assets/pause_circle.png') : require('@assets/mic2.png')}
                  style={styles.sheetMicIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              {isRecording && (
                <Text style={styles.sheetRecordingTimer}>{formatDuration(recordingDuration)}</Text>
              )}

              <View style={styles.sheetSaveRow}>
                <Button
                  variant="secondary"
                  size="L"
                  title="SAVE"
                  onPress={async () => {
                    if (isRecording) await stopAudioRecording();
                    setShowVoiceSheet(false);
                  }}
                  disabled={!mediaUri && !isRecording}
                />
              </View>
            </View>
          </Pressable>
        </Modal>

        {/* ── "Record Video" sheet ── */}
        <Modal
          visible={showVideoSheet}
          transparent
          animationType="slide"
          onRequestClose={() => {
            if (isRecording) stopVideoRecording();
            setShowVideoSheet(false);
          }}
        >
          <Pressable style={styles.sheetBackdrop} onPress={() => {}}>
            <View style={[styles.bottomSheet, { width: contentWidth }]}>
              <View style={styles.sheetTopRow}>
                <Text style={styles.sheetTitle}>Record Video</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (isRecording) stopVideoRecording();
                    setShowVideoSheet(false);
                  }}
                  style={styles.sheetCloseBtn}
                >
                  <Text style={styles.sheetCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Camera viewfinder */}
              <View style={styles.sheetCameraBox}>
                {device && hasCamPermission ? (
                  <Camera
                    ref={camera}
                    style={StyleSheet.absoluteFill}
                    device={device}
                    isActive={showVideoSheet}
                    video
                    audio={hasMicPermission}
                  />
                ) : (
                  <View style={styles.sheetCameraPlaceholder}>
                    <Text style={styles.sheetCameraHint}>
                      {!hasCamPermission ? 'Camera permission required' : 'No camera available'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Record button */}
              <TouchableOpacity
                style={styles.sheetMicBtn}
                onPress={isRecording ? stopVideoRecording : startVideoRecording}
                activeOpacity={0.8}
              >
                <Image
                  source={isRecording ? require('@assets/pause_circle.png') : require('@assets/videocam_2.png')}
                  style={styles.sheetMicIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <View style={styles.sheetSaveRow}>
                <Button
                  variant="secondary"
                  size="L"
                  title="SAVE"
                  onPress={() => {
                    if (isRecording) stopVideoRecording();
                    setShowVideoSheet(false);
                  }}
                  disabled={!mediaUri && !isRecording}
                />
              </View>
            </View>
          </Pressable>
        </Modal>

        {/* Upload progress overlay — covers the recorded video / audio
            preview so the user isn't left staring at their clip wondering
            whether the save is doing anything. */}
        <UploadProgressOverlay
          visible={isSaving && (mode === 'audio' || mode === 'video') && !!mediaUri}
          progress={uploadProgress}
          stage={uploadStage}
        />
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

/** ---------- Small UI bits (pure RN, no extra deps) ---------- */

// Figma 220:2073 — two states:
// idle  (fullSize=false): 80px dark circle + glow, 40px icon inside
// active (fullSize=true):  flat pause_circle / play_circle icon at 80px, no container
const CircleIcon = ({ label, icon, fullSize }: { label?: string; icon?: any; fullSize?: boolean }) => {
  if (fullSize) {
    return (
      <Image
        source={icon}
        style={{ width: scale(80), height: scale(80), tintColor: palette.gold.DEFAULT }}
        resizeMode="contain"
      />
    );
  }
  return (
    <View style={styles.circleGlow}>
      <View style={styles.circleOuter}>
        {icon ? (
          <Image
            source={icon}
            style={{ width: scale(40), height: scale(40), tintColor: palette.gold.DEFAULT }}
            resizeMode="contain"
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

/** ---------- Add to Echo Row ---------- */

interface AddToEchoRowProps {
  mode: 'text' | 'audio' | 'video';
  onPickMedia: () => void;
  onPickPhotoVideo?: () => void;
  onRecord: () => void;
  onRecordVideo?: () => void;
  isRecording: boolean;
}

const AddToEchoRow: React.FC<AddToEchoRowProps> = ({ mode, onPickMedia, onPickPhotoVideo, onRecord, onRecordVideo, isRecording }) => {
  const buttons: { icon: any; label: string; onPress: () => void }[] =
    mode === 'text'
      ? [
          { icon: require('@assets/videocam.png'), label: 'Add photo\nor video', onPress: onPickPhotoVideo ?? onPickMedia },
          { icon: require('@assets/mic.png'), label: 'Add voice\nrecording', onPress: onRecord },
          { icon: require('@assets/videocam_2.png'), label: 'Record a\nvideo', onPress: onRecordVideo ?? onPickMedia },
        ]
      : mode === 'audio'
      ? [
          {
            icon: isRecording ? require('@assets/pause_circle.png') : require('@assets/mic2.png'),
            label: isRecording ? 'Stop\nrecording' : 'Record\nvoice',
            onPress: onRecord,
          },
          { icon: require('@assets/download.png'), label: 'Import\naudio', onPress: onPickMedia },
        ]
      : [
          {
            icon: isRecording ? require('@assets/pause_circle.png') : require('@assets/videocam_2.png'),
            label: isRecording ? 'Stop\nrecording' : 'Record\nvideo',
            onPress: onRecord,
          },
          { icon: require('@assets/videocam.png'), label: 'Choose\nfrom gallery', onPress: onPickMedia },
        ];

  return (
    <View style={addRowStyles.wrap}>
      <Text style={addRowStyles.label}>Add to your Echo</Text>
      <View style={addRowStyles.row}>
        {buttons.map((btn, i) => (
          <TouchableOpacity key={i} style={addRowStyles.btn} activeOpacity={0.8} onPress={btn.onPress}>
            <View style={addRowStyles.iconCircle}>
              <Image source={btn.icon} style={addRowStyles.icon} resizeMode="contain" />
            </View>
            <Text style={addRowStyles.btnLabel}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const addRowStyles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginTop: verticalScale(spacing.m),
    gap: verticalScale(spacing.xs),
  },
  label: {
    fontFamily: fontFamily.bodyItalic,
    fontSize: moderateScale(fontSize.xs),
    color: palette.gold.subtlest,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: verticalScale(spacing.xs),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale(spacing.s),
  },
  btn: {
    alignItems: 'center',
    gap: verticalScale(spacing.xxs),
    flex: 1,
  },
  iconCircle: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.s,
    borderWidth: 0.5,
    borderColor: 'rgba(215,192,138,0.5)',
    backgroundColor: 'rgba(215,192,138,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.gold.DEFAULT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  icon: {
    width: scale(28),
    height: scale(28),
    tintColor: palette.gold.DEFAULT,
  },
  btnLabel: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.xxs),
    color: palette.gold.subtlest,
    textAlign: 'center',
    lineHeight: moderateScale(14),
  },
});

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
  iconText: { color: palette.neutral.white, fontSize: 24, opacity: 0.9 },

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
  logoMark: { color: palette.gold.DEFAULT, fontSize: 16 },
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
    marginTop: verticalScale(spacing.m),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: scale(44),
    height: scale(44),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backIcon: {
    color: palette.gold.DEFAULT,
    fontSize: moderateScale(fontSize.xl),
    marginLeft: 2,
  },
  backArrowImg: {
    width: scale(20),
    height: scale(20),
    tintColor: palette.gold.DEFAULT,
  },
  screenTitle: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize['2xl']),
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.xl,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    textShadowColor: textShadow.glowSubtle.color,
    textShadowOffset: textShadow.glowSubtle.offset,
    textShadowRadius: textShadow.glowSubtle.radius,
  },
  titleRightSpacer: { width: scale(44), height: scale(44) },

  ornamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(spacing.xxs),
    marginBottom: verticalScale(spacing.xs),
    gap: scale(spacing.xs),
  },
  ornamentLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: 'rgba(215,192,138,0.35)',
  },
  ornamentDiamond: {
    width: scale(6),
    height: scale(6),
    borderWidth: 0.8,
    borderColor: palette.gold.DEFAULT,
    transform: [{ rotate: '45deg' }],
    backgroundColor: palette.gold.DEFAULT,
  },

  kav: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    flex: 1,
    marginTop: 10,
    paddingBottom: 22,
  },

  smallLabel: {
    fontFamily: fontFamily.headingMedium,
    fontSize: moderateScale(fontSize.l),
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.m,
    color: palette.gold.subtlest,
    marginBottom: verticalScale(spacing.xs),
    marginLeft: scale(spacing.xxs),
  },
  textInputShell: {
    // flex: 1 lets the input fill all space between the title row and the
    // bottom buttons — same height on iPhone SE as on Pro Max, just less
    // of it. Overflow scrolls inside the TextInput itself when content
    // exceeds the visible area.
    flex: 1,
    borderRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
    minHeight: scale(120),
    overflow: 'hidden',
    width: '100%',
  },
  textInputGradient: {
    flex: 1,
    paddingHorizontal: scale(spacing.m),
    paddingVertical: verticalScale(spacing.xs),
    width: '100%',
  },
  // Figma 211:1271 — outer video container with gold glow
  bigBoxShell: {
    width: '100%',
    height: Math.min(520, Math.max(420, W * 1.3)) + scale(spacing.xs) * 2,
    borderRadius: radius.xs,
    borderWidth: 0.2,
    borderColor: '#bfc7d9',
    backgroundColor: 'rgba(197,158,95,0.05)',
    padding: scale(spacing.xs),
    boxShadow: '0px 0px 12px 0px rgba(229,214,176,0.3)',
    shadowColor: '#e5d6b0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  // Figma 211:1272 — inner camera viewport; flex:1 fills bigBoxShell minus padding
  bigBoxInnerBorder: {
    flex: 1,
    borderRadius: radius.xs,
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.DEFAULT,
    backgroundColor: 'rgba(163,179,204,0.05)',
    overflow: 'hidden',
  },
  videoBigBox: {},
  videoOverlayBtn: {
    position: 'absolute',
    bottom: verticalScale(spacing.m),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  bigTextInput: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.s),
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.m,
    color: palette.neutral.white,
  },

  saveRow: {
    marginTop: verticalScale(spacing.s),
    marginBottom: verticalScale(spacing.m),
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Attachment chip — inline below the text box
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(spacing.xs),
    paddingHorizontal: scale(spacing.xs),
    paddingVertical: verticalScale(spacing.xxs),
    borderRadius: radius.xs,
    borderWidth: borderWidth.thin,
    borderColor: 'rgba(215,192,138,0.3)',
    backgroundColor: 'rgba(215,192,138,0.07)',
    gap: scale(spacing.xs),
  },
  attachmentThumb: {
    width: scale(36),
    height: scale(36),
    borderRadius: 4,
  },
  attachmentIconBox: {
    width: scale(36),
    height: scale(36),
    borderRadius: 4,
    backgroundColor: 'rgba(215,192,138,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentIcon: {
    width: scale(20),
    height: scale(20),
    tintColor: palette.gold.DEFAULT,
  },
  attachmentName: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.xxs),
    color: palette.gold.subtlest,
  },
  attachmentRemove: {
    color: 'rgba(253,253,249,0.5)',
    fontSize: moderateScale(fontSize.xs),
    paddingLeft: scale(4),
  },
  // Figma 211:1339 — audio mode: mic area and buttons spaced proportionally to screen height
  audioContent: {
    justifyContent: 'space-between',
  },
  disabled: {
    opacity: 0.5,
  },

  // Audio idle state layout — waveform fills space, mic pinned to bottom
  audioBody: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
  },
  audioWaveWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: scale(spacing.m),
  },
  micRow: {
    height: verticalScale(88),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(spacing.l),
  },

  waveContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: scale(spacing.s),
    paddingVertical: verticalScale(spacing.m),
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  waveBar: {
    flex: 1,
    borderRadius: 2,
    backgroundColor: palette.neutral.white,
  },

  circleGlow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Figma 220:2073 — idle mic/video button: 80px circle, bg 0.05, glow 15px/0.3
  circleOuter: {
    width: scale(80),
    height: scale(80),
    borderRadius: radius.full,
    borderWidth: 0.2,
    borderColor: palette.navy.light,
    backgroundColor: 'rgba(253,253,249,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 0px 15px 0px rgba(242,226,177,0.3)',
    shadowColor: palette.gold.DEFAULT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  circleIcon: {
    color: 'rgba(215,192,138,0.92)',
    fontSize: 22,
  },

  videoPreviewPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewHint: {
    color: 'rgba(253,253,249,0.55)',
    fontSize: 14,
  },
  grantPermissionBtn: {
    marginTop: 12,
  },

  mediaLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(7,9,14,0.72)',
    zIndex: 10,
  },
  mediaLoadingText: {
    color: palette.gold.subtlest,
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.s),
  },

  // ── Video picked preview ──
  videoTopScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 28,
    zIndex: 5,
  },
  videoPickedName: {
    flex: 1,
    color: palette.neutral.white,
    fontSize: 13,
    marginRight: 8,
    letterSpacing: 0.3,
  },
  videoRemoveBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoRemoveBtnText: {
    color: palette.neutral.white,
    fontSize: 14,
    lineHeight: 18,
  },
  videoCenterPlayBtn: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  videoPlayIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayIconImg: {
    width: 72,
    height: 72,
    tintColor: palette.neutral.white,
  },

  // ── Audio picked preview ──
  audioPreviewCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.2)',
    backgroundColor: 'rgba(7,9,14,0.55)',
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 16,
    marginTop: 14,
    gap: 12,
  },
  audioRemoveBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  audioRemoveBtnText: {
    color: palette.neutral.white,
    fontSize: 14,
  },
  audioFileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 8,
  },
  audioTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(215,192,138,0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(215,192,138,0.4)',
  },
  audioTypeBadgeText: {
    color: palette.gold.DEFAULT,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  audioPreviewFileName: {
    flex: 1,
    color: palette.neutral.white,
    fontSize: 14,
    lineHeight: 18,
  },
  audioPreviewWaveWrap: {
    flex: 1,
    minHeight: 80,
    opacity: 0.55,
  },
  audioPlaybackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  audioTimerText: {
    color: 'rgba(253,253,249,0.45)',
    fontSize: 13,
    minWidth: 40,
    textAlign: 'center',
  },
  audioPlayPauseBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(215,192,138,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: palette.gold.DEFAULT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
      },
      android: {
        boxShadow: '0px 0px 14px 4px rgba(215,192,138,0.35)',
      },
    }),
  },
  audioPlayPauseBtnText: {
    color: palette.gold.DEFAULT,
    fontSize: 22,
    marginLeft: 3,
  },
  audioPlayPauseBtnIcon: {
    width: 36,
    height: 36,
    tintColor: palette.gold.DEFAULT,
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
    color: palette.gold.DEFAULT,
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
    color: palette.gold.DEFAULT,
    opacity: 0.8,
  },
  pickedMediaName: {
    color: palette.neutral.white,
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

  /* ── Bottom sheet modals ── */
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: verticalScale(spacing.xl),
  },
  bottomSheet: {
    borderRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: 'rgba(215,192,138,0.22)',
    backgroundColor: 'rgba(10,12,20,0.97)',
    paddingHorizontal: scale(spacing.m),
    paddingTop: verticalScale(spacing.m),
    paddingBottom: verticalScale(spacing.l),
    gap: verticalScale(spacing.m),
  },
  sheetTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    flex: 1,
    fontFamily: fontFamily.headingMedium,
    fontSize: moderateScale(fontSize.s),
    color: palette.gold.subtlest,
    letterSpacing: 0.4,
  },
  sheetCloseBtn: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    borderWidth: borderWidth.thin,
    borderColor: 'rgba(253,253,249,0.15)',
    backgroundColor: 'rgba(253,253,249,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCloseText: {
    color: 'rgba(253,253,249,0.6)',
    fontSize: moderateScale(fontSize.xs),
  },

  /* File-type chooser */
  sheetBtnRow: {
    flexDirection: 'row',
    gap: scale(spacing.m),
    justifyContent: 'center',
  },
  sheetTypeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: verticalScale(spacing.xs),
    paddingVertical: verticalScale(spacing.m),
    borderRadius: radius.xs,
    borderWidth: borderWidth.thin,
    borderColor: 'rgba(215,192,138,0.25)',
    backgroundColor: 'rgba(215,192,138,0.06)',
  },
  sheetTypeBtnIcon: {
    width: scale(32),
    height: scale(32),
    tintColor: palette.gold.DEFAULT,
  },
  sheetTypeBtnLabel: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.xs),
    color: palette.gold.subtlest,
  },
  sheetHint: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.xxs),
    color: 'rgba(253,253,249,0.4)',
    textAlign: 'center',
    lineHeight: moderateScale(16),
  },

  /* Voice / video recording sheet */
  sheetWaveWrap: {
    height: verticalScale(60),
    width: '100%',
  },
  sheetMicBtn: {
    alignSelf: 'center',
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    borderWidth: borderWidth.thin,
    borderColor: 'rgba(215,192,138,0.35)',
    backgroundColor: 'rgba(215,192,138,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.gold.DEFAULT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  sheetMicIcon: {
    width: scale(32),
    height: scale(32),
    tintColor: palette.gold.DEFAULT,
  },
  sheetRecordingTimer: {
    alignSelf: 'center',
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.xs),
    color: palette.gold.subtlest,
    marginTop: verticalScale(-spacing.xs),
  },
  sheetSaveRow: {
    alignItems: 'center',
  },
  sheetCameraBox: {
    width: '100%',
    height: verticalScale(220),
    borderRadius: radius.xs,
    overflow: 'hidden',
    backgroundColor: 'rgba(7,9,14,0.8)',
    borderWidth: borderWidth.thin,
    borderColor: 'rgba(215,192,138,0.15)',
  },
  sheetCameraPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCameraHint: {
    color: 'rgba(253,253,249,0.4)',
    fontSize: moderateScale(fontSize.xxs),
    textAlign: 'center',
  },
});

export default NewEchoComposeScreen;
