import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Rect } from 'react-native-svg';

import { TTS_FEATURE_ENABLED, ttsService, useTtsActiveId } from '@services/speech';
import { theme, spacing, radius, shadows, palette } from '@theme';
import type { Message } from '@types';


interface MessageBubbleProps {
  message: Message;
  /**
   * When provided, an assistant reply shows a "save to Echo Vault" icon that
   * carries this reply's text into the create-Echo flow. Ignored for the
   * user's own messages.
   */
  onSave?: () => void;
}

// content_copy glyph (Figma 7811-2866) — the "copy this reply into an Echo"
// affordance. The info modal (node 7915-4583) explicitly calls this "the copy
// icon", so the design uses two overlapping sheets rather than a download arrow.
const SaveIcon: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect
      x={9}
      y={9}
      width={11}
      height={11}
      rx={2}
      stroke={palette.gold.DEFAULT}
      strokeWidth={1.6}
    />
    <Path
      d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
      stroke={palette.gold.DEFAULT}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

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

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onSave,
}) => {
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
        <View style={styles.systemColumn}>
          <View style={[styles.bubble, styles.systemBubble, styles.systemBubbleWidth]}>
            <Text style={[styles.text, styles.systemText]}>{message.text}</Text>
            {TTS_FEATURE_ENABLED && (
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
            )}
          </View>

          {onSave && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={onSave}
                style={styles.actionBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Save to Echo Vault"
                testID={`save-echo-${message.id}`}
              >
                <SaveIcon />
              </TouchableOpacity>
            </View>
          )}
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
  // Assistant messages stack the bubble + an action row (save icon) beneath it,
  // left-aligned to the bubble edge. The column carries the 80% width cap.
  systemColumn: {
    maxWidth: '80%',
    alignItems: 'flex-start',
  },
  systemBubbleWidth: {
    maxWidth: '100%',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
    marginLeft: 4,
  },
  actionBtn: {
    padding: 2,
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
    // When TTS_FEATURE_ENABLED is true, the speaker button is absolutely
    // positioned bottom-right and needs ~28px of right padding to avoid
    // overlap with the text. Re-add `paddingRight: spacing.s + 28` here
    // when re-enabling the feature.
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
