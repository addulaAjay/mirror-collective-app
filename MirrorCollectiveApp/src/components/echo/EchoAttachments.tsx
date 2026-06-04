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
import type { Attachment } from '@services/api/echo';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Video from 'react-native-video';

const audioPlayer = AudioRecorderPlayer;

interface EchoAttachmentsProps {
  attachments: Attachment[];
  /** Max height of the (internally scrollable) list. */
  maxHeight?: number;
}

function AttachmentCard({ att }: { att: Attachment }) {
  const [playingAudio, setPlayingAudio] = useState(false);

  useEffect(
    () => () => {
      if (att.type === 'AUDIO') {
        audioPlayer.stopPlayer().catch(() => {});
        audioPlayer.removePlayBackListener();
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
        audioPlayer.removePlayBackListener();
        setPlayingAudio(false);
        return;
      }
      await audioPlayer.startPlayer(att.media_url);
      setPlayingAudio(true);
      audioPlayer.addPlayBackListener(e => {
        if (e.duration > 0 && e.currentPosition >= e.duration) {
          audioPlayer.stopPlayer().catch(() => {});
          audioPlayer.removePlayBackListener();
          setPlayingAudio(false);
        }
      });
    } catch {
      setPlayingAudio(false);
    }
  };

  const name = att.filename ?? `${att.type.toLowerCase()} attachment`;
  const dur = att.duration ? ` · ${att.duration}` : '';

  let media: React.ReactNode = null;
  if (att.type === 'IMAGE') {
    media = (
      <Image
        source={{ uri: att.media_url }}
        style={styles.image}
        resizeMode="cover"
      />
    );
  } else if (att.type === 'VIDEO') {
    media = (
      <Video
        source={{ uri: att.media_url }}
        style={styles.video}
        controls
        paused
        resizeMode="contain"
        poster={att.thumb_url ?? undefined}
      />
    );
  } else if (att.type === 'AUDIO') {
    media = (
      <TouchableOpacity
        style={styles.audioRow}
        onPress={toggleAudio}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={playingAudio ? 'Pause audio' : 'Play audio'}
      >
        <View style={styles.audioBtn}>
          <Text style={styles.audioGlyph}>{playingAudio ? '⏸' : '▶'}</Text>
        </View>
        <Text style={styles.audioLabel} numberOfLines={1}>
          {name}
          {dur}
        </Text>
      </TouchableOpacity>
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
    </View>
  );
}

const EchoAttachments: React.FC<EchoAttachmentsProps> = ({
  attachments,
  maxHeight = verticalScale(360),
}) => {
  if (!attachments || attachments.length === 0) return null;
  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>
        {attachments.length === 1
          ? 'Attachment'
          : `Attachments (${attachments.length})`}
      </Text>
      <ScrollView
        style={{ maxHeight }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {attachments.map(att => (
          <AttachmentCard key={att.attachment_id} att={att} />
        ))}
      </ScrollView>
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
  image: { width: '100%', height: verticalScale(180), backgroundColor: '#0b1020' },
  video: { width: '100%', height: verticalScale(180), backgroundColor: '#0b1020' },
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
