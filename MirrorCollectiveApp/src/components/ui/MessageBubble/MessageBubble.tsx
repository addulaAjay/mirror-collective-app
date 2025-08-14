import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SHADOWS, SPACING, BORDER_RADIUS } from '../../../constants';
import { theme } from '../../../theme';
import type { Message } from '../../../types';
import LinearGradient from 'react-native-linear-gradient';

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
          colors={['#C59D5F', '#E5D6B0']}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
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
    borderRadius: BORDER_RADIUS.LG,
    marginVertical: SPACING.XS,
    maxWidth: '80%',
    ...SHADOWS.MEDIUM,
  },

  userBubble: {
    // backgroundColor: 'linear-gradient(0deg, #C59D5F 0%, #E5D6B0 100%)',
    marginTop: 14,
    alignSelf: 'flex-end',
    borderColor: COLORS.BORDER.SECONDARY,
    borderBottomRightRadius: 0,
  },

  systemBubble: {
    marginTop: 14,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(155, 170, 194, 0.5)',
    borderBottomLeftRadius: 0,
  },

  text: {
    ...theme.typography.styles.body,
  },

  userText: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 16,
    fontWeight: '400',
    color: '#E5D6B0',
  },

  systemText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: COLORS.TEXT.USER_MESSAGE,
  },
  systemFill: {
    // match outer radii so the fill clips to the same shape
    borderRadius: BORDER_RADIUS.LG,
    borderBottomRightRadius: 0,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
        alignSelf: 'flex-end',
  },

});