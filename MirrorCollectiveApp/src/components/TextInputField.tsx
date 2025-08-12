import React, { useState } from 'react';
import {
  TextInput,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import { typography, colors } from '../styles/typography';

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
  placeholderAlign?: 'center' | 'left' | 'right';
  size: 'small' | 'normal' | 'medium';
}

const TextInputField = ({
  placeholder,
  secureTextEntry = false,
  value = '',
  onChangeText,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
  showPasswordToggle = false,
  isPasswordVisible = false,
  onTogglePassword,
  placeholderAlign,
  size,
}: Props) => {
  const [isFocused, setIsFocused] = useState(false);

  const isEmpty = value.trim().length === 0;

  return (
    <View style={styles.container}>
      {/* Custom Placeholder */}
      {isEmpty && !isFocused && (
        <Text
          style={[
            styles.placeholder,
            placeholderAlign === 'left'
              ? styles.placeholderLeft
              : styles.placeholderCenter,
          ]}
        >
          {placeholder}
        </Text>
      )}

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="" // hide native placeholder
        secureTextEntry={secureTextEntry && !isPasswordVisible}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        style={[
          styles.input,
          size === 'normal'
            ? styles.size_normal
            : size === 'medium'
            ? styles.size_medium
            : styles.size_small,
        ]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
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
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#FDFDF9',
    backgroundColor: 'rgba(58, 74, 92, 0.3)',
    paddingHorizontal: 15,
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  size_normal: {
    height: 48,
  },
  size_medium: {
    height: 44,
  },
  size_small: {
    height: 35,
  },
  input: {
    flex: 1,
    ...typography.styles.input,
    textAlign: 'left',
    textAlignVertical: 'center',
    includeFontPadding: false,
    color: colors.text.primary,
    fontFamily: 'CormorantGaramond-LightItalic',
  },
  placeholder: {
    position: 'absolute',
    left: 0,
    right: 0,
    ...typography.styles.inputPlaceholder,
    zIndex: 1,
    pointerEvents: 'none',
  },
  placeholderCenter: {
    textAlign: 'center',
  },
  placeholderLeft: {
    textAlign: 'left',
    paddingHorizontal: 15,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  eyeText: {
    fontSize: 18,
    color: colors.text.secondary,
    fontFamily: 'CormorantGaramond-LightItalic',
  },
});

export default TextInputField;
