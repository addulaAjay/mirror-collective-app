/**
 * Echo Vault Library Screen
 * Figma: Design-Master-File → Echo Vault Library (211:1449)
 *
 * Layout (top → bottom):
 *   LogoHeader
 *   Title "MY ECHO LIBRARY" — Heading M Cormorant 28/32
 *   Subtitle — Body S Light Inter 16/24
 *   Echo Inbox row — mail icon + Cormorant 28/32, border-bottom #a3b3cc
 *   Card — gradient bg, border 0.25px #a3b3cc, radius 16, padding 16
 *     ├ Tabs: RECIPIENT (active) | CATEGORY (inactive)
 *     └ List rows: avatar (40×40) + title + subtitle | recipient + lock
 *   Buttons — CREATE AN ECHO / MANAGE RECIPIENTS (271px, Button primary)
 *
 * Token audit (from Figma variable defs):
 *   Heading M: Cormorant Regular 28/32         → fontFamily.heading 28/32
 *   Heading XS Bold: Cormorant Medium 20/24    → fontFamily.heading + fontWeight '500' 20/24
 *   Heading XS: Cormorant Regular 20/24        → fontFamily.heading 20/24
 *   Body S Light: Inter Light 16/24            → fontFamily.bodyLight 16/24
 *   Text/Paragraph-1 #f2e1b0                  → palette.gold.DEFAULT
 *   Text/Paragraph-2 #fdfdf9                  → palette.gold.subtlest
 *   Text/Inverse-Paragraph-2 #a3b3cc          → palette.navy.light
 *   Border/Subtle #a3b3cc                      → palette.navy.light
 *   Glow Drop Shadow: 0 0 10 spread:3 #F0D4A84D
 *   Radius/M: 16, Spacing/M: 16, Spacing/S: 12, Spacing/XL: 24
 */

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import Svg, { Path } from 'react-native-svg';
import { SvgXml } from 'react-native-svg';

import { getMotifIcon } from '@assets/motifs/MotifAssets';
import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button/Button';
import LogoHeader from '@components/LogoHeader';
import { echoApiService, type EchoResponse } from '@services/api/echo';

type EchoLibraryNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MirrorEchoVaultLibrary'
>;

// ── Lock icon — Figma node 1143:1360 (Vector) ───────────────────────────────
const LockIcon: React.FC = () => (
  <Svg width={scale(22)} height={scale(22)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
      fill={palette.navy.light}
    />
  </Svg>
);

// ── Avatar ───────────────────────────────────────────────────────────────────
// Figma: 40×40, border 1px #f2e1b0, glow 0 0 10 3px rgba(240,212,168,0.3)
// Avatar image: 149.82% height, offset -6.74% top (crops to face)
interface AvatarProps {
  motif?: string;
  profileImage?: string;
}
const EchoAvatar: React.FC<AvatarProps> = ({ motif, profileImage }) => (
  <View style={styles.avatarGlow}>
    <View style={styles.avatarRing}>
      {profileImage ? (
        <Image
          source={{ uri: profileImage }}
          style={styles.avatarImg}
          resizeMode="cover"
        />
      ) : motif && getMotifIcon(motif) ? (
        <SvgXml xml={getMotifIcon(motif)?.xml || ''} width="60%" height="60%" />
      ) : (
        <Image source={require('@assets/Group.png')} style={styles.avatarFallback} />
      )}
    </View>
  </View>
);

// ── Screen ───────────────────────────────────────────────────────────────────

export function EchoLibraryContent() {
  const navigation = useNavigation<EchoLibraryNavigationProp>();
  const [echoes, setEchoes] = useState<EchoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'RECIPIENT' | 'CATEGORY'>('RECIPIENT');

  const fetchEchoes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await echoApiService.getEchoes();
      if (response.success && response.data) {
        setEchoes(response.data);
      } else {
        setError(response.error || 'Failed to load echoes');
      }
    } catch (err: any) {
      setError(`Failed to load echoes: ${err.message || ''}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEchoes(); }, [fetchEchoes]);

  const handleOpenItem = (item: EchoResponse) => {
    if (item.echo_type === 'AUDIO') {
      navigation.navigate('EchoAudioPlaybackScreen', { echoId: item.echo_id, title: item.title });
    } else if (item.echo_type === 'VIDEO') {
      navigation.navigate('EchoVideoPlaybackScreen', { echoId: item.echo_id, title: item.title });
    } else {
      navigation.navigate('EchoDetailScreen', { echoId: item.echo_id, title: item.title });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <BackgroundWrapper style={styles.bg} scrollable>
      <SafeAreaView style={styles.safe}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <LogoHeader navigation={navigation} />

        {/*
          Figma 211:1450 — outer column:
          flex-col gap:40, h:762, left:24, top:48, w:345
          gap between sections is 12 (1457) and 16 (title group 1441)
        */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Title + Subtitle ─────────────────────────────────────── */}
          {/*
            Figma 211:1223/1224 — items-center, gap:16
            Title wrapper (243:1341): justify-center so title is centered.
            Subtitle (211:1225): text-center Inter Regular 16/24.
          */}
          <View style={styles.titleGroup}>
            <Text style={styles.title}>MY ECHO LIBRARY</Text>
            <Text style={styles.subtitle}>
              Preserve memories that matter most
            </Text>
          </View>

          {/* ── Echo Inbox link ───────────────────────────────────────── */}
          {/* Figma 1441:1943 — border-bottom 0.5px #a3b3cc, gap:16 */}
          <TouchableOpacity
            style={styles.inboxRow}
            onPress={() => navigation.navigate('EchoInboxScreen')}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Image
              source={require('@assets/mail.png')}
              style={styles.mailIcon}
              resizeMode="contain"
            />
            {/* Heading M: Cormorant Regular 28/32, #f2e1b0 */}
            <Text style={styles.inboxText}>Echo Inbox</Text>
          </TouchableOpacity>

          {/* ── Content area — empty OR filled ───────────────────────── */}
          {loading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator size="large" color={palette.gold.DEFAULT} />
            </View>
          ) : error ? (
            <View style={styles.stateBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={fetchEchoes} style={styles.retryBtn}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : echoes.length === 0 ? (
            /*
              Empty state — Figma 211:1233: ONE single card, no outer wrapper.
              border 0.5px #60739f (border-inverse-1), radius 16,
              padding 20v/16h, gap 32, items-center, text-center.
            */
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardTitle}>NO ECHOES YET.</Text>
              <Text style={styles.emptyCardBody}>
                Begin by creating something meaningful — for yourself or someone you love.
              </Text>
            </View>
          ) : (
            /*
              Filled state — Figma 211:1468: outer card with gradient bg,
              border 0.25px #a3b3cc, tabs, then list rows.
            */
            <View style={[styles.cardGlow, styles.cardGlowFlex]}>
              <LinearGradient
                colors={['rgba(253,253,249,0.01)', 'rgba(253,253,249,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View style={styles.tabs}>
                {(['RECIPIENT', 'CATEGORY'] as const).map(tab => (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    activeOpacity={0.7}
                    style={[styles.tab, activeTab === tab && styles.tabActive]}
                  >
                    <Text style={[
                      styles.tabText,
                      activeTab === tab ? styles.tabTextActive : styles.tabTextInactive,
                    ]}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {echoes.map((item, index) => {
                const isLast = index === echoes.length - 1;
                const isLocked = !!item.scheduled_at;
                const rightLabel = activeTab === 'RECIPIENT'
                  ? (item.recipient?.name?.toUpperCase() || 'UNASSIGNED')
                  : (item.category?.toUpperCase() || 'UNCATEGORIZED');
                return (
                  <TouchableOpacity
                    key={item.echo_id}
                    activeOpacity={0.9}
                    onPress={() => handleOpenItem(item)}
                    style={[styles.row, !isLast && styles.rowBorder]}
                  >
                    <View style={styles.rowLeft}>
                      <EchoAvatar motif={item.recipient?.motif} profileImage={undefined} />
                      <View style={styles.rowText}>
                        <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.rowSub} numberOfLines={1}>
                          {isLocked
                            ? `Unlocks ${formatDate(item.scheduled_at!)}`
                            : `Saved ${formatDate(item.created_at)}`}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.rowRight}>
                      <Text style={styles.rowLabel}>{rightLabel}</Text>
                      {isLocked && <LockIcon />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ── Buttons ───────────────────────────────────────────────── */}
          {/*
            Empty state (211:1236): single "CREATE ECHO" button
            Filled state (791:3866): "CREATE AN ECHO" + "MANAGE RECIPIENTS"
          */}
          <View style={styles.btnGroup}>
            <Button
              variant="primary"
              size="L"
              title={echoes.length === 0 ? 'CREATE ECHO' : 'CREATE AN ECHO'}
              onPress={() => navigation.navigate('NewEchoScreen')}
              style={styles.btn}
            />
            {echoes.length > 0 && (
              <Button
                variant="primary"
                size="L"
                title="MANAGE RECIPIENTS"
                onPress={() => navigation.navigate('ManageRecipientScreen')}
                style={styles.btn}
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
}

export default function MirrorEchoVaultLibraryScreen() {
  return <EchoLibraryContent />;
}

// ── Styles ────────────────────────────────────────────────────────────────────


const styles = StyleSheet.create<{
  bg: ViewStyle;
  safe: ViewStyle;
  scroll: ViewStyle;
  scrollContent: ViewStyle;
  titleGroup: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  inboxRow: ViewStyle;
  mailIcon: ImageStyle;
  inboxText: TextStyle;
  cardGlow: ViewStyle;
  cardGlowFlex: ViewStyle;
  tabs: ViewStyle;
  tab: ViewStyle;
  tabActive: ViewStyle;
  tabText: TextStyle;
  tabTextActive: TextStyle;
  tabTextInactive: TextStyle;
  row: ViewStyle;
  rowBorder: ViewStyle;
  rowLeft: ViewStyle;
  avatarGlow: ViewStyle;
  avatarRing: ViewStyle;
  avatarImg: ImageStyle;
  avatarFallback: ImageStyle;
  rowText: ViewStyle;
  rowTitle: TextStyle;
  rowSub: TextStyle;
  rowRight: ViewStyle;
  rowLabel: TextStyle;
  btnGroup: ViewStyle;
  btn: ViewStyle;
  emptyCard: ViewStyle;
  emptyCardTitle: TextStyle;
  emptyCardBody: TextStyle;
  stateBox: ViewStyle;
  errorText: TextStyle;
  retryBtn: ViewStyle;
  retryText: TextStyle;
  emptyText: TextStyle;
  emptySubtext: TextStyle;
}>({
  bg:   { flex: 1, backgroundColor: palette.navy.deep },
  safe: { flex: 1, backgroundColor: palette.neutral.transparent },

  scroll: { flex: 1 },
  // Figma 211:1221 outer column: gap-[30px] between LogoHeader and inner content
  // Figma 211:1222 inner column: gap-[24px] between titleGroup / inboxRow / card / button
  scrollContent: {
    paddingHorizontal: scale(spacing.xl),        // 24px — Figma left:24
    paddingTop:        verticalScale(30),         // 30px — Figma outer gap-[30px]
    paddingBottom:     verticalScale(spacing.xxxl),
    gap:               verticalScale(spacing.xl), // 24px — Figma inner gap-[24px]
    flexGrow:          1,
  },

  // ── Title + Subtitle ───────────────────────────────────────────────────────
  // Figma 211:1223 — flex-col gap:16, items-center
  titleGroup: {
    gap:        verticalScale(spacing.m),        // 16px
    alignItems: 'center',                        // FIX: was 'flex-start'
  },

  // Heading M: Cormorant Regular 28/32, #f2e1b0, glow shadow, center-aligned
  title: {
    fontFamily:       fontFamily.heading,
    fontSize:         moderateScale(fontSize['2xl']),  // 28px
    fontWeight:       fontWeight.regular,
    lineHeight:       moderateScale(32),
    color:            palette.gold.DEFAULT,
    textAlign:        'center',                  // FIX: was missing
    textShadowColor:  'rgba(240,212,168,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    width:            '100%',
  },

  // Body S Regular: Inter Regular 16/24, white, center-aligned
  // Figma 211:1225: font-weight/regular (not Light)
  subtitle: {
    fontFamily: fontFamily.body,                 // FIX: was bodyLight
    fontSize:   moderateScale(fontSize.s),       // 16px
    fontWeight: fontWeight.regular,              // FIX: was '300'
    lineHeight: moderateScale(24),
    color:      palette.neutral.white,
    textAlign:  'center',                        // FIX: was missing
    width:      '100%',
  },

  // ── Echo Inbox row ─────────────────────────────────────────────────────────
  // Figma 1441:1943 — border-bottom 0.5px Border/Subtle, gap:16, items-center
  inboxRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            scale(spacing.m),                   // 16px
    paddingVertical: verticalScale(spacing.xxs),        // 4px (Spacing/XXS)
    borderBottomWidth: borderWidth.thin,                // 0.5px
    borderBottomColor: palette.navy.light,              // Border/Subtle #a3b3cc
    alignSelf:      'center',
  },

  mailIcon: {
    width:     scale(24),
    height:    scale(24),
    tintColor: palette.gold.DEFAULT,
  },

  // Heading M: Cormorant Regular 28/32, #f2e1b0
  inboxText: {
    fontFamily: fontFamily.heading,
    fontSize:   moderateScale(fontSize['2xl']),         // 28px
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(32),
    color:      palette.gold.DEFAULT,
  },

  // ── Library card ──────────────────────────────────────────────────────────
  // Figma 211:1468 — gradient bg, border 0.25px #a3b3cc, radius 16, padding 16
  // overflow:hidden clips the LinearGradient; glow is on this same view
  // (shadow doesn't clip because we're not hiding shadow separately)
  // Base card — no flex; wraps content in empty state
  cardGlow: {
    width:        '100%',
    borderRadius: radius.m,
    borderWidth:  borderWidth.hairline,
    borderColor:  palette.navy.light,
    padding:      scale(spacing.m),
    overflow:     'hidden',
  },
  // Applied on top of cardGlow when echoes exist — lets the list fill space
  cardGlowFlex: {
    flex:      1,
    minHeight: scale(200),
  },

  // ── Tabs ────────────────────────────────────────────────────────────────────
  // Figma 1065:1750 — gap:32, items-center, justify-center
  tabs: {
    flexDirection:  'row',
    justifyContent: 'center',
    alignItems:     'center',
    gap:            scale(32),
    marginBottom:   verticalScale(spacing.s),           // visual separation from rows
  },

  tab: {
    paddingVertical: 2,
  },

  // Active tab: bottom border Border/Subtle
  tabActive: {
    borderBottomWidth: 1,
    borderBottomColor: palette.navy.light,              // #a3b3cc per Figma 1065:1751
  },

  // Heading XS Bold: Cormorant Medium 20/24
  tabText: {
    fontFamily: fontFamily.heading,
    fontSize:   moderateScale(fontSize.l),              // 20px (font/size/L)
    fontWeight: '500',                                  // Figma: font-medium
    lineHeight: moderateScale(24),                      // font/size/XL
    textAlign:  'center',
  },

  tabTextActive: {
    color: palette.gold.subtlest,                       // #fdfdf9 (Text/Paragraph-2)
  },

  tabTextInactive: {
    color: palette.navy.light,                          // #a3b3cc (Text/Inverse-Paragraph-2)
  },

  // ── List rows ───────────────────────────────────────────────────────────────
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(spacing.m),          // 16px (Spacing/M)
  },

  // Figma: border-bottom 0.25px Border/Subtle between rows (not on last)
  rowBorder: {
    borderBottomWidth: borderWidth.hairline,             // 0.25px
    borderBottomColor: palette.navy.light,               // #a3b3cc
  },

  rowLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           scale(12),
    flex:          1,
    maxWidth:      scale(200),
  },

  // ── Avatar ─────────────────────────────────────────────────────────────────
  // Figma 4190:3633 — 40×40, border 1px #f2e1b0, glow 0 0 10 3px rgba(240,212,168,0.3)
  avatarGlow: {
    width:         scale(40),
    height:        scale(40),
    borderRadius:  scale(20),
    // Figma glow: 0 0 10px 3px rgba(240,212,168,0.3)
    boxShadow:     '0px 0px 10px 3px rgba(240, 212, 168, 0.3)',
    shadowColor:   palette.gold.glow,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius:  10,
    elevation:     6,
  },

  avatarRing: {
    width:           '100%',
    height:          '100%',
    borderRadius:    scale(20),
    borderWidth:     1,                                  // Figma: 1px border/brand
    borderColor:     palette.gold.DEFAULT,               // #f2e1b0
    backgroundColor: 'rgba(197,158,95,0.05)',
    overflow:        'hidden',
    alignItems:      'center',
    justifyContent:  'center',
  },

  // Avatar image: 149.82% height, offset top -6.74%
  avatarImg: {
    position: 'absolute',
    width:    '100%',
    height:   '150%',
    top:      '-7%',
    left:     0,
  },

  avatarFallback: {
    width:  scale(20),
    height: scale(20),
  },

  rowText: {
    flex: 1,
  },

  // Heading XS: Cormorant Regular 20/24, white
  rowTitle: {
    fontFamily: fontFamily.heading,
    fontSize:   moderateScale(fontSize.l),               // 20px
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(24),
    color:      palette.neutral.white,
  },

  // Body XS Light Italic: Inter Light Italic 14/1.5, white
  rowSub: {
    fontFamily: fontFamily.bodyItalic,
    fontStyle:  'italic',
    fontSize:   moderateScale(fontSize.xs),              // 14px
    fontWeight: '300',
    lineHeight: moderateScale(fontSize.xs * 1.5),
    color:      palette.neutral.white,
    opacity:    0.85,
  },

  rowRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           scale(8),
  },

  // Inter Light 16/24, Text/Paragraph-1 #f2e1b0
  rowLabel: {
    fontFamily: fontFamily.bodyLight,
    fontSize:   moderateScale(fontSize.s),               // 16px
    fontWeight: '300',
    lineHeight: moderateScale(24),
    color:      palette.gold.DEFAULT,
    textAlign:  'center',
  },

  // ── Buttons ─────────────────────────────────────────────────────────────────
  // Figma 791:3866 — flex-col gap:12, width 271px
  btnGroup: {
    alignItems: 'center',
    gap:        verticalScale(spacing.s),                // 12px
  },

  btn: {
    width: scale(271),
  },

  // ── State views ─────────────────────────────────────────────────────────────
  // Figma 211:1233 — empty state card inside the list area
  // border 0.5px #60739f (border-inverse-1 = navy.medium), gradient, radius 16
  // padding 20v/16h (Spacing/L and Spacing/M), gap 32, items-center, text-center
  emptyCard: {
    width:           '100%',
    borderRadius:    radius.m,
    borderWidth:     borderWidth.thin,
    borderColor:     palette.navy.medium,                  // #60739f
    paddingVertical: verticalScale(20),
    paddingHorizontal: scale(spacing.m),
    gap:             verticalScale(32),
    alignItems:      'center',
  },

  // Cormorant Regular 28px, #e5d6b0 (gold.warm), lineHeight 1.3
  emptyCardTitle: {
    fontFamily: fontFamily.heading,
    fontSize:   moderateScale(28),
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(28 * 1.3),
    color:      palette.gold.warm,
    textAlign:  'center',
    width:      '100%',
    textTransform: 'uppercase',
  },

  // Inter Light 18px, #fdfdf9, lineHeight 1.5
  emptyCardBody: {
    fontFamily: fontFamily.bodyLight,
    fontSize:   moderateScale(18),
    fontWeight: '300',
    lineHeight: moderateScale(18 * 1.5),
    color:      palette.gold.subtlest,
    textAlign:  'center',
    width:      '100%',
  },

  stateBox: {
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(40),
  },
  errorText: {
    color:       palette.status.errorHover,
    fontSize:    moderateScale(14),
    textAlign:   'center',
    marginBottom: 12,
  },
  retryBtn: {
    paddingHorizontal: scale(20),
    paddingVertical:   verticalScale(8),
    borderRadius:      radius.s,
    borderWidth:       1,
    borderColor:       palette.gold.DEFAULT,
  },
  retryText: {
    color:    palette.gold.DEFAULT,
    fontSize: moderateScale(14),
  },
  emptyText: {
    color:       palette.gold.subtlest,
    fontSize:    moderateScale(16),
    textAlign:   'center',
    marginBottom: verticalScale(8),
  },
  emptySubtext: {
    color:     palette.gold.subtlest,
    fontSize:  moderateScale(14),
    textAlign: 'center',
    opacity:   0.7,
  },
});
