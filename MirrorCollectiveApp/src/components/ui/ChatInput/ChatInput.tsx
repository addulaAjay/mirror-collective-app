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
        <Text style={styles.iconText}>＋</Text>
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
          ➤
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d9d9d9',
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

  iconText: {
    ...theme.typography.styles.body,
    color: COLORS.TEXT.SECONDARY,
    fontSize: 20,
  },

  input: {
    flex: 1,
    ...theme.typography.styles.input,
    color: COLORS.TEXT.TERTIARY,
    marginHorizontal: SPACING.SM,
    maxHeight: 100,
  },

  sendButton: {
    padding: SPACING.XS,
  },

  sendText: {
    ...theme.typography.styles.body,
    fontSize: 18,
  },

  enabledText: {
    color: COLORS.TEXT.SECONDARY,
  },

  disabledText: {
    color: COLORS.TEXT.SECONDARY,
    opacity: 0.5,
  },
});
