import { theme, spacing, radius, shadows, palette } from '@theme';
import type { Message } from '@types';
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Rect } from 'react-native-svg';

import { ttsService, useTtsActiveId } from '@services/speech';


interface MessageBubbleProps {
  message: Message;
}

const SpeakerPlayIcon: React.FC = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 5L6 9H2v6h4l5 4V5z"
      fill={palette.gold.DEFAULT}
    />
    <Path
      d="M15.54 8.46a5 5 0 0 1 0 7.07"
      stroke={palette.gold.DEFAULT}
      strokeWidth={1.5}
      strokeLinecap="round"
      fill="none"
    />
    <Path
      d="M18.36 5.64a9 9 0 0 1 0 12.72"
      stroke={palette.gold.DEFAULT}
      strokeWidth={1.5}
      strokeLinecap="round"
      fill="none"
    />
  </Svg>
);

const SpeakerStopIcon: React.FC = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Rect x={5} y={5} width={14} height={14} rx={2} fill={palette.gold.DEFAULT} />
  </Svg>
);

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const activeUtteranceId = useTtsActiveId();
  const isSpeaking = activeUtteranceId === message.id;

  // Tap toggles: tapping the active bubble stops it; tapping any other
  // bubble starts that one (the wrapper takes care of stopping whichever
  // was previously active).
  const handleSpeakerPress = useCallback(() => {
    if (isSpeaking) {
      ttsService.stop();
    } else {
      void ttsService.speak(message.text, message.id);
    }
  }, [isSpeaking, message.id, message.text]);

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowSystem]}>
      {isUser ? (
        <LinearGradient
          colors={['rgba(253, 253, 249, 0.03)', 'rgba(253, 253, 249, 0.20)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.bubble, styles.userBubble, styles.gradientBubble]}
        >
          <Text style={[styles.text, styles.userText]}>{message.text}</Text>
        </LinearGradient>
      ) : (
        <View style={[styles.bubble, styles.systemBubble]}>
          <Text style={[styles.text, styles.systemText]}>{message.text}</Text>
          <TouchableOpacity
            onPress={handleSpeakerPress}
            style={styles.speakerBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={
              isSpeaking ? 'Stop reading reply aloud' : 'Read reply aloud'
            }
            accessibilityState={{ selected: isSpeaking }}
            testID={`speaker-button-${message.id}`}
          >
            {isSpeaking ? <SpeakerStopIcon /> : <SpeakerPlayIcon />}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Full-width row so bubbles never render "outside" the scroll area
  row: {
    width: '100%',
    flexDirection: 'row',
    marginVertical: spacing.xxs,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowSystem: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',

    borderRadius: radius.s,
    ...shadows.MEDIUM,
  },

  gradientBubble: {
    overflow: 'hidden',
  },

  userBubble: {
    marginTop: 14,
    alignSelf: 'flex-start',
    borderWidth: 0.25,
    borderColor: palette.navy.light,
  },

  systemBubble: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.s,
    paddingRight: spacing.s + 28, // room for the speaker button
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(155, 170, 194, 0.5)',
    backgroundColor: 'rgba(253, 253, 249, 0.05)',
  },

  speakerBtn: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    padding: 4,
  },

  text: {
    ...theme.typography.styles.bodyItalic,
    flexShrink: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  userText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '300',
    lineHeight: 24,
    color: palette.gold.DEFAULT,
    padding: spacing.xs,
    backgroundColor: 'transparent',
  },

  systemText: {
    fontFamily: 'Inter',
    fontStyle: 'italic',
    fontSize: 16,
    fontWeight: '300',
    lineHeight: 24,
    color: palette.gold.DEFAULT,
  },
});
