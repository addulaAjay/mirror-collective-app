import { COLORS, SHADOWS, SPACING } from '@constants';
import { theme } from '@theme';
import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

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
  placeholder = 'Ask me anything...',
  disabled = false,
}) => {
  return (
    <LinearGradient
      colors={['rgba(253, 253, 249, 0.03)', 'rgba(253, 253, 249, 0.20)']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <TouchableOpacity style={styles.iconButton} disabled={disabled}>
        <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
          <Defs>
            <ClipPath id="clip0_8_390">
              <Rect width={22} height={22} fill="white" />
            </ClipPath>
          </Defs>
          <G clipPath="url(#clip0_8_390)">
            <Path
              d="M11.0176 0.000118047C17.1144 0.0279573 22.028 4.95551 22.0002 11.0175C21.9723 17.1213 17.0587 22.014 10.9828 22.0001C4.89294 21.9862 -0.0346159 17.0378 0.000183189 10.9827C0.0349823 4.87199 4.95558 -0.0277212 11.0176 0.000118047ZM0.91888 10.9897C0.91888 16.5367 5.42885 21.0675 10.9758 21.0814C16.5367 21.0953 21.0815 16.5715 21.0884 11.0036C21.0954 5.4427 16.5646 0.911855 10.9967 0.911855C5.44972 0.911855 0.92584 5.43574 0.91888 10.9897Z"
              fill="#9BAAC2"
            />
            <Path
              d="M10.5442 13.3698C10.5442 12.8269 10.5373 12.2841 10.5442 11.7412C10.5442 11.5185 10.4746 11.4489 10.2519 11.4489C9.18706 11.4559 8.12221 11.4489 7.05736 11.4489C6.88336 11.4489 6.71633 11.4489 6.58409 11.3097C6.45881 11.1705 6.41705 11.0104 6.48665 10.8364C6.57017 10.6207 6.73721 10.5372 6.96688 10.5372C7.83686 10.5372 8.7138 10.5372 9.58377 10.5372C9.80649 10.5372 10.0292 10.5232 10.2519 10.5372C10.4746 10.5511 10.5442 10.4676 10.5442 10.2449C10.5373 9.18 10.5442 8.11515 10.5442 7.0503C10.5442 6.86934 10.5442 6.68838 10.7113 6.55615C10.8574 6.43783 11.0175 6.41695 11.1915 6.49351C11.3864 6.58399 11.4629 6.74406 11.4629 6.95982C11.4629 7.73932 11.4629 8.51186 11.4629 9.29136C11.4629 9.61151 11.4768 9.93166 11.4629 10.2518C11.449 10.4745 11.5325 10.5441 11.7552 10.5441C12.8271 10.5372 13.9058 10.5441 14.9776 10.5441C15.1516 10.5441 15.3187 10.558 15.437 10.7112C15.5553 10.8573 15.5762 11.0174 15.4996 11.1914C15.4091 11.3863 15.2491 11.4628 15.0333 11.4628C14.2329 11.4628 13.4395 11.4628 12.6391 11.4628C12.3399 11.4628 12.0406 11.4767 11.7483 11.4628C11.5256 11.4489 11.456 11.5324 11.4629 11.7551C11.4699 12.7852 11.4629 13.8222 11.4629 14.8523C11.4629 14.9567 11.4699 15.068 11.449 15.1724C11.4003 15.4299 11.2333 15.5622 10.9688 15.5413C10.7113 15.5204 10.5581 15.3673 10.5512 15.1028C10.5442 14.5251 10.5512 13.9544 10.5512 13.3768L10.5442 13.3698Z"
              fill="#9BAAC2"
            />
          </G>
        </Svg>
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
        testID="send-button"
      >
        <Text
          style={[
            styles.sendText,
            disabled || !value.trim()
              ? styles.disabledText
              : styles.enabledText,
          ]}
        >
          <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
            <Defs>
              <ClipPath id="clip0_8_397">
                <Rect width={18} height={18} fill="white" />
              </ClipPath>
            </Defs>
            <G clipPath="url(#clip0_8_397)">
              <Path
                d="M0.892988 18.0002H0.492988C0.0429882 17.7575 -0.0641546 17.4219 0.0644168 16.9149C0.564417 14.8586 1.0287 12.8023 1.49299 10.7388C1.59299 10.2819 1.85013 10.0534 2.30727 10.0105C4.0287 9.83918 5.75727 9.66782 7.4787 9.48932C8.47156 9.38936 9.46442 9.28226 10.4644 9.1823C10.6144 9.16802 10.793 9.16088 10.8001 8.96096C10.8001 8.76104 10.6358 8.73962 10.4787 8.7182C10.3787 8.70392 10.2787 8.70392 10.1787 8.69678C7.54299 8.43974 4.90727 8.17556 2.27156 7.9328C1.81442 7.88996 1.59299 7.66862 1.49299 7.24022C1.01442 5.13391 0.52156 3.04188 0.0358454 0.956994C-0.0570118 0.564293 0.0287025 0.264412 0.392988 0.0716309C0.707274 -0.0925896 0.97156 0.0644909 1.24299 0.200151C6.6287 2.89908 12.0216 5.59087 17.4073 8.2898C17.6573 8.41118 17.8501 8.56826 18.0001 8.79674V9.29654C17.7787 9.52502 17.5216 9.68924 17.2358 9.83204C14.0287 11.4243 10.8216 13.0165 7.62156 14.6159C5.37156 15.7368 3.13585 16.8721 0.885845 18.0002H0.892988Z"
                fill="#9BAAC2"
              />
            </G>
          </Svg>
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: SPACING.MD,
    paddingHorizontal: SPACING.XS,
    // paddingVertical: SPACING.XS,
    marginTop: SPACING.XL,
    marginBottom: SPACING.XL,
    ...SHADOWS.MEDIUM,
    // borderWidth: 0.25,
    borderColor: COLORS.BORDER.PRIMARY,
    height: 65,
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
