import React, { useRef, useState } from 'react';
import {
  TextInput,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import { typography, colors, shadows } from '../styles/typography';

interface Props {
  placeholder: string;
  secureTextEntry?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'password' | 'name' | 'off';
  showPasswordToggle?: boolean;
  isPasswordVisible?: boolean;
  onTogglePassword?: () => void;
}

const TextInputField = ({
  placeholder,
  secureTextEntry = false,
  value,
  onChangeText,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
  showPasswordToggle = false,
  isPasswordVisible = false,
  onTogglePassword,
}: Props) => {
  const inputRef = useRef<TextInput>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const handleChangeText = (text: string) => {
    if (onChangeText) {
      onChangeText(text);
    }
    // Update selection to be at the end of new text
    const newPosition = text.length;
    setSelection({ start: newPosition, end: newPosition });
  };

  const handleFocus = () => {
    // When focusing on an empty field, cursor should be at position 0 for center alignment
    if (!value || value.length === 0) {
      setSelection({ start: 0, end: 0 });
      setTimeout(() => {
        inputRef.current?.setSelection(0, 0);
      }, 50);
    } else {
      // If there's text, place cursor at the end
      const textLength = value.length;
      setSelection({ start: textLength, end: textLength });
    }
  };

  const handleSelectionChange = (event: any) => {
    setSelection(event.nativeEvent.selection);
  };

  return (
    <View style={styles.container}>
      <TextInput
        ref={inputRef}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        secureTextEntry={secureTextEntry}
        style={styles.input}
        value={value}
        onChangeText={handleChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        textAlign="center"
        onFocus={handleFocus}
        onSelectionChange={handleSelectionChange}
        selection={selection}
        multiline={false}
        selectTextOnFocus={false}
      />
      {showPasswordToggle && (
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={onTogglePassword}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.eyeText}>{isPasswordVisible ? '👁️' : '👁️‍🗨️'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 313,
    height: 48,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: colors.border.input,
    backgroundColor: colors.background.input,
    paddingHorizontal: 40,
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: shadows.input.color,
    shadowOffset: shadows.input.offset,
    shadowOpacity: shadows.input.opacity,
    shadowRadius: shadows.input.radius,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    ...typography.styles.input,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    paddingTop: 0,
    paddingBottom: 0,
    height: '100%',
    // Force cursor to be visible and centered
    ...(Platform.OS === 'android' && {
      textAlign: 'center',
      textAlignVertical: 'center',
    }),
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  eyeText: {
    fontSize: 18,
    color: colors.text.secondary,
  },
});

export default TextInputField;
