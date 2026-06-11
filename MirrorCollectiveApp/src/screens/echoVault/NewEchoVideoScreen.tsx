import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  fontFamily, fontSize, palette, radius, spacing, textShadow,
  scale, verticalScale, moderateScale, borderWidth,
} from '@theme';
import { RootStackParamList } from '@types';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import Video from 'react-native-video';
import Svg, { Path } from 'react-native-svg';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useMicrophonePermission,
} from 'react-native-vision-camera';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button/Button';
import LogoHeader from '@components/LogoHeader';
import UploadProgressOverlay from '@components/UploadProgressOverlay';
import { echoApiService } from '@services/api';
import type { UploadStage } from '@services/api/echo';

type Props = NativeStackScreenProps<RootStackParamList, 'NewEchoVideoScreen'>;

type Mode = 'idle' | 'camera' | 'recording' | 'preview';

// Figma 4940:17503 — aspect ratio 345/507
const VIDEO_ASPECT = 507 / 345;

// Figma: videocam icon 40×40 inside the 80×80 button
const VideocamIcon = ({ size = 40, color = palette.gold.DEFAULT }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
  </Svg>
);

const NewEchoVideoScreen: React.FC<Props> = ({ navigation, route }) => {
  const { recipientId, recipientName, title: echoTitle, category } = route.params || {};

  const [mode, setMode] = useState<Mode>('idle');
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [pickedVideo, setPickedVideo] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [saving, setSaving] = useState(false);
  // 0..1 wall-clock progress across compress + upload + finalize. The
  // SAVE button label shows the percentage so the user has feedback
  // beyond the indeterminate spinner.
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<UploadStage | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  // True between "user tapped stop" and "onRecordingFinished/Error fires" —
  // gives the user immediate visual feedback during the async file finalize step.
  const [isStopping, setIsStopping] = useState(false);
  // Tracks whether this screen currently owns the camera (focused). When false,
  // the camera component releases its session even if mounted — releases the
  // green indicator on iOS without unmounting.
  const [isScreenFocused, setIsScreenFocused] = useState(true);

  const cameraRef = useRef<Camera>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Ref (not state) so stopRecording guards can read it synchronously without
  // stale closures — avoids calling stopRecording() twice on the same session.
  const isRecordingRef = useRef(false);

  const { hasPermission: hasCam, requestPermission: requestCam } = useCameraPermission();
  const { hasPermission: hasMic, requestPermission: requestMic } = useMicrophonePermission();
  const device = useCameraDevice('back');

  const pageTitle = recipientName ? `For ${recipientName}` : (echoTitle || 'Video Echo');
  const hasVideo = !!(recordingUri || pickedVideo);
  // Camera should only be ACTIVE during camera/recording modes AND when the
  // screen is focused. Setting isActive=false on a mounted Camera is the
  // proper Vision Camera v4 way to release the AVCaptureSession (and the
  // green privacy indicator on iOS) without abrupt unmounting.
  const isCameraActive = isScreenFocused && (mode === 'camera' || mode === 'recording');

  // Cleanup on UNMOUNT only — [] avoids the stale-closure bug where a
  // mode-change re-runs the cleanup and calls stopRecording() on an already-
  // finished session.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (isRecordingRef.current) {
        cameraRef.current?.stopRecording().catch(() => {});
      }
    };
  }, []);

  // When the screen loses focus, deactivate the camera so the iOS green
  // indicator goes off, and stop any in-flight recording.
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      return () => {
        setIsScreenFocused(false);
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        if (isRecordingRef.current) {
          cameraRef.current?.stopRecording().catch(() => {});
        }
      };
    }, []),
  );

  const ensurePermissions = useCallback(async (): Promise<boolean> => {
    let cam = hasCam;
    let mic = hasMic;
    if (!cam) cam = (await requestCam()) === true;
    if (!mic) mic = (await requestMic()) === true;
    if (!cam || !mic) {
      Alert.alert(
        'Permission Required',
        'Camera and microphone access are needed to record video.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
      return false;
    }
    return true;
  }, [hasCam, hasMic, requestCam, requestMic]);

  const handleCameraButtonPress = useCallback(async () => {
    if (mode === 'idle' || mode === 'preview') {
      const ok = await ensurePermissions();
      if (!ok) return;
      setRecordingUri(null);
      setPickedVideo(null);
      setRecordingSeconds(0);
      setMode('camera');

    } else if (mode === 'camera') {
      if (!cameraRef.current || isRecordingRef.current) return;
      // Camera ref exists but the session may still be initialising — give it a beat
      isRecordingRef.current = true;
      setRecordingSeconds(0);
      setMode('recording');
      timerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);

      cameraRef.current.startRecording({
        onRecordingFinished: video => {
          isRecordingRef.current = false;
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
          setIsStopping(false);
          setRecordingUri(video.path.startsWith('file://') ? video.path : `file://${video.path}`);
          setMode('preview');
        },
        onRecordingError: err => {
          isRecordingRef.current = false;
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
          setIsStopping(false);
          console.error('Recording error:', err);
          Alert.alert('Recording Error', err.message || 'Recording failed. Please try again.');
          setMode('camera');
        },
      });

    } else if (mode === 'recording') {
      // Guard: only call stopRecording once per session
      if (!isRecordingRef.current || isStopping) return;
      // Immediately reflect "stopping" state in the UI so the user sees their
      // tap registered. The actual mode→preview transition happens later when
      // onRecordingFinished fires.
      setIsStopping(true);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      // Do NOT set isRecordingRef.current = false here — wait for the
      // onRecordingFinished / onRecordingError callback to confirm the session ended.
      await cameraRef.current?.stopRecording();
    }
  }, [mode, ensurePermissions, isStopping]);

  const handleUpload = useCallback(async () => {
    if (isPicking) return;
    try {
      setIsPicking(true);
      const result = await launchImageLibrary({ mediaType: 'video', quality: 1 });
      if (result.assets?.[0]) {
        const a = result.assets[0];
        setPickedVideo({ uri: a.uri ?? '', name: a.fileName ?? 'video.mp4', type: a.type ?? 'video/mp4' });
        setRecordingUri(null);
        setMode('preview');
      }
    } catch {
      Alert.alert('Error', 'Failed to pick video');
    } finally {
      setIsPicking(false);
    }
  }, [isPicking]);

  const handleSave = useCallback(async () => {
    const uri = pickedVideo?.uri ?? recordingUri;
    const contentType = pickedVideo?.type ?? 'video/mp4';
    if (!uri) {
      Alert.alert('Nothing to save', 'Please record or upload a video first.');
      return;
    }
    try {
      setSaving(true);
      setUploadProgress(0);
      const createRes = await echoApiService.createEcho({
        title: echoTitle || 'Untitled Video Echo',
        category: category || 'General',
        echo_type: 'VIDEO',
        recipient_id: recipientId,
      });
      if (!createRes.success || !createRes.data) throw new Error('Failed to create echo');

      // Compress → presign → stream → finalize via the umbrella helper.
      const result = await echoApiService.uploadEchoMedia(
        createRes.data.echo_id,
        uri,
        contentType,
        stage => {
          setUploadStage(stage);
          if (stage.type === 'compressing') {
            // Compression takes ~25% of perceived progress for 1m clips.
            setUploadProgress(stage.fraction * 0.25);
          } else if (stage.type === 'uploading' && stage.total > 0) {
            setUploadProgress(0.25 + 0.7 * (stage.sent / stage.total));
          } else if (stage.type === 'finalizing') {
            setUploadProgress(0.97);
          }
        },
        // Warn once if the user backgrounds mid-upload. Today's pipeline
        // pauses when the OS suspends the JS thread; the warning lets
        // the user know to come back rather than silently waiting.
        () => {
          Alert.alert(
            'Save paused',
            'Bring the app back to the foreground to finish saving your echo.',
          );
        },
      );
      if (!result.success) throw new Error(result.error ?? 'Upload failed');
      setUploadProgress(1);

      Alert.alert('Saved', 'Echo saved successfully');
      navigation.navigate('MirrorEchoVaultHome');
      // NOTE: do NOT reset uploadProgress here. The component is still
      // mounted while navigation animates away; setting it to 0 would
      // flash "0%" on the SAVE button momentarily. The state is reset
      // naturally when the screen unmounts. The catch branch handles
      // the failure path explicitly.
    } catch {
      Alert.alert('Error', 'Failed to save echo');
      setUploadProgress(0);
      setUploadStage(null);
    } finally {
      setSaving(false);
    }
  }, [pickedVideo, recordingUri, echoTitle, category, recipientId, navigation]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <BackgroundWrapper style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LogoHeader navigation={navigation} />

        {/* Outer column — Figma 4940:17498: flex-col justify-between */}
        <View style={styles.outerColumn}>

          {/* Title row — Figma 4940:17499 */}
          <View style={styles.titleRow}>
            <TouchableOpacity
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => navigation.goBack()}
              style={styles.titleSpacer}
            >
              <Image
                source={require('@assets/back-arrow.png')}
                style={styles.backArrow}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text style={styles.title}>{pageTitle}</Text>
            <View style={styles.titleSpacer} />
          </View>

          {/* Video box — Figma 4940:17503 */}
          <View style={styles.videoOuter}>
            {/* Inner dark area — Figma 4940:17504 */}
            <View style={styles.videoInner}>

              {/* Camera live preview — UNMOUNT entirely when not in camera /
                  recording mode (or when screen is not focused). Just setting
                  isActive=false leaves the AVCaptureSession alive on iOS and
                  the green privacy indicator stays on. Full unmount tears
                  down the session and turns the indicator off. */}
              {device && isCameraActive ? (
                <Camera
                  ref={cameraRef}
                  style={StyleSheet.absoluteFill}
                  device={device}
                  isActive={true}
                  video
                  audio
                />
              ) : null}

              {/* Recorded video preview */}
              {mode === 'preview' && recordingUri ? (
                <Video
                  source={{ uri: recordingUri }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                  repeat
                  muted
                />
              ) : null}

              {/* Picked from gallery label */}
              {mode === 'preview' && pickedVideo ? (
                <View style={styles.pickedOverlay}>
                  <Text style={styles.pickedIcon}>🎬</Text>
                  <Text style={styles.pickedName} numberOfLines={2}>{pickedVideo.name}</Text>
                </View>
              ) : null}

              {/* Recording timer overlay */}
              {mode === 'recording' && !isStopping ? (
                <View style={styles.timerBadge}>
                  <View style={styles.recDot} />
                  <Text style={styles.timerText} allowFontScaling={false}>
                    {formatTime(recordingSeconds)}
                  </Text>
                </View>
              ) : null}

              {/* Camera button — Figma: 80×80 circle, bottom center, gold glow.
                  Same single button across all states; only the icon inside
                  changes — no extra UI added. The in-place spinner during
                  the stop transition prevents the icon from briefly
                  "disappearing" while the file finalizes. */}
              <TouchableOpacity
                style={styles.cameraBtn}
                activeOpacity={0.85}
                onPress={handleCameraButtonPress}
                disabled={isStopping}
              >
                {isStopping ? (
                  /* Stopping in progress — spinner inside the existing button */
                  <ActivityIndicator size="small" color={palette.gold.DEFAULT} />
                ) : mode === 'recording' ? (
                  /* Stop: red square */
                  <View style={styles.stopSquare} />
                ) : (
                  /* idle / camera / preview — same gold videocam icon as Figma */
                  <VideocamIcon size={scale(40)} color={palette.gold.DEFAULT} />
                )}
              </TouchableOpacity>

            </View>
          </View>

          {/* Buttons — Figma 4940:17506: w-278, gap-16, justify-center */}
          <View style={styles.btnRow}>
            <Button
              variant="secondary"
              size="L"
              title={isPicking ? '...' : 'UPLOAD'}
              onPress={handleUpload}
              disabled={isPicking}
              style={styles.uploadBtn}
            />
            <Button
              variant="primary"
              size="L"
              title={saving ? `${Math.round(uploadProgress * 100)}%` : 'SAVE'}
              onPress={handleSave}
              disabled={saving || !hasVideo}
              style={styles.saveBtn}
            />
          </View>

        </View>
      </SafeAreaView>

      <UploadProgressOverlay
        visible={saving}
        progress={uploadProgress}
        stage={uploadStage}
      />
    </BackgroundWrapper>
  );
};

export default NewEchoVideoScreen;

/* ── Styles ── */
const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, backgroundColor: 'transparent' },

  // Figma 4940:17498 — flex-col justify-between, padding 24h
  outerColumn: {
    flex: 1,
    paddingHorizontal: scale(spacing.xl),   // 24px
    paddingTop: verticalScale(spacing.m),   // 16px gap after LogoHeader
    paddingBottom: verticalScale(spacing.xl),
    justifyContent: 'space-between',
  },

  // Figma 4940:17499 — title row
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleSpacer: {
    width: scale(20),
    height: scale(20),
    justifyContent: 'center',
  },
  backArrow: {
    width: scale(20),
    height: scale(20),
    tintColor: palette.gold.DEFAULT,
  },
  // Figma: Heading M Cormorant 28px, #f2e1b0, text-shadow glow
  title: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize['2xl']),  // 28px
    lineHeight: moderateScale(32),
    color: palette.gold.DEFAULT,
    textShadowColor: 'rgba(240,212,168,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    textAlign: 'center',
    flex: 1,
  },

  // Figma 4940:17503 — aspect 345/507, border 0.2px #bfc7d9, radius 8, glow, bg, padding 8
  videoOuter: {
    width: '100%',
    aspectRatio: 345 / 507,
    borderRadius: radius.xs ?? 8,
    borderWidth: 0.2,
    borderColor: '#bfc7d9',
    backgroundColor: 'rgba(197,158,95,0.05)',
    padding: scale(spacing.xs),               // 8px inner padding
    shadowColor: 'rgba(229,214,176,1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },

  // Figma 4940:17504 — inner dark area, border 0.5px #1a2238, radius 8, bg, items-end justify-center, py-16
  videoInner: {
    flex: 1,
    borderRadius: 6,
    borderWidth: borderWidth.thin,             // 0.5px
    borderColor: palette.navy.deep,            // #1a2238
    backgroundColor: 'rgba(163,179,204,0.05)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: verticalScale(spacing.m),   // 16px
  },

  // Picked gallery overlay
  pickedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(12),
    backgroundColor: 'rgba(7,9,14,0.7)',
  },
  pickedIcon: { fontSize: 48 },
  pickedName: {
    color: 'rgba(253,253,249,0.9)',
    fontSize: moderateScale(14),
    textAlign: 'center',
    paddingHorizontal: scale(20),
  },

  // Recording timer — top-left overlay
  timerBadge: {
    position: 'absolute',
    top: scale(12),
    left: scale(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: scale(10),
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
  },
  recDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: '#ff3b30',
  },
  timerText: {
    color: '#fff',
    fontSize: moderateScale(13),
    fontFamily: 'Courier',
  },

  // Figma: Component "Variant4" — 80×80 circle, bg rgba(253,253,249,0.05),
  // shadow 0 0 24px rgba(242,226,177,0.5) spread 8, padding 24px
  cameraBtn: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: 'rgba(253,253,249,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    // Glow shadow
    shadowColor: 'rgba(242,226,177,1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: scale(24),
    elevation: 8,
    boxShadow: `0px 0px ${scale(24)}px ${scale(8)}px rgba(242,226,177,0.5)`,
  },

  // Stop recording — red square inside camera button
  stopSquare: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(4),
    backgroundColor: '#ff3b30',
  },

  // Figma 4940:17506 — w-278, gap-16, justify-center
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale(spacing.m),                     // 16px
    width: scale(278),
    alignSelf: 'center',
  },
  uploadBtn: {
    flex: 1,
  },
  saveBtn: {
    width: scale(123),
  },
});
