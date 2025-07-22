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
    marginTop: 14,
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: COLORS.BORDER.SECONDARY,
    borderBottomRightRadius: 0,
  },
  
  systemBubble: {
    backgroundColor: COLORS.BACKGROUND.SYSTEM_BUBBLE,
    marginTop: 14,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.BORDER.GOLD,
    borderBottomLeftRadius: 0,
  },
  
  text: {
    ...theme.typography.styles.body,
  },
  
  userText: {
    fontSize: 17,
    color: COLORS.TEXT.USER_MESSAGE,
  },
  
  systemText: {
    fontFamily: 'CormorantGaramond-MediumItalic',
    fontSize: 17,
    color: COLORS.TEXT.SYSTEM_MESSAGE,
  },
});