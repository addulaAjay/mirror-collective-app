import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Camera } from 'react-native-vision-camera';
import { launchImageLibrary } from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import BackgroundWrapper from '@components/BackgroundWrapper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@types';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';
import { echoApiService } from '@services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'NewEchoVideoScreen'>;

const { width } = Dimensions.get('window');

const GOLD = '#D7C08A';
const OFFWHITE = 'rgba(253,253,249,0.92)';

const NewEchoVideoScreen: React.FC<Props> = ({ navigation, route }) => {
  const { recipientId, title: echoTitle, category } = route.params || {};
  const [pickedVideo, setPickedVideo] = useState<{ uri: string; fileName: string; type: string } | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isPicking, setIsPicking] = useState(false);

  const camera = React.useRef<Camera>(null);
  const contentWidth = Math.min(width * 0.88, 360);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      // VisionCamera: ensuring recording stops if active
      // We don't have a direct reference to stop here easily without a flag,
      // but the camera ref is available.
      if (camera.current) {
        camera.current.stopRecording().catch(() => {});
      }
    };
  }, []);

  const checkAndRequestPermissions = async () => {
    const cameraPermission = await Camera.getCameraPermissionStatus();
    const microphonePermission = await Camera.getMicrophonePermissionStatus();

    if (cameraPermission === 'denied' || microphonePermission === 'denied') {
      Alert.alert(
        'Permission Required',
        'Camera and Microphone permissions are needed to record video. Please enable them in your settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }

    if (cameraPermission === 'not-determined') {
      await Camera.requestCameraPermission();
    }
    if (microphonePermission === 'not-determined') {
      await Camera.requestMicrophonePermission();
    }

    const finalCameraStatus = await Camera.getCameraPermissionStatus();
    const finalMicStatus = await Camera.getMicrophonePermissionStatus();

    return finalCameraStatus === 'granted' && finalMicStatus === 'granted';
  };

  const onRecordPress = async () => {
    if (pickedVideo) {
      setPickedVideo(null);
    }
    const hasPermission = await checkAndRequestPermissions();
    if (!hasPermission) return;
    // Proceed with recording logic
  };

  const onUploadPress = async () => {
    if (isPicking) return;
    try {
      setIsPicking(true);
      const result = await launchImageLibrary({
        mediaType: 'video',
        quality: 1,
      });

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPickedVideo({
          uri: asset.uri || '',
          fileName: asset.fileName || 'video_echo.mp4',
          type: asset.type || 'video/mp4',
        });
      }
    } catch (err) {
      console.error('Pick error:', err);
      Alert.alert('Error', 'Failed to pick video');
    } finally {
      setIsPicking(false);
    }
  };

  const onSave = async () => {
    if (!pickedVideo && !recordingUri) {
      Alert.alert('Nothing to save', 'Please record or upload a video first.');
      return;
    }

    try {
      setSaving(true);
      
      // 1. Create Echo
      const createResponse = await echoApiService.createEcho({
        title: echoTitle || 'Untitled Video Echo',
        category: category || 'General',
        echo_type: 'VIDEO',
        recipient_id: recipientId,
      });

      if (!createResponse.success || !createResponse.data) {
        throw new Error('Failed to create echo');
      }
      const echoId = createResponse.data.echo_id;

      // 2. Upload Video
      const uri = pickedVideo ? pickedVideo.uri : recordingUri;
      const contentType = pickedVideo ? pickedVideo.type : 'video/mp4';

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

        {/* Header */}
        <LogoHeader navigation={navigation} />

        {/* Title Row */}
        <View style={[styles.titleRow, { width: contentWidth }]}>
          <TouchableOpacity 
            hitSlop={12}
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
 
          <Text style={styles.title}>For Alia</Text>
 
          <View style={{ width: 44 }} />
        </View>

        {/* Video Box */}
        <View style={[styles.videoOuter, { width: contentWidth }]}>
          <View style={styles.videoInner}>
            {pickedVideo ? (
              <View style={styles.pickedContainer}>
                <Text style={styles.pickedIcon}>🎬</Text>
                <Text style={styles.pickedName} numberOfLines={1}>{pickedVideo.fileName}</Text>
                <TouchableOpacity onPress={() => setPickedVideo(null)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={onRecordPress}
                style={styles.videoButtonGlow}
              >
                <View style={styles.videoButton}>
                  <Text style={styles.videoIcon}>📹</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Upload Button */}
        {!pickedVideo && (
          <TouchableOpacity style={[styles.uploadPill, { width: contentWidth * 0.6 }]} onPress={onUploadPress}>
            <Text style={styles.uploadPillText}>UPLOAD FROM GALLERY</Text>
          </TouchableOpacity>
        )}

        {/* Save */}
        <TouchableOpacity 
          style={styles.saveAction} 
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
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default NewEchoVideoScreen;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  root: {
    flex: 1,
    alignItems: 'center',
  },

  /* Header */
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  iconText: {
    color: OFFWHITE,
    fontSize: 22,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GOLD,
  },
  brandSmall: {
    color: GOLD,
    fontSize: 10,
    letterSpacing: 1,
  },
  brandText: {
    color: GOLD,
    fontSize: 12,
    letterSpacing: 2,
    lineHeight: 14,
  },

  /* Title */
  titleRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backArrow: {
    fontSize: 22,
    color: GOLD,
  },
  title: {
    fontSize: 28,
    color: GOLD,
    letterSpacing: 2,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backIcon: {
    color: GOLD,
    fontSize: 30,
  },
 
  /* Video box */
  videoOuter: {
    marginTop: 20,
    borderRadius: 22,
    padding: 1,
    borderWidth: 1,
    borderColor: 'rgba(253,253,249,0.12)',
  },
  videoInner: {
    height: Math.min(420, Dimensions.get('window').width * 1.05),
    borderRadius: 21,
    backgroundColor: 'rgba(7,9,14,0.45)',
    alignItems: 'center',
    justifyContent: 'center', // Centered for picked view, using specialized padding for button
    paddingBottom: 0,
  },
  pickedContainer: {
    alignItems: 'center',
    gap: 12,
  },
  pickedIcon: {
    fontSize: 56,
  },
  pickedName: {
    color: OFFWHITE,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  removeText: {
    color: '#ff6b6b',
    fontSize: 14,
    textDecorationLine: 'underline',
    marginTop: 8,
  },
  uploadPill: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.3)',
    backgroundColor: 'rgba(253,253,249,0.05)',
    alignItems: 'center',
  },
  uploadPillText: {
    color: GOLD,
    fontSize: 13,
    letterSpacing: 1.2,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },
 
  /* Video button */
  videoButtonGlow: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(215,192,138,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(7,9,14,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoIcon: {
    fontSize: 22,
    color: GOLD,
  },
 
  /* Save action */
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
});
