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
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import DocumentPicker from 'react-native-document-picker';
import { launchImageLibrary } from 'react-native-image-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Video from 'react-native-video';
import { Camera, useCameraDevice, useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button';
import LogoHeader from '@components/LogoHeader';
import { echoApiService } from '@services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'NewEchoComposeScreen'>;

const { width: W } = Dimensions.get('window');

const SURFACE_BORDER = 'rgba(253, 253, 249, 0.18)';

const NewEchoComposeScreen: React.FC<Props> = ({ navigation, route }) => {
  const mode = route.params?.mode ?? 'text';
  const { recipientName, title, category, recipientId, guardianId, lockDate, unlockOnDeath, editEchoId, initialContent, letterToRecipient } = route.params || {};

  const [message, setMessage] = useState(initialContent ?? '');
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  
  // Media State
  const [isRecording, setIsRecording] = useState(false);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<{ name: string; type: string } | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const [pendingPicker, setPendingPicker] = useState<'audio' | 'video' | 'text' | null>(null);

  // Audio Playback
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioPosition, setAudioPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // Video Playback
  const [videoPaused, setVideoPaused] = useState(true);

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
    if ((mode === 'audio' || mode === 'video') && !mediaUri && !editEchoId) {
      Alert.alert('No Recording', 'Please record a message first.');
      return;
    }

    setIsSaving(true);
    try {
      // ── Edit mode: PATCH existing echo ───────────────────────────────────
      if (editEchoId) {
        const updateData: Record<string, any> = {};
        if (mode === 'text') updateData.content = message;
        if (mediaUri && mode !== 'text') {
          const contentType = mediaFile?.type || (mode === 'audio' ? 'audio/mp4' : 'video/mp4');
          const uploadUrlResponse = await echoApiService.getUploadUrl(contentType, editEchoId);
          if (!uploadUrlResponse.success || !uploadUrlResponse.data) {
            throw new Error('Could not get upload URL. Please try again.');
          }
          await echoApiService.uploadMedia(uploadUrlResponse.data.upload_url, mediaUri, contentType);
          updateData.media_url = uploadUrlResponse.data.media_url;
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

      if (mode !== 'text' && mediaUri && newEchoId) {
        const contentType = mediaFile?.type || (mode === 'audio' ? 'audio/mp4' : 'video/mp4');
        const uploadUrlResponse = await echoApiService.getUploadUrl(contentType, newEchoId);
        if (!uploadUrlResponse.success || !uploadUrlResponse.data) {
          throw new Error('Could not get upload URL. Please try again.');
        }
        await echoApiService.uploadMedia(uploadUrlResponse.data.upload_url, mediaUri, contentType);
        await echoApiService.updateEcho(newEchoId, { media_url: uploadUrlResponse.data.media_url });
      }

      Alert.alert('Success', 'Echo saved to vault!', [
        { text: 'OK', onPress: () => navigation.navigate('MirrorEchoVaultLibrary' as any) },
      ]);

    } catch (error: any) {
      console.error('Save failed:', error);
      Alert.alert('Error', error?.message || 'Failed to save echo. Please try again.');
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

  return (
    <BackgroundWrapper style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />

        {/* Header (menu + centered brand) — rendered outside the scroll so
            it stays pinned at the top while the body scrolls. */}
        <LogoHeader navigation={navigation} />

        {/*
          KeyboardAwareScrollView from react-native-keyboard-controller is
          the standard keyboard handling in this app — it auto-scrolls the
          focused input into view above the keyboard, no manual measuring.
          On small devices this prevents the bottom buttons from being
          hidden behind the keyboard, which the previous stock
          KeyboardAvoidingView did not handle.
        */}
        <KeyboardAwareScrollView
          style={styles.kav}
          contentContainerStyle={styles.kavContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          bottomOffset={16}
        >

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
                    placeholder="Write message here"
                    placeholderTextColor={palette.navy.light}
                    style={styles.bigTextInput}
                    multiline
                    textAlignVertical="top"
                  />
                </LinearGradient>
              </View>

              <View style={styles.bottomButtonsRow}>
                <Button variant="primary" size="L" title="UPLOAD" onPress={onUpload} />
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
                </View>
              )}

              <View style={styles.bottomButtonsRow}>
                <Button variant="primary" size="L" title="UPLOAD" onPress={onUpload} />
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
                </View>
              </View>

              <View style={styles.bottomButtonsRow}>
                <Button variant="primary" size="L" title="UPLOAD" onPress={onUpload} />
                <Button variant="secondary" size="L" title={isSaving ? 'SAVING...' : 'SAVE'} onPress={onSave} disabled={isSaving} />
              </View>
            </>
          )}
        </View>
        </KeyboardAwareScrollView>

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

  kav: {
    flex: 1,
    width: '100%',
  },
  // KeyboardAwareScrollView's contentContainerStyle — flexGrow so the
  // body still fills the screen when content is short, alignItems:center
  // to mirror the previous KAV behaviour, and bottom padding so the
  // last button has breathing room above the keyboard.
  kavContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: verticalScale(spacing.l),
  },
  content: {
    width: '100%',
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
    // Concrete heights so the shell renders correctly inside the scroll
    // container. Was flex:1 under the old KAV — that doesn't bound height
    // when the parent is a ScrollView, so we set explicit minHeight and a
    // maxHeight cap that keeps the input from eating the whole viewport on
    // tall devices. Multiline TextInput grows with content within these.
    minHeight: verticalScale(240),
    maxHeight: verticalScale(360),
    borderRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
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

  bottomButtonsRow: {
    flexDirection: 'row',
    marginTop: verticalScale(spacing.m),
    marginBottom: verticalScale(spacing.m),
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(spacing.m),
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
});

export default NewEchoComposeScreen;
