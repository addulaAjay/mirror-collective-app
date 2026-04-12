import {
  fontFamily,
  fontSize,
  lineHeight,
  moderateScale,
  palette,
  radius,
  spacing,
  theme,
} from '@theme';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { G, Mask, Path, Rect } from 'react-native-svg';

// Figma: MC-Component-Library → TextField (node 147:967)
// S size = minHeight 40px (single-line), L size = minHeight 120px (multiline)
// Structure: [Label?] → [Field container] → [Helper text?]
// Inactive: gradient bg rgba(253,253,249,0.04→0.01), border navy.light
// Active:   bg surface.active, border gold.DEFAULT

type FieldSize =
  | 'S'
  | 'L'
  | 'small'   // legacy → maps to S
  | 'normal'  // legacy → maps to S
  | 'medium'; // legacy → maps to S

interface Props {
  // Figma slots
  label?: string;
  helperText?: string;
  // Field placeholder (custom overlay, preserves existing behaviour)
  placeholder?: string;
  // Input behaviour
  secureTextEntry?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'password' | 'new-password' | 'name' | 'off';
  textContentType?:
    | 'none'
    | 'emailAddress'
    | 'password'
    | 'newPassword'
    | 'name'
    | 'givenName'
    | 'familyName'
    | 'telephoneNumber'
    | 'username';
  // Password toggle
  showPasswordToggle?: boolean;
  isPasswordVisible?: boolean;
  onTogglePassword?: () => void;
  // Layout overrides (preserved from previous API)
  placeholderAlign?: 'center' | 'left' | 'right';
  placeholderStyle?: TextStyle;
  /** @deprecated kept for API compat — no longer applied */
  placeholderFontFamily?: string;
  /** @deprecated kept for API compat — use 'gold-regular' for warm gold input text */
  inputTextStyle?: string;
  // Size
  size?: FieldSize;
  multiline?: boolean;
  testID?: string;
}

const TextInputField = ({
  label,
  helperText,
  placeholder,
  secureTextEntry = false,
  value = '',
  onChangeText,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
  textContentType,
  showPasswordToggle = false,
  isPasswordVisible = false,
  onTogglePassword,
  placeholderAlign,
  placeholderStyle,
  inputTextStyle,
  size,
  multiline,
  testID,
}: Props) => {
  const [isFocused, setIsFocused] = useState(false);

  const isEmpty = value.trim().length === 0;
  const resolvedSize: 'S' | 'L' = size === 'L' ? 'L' : 'S';
  const isMultiline = resolvedSize === 'L' || multiline === true;

  return (
    <View style={styles.wrapper}>
      {/* ── Label ─────────────────────────────────────────────────────── */}
      {label ? <Text style={styles.label}>{label}</Text> : null}

      {/* ── Field container ───────────────────────────────────────────── */}
      <View
        style={[
          styles.field,
          isFocused ? styles.fieldActive : styles.fieldInactive,
          resolvedSize === 'L' && styles.fieldL,
        ]}
      >
        {/* Inactive gradient background — clipped by field's borderRadius */}
        {!isFocused && (
          <LinearGradient
            colors={['rgba(253,253,249,0.04)', 'rgba(253,253,249,0.01)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        )}

        {/* Custom placeholder overlay */}
        {isEmpty && !isFocused && placeholder ? (
          <Text
            style={[
              styles.placeholder,
              placeholderAlign === 'left'
                ? styles.placeholderLeft
                : styles.placeholderCenter,
              placeholderStyle,
            ]}
            pointerEvents="none"
          >
            {placeholder}
          </Text>
        ) : null}

        {/* Text input */}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder=""
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          textContentType={textContentType}
          multiline={isMultiline}
          style={[
            styles.input,
            isFocused ? styles.inputActive : styles.inputInactive,
            inputTextStyle === 'gold-regular' && styles.inputGoldRegular,
            isMultiline && styles.inputMultiline,
          ]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          testID={testID}
        />

        {/* Password visibility toggle */}
        {showPasswordToggle ? (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={onTogglePassword}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isPasswordVisible ? (
              // Eye open — password visible
              <Svg width={20} height={20} viewBox="0 0 20 20">
                <Mask
                  id="eyeMask"
                  maskUnits="userSpaceOnUse"
                  x={0}
                  y={0}
                  width={20}
                  height={20}
                >
                  {/* eslint-disable-next-line no-restricted-syntax -- SVG mask fill must be literal white; theme values are not valid SVG attributes */}
                  <Rect width={20} height={20} fill="#fff" />
                </Mask>
                <G mask="url(#eyeMask)">
                  <Path
                    d="M10 13.3333C11.0417 13.3333 11.9271 12.9687 12.6562 12.2396C13.3854 11.5104 13.75 10.625 13.75 9.58331C13.75 8.54165 13.3854 7.65623 12.6562 6.92706C11.9271 6.1979 11.0417 5.83331 10 5.83331C8.95833 5.83331 8.07292 6.1979 7.34375 6.92706C6.61458 7.65623 6.25 8.54165 6.25 9.58331C6.25 10.625 6.61458 11.5104 7.34375 12.2396C8.07292 12.9687 8.95833 13.3333 10 13.3333ZM10 11.8333C9.375 11.8333 8.84375 11.6146 8.40625 11.1771C7.96875 10.7396 7.75 10.2083 7.75 9.58331C7.75 8.95831 7.96875 8.42706 8.40625 7.98956C8.84375 7.55206 9.375 7.33331 10 7.33331C10.625 7.33331 11.1562 7.55206 11.5938 7.98956C12.0312 8.42706 12.25 8.95831 12.25 9.58331C12.25 10.2083 12.0312 10.7396 11.5938 11.1771C11.1562 11.6146 10.625 11.8333 10 11.8333ZM10 15.8333C8.13889 15.8333 6.44097 15.3333 4.90625 14.3333C3.37153 13.3333 2.15972 12.0139 1.27083 10.375C1.20139 10.25 1.14931 10.1215 1.11458 9.98956C1.07986 9.85762 1.0625 9.7222 1.0625 9.58331C1.0625 9.44442 1.07986 9.30901 1.11458 9.17706C1.14931 9.04512 1.20139 8.91665 1.27083 8.79165C2.15972 7.15276 3.37153 5.83331 4.90625 4.83331C6.44097 3.83331 8.13889 3.33331 10 3.33331C11.8611 3.33331 13.559 3.83331 15.0937 4.83331C16.6285 5.83331 17.8403 7.15276 18.7292 8.79165C18.7986 8.91665 18.8507 9.04512 18.8854 9.17706C18.9201 9.30901 18.9375 9.44442 18.9375 9.58331C18.9375 9.7222 18.9201 9.85762 18.8854 9.98956C18.8507 10.1215 18.7986 10.25 18.7292 10.375C17.8403 12.0139 16.6285 13.3333 15.0937 14.3333C13.559 15.3333 11.8611 15.8333 10 15.8333ZM10 14.1666C11.5694 14.1666 13.0104 13.7535 14.3229 12.9271C15.6354 12.1007 16.6389 10.9861 17.3333 9.58331C16.6389 8.18053 15.6354 7.06595 14.3229 6.23956C13.0104 5.41317 11.5694 4.99998 10 4.99998C8.43056 4.99998 6.98958 5.41317 5.67708 6.23956C4.36458 7.06595 3.36111 8.18053 2.66667 9.58331C3.36111 10.9861 4.36458 12.1007 5.67708 12.9271C6.98958 13.7535 8.43056 14.1666 10 14.1666Z"
                    fill={palette.navy.light}
                  />
                </G>
              </Svg>
            ) : (
              // Eye closed — password hidden
              <Svg width={20} height={20} viewBox="0 0 20 20">
                <Mask
                  id="eyeOffMask"
                  maskUnits="userSpaceOnUse"
                  x={0}
                  y={0}
                  width={20}
                  height={20}
                >
                  {/* eslint-disable-next-line no-restricted-syntax -- SVG mask fill must be literal white; theme values are not valid SVG attributes */}
                  <Rect width={20} height={20} fill="#fff" />
                </Mask>
                <G mask="url(#eyeOffMask)">
                  <Path
                    d="M12.6457 6.9375C13.0484 7.34028 13.3436 7.79861 13.5311 8.3125C13.7186 8.82639 13.7846 9.35417 13.729 9.89583C13.729 10.1042 13.6526 10.2813 13.4998 10.4271C13.3471 10.5729 13.1665 10.6458 12.9582 10.6458C12.7498 10.6458 12.5728 10.5729 12.4269 10.4271C12.2811 10.2813 12.2082 10.1042 12.2082 9.89583C12.2776 9.53472 12.2568 9.1875 12.1457 8.85417C12.0346 8.52083 11.8609 8.23611 11.6248 8C11.3887 7.76389 11.104 7.58333 10.7707 7.45833C10.4373 7.33333 10.0832 7.30556 9.70817 7.375C9.49984 7.375 9.32275 7.29861 9.17692 7.14583C9.03109 6.99306 8.95817 6.8125 8.95817 6.60417C8.95817 6.39583 9.03109 6.21875 9.17692 6.07292C9.32275 5.92708 9.49984 5.85417 9.70817 5.85417C10.2359 5.79861 10.7568 5.86458 11.2707 6.05208C11.7846 6.23958 12.2429 6.53472 12.6457 6.9375ZM9.99984 5C9.73595 5 9.479 5.01042 9.229 5.03125C8.979 5.05208 8.729 5.09028 8.479 5.14583C8.24289 5.1875 8.03109 5.15278 7.84359 5.04167C7.65609 4.93056 7.52762 4.76389 7.45817 4.54167C7.38873 4.31944 7.41303 4.10417 7.53109 3.89583C7.64914 3.6875 7.81928 3.5625 8.0415 3.52083C8.36095 3.45139 8.68387 3.40278 9.01025 3.375C9.33664 3.34722 9.6665 3.33333 9.99984 3.33333C11.9026 3.33333 13.6422 3.83333 15.2186 4.83333C16.795 5.83333 17.9998 7.18056 18.8332 8.875C18.8887 8.98611 18.9304 9.10069 18.9582 9.21875C18.986 9.33681 18.9998 9.45833 18.9998 9.58333C18.9998 9.70833 18.9894 9.82986 18.9686 9.94792C18.9478 10.066 18.9096 10.1806 18.854 10.2917C18.604 10.8472 18.295 11.3681 17.9269 11.8542C17.5589 12.3403 17.1526 12.7847 16.7082 13.1875C16.5415 13.3403 16.3471 13.4028 16.1248 13.375C15.9026 13.3472 15.7221 13.2361 15.5832 13.0417C15.4443 12.8472 15.3853 12.6354 15.4061 12.4063C15.4269 12.1771 15.5207 11.9861 15.6873 11.8333C16.0207 11.5139 16.3262 11.1667 16.604 10.7917C16.8818 10.4167 17.1248 10.0139 17.3332 9.58333C16.6387 8.18056 15.6353 7.06597 14.3228 6.23958C13.0103 5.41319 11.5693 5 9.99984 5ZM9.99984 15.8333C8.13873 15.8333 6.43734 15.3299 4.89567 14.3229C3.354 13.316 2.13873 11.9931 1.24984 10.3542C1.18039 10.2431 1.12831 10.1215 1.09359 9.98958C1.05887 9.85764 1.0415 9.72222 1.0415 9.58333C1.0415 9.44445 1.05539 9.3125 1.08317 9.1875C1.11095 9.0625 1.15956 8.9375 1.229 8.8125C1.50678 8.25694 1.8297 7.72569 2.19775 7.21875C2.56581 6.71181 2.98595 6.25 3.45817 5.83333L1.729 4.08333C1.57623 3.91667 1.50331 3.71875 1.51025 3.48958C1.5172 3.26042 1.59706 3.06944 1.74984 2.91667C1.90262 2.76389 2.09706 2.6875 2.33317 2.6875C2.56928 2.6875 2.76373 2.76389 2.9165 2.91667L17.0832 17.0833C17.236 17.2361 17.3158 17.4271 17.3228 17.6562C17.3297 17.8854 17.2498 18.0833 17.0832 18.25C16.9304 18.4028 16.7359 18.4792 16.4998 18.4792C16.2637 18.4792 16.0693 18.4028 15.9165 18.25L12.9998 15.375C12.5137 15.5278 12.0207 15.6424 11.5207 15.7188C11.0207 15.7951 10.5137 15.8333 9.99984 15.8333ZM4.62484 7C4.22206 7.36111 3.854 7.75694 3.52067 8.1875C3.18734 8.61806 2.90262 9.08333 2.6665 9.58333C3.36095 10.9861 4.36442 12.1007 5.67692 12.9271C6.98942 13.7535 8.43039 14.1667 9.99984 14.1667C10.2776 14.1667 10.5484 14.1493 10.8123 14.1146C11.0762 14.0799 11.3471 14.0417 11.6248 14L10.8748 13.2083C10.7221 13.25 10.5762 13.2813 10.4373 13.3021C10.2984 13.3229 10.1526 13.3333 9.99984 13.3333C8.95817 13.3333 8.07275 12.9688 7.34359 12.2396C6.61442 11.5104 6.24984 10.625 6.24984 9.58333C6.24984 9.43056 6.26025 9.28472 6.28109 9.14583C6.30192 9.00694 6.33317 8.86111 6.37484 8.70833L4.62484 7Z"
                    fill={palette.navy.light}
                  />
                </G>
              </Svg>
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ── Helper text ───────────────────────────────────────────────── */}
      {helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  // ── Outer wrapper ──────────────────────────────────────────────────
  wrapper: {
    width: '100%',
    gap: spacing.xs, // 8px between label, field, helper
  },

  // ── Label — Figma: Cormorant Garamond Medium 20px, gold ────────────
  label: {
    fontFamily: fontFamily.headingMedium,
    fontSize: moderateScale(fontSize.l, 0.3), // 20 base
    lineHeight: lineHeight.l,                 // 28
    color: palette.gold.DEFAULT,
  },

  // ── Field container ────────────────────────────────────────────────
  field: {
    borderRadius: radius.s,      // 12 — Figma confirmed
    borderWidth: 0.5,
    paddingHorizontal: spacing.m, // 16
    paddingVertical: spacing.xs,  // 8
    minHeight: 40,                // Size S — Figma
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',           // clips LinearGradient to borderRadius
    // Shadow — Figma: 0px 4px 12px rgba(0,0,0,0.25)
    ...theme.shadows.input,
  },
  fieldInactive: {
    borderColor: palette.navy.light,  // #a3b3cc — Figma inactive border
  },
  fieldActive: {
    borderColor: palette.gold.DEFAULT,
    backgroundColor: palette.surface.active, // rgba(197,158,95,0.05) — Figma active bg
  },
  fieldL: {
    minHeight: 120,       // Size L / multiline — Figma
    alignItems: 'flex-start',
  },

  // ── Custom placeholder overlay ─────────────────────────────────────
  placeholder: {
    position: 'absolute',
    left: 0,
    right: 0,
    ...theme.typography.styles.inputPlaceholder,
    zIndex: 1,
    color: 'rgba(232, 241, 242, 0.50)',
    pointerEvents: 'none',
  },
  placeholderCenter: {
    textAlign: 'center',
  },
  placeholderLeft: {
    textAlign: 'left',
    paddingHorizontal: spacing.m, // 16
  },

  // ── Text input ─────────────────────────────────────────────────────
  // Figma: Inter Regular 16px / lh:24
  input: {
    flex: 1,
    fontFamily: fontFamily.body,                  // Inter-Regular
    fontSize: moderateScale(fontSize.s, 0.3),     // 16 base
    lineHeight: lineHeight.m,                      // 24
    fontWeight: '400',
    textAlign: 'left',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  inputInactive: {
    color: palette.gold.subtlest, // #fdfdf9 — readable on dark bg when not focused
  },
  inputActive: {
    color: palette.gold.DEFAULT,  // #f2e2b1 — Figma active text
  },
  inputGoldRegular: {
    // Legacy 'gold-regular' inputTextStyle — warm gold variant
    color: palette.gold.warm, // #e5d6b0
  },
  inputMultiline: {
    textAlignVertical: 'top',
    paddingTop: spacing.xs, // 8 — align text to top in multiline
  },

  // ── Password toggle ────────────────────────────────────────────────
  eyeIcon: {
    paddingLeft: spacing.xs, // 8 — space between input text and icon
    padding: 5,
  },

  // ── Helper text ────────────────────────────────────────────────────
  // Figma: Inter Regular ~13px (token gap: 12px used) / lh:18, gold.subtlest
  // TODO: 13px not in token scale (xxs=12, xs=14) — flag for designer to add token
  helperText: {
    fontFamily: fontFamily.body,                   // Inter-Regular
    fontSize: moderateScale(fontSize.xxs, 0.3),    // 12 base (token gap for 13px)
    lineHeight: lineHeight.xs,                      // 18
    color: palette.gold.subtlest,                  // #fdfdf9
  },
});

export default TextInputField;

// ── CLEANUP TODO (do when all callers are updated) ─────────────────────────
// 1. Remove deprecated props: `placeholderFontFamily`, `inputTextStyle`
//    - `placeholderFontFamily` was never applied; safe to delete outright.
//    - `inputTextStyle` only used for 'gold-regular' in some screens; replace
//      callers with a proper `textColor` or `variant` prop, then remove.
// 2. Collapse `FieldSize` — drop 'small' | 'normal' | 'medium' variants once
//    all screens pass 'S' or 'L'. Then remove the `resolvedSize` mapping.
// 3. Remove `inputGoldRegular` style and the `inputTextStyle === 'gold-regular'`
//    conditional in the JSX once step 1 is done.
// 4. Audit `placeholderAlign` / `placeholderStyle` — if no screen still needs
//    the custom Text overlay, replace with native `placeholder` + `placeholderTextColor`.
// ──────────────────────────────────────────────────────────────────────────
