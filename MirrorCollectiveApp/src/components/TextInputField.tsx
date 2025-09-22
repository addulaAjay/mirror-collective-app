import React, { useState } from 'react';
import {
  TextInput,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import {
  COLORS,
  TYPOGRAPHY,
  LAYOUT,
  BORDERS,
  SPACING,
  SHADOWS,
} from '../styles';
import Svg, { Path } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');

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
  size?: 'small' | 'normal' | 'medium';
  placeholderFontFamily?: 'regular' | 'italic';
  inputTextStyle?: 'gold-regular';
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
  placeholderAlign = 'left',
  size = 'normal',
  placeholderFontFamily = 'italic',
  inputTextStyle,
}: Props) => {
  const [isFocused, setIsFocused] = useState(false);
  const isEmpty = value.trim().length === 0;

  return (
    <View style={styles.container}>
      {isEmpty && !isFocused && (
        <Text
          style={[
            styles.placeholder,
            placeholderAlign === 'left'
              ? styles.placeholderLeft
              : styles.placeholderCenter,
            placeholderFontFamily === 'regular'
              ? styles.fontFamilyRegular
              : styles.fontFamilyItalic,
          ]}
        >
          {placeholder}
        </Text>
      )}

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder=""
        secureTextEntry={secureTextEntry && !isPasswordVisible}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        style={[
          styles.input,
          size === 'small'
            ? styles.sizeSmall
            : size === 'medium'
            ? styles.sizeMedium
            : styles.sizeNormal,
          inputTextStyle === 'gold-regular' && styles.inputGoldRegular,
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
          <Svg width={20} height={20} viewBox="0 0 20 20">
            <Path
              d={
                isPasswordVisible
                  ? 'M10 13.33C11.04 ...' // 👁 path
                  : 'M12.64 6.93 ...' // 👁‍🗨 path
              }
              fill={COLORS.TEXT.TERTIARY}
            />
          </Svg>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: Math.min(screenWidth * 0.85, 313),
    borderRadius: BORDERS.RADIUS.MEDIUM,
    borderWidth: BORDERS.WIDTH.THIN,
    borderColor: COLORS.UI.BORDER,
    backgroundColor: COLORS.UI.INPUT_BG,
    paddingHorizontal: SPACING.M,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.MEDIUM,
  },

  sizeNormal: { height: LAYOUT.INPUT_HEIGHT },
  sizeMedium: { height: 44 },
  sizeSmall: { height: 35 },

  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.SIZES.L,
    fontFamily: 'CormorantGaramond-Italic',
    color: COLORS.TEXT.PRIMARY,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },

  inputGoldRegular: {
    fontFamily: 'CormorantGaramond-Regular',
    color: COLORS.PRIMARY.GOLD_LIGHT,
  },

  placeholder: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontSize: TYPOGRAPHY.SIZES.L,
    color: COLORS.TEXT.MUTED,
    pointerEvents: 'none',
  },
  fontFamilyRegular: { fontFamily: 'CormorantGaramond-Regular' },
  fontFamilyItalic: { fontFamily: 'CormorantGaramond-Italic' },

  placeholderCenter: { textAlign: 'center' },
  placeholderLeft: { textAlign: 'left', paddingHorizontal: SPACING.M },

  eyeIcon: {
    position: 'absolute',
    right: SPACING.M,
    padding: SPACING.XXS,
  },
});

export default TextInputField;
