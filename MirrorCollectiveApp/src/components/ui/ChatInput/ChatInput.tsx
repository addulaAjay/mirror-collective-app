import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { COLORS, SHADOWS, SPACING } from '../../../constants';
import { theme } from '../../../theme';
import { Image } from 'react-native';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChangeText,
  onSend,
  placeholder = 'Ask me something',
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.iconButton} disabled={disabled}>
        <Image
          source={require('../../../../assets/add_circle.png')}
          style={styles.iconImage}
        />
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.TEXT.TERTIARY}
        editable={!disabled}
        multiline
      />

      <TouchableOpacity
        style={styles.sendButton}
        onPress={onSend}
        disabled={disabled || !value.trim()}
      >
        <Text
          style={[
            styles.sendText,
            disabled || !value.trim()
              ? styles.disabledText
              : styles.enabledText,
          ]}
        >
          <Image
            source={require('../../../../assets/send.png')}
            style={styles.iconImage}
          />
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'linear-gradient(0deg, rgba(217, 217, 217, 0.15) 0%, rgba(155, 170, 194, 0.15) 100%)',
    borderRadius: 13,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    marginTop: SPACING.MD,
    ...SHADOWS.MEDIUM,
    borderWidth: 0.25,
    borderColor: COLORS.BORDER.PRIMARY,
  },

  iconButton: {
    padding: SPACING.XS,
  },
  iconImage: {
    width: 28,
    height: 28,
    tintColor: COLORS.TEXT.TERTIARY,
  },

  iconText: {
    ...theme.typography.styles.body,
    color: COLORS.TEXT.SECONDARY,
    fontSize: 20,
  },

  input: {
    flex: 1,
    ...theme.typography.styles.input,
    color: COLORS.TEXT.WHITE,
    marginHorizontal: SPACING.SM,
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '400',
    maxHeight: 100,
  },

  sendButton: {
    padding: SPACING.XS,
  },

  sendText: {
    ...theme.typography.styles.body,
    fontSize: 30,
  },

  enabledText: {
    color: COLORS.TEXT.TERTIARY,
  },

  disabledText: {
    color: 'rgba(163, 179, 204, 0.50)',
    textAlign: 'center',
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '400',
    opacity: 0.5,
  },
});
