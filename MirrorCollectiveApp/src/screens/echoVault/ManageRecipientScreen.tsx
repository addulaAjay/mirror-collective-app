/**
 * Manage Recipients Screen
 * Figma: Design-Master-File → Manage Recipients (211:1528)
 *
 * Layout:
 *   LogoHeader
 *   ← MANAGE RECIPIENTS (back arrow + gold Cormorant 28, centered)
 *   "Choose who can access echoes you share." (Inter Light 16)
 *   Flat list — avatar (40×40 gold-border glow) + name/email | SHARED? + delete
 *   ADD RECIPIENT glass button (Cormorant 24, centered)
 *
 * Tokens:
 *   Heading M:   Cormorant Regular 28/32  → fontFamily.heading 28
 *   Heading XS:  Cormorant Regular 20/24  → fontFamily.heading 20
 *   Body XS Italic: Inter Italic 14/20   → fontFamily.bodyItalic 14
 *   Body S Light: Inter Light 16/24      → fontFamily.bodyLight 16
 *   Row separator: 0.25px #a3b3cc       → palette.navy.light
 *   Avatar glow:  0 0 10 3px rgba(240,212,168,0.3)
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  borderWidth,
  fontFamily,
  fontSize,
  fontWeight,
  moderateScale,
  palette,
  radius,
  scale,
  spacing,
  verticalScale,
} from '@theme';
import type { RootStackParamList } from '@types';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { getMotifIcon } from '@assets/motifs/MotifAssets';
import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import { echoApiService, type Recipient } from '@services/api/echo';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageRecipientScreen'>;

// ── Avatar ───────────────────────────────────────────────────────────────────
// Figma 4629:3814 — 40×40, border 1px #f2e1b0, glow 0 0 10 3px rgba(240,212,168,0.3)
// Image height 149.82%, top offset -6.74% (portrait crop, same as EchoAvatar)
const RecipientAvatar: React.FC<{ item: Recipient }> = ({ item }) => (
  <View style={styles.avatarGlow}>
    <View style={styles.avatarRing}>
      {item.profile_image_url ? (
        <Image
          source={{ uri: item.profile_image_url }}
          style={styles.avatarImg}
          resizeMode="cover"
        />
      ) : item.motif && getMotifIcon(item.motif) ? (
        <SvgXml xml={getMotifIcon(item.motif)?.xml || ''} width="60%" height="60%" />
      ) : (
        <View style={styles.avatarPlaceholder} />
      )}
    </View>
  </View>
);

// ── Screen ────────────────────────────────────────────────────────────────────
const ManageRecipientScreen: React.FC<Props> = ({ navigation }) => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await echoApiService.getRecipients();
      if (res.success && res.data) {
        setRecipients(res.data);
      } else {
        setError(res.error || 'Failed to load recipients');
      }
    } catch {
      setError('Failed to load recipients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipients();
    const unsub = navigation.addListener('focus', fetchRecipients);
    return unsub;
  }, [navigation, fetchRecipients]);

  const handleRemove = (id: string) => {
    Alert.alert('Remove Recipient', 'Are you sure you want to remove this recipient?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await echoApiService.removeRecipient(id);
            if (res.success) {
              setRecipients(prev => prev.filter(r => r.recipient_id !== id));
            } else {
              Alert.alert('Error', res.error || 'Failed to remove recipient');
            }
          } catch {
            Alert.alert('Error', 'Failed to remove recipient');
          }
        },
      },
    ]);
  };

  const renderRow = ({ item, index }: { item: Recipient; index: number }) => {
    const isLast = index === recipients.length - 1;
    return (
      <View style={[styles.row, !isLast && styles.rowBorder]}>
        {/* Left: avatar + name/email */}
        <View style={styles.rowLeft}>
          <RecipientAvatar item={item} />
          <View style={styles.rowText}>
            <Text style={styles.name} numberOfLines={1}>{item.name.toUpperCase()}</Text>
            <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
          </View>
        </View>

        {/* Right: delete (shared label omitted — not in recipients API) */}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleRemove(item.recipient_id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Image
            source={require('@assets/delete.png')}
            style={styles.deleteIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <BackgroundWrapper style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <LogoHeader navigation={navigation} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header row: ← MANAGE RECIPIENTS ─────────────────────────── */}
          {/* Figma 222:2110 — flex-row, items-center, justify-between */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.backBtn}
            >
              <Image
                source={require('@assets/back-arrow.png')}
                style={styles.backIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <Text style={styles.title}>MANAGE RECIPIENTS</Text>

            {/* Invisible spacer — mirrors back button width for centering */}
            <View style={styles.backBtn} />
          </View>

          {/* ── Subtitle ─────────────────────────────────────────────────── */}
          {/* Figma 222:2114 — Body S Light, Inter Light 16/24, white, center */}
          <Text style={styles.subtitle}>
            Choose who can access echoes you share.
          </Text>

          {/* ── List ─────────────────────────────────────────────────────── */}
          {/* Figma 222:2115 — flex-col, pl:16, overflow-y-auto */}
          {loading ? (
            <ActivityIndicator
              size="large"
              color={palette.gold.DEFAULT}
              style={styles.loader}
            />
          ) : error ? (
            <View style={styles.stateBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={fetchRecipients} style={styles.retryBtn}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : recipients.length === 0 ? (
            <View style={styles.stateBox}>
              <Text style={styles.emptyText}>No recipients added yet.</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {recipients.map((item, index) => renderRow({ item, index }))}
            </View>
          )}

          {/* ── ADD RECIPIENT button ──────────────────────────────────────── */}
          {/* Figma 222:2146 — glass gradient, border 0.5px #a3b3cc, radius 16,
               padding 12v/16h, Cormorant Regular 24/28 gold */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AddNewProfileScreen')}
            style={styles.addBtnWrapper}
          >
            <LinearGradient
              colors={['rgba(253,253,249,0.01)', 'rgba(253,253,249,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.addBtn}
            >
              <Text style={styles.addBtnText}>ADD RECIPIENT</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default ManageRecipientScreen;

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create<{
  bg: ViewStyle;
  safe: ViewStyle;
  scroll: ViewStyle;
  scrollContent: ViewStyle;
  headerRow: ViewStyle;
  backBtn: ViewStyle;
  backIcon: ImageStyle;
  title: TextStyle;
  subtitle: TextStyle;
  loader: ViewStyle;
  stateBox: ViewStyle;
  errorText: TextStyle;
  retryBtn: ViewStyle;
  retryText: TextStyle;
  emptyText: TextStyle;
  listContainer: ViewStyle;
  row: ViewStyle;
  rowBorder: ViewStyle;
  rowLeft: ViewStyle;
  avatarGlow: ViewStyle;
  avatarRing: ViewStyle;
  avatarImg: ImageStyle;
  avatarPlaceholder: ViewStyle;
  rowText: ViewStyle;
  name: TextStyle;
  email: TextStyle;
  deleteBtn: ViewStyle;
  deleteIcon: ImageStyle;
  addBtnWrapper: ViewStyle;
  addBtn: ViewStyle;
  addBtnText: TextStyle;
}>({
  bg:   { flex: 1 },
  safe: { flex: 1 },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: scale(spacing.xl),   // 24px — Figma left:24
    paddingTop:        verticalScale(24),
    paddingBottom:     verticalScale(48),
    gap:               verticalScale(spacing.xl),  // 24 between sections
  },

  // ── Header row ───────────────────────────────────────────────────────────
  // Figma 222:2110 — flex-row, items-center, justify-between
  headerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },

  backBtn: {
    width:  scale(19),
    height: scale(19),
    alignItems:     'center',
    justifyContent: 'center',
  },

  backIcon: {
    width:     scale(19),
    height:    scale(19),
    tintColor: palette.gold.DEFAULT,
  },

  // Heading M: Cormorant Regular 28/32, gold, glow text-shadow
  title: {
    fontFamily:       fontFamily.heading,
    fontSize:         moderateScale(fontSize['2xl']),  // 28
    fontWeight:       fontWeight.regular,
    lineHeight:       moderateScale(32),
    color:            palette.gold.DEFAULT,
    textAlign:        'center',
    flex:             1,
    textShadowColor:  'rgba(240,212,168,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },

  // Body S Light: Inter Light 16/24, white, center
  subtitle: {
    fontFamily: fontFamily.bodyLight,
    fontSize:   moderateScale(fontSize.s),
    fontWeight: '300',
    lineHeight: moderateScale(24),
    color:      palette.neutral.white,
    textAlign:  'center',
  },

  // ── State views ──────────────────────────────────────────────────────────
  loader: { marginTop: verticalScale(40) },

  stateBox: {
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(40),
    gap:             verticalScale(12),
  },

  errorText: {
    fontFamily: fontFamily.body,
    fontSize:   moderateScale(14),
    color:      palette.status.errorHover,
    textAlign:  'center',
  },

  retryBtn: {
    paddingHorizontal: scale(20),
    paddingVertical:   verticalScale(8),
    borderRadius:      radius.s,
    borderWidth:       1,
    borderColor:       palette.gold.DEFAULT,
  },

  retryText: {
    fontFamily: fontFamily.body,
    fontSize:   moderateScale(14),
    color:      palette.gold.DEFAULT,
  },

  emptyText: {
    fontFamily: fontFamily.bodyLight,
    fontSize:   moderateScale(16),
    color:      palette.navy.light,
    textAlign:  'center',
  },

  // ── List ─────────────────────────────────────────────────────────────────
  // Figma 222:2115 — flex-col, padding-left 16px
  listContainer: {
    paddingLeft: scale(spacing.m),   // 16px
  },

  // Figma row — flex-row, items-center, justify-between, py:20
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(spacing.l),  // 20px
  },

  // Border/Subtle 0.25px between rows (not on last)
  rowBorder: {
    borderBottomWidth: borderWidth.hairline,
    borderBottomColor: palette.navy.light,
  },

  // Figma 222:2127 — gap:12, items-center, maxWidth:230
  rowLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           scale(12),
    flex:          1,
    maxWidth:      scale(230),
  },

  // ── Avatar ───────────────────────────────────────────────────────────────
  // Figma 4629:3814 — 40×40, border 1px border/brand #f2e1b0, glow shadow
  avatarGlow: {
    width:        scale(40),
    height:       scale(40),
    borderRadius: scale(20),
    boxShadow:    '0px 0px 10px 3px rgba(240, 212, 168, 0.3)',
    shadowColor:  'rgba(240,212,168,0.3)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation:    4,
  },

  avatarRing: {
    width:           '100%',
    height:          '100%',
    borderRadius:    scale(20),
    borderWidth:     1,
    borderColor:     palette.gold.DEFAULT,        // #f2e1b0
    backgroundColor: 'rgba(197,158,95,0.05)',
    overflow:        'hidden',
    alignItems:      'center',
    justifyContent:  'center',
  },

  // Figma: image height 149.82%, top -6.74% (portrait crop)
  avatarImg: {
    position: 'absolute',
    width:    '100%',
    height:   '150%',
    top:      '-7%',
    left:     0,
  },

  avatarPlaceholder: {
    width:           scale(22),
    height:          scale(22),
    borderRadius:    scale(11),
    backgroundColor: palette.gold.DEFAULT,
    opacity:         0.4,
  },

  // ── Row text ─────────────────────────────────────────────────────────────
  rowText: {
    flex:    1,
    minWidth: 0,
  },

  // Heading XS: Cormorant Regular 20/24, white
  name: {
    fontFamily: fontFamily.heading,
    fontSize:   moderateScale(fontSize.l),   // 20
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(24),
    color:      palette.neutral.white,
  },

  // Body XS Italic: Inter Italic 14/20, white
  email: {
    fontFamily: fontFamily.bodyItalic,
    fontStyle:  'italic',
    fontSize:   moderateScale(fontSize.xs),  // 14
    fontWeight: '400',
    lineHeight: moderateScale(20),
    color:      palette.neutral.white,
    opacity:    0.85,
  },

  // ── Delete icon ──────────────────────────────────────────────────────────
  // Figma: 20×20 delete icon
  deleteBtn: {
    width:           scale(20),
    height:          scale(20),
    alignItems:      'center',
    justifyContent:  'center',
    marginLeft:      scale(12),
  },

  deleteIcon: {
    width:     scale(20),
    height:    scale(20),
    tintColor: palette.navy.light,
  },

  // ── ADD RECIPIENT button ──────────────────────────────────────────────────
  // Figma 222:2146 — glass gradient, border 0.5px #a3b3cc, radius 16,
  // px:16 py:12, Cormorant Regular 24/28 gold, glow text-shadow, centered
  addBtnWrapper: {
    alignSelf: 'center',
  },

  addBtn: {
    paddingVertical:   verticalScale(spacing.s),   // 12
    paddingHorizontal: scale(spacing.m),           // 16
    borderRadius:      radius.m,                   // 16
    borderWidth:       borderWidth.thin,           // 0.5
    borderColor:       palette.navy.light,         // #a3b3cc
    alignItems:        'center',
    justifyContent:    'center',
  },

  // Cormorant Regular 24/28, gold, glow text-shadow
  addBtnText: {
    fontFamily:       fontFamily.heading,
    fontSize:         moderateScale(fontSize.xl),  // 24
    fontWeight:       fontWeight.regular,
    lineHeight:       moderateScale(28),
    color:            palette.gold.DEFAULT,
    textAlign:        'center',
    textShadowColor:  'rgba(229,214,176,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 9,
  },
});
