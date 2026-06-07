/**
 * Create an Echo (New Design)
 * Figma: Dev-Master-File → "Echo - Write message (New Design)" (7544:1873)
 *
 * Unified compose screen: a text Message plus optional attachments
 * (photo/video from gallery or file, a voice recording, or a recorded video).
 * Replaces the mode-siloed NewEchoComposeScreen for the new flow.
 *
 * Layout (left:24 w:345 gap:24 column under LogoHeader):
 *   Header row: ← | CREATE AN ECHO | spacer
 *   Star divider
 *   Message field (multiline, flex)
 *   "Add to your Echo" divider + 3 cards (photo/video, voice, video)
 *   Selected-attachment chips (removable)
 *   SAVE button
 *
 * SAVE: createEcho (echo_type TEXT — backend flips to AUDIO/VIDEO when the
 * first A/V attachment lands) → uploadEchoAttachment per file → release when
 * the echo has a recipient and no lock date.
 */

import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  borderWidth,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  moderateScale,
  palette,
  radius,
  scale,
  spacing,
  verticalScale,
} from '@theme';
import type { RootStackParamList } from '@types';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import DocumentPicker from 'react-native-document-picker';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Video from 'react-native-video';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button/Button';
import EchoAttachments from '@components/echo/EchoAttachments';
import LogoHeader from '@components/LogoHeader';
import { echoApiService } from '@services/api/echo';
import type { Attachment, EchoResponse, UploadStage } from '@services/api/echo';
import { createPosterThumbnail } from '@utils/media/compress';
import { uuidV4 } from '@utils/uuid';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CreateEchoScreen'
>;
type CreateEchoRoute = RouteProp<RootStackParamList, 'CreateEchoScreen'>;

type AttachmentKind = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';

interface DraftAttachment {
  id: string;
  uri: string;
  contentType: string;
  name: string;
  kind: AttachmentKind;
  duration?: string;
  /** Local poster JPEG for video previews (generated on add). */
  thumbUri?: string;
  /** Set when this is an EXISTING server attachment (edit mode). Removing it
   *  calls DELETE; it is never re-uploaded on save. */
  serverAttachmentId?: string;
}

/** Map a server attachment (edit mode) to a preview-ready draft. */
function mapServerAttachment(a: Attachment): DraftAttachment {
  return {
    id: a.attachment_id,
    serverAttachmentId: a.attachment_id,
    uri: a.media_url,
    thumbUri: a.thumb_url ?? undefined,
    contentType: a.mime_type ?? '',
    name: a.filename ?? `${a.type.toLowerCase()} attachment`,
    kind: a.type,
    duration: a.duration ?? undefined,
  };
}

// The library's default export is a singleton instance (not a class).
const audioRecorder = AudioRecorderPlayer;

/** mm:ss from milliseconds. */
function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Message box grows with content between these bounds; past the max it scrolls
// internally so it never dominates the screen (keeps the page scrollable).
const MIN_MESSAGE_HEIGHT = verticalScale(120);
const MAX_MESSAGE_HEIGHT = verticalScale(220);

// Non-canonical MIME types pickers report, mapped to what the backend accepts.
const MIME_ALIASES: Record<string, string> = {
  'image/jpg': 'image/jpeg',
  'image/pjpeg': 'image/jpeg',
  'video/mov': 'video/quicktime',
};

/** Lowercase + map known aliases (e.g. image/jpg → image/jpeg). */
function normalizeMime(contentType: string): string {
  const c = contentType.trim().toLowerCase();
  return MIME_ALIASES[c] ?? c;
}

const EXT_CONTENT_TYPE: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  heic: 'image/heic',
  webp: 'image/webp',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  m4v: 'video/x-m4v',
};

/**
 * Resolve a usable content type for a picked file. Trusts a concrete provided
 * type; otherwise derives one from the filename extension so the backend
 * upload allowlist (.pdf/.png/.jpg/.mp4) accepts it.
 */
function resolveFileContentType(name: string, providedType?: string | null): string {
  if (providedType && providedType !== 'application/octet-stream') {
    return normalizeMime(providedType);
  }
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return EXT_CONTENT_TYPE[ext] ?? providedType ?? 'application/octet-stream';
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const PhotoIcon: React.FC = () => (
  <Svg width={scale(32)} height={scale(32)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 5.5A2.5 2.5 0 0 1 5.5 3h13A2.5 2.5 0 0 1 21 5.5v13A2.5 2.5 0 0 1 18.5 21h-13A2.5 2.5 0 0 1 3 18.5v-13Z"
      stroke={palette.gold.DEFAULT}
      strokeWidth={1.4}
    />
    <Path
      d="M3.5 16.5 8 12l3.5 3 3-2.5L20.5 18"
      stroke={palette.gold.DEFAULT}
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 8.5a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0Z"
      fill={palette.gold.DEFAULT}
    />
  </Svg>
);

const MicIcon: React.FC = () => (
  <Image
    source={require('@assets/mic.png')}
    style={styles.cardIconImg}
    resizeMode="contain"
  />
);

const VideoIcon: React.FC = () => (
  <Image
    source={require('@assets/videocam.png')}
    style={styles.cardIconImg}
    resizeMode="contain"
  />
);

const BackIcon: React.FC = () => (
  <Image
    source={require('@assets/back-arrow.png')}
    style={styles.backArrowImg}
    resizeMode="contain"
  />
);

// ── Add-to-Echo card ────────────────────────────────────────────────────────────
interface AddCardProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}
const AddCard: React.FC<AddCardProps> = ({ icon, label, onPress, disabled }) => (
  <TouchableOpacity
    style={[styles.addCard, disabled && styles.addCardDisabled]}
    activeOpacity={0.85}
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    {icon}
    <Text style={styles.addCardLabel}>{label}</Text>
  </TouchableOpacity>
);

// ── Attachment preview (type-specific, Figma 7544:1923 / 2644 / 2192) ──────────
const RemoveCircle: React.FC<{ onPress: () => void; floating?: boolean }> = ({
  onPress,
  floating,
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.removeCircle, floating && styles.removeCircleFloating]}
    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    accessibilityRole="button"
    accessibilityLabel="Remove attachment"
  >
    <Text style={styles.removeCircleText}>✕</Text>
  </TouchableOpacity>
);

interface AttachmentPreviewProps {
  attachment: DraftAttachment;
  onRemove: () => void;
  onAddMore: () => void;
  onPlayVideo: () => void;
  onToggleAudio: () => void;
  isPlayingAudio: boolean;
}
const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  attachment,
  onRemove,
  onAddMore,
  onPlayVideo,
  onToggleAudio,
  isPlayingAudio,
}) => {
  // Image → large preview card with filename caption + "Tap to add more".
  if (attachment.kind === 'IMAGE') {
    return (
      <View style={styles.previewCard}>
        {/* pointerEvents none → vertical drags scroll the page, not get eaten. */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Image
            source={{ uri: attachment.uri }}
            style={styles.previewImage}
            resizeMode="cover"
          />
        </View>
        <RemoveCircle onPress={onRemove} floating />
        <TouchableOpacity
          style={styles.previewCaption}
          activeOpacity={0.85}
          onPress={onAddMore}
        >
          <Text style={styles.previewCaptionIcon}>🖼</Text>
          <View style={styles.previewCaptionTextWrap}>
            <Text style={styles.previewCaptionName} numberOfLines={1}>
              {attachment.name}
            </Text>
            <Text style={styles.previewCaptionHint}>Tap to add more</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  // Video → large preview: poster thumbnail + tappable play (opens player).
  if (attachment.kind === 'VIDEO') {
    return (
      <View style={[styles.previewCard, styles.previewVideoBg]}>
        {attachment.thumbUri ? (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Image
              source={{ uri: attachment.thumbUri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          </View>
        ) : null}
        <RemoveCircle onPress={onRemove} floating />
        <TouchableOpacity
          style={styles.previewPlay}
          onPress={onPlayVideo}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Play video"
        >
          <Text style={styles.previewPlayGlyph}>▶</Text>
        </TouchableOpacity>
        {attachment.duration ? (
          <View style={styles.previewBadge}>
            <Text style={styles.previewBadgeText}>🎬 {attachment.duration}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  // Audio → compact card with a play/pause control + name + duration.
  if (attachment.kind === 'AUDIO') {
    return (
      <View style={styles.chip}>
        <TouchableOpacity
          onPress={onToggleAudio}
          style={styles.audioPlayBtn}
          accessibilityRole="button"
          accessibilityLabel={isPlayingAudio ? 'Pause audio' : 'Play audio'}
        >
          <Text style={styles.audioPlayGlyph}>{isPlayingAudio ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
        <Text style={styles.chipText} numberOfLines={1}>
          {attachment.name}
          {attachment.duration ? `  ${attachment.duration}` : ''}
        </Text>
        <RemoveCircle onPress={onRemove} />
      </View>
    );
  }

  // File (pdf / other) → compact chip.
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText} numberOfLines={1}>
        📄 {attachment.name}
      </Text>
      <RemoveCircle onPress={onRemove} />
    </View>
  );
};

// ── Inline upload-error banner (Figma 7544:2106) ───────────────────────────────
const ErrorBanner: React.FC<{ message: string }> = ({ message }) => (
  <View style={styles.errorBanner}>
    <View style={styles.errorIconCircle}>
      <Text style={styles.errorIconGlyph}>i</Text>
    </View>
    <Text style={styles.errorText}>{message}</Text>
  </View>
);

// ── Screen ────────────────────────────────────────────────────────────────────
const CreateEchoScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CreateEchoRoute>();
  const params = route.params ?? {};
  const {
    title,
    category,
    recipientId,
    guardianId,
    lockDate,
    unlockOnDeath,
    letterToRecipient,
    editEchoId,
    viewEchoId,
  } = params;
  // Read-only view mode (tap an echo to open). editEchoId takes precedence.
  const readOnly = !editEchoId && !!viewEchoId;

  const [message, setMessage] = useState('');
  const [viewEcho, setViewEcho] = useState<EchoResponse | null>(null);
  // Dynamic message-box height — grows with content (min ~120) so the box isn't
  // a fixed slab; the page scrolls when the whole form overflows.
  const [messageHeight, setMessageHeight] = useState(MIN_MESSAGE_HEIGHT);
  const [attachments, setAttachments] = useState<DraftAttachment[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadStage, setUploadStage] = useState<UploadStage | null>(null);
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  // Picker must launch only AFTER the sheet fully dismisses (iOS races
  // otherwise). pendingPicker records the choice; the launch happens in
  // handleSheetDismissed (iOS) or a timeout (Android).
  const [pendingPicker, setPendingPicker] = useState<'gallery' | 'file' | null>(
    null,
  );
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<DraftAttachment | null>(null);

  // Make SAVE retry-safe: create the echo once, and never re-upload an
  // attachment that already landed. Without this, a partial-failure retry
  // would create duplicate echoes and re-upload succeeded files.
  const createdEchoId = useRef<string | null>(null);
  const uploadedIds = useRef<Set<string>>(new Set());

  // Voice-record modal state.
  const [showRecordSheet, setShowRecordSheet] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordMs, setRecordMs] = useState(0);
  const recordUri = useRef<string | null>(null);

  const addAttachment = (att: DraftAttachment) =>
    setAttachments(prev => [...prev, att]);
  const removeAttachment = async (att: DraftAttachment) => {
    // Existing (server) attachment → DELETE on the backend before dropping it.
    if (att.serverAttachmentId && editEchoId) {
      const res = await echoApiService.removeAttachment(
        editEchoId,
        att.serverAttachmentId,
      );
      if (!res.success) {
        setErrors([res.error ?? 'Could not remove the attachment. Try again.']);
        return;
      }
    }
    setAttachments(prev => prev.filter(a => a.id !== att.id));
  };

  // Load the echo on mount for edit (into the editable form) or view (read-only).
  useEffect(() => {
    const loadId = editEchoId ?? viewEchoId;
    if (!loadId) return;
    let cancelled = false;
    (async () => {
      const res = await echoApiService.getEcho(loadId);
      if (cancelled || !res.success || !res.data) return;
      if (readOnly) {
        setViewEcho(res.data);
      } else {
        setMessage(res.data.content ?? '');
        setAttachments((res.data.attachments ?? []).map(mapServerAttachment));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editEchoId, viewEchoId, readOnly]);

  // Generate a local poster for a video so its preview card shows a frame.
  const attachVideoThumb = async (id: string, videoUri: string) => {
    try {
      const thumb = await createPosterThumbnail(videoUri);
      if (thumb) {
        setAttachments(prev =>
          prev.map(a => (a.id === id ? { ...a, thumbUri: thumb } : a)),
        );
      }
    } catch (err) {
      console.warn('Video thumbnail failed:', err);
    }
  };

  // ── Sheet → picker handoff (launch after the modal fully dismisses) ────────
  const requestGallery = () => {
    setPendingPicker('gallery');
    setShowUploadSheet(false);
    if (Platform.OS === 'android') setTimeout(executePickGallery, 300);
  };
  const requestFile = () => {
    setPendingPicker('file');
    setShowUploadSheet(false);
    if (Platform.OS === 'android') setTimeout(executePickFile, 300);
  };
  const handleSheetDismissed = () => {
    // iOS only — Android Modal doesn't fire onDismiss, so it uses the timeout.
    if (Platform.OS === 'android') return;
    const choice = pendingPicker;
    if (!choice) return;
    setPendingPicker(null);
    setTimeout(() => {
      if (choice === 'gallery') void executePickGallery();
      else if (choice === 'file') void executePickFile();
    }, 100);
  };

  // ── Photo / video: gallery ────────────────────────────────────────────────
  const executePickGallery = async () => {
    setPendingPicker(null);
    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        selectionLimit: 1,
        assetRepresentationMode: 'current',
        includeExtra: false,
      });
      const asset = result.assets?.[0];
      if (!asset?.uri) return;
      const contentType = normalizeMime(
        asset.type ?? (asset.uri.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg'),
      );
      const isVideo = contentType.startsWith('video/');
      const id = uuidV4();
      addAttachment({
        id,
        uri: asset.uri,
        contentType,
        name: asset.fileName ?? `gallery-${Date.now()}`,
        kind: isVideo ? 'VIDEO' : 'IMAGE',
        duration:
          isVideo && asset.duration != null
            ? formatDuration(asset.duration * 1000)
            : undefined,
      });
      if (isVideo) void attachVideoThumb(id, asset.uri);
    } catch (err) {
      console.warn('Gallery pick failed:', err);
    }
  };

  // ── Photo / video / pdf: file ─────────────────────────────────────────────
  const executePickFile = async () => {
    setPendingPicker(null);
    try {
      const res = await DocumentPicker.pickSingle({
        type: [
          DocumentPicker.types.images,
          DocumentPicker.types.pdf,
          DocumentPicker.types.video,
        ],
        copyTo: 'cachesDirectory',
      });
      const uri = res.fileCopyUri ?? res.uri;
      const name = res.name ?? `file-${Date.now()}`;
      // DocumentPicker's mime can be missing/generic on some platforms; fall
      // back to the extension so the backend allowlist accepts it (.pdf/.png/
      // .jpg/.mp4 per Figma 7544:2839).
      const contentType = resolveFileContentType(name, res.type);
      const id = uuidV4();
      const isVideo = contentType.startsWith('video/');
      addAttachment({
        id,
        uri,
        contentType,
        name,
        kind: contentType.startsWith('image/')
          ? 'IMAGE'
          : isVideo
            ? 'VIDEO'
            : 'FILE',
      });
      if (isVideo) void attachVideoThumb(id, uri);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) console.warn('File pick failed:', err);
    }
  };

  // ── Record a video ────────────────────────────────────────────────────────
  const recordVideo = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'video',
        videoQuality: 'high',
        saveToPhotos: false,
      });
      const asset = result.assets?.[0];
      if (!asset?.uri) return;
      const id = uuidV4();
      addAttachment({
        id,
        uri: asset.uri,
        contentType: normalizeMime(asset.type ?? 'video/mp4'),
        name: asset.fileName ?? `video-${Date.now()}.mp4`,
        kind: 'VIDEO',
        duration:
          asset.duration != null
            ? formatDuration(asset.duration * 1000)
            : undefined,
      });
      void attachVideoThumb(id, asset.uri);
    } catch (err) {
      console.warn('Video record failed:', err);
    }
  };

  // ── Voice recording ───────────────────────────────────────────────────────
  const openRecorder = () => {
    setRecordMs(0);
    recordUri.current = null;
    setIsRecording(false);
    setShowRecordSheet(true);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      const uri = await audioRecorder.stopRecorder();
      audioRecorder.removeRecordBackListener();
      recordUri.current = uri;
      setIsRecording(false);
      return;
    }
    try {
      const uri = await audioRecorder.startRecorder();
      recordUri.current = uri;
      audioRecorder.addRecordBackListener(e => {
        setRecordMs(e.currentPosition);
      });
      setIsRecording(true);
    } catch (err) {
      console.warn('Audio record failed:', err);
      Alert.alert('Microphone unavailable', 'Could not start recording.');
    }
  };

  const saveRecording = () => {
    if (isRecording) {
      Alert.alert('Still recording', 'Stop the recording before saving.');
      return;
    }
    if (!recordUri.current) {
      setShowRecordSheet(false);
      return;
    }
    addAttachment({
      id: uuidV4(),
      uri: recordUri.current,
      contentType: 'audio/mp4',
      name: `voice-${Date.now()}.m4a`,
      kind: 'AUDIO',
      duration: formatDuration(recordMs),
    });
    setShowRecordSheet(false);
  };

  const cancelRecording = async () => {
    if (isRecording) {
      try {
        await audioRecorder.stopRecorder();
        audioRecorder.removeRecordBackListener();
      } catch {
        /* ignore */
      }
    }
    setIsRecording(false);
    setShowRecordSheet(false);
  };

  // ── Attachment playback ────────────────────────────────────────────────────
  const toggleAudioPlayback = async (att: DraftAttachment) => {
    try {
      if (playingAudioId === att.id) {
        await audioRecorder.stopPlayer();
        audioRecorder.removePlaybackEndListener();
        setPlayingAudioId(null);
        return;
      }
      if (playingAudioId) {
        await audioRecorder.stopPlayer().catch(() => {});
        audioRecorder.removePlaybackEndListener();
      }
      await audioRecorder.startPlayer(att.uri);
      setPlayingAudioId(att.id);
      // v4 dedicated end event → reliable auto-reset when playback finishes.
      audioRecorder.addPlaybackEndListener(() => {
        audioRecorder.removePlaybackEndListener();
        setPlayingAudioId(null);
      });
    } catch (err) {
      console.warn('Audio playback failed:', err);
      setPlayingAudioId(null);
    }
  };

  // Stop any in-flight playback/recording when leaving the screen.
  useEffect(
    () => () => {
      audioRecorder.stopPlayer().catch(() => {});
      audioRecorder.removePlaybackEndListener();
      audioRecorder.stopRecorder().catch(() => {});
      audioRecorder.removeRecordBackListener();
    },
    [],
  );

  // ── Save ──────────────────────────────────────────────────────────────────
  const onSave = async () => {
    setErrors([]);
    if (!message.trim() && attachments.length === 0) {
      setErrors(['Write a message or add an attachment before saving.']);
      return;
    }
    setIsSaving(true);
    setUploadStage(null);
    try {
      let echoId: string;
      if (editEchoId) {
        // Edit mode: PATCH message + metadata on the existing draft. Removals
        // already happened via DELETE; only NEW attachments upload below.
        const upd = await echoApiService.updateEcho(editEchoId, {
          content: message.trim() || undefined,
          ...(recipientId ? { recipient_id: recipientId } : {}),
          release_date: lockDate ?? null,
          letter_to_recipient: letterToRecipient ?? null,
        });
        if (!upd.success) {
          setErrors(['Could not update your echo. Please try again.']);
          return;
        }
        echoId = editEchoId;
      } else {
        // Create the echo exactly once (reused on retry).
        if (!createdEchoId.current) {
          const createResponse = await echoApiService.createEcho({
            title: title || 'Untitled Echo',
            category: category || 'General',
            echo_type: 'TEXT',
            recipient_id: recipientId,
            ...(guardianId && { guardian_id: guardianId }),
            ...(lockDate && { release_date: lockDate }),
            ...(unlockOnDeath !== undefined && {
              unlock_on_death: unlockOnDeath,
            }),
            ...(letterToRecipient && { letter_to_recipient: letterToRecipient }),
            content: message.trim() || undefined,
          });
          if (!createResponse.success || !createResponse.data) {
            setErrors(['Could not create your echo. Please try again.']);
            return;
          }
          createdEchoId.current = createResponse.data.echo_id;
        }
        echoId = createdEchoId.current;
      }

      // Upload each new (non-server), not-yet-uploaded attachment.
      const failures: string[] = [];
      for (const att of attachments) {
        if (att.serverAttachmentId) continue; // already on the server
        if (uploadedIds.current.has(att.id)) continue;
        const result = await echoApiService.uploadEchoAttachment(
          echoId,
          att.uri,
          att.contentType,
          { duration: att.duration, filename: att.name },
          setUploadStage,
        );
        if (result.success) {
          uploadedIds.current.add(att.id);
        } else {
          failures.push(
            att.kind === 'AUDIO'
              ? 'Recording failed to upload. Please try again.'
              : 'Attachment upload failed. Please try again.',
          );
        }
      }
      if (failures.length > 0) {
        // Keep the user on-screen to retry; the echo + uploaded files persist.
        setErrors(Array.from(new Set(failures)));
        return;
      }

      // Mirror the create-echo auto-release rule (recipient + no lock date).
      if (recipientId && !lockDate) {
        try {
          await echoApiService.releaseEcho(echoId);
        } catch {
          /* backend preconditions guard this; non-fatal */
        }
      }

      Alert.alert('Success', 'Echo saved to vault!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('MirrorEchoVaultLibrary' as never),
        },
      ]);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'Failed to save echo.';
      console.error('Create echo failed:', msg);
      setErrors([msg]);
    } finally {
      setIsSaving(false);
      setUploadStage(null);
    }
  };

  const savingLabel = uploadStage
    ? uploadStage.type === 'compressing'
      ? 'Compressing…'
      : uploadStage.type === 'uploading'
        ? 'Uploading…'
        : uploadStage.type === 'finalizing'
          ? 'Finalizing…'
          : 'Saving…'
    : 'Saving…';

  // ── Read-only view mode ─────────────────────────────────────────────────────
  const handleViewShare = async () => {
    if (!viewEcho) return;
    try {
      await Share.share({ message: viewEcho.content || viewEcho.title });
    } catch {
      /* user dismissed */
    }
  };
  const handleViewEdit = () => {
    if (!viewEcho) return;
    navigation.navigate('ChooseRecipientScreen', {
      title: viewEcho.title,
      category: viewEcho.category,
      editEchoId: viewEcho.echo_id,
      prefillRecipient: viewEcho.recipient,
      prefillLockDate: viewEcho.release_date,
      prefillContent: viewEcho.content,
      prefillLetter: viewEcho.letter_to_recipient,
    });
  };

  if (readOnly) {
    const atts = viewEcho?.attachments ?? [];
    const canEdit = viewEcho?.status === 'DRAFT';
    return (
      <BackgroundWrapper style={styles.bg}>
        <SafeAreaView style={styles.safe}>
          <StatusBar
            translucent
            backgroundColor="transparent"
            barStyle="light-content"
          />
          <LogoHeader navigation={navigation} />
          <ScrollView
            style={styles.kav}
            contentContainerStyle={styles.kavContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              <View style={styles.headerRow}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <BackIcon />
                </TouchableOpacity>
                <Text style={styles.screenTitle} numberOfLines={1}>
                  {viewEcho?.title || 'ECHO'}
                </Text>
                <View style={styles.headerSpacer} />
              </View>

              <View style={styles.starDivider}>
                <View style={styles.starLine} />
                <Text style={styles.starGlyph}>✦</Text>
                <View style={styles.starLine} />
              </View>

              {viewEcho?.content ? (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Message</Text>
                  <View style={styles.viewMessageBox}>
                    <Text style={styles.viewMessageText}>{viewEcho.content}</Text>
                  </View>
                </View>
              ) : null}

              {atts.length > 0 && (
                <EchoAttachments attachments={atts} scrollable={false} />
              )}

              {!viewEcho?.content && atts.length === 0 && (
                <Text style={styles.viewEmpty}>This echo has no content.</Text>
              )}

              <View style={styles.viewActions}>
                <TouchableOpacity
                  style={styles.viewActionBtn}
                  onPress={handleViewShare}
                  activeOpacity={0.85}
                >
                  <Text style={styles.viewActionText}>Share</Text>
                </TouchableOpacity>
                {canEdit && (
                  <TouchableOpacity
                    style={styles.viewActionBtn}
                    onPress={handleViewEdit}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.viewActionText}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        />
        <LogoHeader navigation={navigation} />

        <KeyboardAwareScrollView
          style={styles.kav}
          contentContainerStyle={styles.kavContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          bottomOffset={16}
        >
          <View style={styles.content}>
            {/* Header row */}
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backBtn}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <BackIcon />
              </TouchableOpacity>
              <Text style={styles.screenTitle}>
                {editEchoId ? 'EDIT ECHO' : 'CREATE AN ECHO'}
              </Text>
              <View style={styles.headerSpacer} />
            </View>

            {/* Star divider */}
            <View style={styles.starDivider}>
              <View style={styles.starLine} />
              <Text style={styles.starGlyph}>✦</Text>
              <View style={styles.starLine} />
            </View>

            {/* Message field */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Message</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Write what you want to remember."
                placeholderTextColor={palette.navy.light}
                style={[
                  styles.messageInput,
                  {
                    height: Math.min(
                      Math.max(messageHeight, MIN_MESSAGE_HEIGHT),
                      MAX_MESSAGE_HEIGHT,
                    ),
                  },
                ]}
                multiline
                textAlignVertical="top"
                onContentSizeChange={e =>
                  setMessageHeight(e.nativeEvent.contentSize.height)
                }
                // Scroll inside the box only once content exceeds the cap.
                scrollEnabled={messageHeight > MAX_MESSAGE_HEIGHT}
              />
            </View>

            {/* Inline upload errors (Figma 7544:2106) */}
            {errors.length > 0 && (
              <View style={styles.errorsWrap}>
                {errors.map((e, i) => (
                  <ErrorBanner key={`${i}-${e}`} message={e} />
                ))}
              </View>
            )}

            {/* Selected attachments — type-specific previews */}
            {attachments.length > 0 && (
              <View style={styles.previewsWrap}>
                {attachments.map(att => (
                  <AttachmentPreview
                    key={att.id}
                    attachment={att}
                    onRemove={() => removeAttachment(att)}
                    onAddMore={() => setShowUploadSheet(true)}
                    onPlayVideo={() => setPreviewVideo(att)}
                    onToggleAudio={() => toggleAudioPlayback(att)}
                    isPlayingAudio={playingAudioId === att.id}
                  />
                ))}
              </View>
            )}

            {/* Add to your Echo */}
            <View style={styles.addSection}>
              <View style={styles.sectionDivider}>
                <View style={styles.sectionLine} />
                <Text style={styles.sectionLabel}>Add to your Echo</Text>
                <View style={styles.sectionLine} />
              </View>

              <View style={styles.addRow}>
                <AddCard
                  icon={<PhotoIcon />}
                  label="Add photo or video"
                  onPress={() => setShowUploadSheet(true)}
                  disabled={isSaving}
                />
                <AddCard
                  icon={<MicIcon />}
                  label="Add voice recording"
                  onPress={openRecorder}
                  disabled={isSaving}
                />
                <AddCard
                  icon={<VideoIcon />}
                  label="Record a video"
                  onPress={recordVideo}
                  disabled={isSaving}
                />
              </View>
            </View>

            {/* Save */}
            <Button
              variant="primary"
              size="L"
              title={isSaving ? savingLabel : 'SAVE'}
              onPress={onSave}
              disabled={isSaving}
            />
            {isSaving && (
              <ActivityIndicator
                color={palette.gold.DEFAULT}
                style={styles.savingSpinner}
              />
            )}
          </View>
        </KeyboardAwareScrollView>

        {/* Photo/video upload bottom sheet (Figma 7544:2839) */}
        <Modal
          visible={showUploadSheet}
          transparent
          animationType="fade"
          onRequestClose={() => setShowUploadSheet(false)}
          onDismiss={handleSheetDismissed}
        >
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={() => setShowUploadSheet(false)}
          >
            <View style={styles.sheetCard}>
              <Text style={styles.sheetTitle}>
                Choose type of file you wish to upload
              </Text>
              <View style={styles.sheetOptions}>
                <TouchableOpacity
                  style={styles.sheetOption}
                  onPress={requestFile}
                  activeOpacity={0.85}
                >
                  <Text style={styles.sheetOptionIcon}>📄</Text>
                  <Text style={styles.sheetOptionLabel}>File</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sheetOption}
                  onPress={requestGallery}
                  activeOpacity={0.85}
                >
                  <Text style={styles.sheetOptionIcon}>🖼</Text>
                  <Text style={styles.sheetOptionLabel}>Gallery</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.sheetHint}>
                You can attach in .pdf, .png, .jpg or .mp4 format.
              </Text>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Fullscreen video player (tap a video preview's play button) */}
        <Modal
          visible={!!previewVideo}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewVideo(null)}
        >
          <View style={styles.videoModalBackdrop}>
            <TouchableOpacity
              style={styles.videoModalClose}
              onPress={() => setPreviewVideo(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Close video"
            >
              <Text style={styles.recordClose}>✕</Text>
            </TouchableOpacity>
            {previewVideo ? (
              <Video
                source={{ uri: previewVideo.uri }}
                style={styles.videoModalPlayer}
                controls
                resizeMode="contain"
              />
            ) : null}
          </View>
        </Modal>

        {/* Voice recorder modal (Figma "Record your Voice") */}
        <Modal
          visible={showRecordSheet}
          transparent
          animationType="fade"
          onRequestClose={cancelRecording}
        >
          <View style={styles.sheetBackdrop}>
            <View style={styles.sheetCard}>
              <TouchableOpacity
                onPress={cancelRecording}
                style={styles.recordCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Close recorder"
              >
                <Text style={styles.recordClose}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>Record your Voice</Text>
              <Text style={styles.recordTimer}>{formatDuration(recordMs)}</Text>
              <TouchableOpacity
                style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
                onPress={toggleRecording}
                activeOpacity={0.85}
                accessibilityLabel={
                  isRecording ? 'Stop recording' : 'Start recording'
                }
              >
                {isRecording ? (
                  <View style={styles.recordStopIcon} />
                ) : (
                  <Image
                    source={require('@assets/mic.png')}
                    style={styles.recordMicIcon}
                    resizeMode="contain"
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.recordSaveBtn}
                onPress={saveRecording}
                activeOpacity={0.85}
              >
                <Text style={styles.recordSave}>SAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default CreateEchoScreen;

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create<{
  bg: ViewStyle;
  safe: ViewStyle;
  kav: ViewStyle;
  kavContent: ViewStyle;
  content: ViewStyle;
  headerRow: ViewStyle;
  backBtn: ViewStyle;
  backArrowImg: ImageStyle;
  screenTitle: TextStyle;
  headerSpacer: ViewStyle;
  starDivider: ViewStyle;
  starLine: ViewStyle;
  starGlyph: TextStyle;
  field: ViewStyle;
  fieldLabel: TextStyle;
  messageInput: TextStyle;
  viewMessageBox: ViewStyle;
  viewMessageText: TextStyle;
  viewEmpty: TextStyle;
  viewActions: ViewStyle;
  viewActionBtn: ViewStyle;
  viewActionText: TextStyle;
  addSection: ViewStyle;
  sectionDivider: ViewStyle;
  sectionLine: ViewStyle;
  sectionLabel: TextStyle;
  addRow: ViewStyle;
  addCard: ViewStyle;
  addCardDisabled: ViewStyle;
  addCardLabel: TextStyle;
  cardIconImg: ImageStyle;
  errorsWrap: ViewStyle;
  errorBanner: ViewStyle;
  errorIconCircle: ViewStyle;
  errorIconGlyph: TextStyle;
  errorText: TextStyle;
  previewsWrap: ViewStyle;
  previewCard: ViewStyle;
  previewImage: ImageStyle;
  removeCircle: ViewStyle;
  removeCircleFloating: ViewStyle;
  removeCircleText: TextStyle;
  previewCaption: ViewStyle;
  previewCaptionIcon: TextStyle;
  previewCaptionTextWrap: ViewStyle;
  previewCaptionName: TextStyle;
  previewCaptionHint: TextStyle;
  previewVideoBg: ViewStyle;
  previewPlay: ViewStyle;
  previewPlayGlyph: TextStyle;
  previewBadge: ViewStyle;
  previewBadgeText: TextStyle;
  previewSeeMore: ViewStyle;
  previewSeeMoreText: TextStyle;
  chip: ViewStyle;
  chipText: TextStyle;
  audioPlayBtn: ViewStyle;
  audioPlayGlyph: TextStyle;
  videoModalBackdrop: ViewStyle;
  videoModalClose: ViewStyle;
  videoModalPlayer: ViewStyle;
  savingSpinner: ViewStyle;
  sheetBackdrop: ViewStyle;
  sheetCard: ViewStyle;
  sheetTitle: TextStyle;
  sheetOptions: ViewStyle;
  sheetOption: ViewStyle;
  sheetOptionIcon: TextStyle;
  sheetOptionLabel: TextStyle;
  sheetHint: TextStyle;
  recordCloseBtn: ViewStyle;
  recordClose: TextStyle;
  recordTimer: TextStyle;
  recordBtn: ViewStyle;
  recordBtnActive: ViewStyle;
  recordMicIcon: ImageStyle;
  recordStopIcon: ViewStyle;
  recordSaveBtn: ViewStyle;
  recordSave: TextStyle;
}>({
  bg: { flex: 1 },
  safe: { flex: 1, backgroundColor: 'transparent' },
  kav: { flex: 1, width: '100%' },
  kavContent: { flexGrow: 1, paddingBottom: verticalScale(spacing.xl * 2) },
  content: {
    width: '100%',
    paddingHorizontal: scale(spacing.xl),
    paddingTop: verticalScale(spacing.l),
    paddingBottom: verticalScale(spacing.xl),
    gap: verticalScale(spacing.xl),
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  backBtn: {
    width: scale(44),
    height: scale(44),
    justifyContent: 'center',
    alignItems: 'flex-start',
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
    lineHeight: moderateScale(32),
    color: palette.gold.DEFAULT,
    textShadowColor: 'rgba(240,212,168,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  headerSpacer: { width: scale(44) },

  starDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(spacing.xs),
    width: '100%',
  },
  starLine: {
    height: 1,
    width: scale(73),
    backgroundColor: 'rgba(163,179,204,0.4)',
  },
  starGlyph: {
    color: palette.gold.DEFAULT,
    fontSize: moderateScale(14),
  },

  field: { width: '100%', gap: verticalScale(spacing.xs) },
  fieldLabel: {
    fontFamily: fontFamily.heading,
    fontWeight: '500',
    fontSize: moderateScale(fontSize.l),
    lineHeight: moderateScale(24),
    color: palette.gold.subtlest,
    paddingHorizontal: scale(2),
  },
  messageInput: {
    borderRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
    paddingHorizontal: scale(spacing.m),
    paddingVertical: verticalScale(spacing.xs),
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.s, 0.3),
    lineHeight: lineHeight.m,
    color: palette.gold.subtlest,
    backgroundColor: 'rgba(253,253,249,0.02)',
  },

  // Read-only view mode
  viewMessageBox: {
    borderRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
    paddingHorizontal: scale(spacing.m),
    paddingVertical: verticalScale(spacing.s),
    backgroundColor: 'rgba(253,253,249,0.02)',
  },
  viewMessageText: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.s, 0.3),
    lineHeight: lineHeight.m,
    color: palette.gold.subtlest,
  },
  viewEmpty: {
    fontFamily: fontFamily.bodyItalic,
    fontSize: moderateScale(fontSize.s),
    color: palette.navy.light,
    textAlign: 'center',
  },
  viewActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale(spacing.l),
    width: '100%',
  },
  viewActionBtn: {
    paddingHorizontal: scale(spacing.l),
    paddingVertical: verticalScale(spacing.s),
    borderRadius: radius.m,
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
  },
  viewActionText: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize.l),
    color: palette.gold.DEFAULT,
  },

  addSection: { width: '100%', gap: verticalScale(spacing.m) },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(6),
    width: '100%',
  },
  sectionLine: {
    height: 1,
    width: scale(73),
    backgroundColor: 'rgba(163,179,204,0.4)',
  },
  sectionLabel: {
    fontFamily: fontFamily.heading,
    fontWeight: fontWeight.regular,
    fontSize: moderateScale(fontSize.l),
    lineHeight: moderateScale(24),
    color: palette.gold.DEFAULT,
    textShadowColor: 'rgba(240,212,168,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
  },
  addCard: {
    width: scale(98),
    height: verticalScale(96),
    borderRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
    backgroundColor: 'rgba(253,253,249,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: verticalScale(spacing.xs),
    paddingHorizontal: scale(spacing.s),
    paddingVertical: verticalScale(spacing.xs),
  },
  addCardDisabled: { opacity: 0.5 },
  addCardLabel: {
    fontFamily: fontFamily.body,
    fontWeight: fontWeight.regular,
    fontSize: moderateScale(fontSize.xs),
    lineHeight: moderateScale(20),
    color: palette.gold.subtlest,
    textAlign: 'center',
  },
  cardIconImg: {
    width: scale(32),
    height: scale(32),
    tintColor: palette.gold.DEFAULT,
  },

  // Inline error banners (Figma 7544:2106)
  errorsWrap: { width: '100%', gap: verticalScale(spacing.xs) },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(spacing.s),
    borderRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: 'rgba(163,179,204,0.4)',
    backgroundColor: 'rgba(253,253,249,0.02)',
    paddingHorizontal: scale(spacing.m),
    paddingVertical: verticalScale(spacing.s),
  },
  errorIconCircle: {
    width: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    backgroundColor: palette.status.errorHover,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconGlyph: {
    color: palette.gold.subtlest,
    fontSize: moderateScale(12),
    fontWeight: '700',
  },
  errorText: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.xs),
    color: palette.gold.subtlest,
  },

  // Attachment previews
  previewsWrap: { width: '100%', gap: verticalScale(spacing.s) },
  previewCard: {
    width: '100%',
    height: verticalScale(200),
    borderRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  previewImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  removeCircle: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeCircleFloating: {
    position: 'absolute',
    top: scale(spacing.s),
    right: scale(spacing.s),
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  removeCircleText: {
    color: palette.gold.subtlest,
    fontSize: moderateScale(fontSize.s),
    fontWeight: '600',
  },
  previewCaption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(spacing.xs),
    alignSelf: 'flex-start',
    margin: scale(spacing.s),
    paddingHorizontal: scale(spacing.s),
    paddingVertical: verticalScale(spacing.xs),
    borderRadius: radius.s,
    backgroundColor: 'rgba(10,12,18,0.7)',
    maxWidth: '80%',
  },
  previewCaptionIcon: { fontSize: moderateScale(16) },
  previewCaptionTextWrap: { flexShrink: 1 },
  previewCaptionName: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.xs),
    color: palette.gold.subtlest,
  },
  previewCaptionHint: {
    fontFamily: fontFamily.bodyItalic,
    fontSize: moderateScale(fontSize.xs),
    color: palette.navy.light,
  },
  previewVideoBg: { backgroundColor: 'rgba(10,16,32,0.85)' },
  previewPlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: scale(56),
    height: scale(56),
    marginLeft: scale(-28),
    marginTop: scale(-28),
    borderRadius: scale(28),
    backgroundColor: palette.gold.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewPlayGlyph: {
    color: palette.navy.deep,
    fontSize: moderateScale(20),
    marginLeft: scale(3),
  },
  previewBadge: {
    position: 'absolute',
    left: scale(spacing.s),
    bottom: scale(spacing.s),
    paddingHorizontal: scale(spacing.s),
    paddingVertical: verticalScale(4),
    borderRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: 'rgba(253,253,249,0.3)',
    backgroundColor: 'rgba(10,12,18,0.6)',
  },
  previewBadgeText: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.xs),
    color: palette.gold.subtlest,
  },
  previewSeeMore: {
    position: 'absolute',
    right: scale(spacing.s),
    bottom: scale(spacing.s),
    paddingHorizontal: scale(spacing.s),
    paddingVertical: verticalScale(4),
    borderRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: 'rgba(253,253,249,0.3)',
    backgroundColor: 'rgba(10,12,18,0.6)',
  },
  previewSeeMoreText: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.xs),
    color: palette.gold.subtlest,
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: 'rgba(163,179,204,0.4)',
    backgroundColor: 'rgba(253,253,249,0.02)',
    paddingHorizontal: scale(spacing.m),
    paddingVertical: verticalScale(spacing.s),
    gap: scale(spacing.s),
  },
  chipText: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.xs),
    color: palette.gold.subtlest,
  },
  audioPlayBtn: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    borderWidth: borderWidth.thin,
    borderColor: palette.gold.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioPlayGlyph: {
    color: palette.gold.DEFAULT,
    fontSize: moderateScale(12),
  },
  videoModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoModalClose: {
    position: 'absolute',
    top: verticalScale(48),
    right: scale(spacing.l),
    zIndex: 2,
  },
  videoModalPlayer: {
    width: '100%',
    height: '70%',
  },
  savingSpinner: { marginTop: verticalScale(spacing.xs) },

  // Bottom sheet / modals
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(spacing.xl),
  },
  sheetCard: {
    width: '100%',
    borderRadius: radius.m,
    backgroundColor: 'rgba(10,12,18,0.97)',
    borderWidth: borderWidth.regular,
    borderColor: 'rgba(215,192,138,0.25)',
    padding: scale(spacing.l),
    alignItems: 'center',
    gap: verticalScale(spacing.m),
  },
  sheetTitle: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize.xl),
    fontWeight: fontWeight.regular,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
  },
  sheetOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale(spacing.l),
  },
  sheetOption: {
    width: scale(72),
    height: scale(84),
    alignItems: 'center',
    justifyContent: 'center',
    gap: verticalScale(spacing.xs),
    borderRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
    backgroundColor: 'rgba(253,253,249,0.03)',
  },
  sheetOptionIcon: { fontSize: moderateScale(28) },
  sheetOptionLabel: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.s),
    color: palette.gold.subtlest,
  },
  sheetHint: {
    fontFamily: fontFamily.bodyItalic,
    fontSize: moderateScale(fontSize.xs),
    color: palette.navy.light,
    textAlign: 'center',
  },

  recordCloseBtn: {
    position: 'absolute',
    top: scale(spacing.m),
    right: scale(spacing.m),
    zIndex: 2,
  },
  recordClose: {
    color: palette.gold.subtlest,
    fontSize: moderateScale(fontSize.l),
    fontWeight: '600',
  },
  recordTimer: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize['2xl']),
    color: palette.gold.subtlest,
  },
  recordBtn: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    borderWidth: 2,
    borderColor: palette.gold.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    // Soft gold glow around the mic button (Figma 7544:2806).
    shadowColor: palette.gold.warm,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  recordBtnActive: { backgroundColor: 'rgba(242,226,177,0.12)' },
  recordMicIcon: {
    width: scale(26),
    height: scale(26),
    tintColor: palette.gold.DEFAULT,
  },
  recordStopIcon: {
    width: scale(20),
    height: scale(20),
    borderRadius: 3,
    backgroundColor: palette.gold.DEFAULT,
  },
  recordSaveBtn: {
    paddingHorizontal: scale(spacing.l),
    paddingVertical: verticalScale(spacing.s),
    borderRadius: radius.m,
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
  },
  recordSave: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize.l),
    color: palette.gold.DEFAULT,
  },
});
