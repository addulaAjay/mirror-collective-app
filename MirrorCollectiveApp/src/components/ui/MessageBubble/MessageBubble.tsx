import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { SHADOWS, SPACING, BORDER_RADIUS } from '@constants';
import { theme } from '@theme';
import type { Message } from '@types';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <View style={[
      styles.bubble,
      isUser ? styles.userBubble : styles.systemBubble
    ]}>
      {!isUser ? (
        <Text style={[styles.text, styles.userText]}>
          {message.text}
        </Text>
      ) : (
        <LinearGradient
          colors={['rgba(253, 253, 249, 0.03)', 'rgba(253, 253, 249, 0.20)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.systemFill}
        >
          <Text style={[styles.text, styles.systemText]}>
            {message.text}
          </Text>
         </LinearGradient>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginVertical: SPACING.XS,
    maxWidth: '80%',
    ...SHADOWS.MEDIUM,
  },

  userBubble: {
    // backgroundColor: 'linear-gradient(0deg, #C59D5F 0%, #E5D6B0 100%)',
    marginTop: 14,
    alignSelf: 'flex-end',
  },

  systemBubble: {
    marginTop: 14,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(155, 170, 194, 0.5)',
    backgroundColor: 'rgba(253, 253, 249, 0.05)',
  },

  text: {
    ...theme.typography.styles.body,
  },

  userText: {
    fontFamily: 'Inter',
    fontStyle: 'italic',
    fontSize: 16,
    fontWeight: '400',
    color: '#F2E2B1',
    
  },

  systemText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: '#F2E2B1',
  },
  systemFill: {
    // match outer radii so the fill clips to the same shape
    borderRadius: BORDER_RADIUS.MD,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
        alignSelf: 'flex-end',
  },

});