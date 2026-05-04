/**
 * Add New Profile Screen
 * Figma: Design-Master-File → Add Profile (780:1147)
 *
 * Layout:
 *   LogoHeader
 *   Header row: ← | ADD PROFILE | spacer
 *   Subtitle — "Personalize your echo with a photo of the intended recipient/guardian."
 *   Photo circle (186×186) — "Add Image +" taps open gallery; shows photo when selected
 *   Name field — TextInputField
 *   Email field — TextInputField
 *   ADD button — Button primary
 *
 * Image flow:
 *   1. User taps circle → launchImageLibrary from react-native-image-picker
 *   2. Selected photo shown in circle (URI stored in state)
 *   3. getUploadUrl('image/jpeg', undefined, 'profile') → presigned S3 URL (no echoId needed)
 *   4. uploadMedia(upload_url, localUri) → PUT to S3
 *   5. Public media_url stored as profile_image_url on recipient via addRecipient
 *   6. EchoVaultLibraryScreen reads recipient.profile_image_url → shows in EchoAvatar
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button/Button';
import LogoHeader from '@components/LogoHeader';
import TextInputField from '@components/TextInputField';
import { echoApiService } from '@services/api/echo';
import {
  borderWidth,
  fontFamily,
  fontSize,
  fontWeight,
  moderateScale,
  palette,
  scale,
  spacing,
  textShadow,
  verticalScale,
} from '@theme';
import type { RootStackParamList } from '@types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddNewProfileScreen'>;

// ── Back arrow ────────────────────────────────────────────────────────────────
const BackIcon: React.FC = () => (
  <Svg width={scale(20)} height={scale(20)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
      fill={palette.gold.DEFAULT}
    />
  </Svg>
);

const CIRCLE = scale(186);

const AddNewProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const mode = route.params?.mode ?? 'recipient';
  const isGuardian = mode === 'guardian';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 400,
      maxHeight: 400,
    });

    if (!result.didCancel && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleAdd = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Required', 'Please enter a name and email address.');
      return;
    }
    try {
      setLoading(true);

      // Upload profile photo → S3 before saving the recipient.
      // Reuses getUploadUrl (upload_type:'profile', no echoId) + uploadMedia —
      // the same pipeline as echo audio/video, no separate endpoint needed.
      let profileImageUrl: string | undefined;
      if (photoUri && !isGuardian) {
        const urlRes = await echoApiService.getUploadUrl('image/jpeg', undefined, 'profile');
        if (!urlRes.success || !urlRes.data) {
          throw new Error(urlRes.error ?? 'Could not get image upload URL');
        }
        await echoApiService.uploadMedia(urlRes.data.upload_url, photoUri, 'image/jpeg');
        profileImageUrl = urlRes.data.media_url;   // public S3 URL stored on recipient
      }

      const response = isGuardian
        ? await echoApiService.addGuardian({ name, email })
        : await echoApiService.addRecipient({
            name,
            email,
            ...(profileImageUrl ? { profile_image_url: profileImageUrl } : {}),
          });

      if (response.success) {
        Alert.alert('Success', `${isGuardian ? 'Guardian' : 'Recipient'} added successfully`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', response.error || `Failed to add ${isGuardian ? 'guardian' : 'recipient'}`);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundWrapper style={styles.bg} scrollable>
      <SafeAreaView style={styles.safe}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <LogoHeader navigation={navigation} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>

              {/* ── Header row ──────────────────────────────────────────── */}
              <View style={styles.headerRow}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backBtn}
                  accessibilityRole="button"
                >
                  <BackIcon />
                </TouchableOpacity>
                {/* Heading M: Cormorant Regular 28/32, gold, glow */}
                <Text style={styles.screenTitle}>
                  {isGuardian ? 'ADD GUARDIAN' : 'ADD PROFILE'}
                </Text>
                <View style={styles.headerSpacer} />
              </View>

              {/* ── Subtitle ─────────────────────────────────────────────── */}
              {/* Body S Regular: Inter 16/24, #fdfdf9, center */}
              <Text style={styles.subtitle}>
                Personalize your echo with a photo of the intended recipient/guardian.
              </Text>

              {/* ── Photo circle ──────────────────────────────────────────── */}
              {/*
                Figma: 186×186 circle, gold border 0.5px, gold glow shadow.
                "Add Image +" when empty, shows photo when selected.
                Tap → opens device gallery (react-native-image-picker).
              */}
              <TouchableOpacity
                style={styles.photoCircle}
                activeOpacity={0.85}
                onPress={handlePickImage}
                accessibilityRole="button"
                accessibilityLabel="Add photo from gallery"
              >
                {photoUri ? (
                  <Image
                    source={{ uri: photoUri }}
                    style={styles.photoImg}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.addImageText}>Add Image +</Text>
                )}
              </TouchableOpacity>

              {/* ── Name ─────────────────────────────────────────────────── */}
              <TextInputField
                label="Name"
                placeholder={isGuardian ? 'Enter name of guardian' : 'Enter name of recipient/guardian'}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

              {/* ── Email ────────────────────────────────────────────────── */}
              <TextInputField
                label="Email Address"
                placeholder={isGuardian ? 'Enter guardian email address' : 'Enter recipient/guardian email address'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />

              {/* ── ADD button ───────────────────────────────────────────── */}
              {loading ? (
                <ActivityIndicator color={palette.gold.DEFAULT} style={{ marginTop: verticalScale(8) }} />
              ) : (
                <Button
                  variant="primary"
                  size="L"
                  title="ADD"
                  onPress={handleAdd}
                  active={!!(name.trim() && email.trim())}
                />
              )}

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default AddNewProfileScreen;

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create<{
  bg: ViewStyle;
  safe: ViewStyle;
  kav: ViewStyle;
  scrollContent: ViewStyle;
  content: ViewStyle;
  headerRow: ViewStyle;
  backBtn: ViewStyle;
  screenTitle: TextStyle;
  headerSpacer: ViewStyle;
  subtitle: TextStyle;
  photoCircle: ViewStyle;
  photoImg: ImageStyle;
  addImageText: TextStyle;
}>({
  bg:   { flex: 1 },
  safe: { flex: 1, backgroundColor: 'transparent' },
  kav:  { flex: 1, width: '100%' },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: verticalScale(spacing.xxxl),
  },
  content: {
    paddingHorizontal: scale(spacing.xl),        // 24px
    paddingTop:        verticalScale(spacing.l),
    gap:               verticalScale(spacing.xl), // 24px between sections
    alignItems:        'center',
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  headerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    width:          '100%',
  },
  backBtn: {
    width:          scale(44),
    height:         scale(44),
    justifyContent: 'center',
    alignItems:     'flex-start',
  },
  // Heading M: Cormorant Regular 28/32, #f2e1b0, glow
  screenTitle: {
    fontFamily:       fontFamily.heading,
    fontSize:         moderateScale(fontSize['2xl']),
    fontWeight:       fontWeight.regular,
    lineHeight:       moderateScale(32),
    color:            palette.gold.DEFAULT,
    textAlign:        'center',
    flex:             1,
    textShadowColor:  'rgba(240,212,168,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  headerSpacer: { width: scale(44) },

  // ── Subtitle ────────────────────────────────────────────────────────────────
  // Body S Regular: Inter 16/24, #fdfdf9, center
  subtitle: {
    fontFamily: fontFamily.body,
    fontWeight: fontWeight.regular,
    fontSize:   moderateScale(fontSize.s),
    lineHeight: moderateScale(24),
    color:      palette.gold.subtlest,
    textAlign:  'center',
    width:      '100%',
  },

  // ── Photo circle ────────────────────────────────────────────────────────────
  // Figma: 186×186, gold border 0.5px, glow shadow 0 0 25px rgba(229,214,176,0.3)
  photoCircle: {
    width:           CIRCLE,
    height:          CIRCLE,
    borderRadius:    CIRCLE / 2,
    borderWidth:     borderWidth.thin,              // 0.5px
    borderColor:     palette.gold.warm,             // gold warm
    backgroundColor: 'rgba(229,214,176,0.04)',
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
    // Glow
    boxShadow:       '0px 0px 25px 0px rgba(229,214,176,0.3)',
    shadowColor:     palette.gold.warm,
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   0.3,
    shadowRadius:    25,
    elevation:       8,
  },
  photoImg: {
    width:        '100%',
    height:       '100%',
    borderRadius: CIRCLE / 2,
  },
  // "Add Image +" — Heading XS: Cormorant Regular 20/24, gold
  addImageText: {
    fontFamily: fontFamily.heading,
    fontSize:   moderateScale(fontSize.l),          // 20px
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(24),
    color:      palette.gold.DEFAULT,
    textAlign:  'center',
    textShadowColor:  textShadow.warmGlow.color,
    textShadowOffset: textShadow.warmGlow.offset,
    textShadowRadius: textShadow.warmGlow.radius,
  },
});
