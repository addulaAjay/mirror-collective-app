import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  borderWidth,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  moderateScale,
  palette,
  scale,
  spacing,
  textShadow,
  verticalScale,
} from '@theme';
import type { RootStackParamList } from '@types';
import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button/Button';
import { CachedImage } from '@components/CachedImage';
import LogoHeader from '@components/LogoHeader';
import TextInputField from '@components/TextInputField';
import { useUser } from '@context/UserContext';
import { authApiService } from '@services/api';
import { echoApiService } from '@services/api/echo';
import { pickProfilePhoto } from '@utils/media/pickProfilePhoto';
import { TTS_FEATURE_ENABLED } from '@services/speech';
import { SpeechSettingsRow } from './settings/SpeechSettingsRow';

const AVATAR_SIZE = moderateScale(160);

// Mirrors SignUpScreen — stores E.164 internally, displays formatted
const formatPhoneDisplay = (e164: string): string => {
  const digits = e164.startsWith('+1') ? e164.slice(2) : '';
  if (digits.length === 0) return '+1';
  if (digits.length <= 3) return `+1 (${digits}`;
  if (digits.length <= 6) return `+1 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, refreshUser } = useUser();

  // E.164 stored internally — displayed via formatPhoneDisplay (matches SignUpScreen)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+1');
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshed, setRefreshed] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Fetch fresh profile data on mount (UserContext only calls refreshUser once
  // on first login; subsequent navigation to this screen gets stale data)
  useEffect(() => {
    void refreshUser().finally(() => setRefreshed(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize local state only AFTER the fresh refresh completes, so
  // phone/image from the backend are available before we snapshot them
  useEffect(() => {
    if (refreshed && user && !initialized) {
      setName(user.fullName ?? '');
      setPhone(user.phoneNumber ?? '+1');
      setInitialized(true);
    }
  }, [refreshed, user, initialized]);

  const handlePhoneChange = (text: string) => {
    let digits = text.replace(/\D/g, '');
    if (digits.startsWith('1')) digits = digits.slice(1);
    digits = digits.slice(0, 10);
    setPhone(digits.length === 0 ? '+1' : `+1${digits}`);
  };

  const handlePickImage = useCallback(async () => {
    // Native crop / zoom / adjust → returns a cropped JPEG ready to upload.
    const photo = await pickProfilePhoto();
    if (photo) setLocalImageUri(photo.uri);
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      let profileImageUrl: string | undefined;

      if (localImageUri) {
        const urlRes = await echoApiService.getUploadUrl('image/jpeg', undefined, 'profile');
        if (!urlRes.success || !urlRes.data) throw new Error('Could not get upload URL');
        await echoApiService.uploadMedia(urlRes.data.upload_url, localImageUri, 'image/jpeg');
        profileImageUrl = urlRes.data.media_url;
      }

      // Always send name and phone when they have values — avoids empty-body 400
      const updatePayload: {
        profileImageUrl?: string;
        displayName?: string;
        phoneNumber?: string;
      } = {};
      if (profileImageUrl) updatePayload.profileImageUrl = profileImageUrl;
      if (name.trim()) updatePayload.displayName = name.trim();
      if (phone.trim()) updatePayload.phoneNumber = phone.trim();

      if (Object.keys(updatePayload).length > 0) {
        await authApiService.updateUserProfile(updatePayload);
      }

      await refreshUser();
      setLocalImageUri(null);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (error: unknown) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  }, [localImageUri, name, phone, refreshUser]);

  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.inner}>

              {/* Back arrow + PROFILE title */}
              <View style={styles.titleRow}>
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => navigation.goBack()}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                  hitSlop={8}
                >
                  <Svg width={scale(20)} height={scale(20)} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M19 12H5M5 12L12 19M5 12L12 5"
                      stroke={palette.gold.DEFAULT}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
                <Text style={styles.title}>PROFILE</Text>
              </View>

              {/* Subtitle */}
              <Text style={styles.subtitle}>
                Personalize your account with a photo.{'\n'}You can always change it later.
              </Text>

              {/* Profile photo */}
              <TouchableOpacity
                onPress={handlePickImage}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Add or change profile photo"
              >
                <View style={styles.avatarRing}>
                  {localImageUri ? (
                    // Just-picked photo from the library — render directly
                    // via RN Image. Caching this temp file would be wrong;
                    // it gets cleaned up by the OS / overwritten by the
                    // next pick.
                    <Image
                      source={{ uri: localImageUri }}
                      style={styles.avatarImage}
                      resizeMode="cover"
                    />
                  ) : user?.profileImageUrl ? (
                    <CachedImage
                      source={{ uri: user.profileImageUrl }}
                      style={styles.avatarImage}
                      contentFit="cover"
                    />
                  ) : (
                    <Text style={styles.avatarPlaceholder}>Add Image</Text>
                  )}
                </View>
              </TouchableOpacity>

              {/* Form — use TextInputField's label prop so typography matches design system */}
              <View style={styles.form}>
                <TextInputField
                  label="Change Name"
                  placeholder="Enter your preferred name here"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                  placeholderAlign="left"
                  placeholderFontFamily="regular"
                  inputTextStyle="gold-regular"
                />

                <TextInputField
                  label="Change Phone Number"
                  placeholder="+1 (555) 123-4567"
                  value={formatPhoneDisplay(phone)}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  placeholderAlign="left"
                  placeholderFontFamily="regular"
                  inputTextStyle="gold-regular"
                />
              </View>

              {/* Settings — currently just the speech toggle, gated on
                  TTS_FEATURE_ENABLED (off by default). The component
                  stays imported so the future engine swap re-enables
                  with a one-line flag flip rather than a re-import.
                  See src/services/speech/featureFlag.ts. */}
              {TTS_FEATURE_ENABLED && (
                <View style={styles.form}>
                  <SpeechSettingsRow />
                </View>
              )}

              {/* Save — no active prop so button renders in default (inactive) state */}
              {!refreshed ? (
                <ActivityIndicator color={palette.gold.DEFAULT} style={styles.loader} />
              ) : isSaving ? (
                <ActivityIndicator color={palette.gold.DEFAULT} style={styles.loader} />
              ) : (
                <Button
                  variant="primary"
                  size="S"
                  title="SAVE"
                  onPress={handleSave}
                />
              )}

            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create<{
  bg: ViewStyle; bgImage: ImageStyle; safe: ViewStyle;
  kav: ViewStyle; scroll: ViewStyle; scrollContent: ViewStyle; inner: ViewStyle;
  titleRow: ViewStyle; backBtn: ViewStyle; title: TextStyle;
  subtitle: TextStyle; avatarRing: ViewStyle;
  avatarImage: ImageStyle; avatarPlaceholder: TextStyle;
  form: ViewStyle; loader: ViewStyle;
}>({
  bg:   { flex: 1 },
  bgImage: { resizeMode: 'cover' },
  safe: { flex: 1, backgroundColor: 'transparent' },
  kav:  { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: scale(spacing.xl),
    paddingBottom: verticalScale(spacing.xxxl * 2),
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    alignItems: 'center',
    gap: verticalScale(spacing.xl),
  },

  // ── Title row ──────────────────────────────────────────────────────────────
  titleRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(spacing.l),
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: 0,
  },
  title: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize['2xl']),
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(lineHeight.l),
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    textShadowColor: textShadow.glow.color,
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: textShadow.glow.radius,
    letterSpacing: 4,
  },

  // ── Subtitle ───────────────────────────────────────────────────────────────
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.s),
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(lineHeight.m),
    color: palette.neutral.white,
    textAlign: 'center',
  },

  // ── Avatar — mirrors AddNewProfileScreen photoCircle exactly ─────────────
  // boxShadow (RN 0.80 CSS property) renders outside the element's paint area
  // so it is NOT clipped by overflow:hidden — no wrapper View needed.
  avatarRing: {
    width:           AVATAR_SIZE,
    height:          AVATAR_SIZE,
    borderRadius:    AVATAR_SIZE / 2,
    borderWidth:     borderWidth.thin,
    borderColor:     palette.gold.warm,
    backgroundColor: 'rgba(229,214,176,0.04)',
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
    boxShadow:       '0px 0px 25px 0px rgba(229,214,176,0.3)',
    shadowColor:     palette.gold.warm,
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   0.3,
    shadowRadius:    25,
    elevation:       8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  // "Add Image" — Cormorant Regular 20px, gold, warm glow (matches AddNewProfileScreen)
  avatarPlaceholder: {
    fontFamily:       fontFamily.heading,
    fontSize:         moderateScale(fontSize.l),
    fontWeight:       fontWeight.regular,
    lineHeight:       moderateScale(lineHeight.m),
    color:            palette.gold.DEFAULT,
    textAlign:        'center',
    textShadowColor:  textShadow.warmGlow.color,
    textShadowOffset: textShadow.warmGlow.offset,
    textShadowRadius: textShadow.warmGlow.radius,
  },

  // ── Form ──────────────────────────────────────────────────────────────────
  form: {
    width: '100%',
    gap: verticalScale(spacing.l),
  },

  loader: { marginVertical: verticalScale(spacing.m) },
});

export default ProfileScreen;
