/**
 * EchoAttachments — renders an echo's attachments[] (multi-attachment model)
 * with inline playback + open/download. Shared by the sender detail and the
 * recipient view screens.
 *
 * - IMAGE → inline image
 * - VIDEO → inline player (react-native-video)
 * - AUDIO → play/pause (react-native-audio-recorder-player)
 * - FILE  → row that opens/downloads via the system (Linking)
 *
 * Self-contained (own audio-playback state); bounded height with internal
 * scroll so it drops into fixed-layout screens without breaking them.
 */

import {
  borderWidth,
  fontFamily,
  fontSize,
  moderateScale,
  palette,
  radius,
  scale,
  spacing,
  verticalScale,
} from '@theme';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Video from 'react-native-video';

import type { Attachment } from '@services/api/echo';

const audioPlayer = AudioRecorderPlayer;

interface EchoAttachmentsProps {
  attachments: Attachment[];
  /** Max height of the (internally scrollable) list. Ignored when scrollable=false. */
  maxHeight?: number;
  /** When false, render a plain View (no internal scroll) so the list can sit
   *  inside a parent ScrollView without nested-scroll conflicts. */
  scrollable?: boolean;
}

function AttachmentCard({ att }: { att: Attachment }) {
  const [playingAudio, setPlayingAudio] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(
    () => () => {
      if (att.type === 'AUDIO') {
        audioPlayer.stopPlayer().catch(() => {});
        audioPlayer.removePlaybackEndListener();
      }
    },
    [att.type],
  );

  const open = () => {
    if (att.media_url) Linking.openURL(att.media_url).catch(() => {});
  };

  const toggleAudio = async () => {
    try {
      if (playingAudio) {
        await audioPlayer.stopPlayer();
        audioPlayer.removePlaybackEndListener();
        setPlayingAudio(false);
        return;
      }
      await audioPlayer.startPlayer(att.media_url);
      setPlayingAudio(true);
      // v4 fires a dedicated end event — reliable for auto-reset (the
      // currentPosition>=duration poll in addPlayBackListener is flaky).
      audioPlayer.addPlaybackEndListener(() => {
        audioPlayer.removePlaybackEndListener();
        setPlayingAudio(false);
      });
    } catch {
      setPlayingAudio(false);
    }
  };

  const name = att.filename ?? `${att.type.toLowerCase()} attachment`;
  const dur = att.duration ? ` · ${att.duration}` : '';

  let media: React.ReactNode = null;
  if (att.type === 'IMAGE') {
    // pointerEvents="none" on the wrapper lets vertical drags pass through to
    // the ScrollView so the page scrolls when you swipe over the image (not
    // just on the side margins).
    media = (
      <View style={styles.image} pointerEvents="none">
        <Image
          source={{ uri: att.media_url }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      </View>
    );
  } else if (att.type === 'VIDEO') {
    // Only the small centered play button is interactive; the poster passes
    // touches through (pointerEvents none) so a vertical drag scrolls the page
    // instead of being eaten by a full-size touchable.
    media = (
      <View style={styles.video}>
        {att.thumb_url ? (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Image
              source={{ uri: att.thumb_url }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          </View>
        ) : null}
        <TouchableOpacity
          style={styles.playOverlay}
          onPress={() => setShowVideo(true)}
          accessibilityRole="button"
          accessibilityLabel="Play video"
        >
          <Text style={styles.playGlyph}>▶</Text>
        </TouchableOpacity>
      </View>
    );
  } else if (att.type === 'AUDIO') {
    // Row is a plain View (passes drags through); only the play button is touchable.
    media = (
      <View style={styles.audioRow}>
        <TouchableOpacity
          style={styles.audioBtn}
          onPress={toggleAudio}
          accessibilityRole="button"
          accessibilityLabel={playingAudio ? 'Pause audio' : 'Play audio'}
        >
          <Text style={styles.audioGlyph}>{playingAudio ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
        <Text style={styles.audioLabel} numberOfLines={1}>
          {name}
          {dur}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {media}
      <View style={styles.row}>
        <Text style={styles.name} numberOfLines={1}>
          {att.type === 'FILE' ? `📄 ${name}` : name}
          {att.type !== 'AUDIO' ? dur : ''}
        </Text>
        <TouchableOpacity onPress={open} accessibilityLabel={`Open ${name}`}>
          <Text style={styles.open}>Open</Text>
        </TouchableOpacity>
      </View>

      {att.type === 'VIDEO' && (
        <Modal
          visible={showVideo}
          transparent
          animationType="fade"
          onRequestClose={() => setShowVideo(false)}
        >
          <View style={styles.videoModalBackdrop}>
            <TouchableOpacity
              style={styles.videoModalClose}
              onPress={() => setShowVideo(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Close video"
            >
              <Text style={styles.videoModalCloseText}>✕</Text>
            </TouchableOpacity>
            <Video
              source={{ uri: att.media_url }}
              style={styles.videoModalPlayer}
              controls
              resizeMode="contain"
            />
          </View>
        </Modal>
      )}
    </View>
  );
}

const EchoAttachments: React.FC<EchoAttachmentsProps> = ({
  attachments,
  maxHeight = verticalScale(360),
  scrollable = true,
}) => {
  if (!attachments || attachments.length === 0) return null;
  const cards = attachments.map(att => (
    <AttachmentCard key={att.attachment_id} att={att} />
  ));
  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>
        {attachments.length === 1
          ? 'Attachment'
          : `Attachments (${attachments.length})`}
      </Text>
      {scrollable ? (
        <ScrollView
          style={{ maxHeight }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {cards}
        </ScrollView>
      ) : (
        <View>{cards}</View>
      )}
    </View>
  );
};

export default EchoAttachments;

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: verticalScale(spacing.xs) },
  heading: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize.l),
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    marginBottom: verticalScale(spacing.xs),
  },
  card: {
    borderRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
    backgroundColor: 'rgba(253,253,249,0.02)',
    overflow: 'hidden',
    marginBottom: verticalScale(spacing.s),
  },
  image: { width: '100%', height: verticalScale(180), backgroundColor: palette.navy.deep },
  video: {
    width: '100%',
    height: verticalScale(180),
    backgroundColor: palette.navy.deep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playOverlay: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: palette.gold.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playGlyph: {
    color: palette.navy.deep,
    fontSize: moderateScale(22),
    marginLeft: scale(3),
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
  videoModalCloseText: {
    color: palette.gold.subtlest,
    fontSize: moderateScale(fontSize.l),
    fontWeight: '600',
  },
  videoModalPlayer: { width: '100%', height: '70%' },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(spacing.s),
    padding: scale(spacing.s),
  },
  audioBtn: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    borderWidth: borderWidth.thin,
    borderColor: palette.gold.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioGlyph: { color: palette.gold.DEFAULT, fontSize: moderateScale(13) },
  audioLabel: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.xs),
    color: palette.gold.subtlest,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(spacing.s),
    paddingVertical: verticalScale(spacing.xs),
    gap: scale(spacing.s),
  },
  name: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.xs),
    color: palette.gold.subtlest,
  },
  open: {
    color: palette.gold.DEFAULT,
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.xs),
    fontWeight: '600',
  },
});
