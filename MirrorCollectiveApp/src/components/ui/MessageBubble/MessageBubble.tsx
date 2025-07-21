import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SHADOWS, SPACING, BORDER_RADIUS } from '../../../constants';
import { theme } from '../../../theme';
import type { Message } from '../../../types';

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
      <Text style={[
        styles.text,
        isUser ? styles.userText : styles.systemText
      ]}>
        {message.text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
    marginVertical: SPACING.XS,
    maxWidth: '80%',
    ...SHADOWS.MEDIUM,
  },
  
  userBubble: {
    backgroundColor: COLORS.BACKGROUND.USER_BUBBLE,
    alignSelf: 'flex-end',
    borderWidth: 0.5,
    borderColor: COLORS.BORDER.SECONDARY,
  },
  
  systemBubble: {
    backgroundColor: COLORS.BACKGROUND.SYSTEM_BUBBLE,
    alignSelf: 'flex-start',
    borderWidth: 0.25,
    borderColor: COLORS.BORDER.PRIMARY,
  },
  
  text: {
    ...theme.typography.styles.body,
  },
  
  userText: {
    color: COLORS.TEXT.USER_MESSAGE,
  },
  
  systemText: {
    color: COLORS.TEXT.SYSTEM_MESSAGE,
  },
});