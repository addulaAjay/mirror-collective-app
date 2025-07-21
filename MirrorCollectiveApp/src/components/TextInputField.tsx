import React from 'react';
import { TextInput, StyleSheet, View, TouchableOpacity, Text } from 'react-native';
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
}: Props) => (
  <View style={styles.container}>
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={colors.text.muted}
      secureTextEntry={secureTextEntry}
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      autoComplete={autoComplete}
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
