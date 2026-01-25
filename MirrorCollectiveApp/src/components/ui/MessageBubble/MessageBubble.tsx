import { SHADOWS, SPACING, BORDER_RADIUS } from '@constants';
import { theme } from '@theme';
import type { Message } from '@types';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';


interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';

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
    marginVertical: SPACING.XS,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowSystem: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',

    borderRadius: BORDER_RADIUS.MD,
    ...SHADOWS.MEDIUM,
  },

  gradientBubble: {
    overflow: 'hidden',
  },

  userBubble: {
    marginTop: 14,
    alignSelf: 'flex-start',
    borderWidth: 0.25,
    borderColor: '#A3B3CC',
  },

  systemBubble: {
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(155, 170, 194, 0.5)',
    backgroundColor: 'rgba(253, 253, 249, 0.05)',
  },

  text: {
    ...theme.typography.styles.body,
    flexShrink: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  userText: {
    fontFamily: 'Inter',
    fontStyle: 'italic',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: '#F2E2B1',
    padding: SPACING.SM,
    backgroundColor: 'transparent',
  },

  systemText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: '#F2E2B1',
  },
});
