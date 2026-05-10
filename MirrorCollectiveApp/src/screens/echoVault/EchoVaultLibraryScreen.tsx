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

/**
 * UI-facing echo state — derived from the backend (`status`, `release_date`)
 * triple, *not* from date heuristics. Mapping:
 *
 *   sent             → backend `RELEASED`. Delivered to recipient.
 *                      Renders the "Echo Sent" pill below the row.
 *   scheduled        → backend `DRAFT` with a `release_date` set. Waiting
 *                      for the future-release scheduler (see PR 3 plan).
 *                      Renders the lock icon and "Unlocks <date>" subtitle.
 *   guardian-locked  → backend `LOCKED`. Awaiting guardian release trigger.
 *                      Renders the lock icon and "Locked <date>" subtitle.
 *   saved            → backend `DRAFT` with no release_date. The default
 *                      no-state — no pill, no lock. Reachable when the
 *                      creator skipped recipient/schedule on creation.
 */
type EchoUiState = 'sent' | 'scheduled' | 'guardian-locked' | 'saved';

const deriveUiState = (item: EchoResponse): EchoUiState => {
  if (item.status === 'RELEASED') return 'sent';
  if (item.status === 'LOCKED') return 'guardian-locked';
  if (item.status === 'DRAFT' && item.release_date) return 'scheduled';
  return 'saved';
};

type EchoLibraryNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MirrorEchoVaultLibrary'
>;

// ── Back arrow — matches ForgotPassword/ResetPassword (Figma 4928:7988) ────
const BackArrowIcon: React.FC = () => (
  <Svg width={scale(20)} height={scale(20)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
      fill={palette.gold.DEFAULT}
    />
  </Svg>
);

// ── Lock icon — Figma node 1143:1360 (Vector) ───────────────────────────────
const LockIcon: React.FC = () => (
  <Svg width={scale(22)} height={scale(22)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
      fill={palette.navy.light}
    />
  </Svg>
);

// ── Echo Sent check icon — circle + check, used inside the "Echo Sent" pill
const EchoSentCheckIcon: React.FC = () => (
  <Svg width={scale(16)} height={scale(16)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.06 17.06l-4.95-4.95 1.414-1.414L10.94 14.23l6.717-6.717 1.414 1.414L10.94 17.06z"
      fill={palette.navy.medium}
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
    <BackgroundWrapper style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <LogoHeader navigation={navigation} />

        {/* Fixed outer column — does NOT scroll */}
        <View style={styles.outerColumn}>

          {/* ── Header (back + title) + Subtitle — fixed ─────────────── */}
          <View style={styles.titleGroup}>
            {/* Header row mirrors ForgotPassword/ResetPassword: back-arrow on
                the left, centered title via flex:1, invisible spacer on the
                right so the title stays optically centered. */}
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backBtn}
                accessibilityRole="button"
                accessibilityLabel="Back"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                testID="header-back-button"
              >
                <BackArrowIcon />
              </TouchableOpacity>
              <Text style={styles.title}>ECHO LIBRARY</Text>
              <View style={styles.headerSpacer} />
            </View>
            <Text style={styles.subtitle}>
              Preserve memories that matter most
            </Text>
          </View>

          {/* ── Echo Inbox link — temporarily hidden ───────────────────
              Feature is on hold pending design/product discussion. Keep
              the JSX intact (with styles below) so we can restore by
              flipping the flag below to `true`. */}
          {false && (
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
              <Text style={styles.inboxText}>Echo Inbox</Text>
            </TouchableOpacity>
          )}

          {/* ── Content area — only THIS scrolls ─────────────────────── */}
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
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardTitle}>NO ECHOES YET.</Text>
              <Text style={styles.emptyCardBody}>
                Begin by creating something meaningful — for yourself or someone you love.
              </Text>
            </View>
          ) : (
            <View style={[styles.cardGlow, styles.cardGlowFlex]}>
              <LinearGradient
                colors={['rgba(253,253,249,0.01)', 'rgba(253,253,249,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              {/* Tabs — fixed inside card */}
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
              {/* Echo rows — scrollable */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.listScroll}
                contentContainerStyle={styles.listScrollContent}
              >
                {echoes.map((item, index) => {
                  const isLast = index === echoes.length - 1;
                  const uiState = deriveUiState(item);
                  const showLock = uiState === 'scheduled' || uiState === 'guardian-locked';
                  const showSentPill = uiState === 'sent';
                  const subtitle =
                    uiState === 'scheduled'
                      ? `Unlocks ${formatDate(item.release_date!)}`
                      : uiState === 'guardian-locked' && item.lock_date
                        ? `Locked ${formatDate(item.lock_date)}`
                        : `Saved ${formatDate(item.created_at)}`;
                  const rightLabel = activeTab === 'RECIPIENT'
                    ? (item.recipient?.name?.toUpperCase() || 'UNASSIGNED')
                    : (item.category?.toUpperCase() || 'UNCATEGORIZED');
                  return (
                    <View
                      key={item.echo_id}
                      style={[styles.rowGroup, !isLast && styles.rowBorder]}
                    >
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => handleOpenItem(item)}
                        style={styles.row}
                      >
                        <View style={styles.rowLeft}>
                          <EchoAvatar motif={item.recipient?.motif} profileImage={item.recipient?.profile_image_url} />
                          <View style={styles.rowText}>
                            <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
                            <Text style={styles.rowSub} numberOfLines={1}>{subtitle}</Text>
                          </View>
                        </View>
                        <View style={styles.rowRight}>
                          <Text style={styles.rowLabel} numberOfLines={1}>{rightLabel}</Text>
                          {showLock && <LockIcon />}
                        </View>
                      </TouchableOpacity>
                      {/* Echo Sent pill — renders only on RELEASED status
                          (the authoritative signal from the backend, set
                          when the recipient notification has been sent). */}
                      {showSentPill && (
                        <View style={styles.echoSentPillWrap}>
                          <View style={styles.echoSentPill}>
                            <EchoSentCheckIcon />
                            <Text style={styles.echoSentText}>Echo Sent</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* ── Buttons — fixed at bottom ─────────────────────────────── */}
          <View style={styles.btnGroup}>
            <Button
              variant="primary"
              size="L"
              title='CREATE AN ECHO'
              onPress={() => navigation.navigate('NewEchoScreen')}
              style={styles.btn}
            />
            {echoes.length > 0 && (
              <Button
                variant="secondary"
                size="L"
                title="MANAGE RECIPIENTS"
                onPress={() => navigation.navigate('ManageRecipientScreen')}
                style={styles.btn}
              />
            )}
          </View>

        </View>
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
  outerColumn: ViewStyle;
  listScroll: ViewStyle;
  listScrollContent: ViewStyle;
  titleGroup: ViewStyle;
  headerRow: ViewStyle;
  backBtn: ViewStyle;
  headerSpacer: ViewStyle;
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
  rowGroup: ViewStyle;
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
  echoSentPillWrap: ViewStyle;
  echoSentPill: ViewStyle;
  echoSentText: TextStyle;
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

  // Fixed outer column — page does not scroll; only the echo list inside scrolls
  outerColumn: {
    flex:              1,
    paddingHorizontal: scale(spacing.xl),        // 24px
    paddingTop:        verticalScale(30),
    paddingBottom:     verticalScale(spacing.xl),
    gap:               verticalScale(spacing.xl), // 24px between sections
  },
  // Inner ScrollView — only the echo rows scroll
  listScroll: { flex: 1 },
  listScrollContent: { flexGrow: 1 },

  // ── Title + Subtitle ───────────────────────────────────────────────────────
  // Figma 211:1223 — flex-col gap:16, items-center
  titleGroup: {
    gap:        verticalScale(spacing.m),        // 16px
    alignItems: 'center',
  },

  // Header row — back arrow on the left, centered title via flex, invisible
  // spacer on the right (matches ForgotPassword/ResetPassword header pattern).
  headerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    width:          '100%',
  },
  backBtn: {
    paddingVertical: verticalScale(8),
  },
  headerSpacer: {
    width: scale(20),
  },

  // Heading M: Cormorant Regular 28/32, #f2e1b0, glow shadow, center-aligned.
  // flex:1 inside the header row so the title fills available width and stays
  // optically centered between the back button and the spacer.
  title: {
    flex:             1,
    fontFamily:       fontFamily.heading,
    fontSize:         moderateScale(fontSize['2xl']),  // 28px
    fontWeight:       fontWeight.regular,
    lineHeight:       moderateScale(32),
    color:            palette.gold.DEFAULT,
    textAlign:        'center',
    textShadowColor:  'rgba(240,212,168,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
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
  // rowGroup wraps the touchable row + optional Echo Sent pill so the bottom
  // border lives on the group (always full-width) rather than the row.
  rowGroup: {
    width: '100%',
  },
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(spacing.m),          // 16px (Spacing/M)
    gap:             scale(spacing.s),                  // 12px between rowLeft and rowRight
  },

  // Figma: border-bottom 0.25px Border/Subtle between rows (not on last)
  rowBorder: {
    borderBottomWidth: borderWidth.hairline,             // 0.25px
    borderBottomColor: palette.navy.light,               // #a3b3cc
  },

  // rowLeft fills available width and shrinks to make room for rowRight.
  // No hardcoded maxWidth — let flex do the work so it scales to any screen.
  rowLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           scale(12),
    flex:          1,
    minWidth:      0,                                    // allow text inside to truncate
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
    flexShrink:    0,                                    // never collapse — recipient + lock must stay readable
    maxWidth:      '40%',                                // cap so a very long recipient name doesn't starve rowLeft
  },

  // Inter Light 16/24, Text/Paragraph-1 #f2e1b0
  rowLabel: {
    fontFamily: fontFamily.bodyLight,
    fontSize:   moderateScale(fontSize.s),               // 16px
    fontWeight: '300',
    lineHeight: moderateScale(24),
    color:      palette.gold.DEFAULT,
    textAlign:  'right',
    flexShrink: 1,                                       // truncate before pushing out the lock icon
  },

  // ── Echo Sent pill ──────────────────────────────────────────────────────────
  // Figma 211:1449 — pill rendered below delivered (non-scheduled) echoes.
  // Centered horizontally inside the rowGroup with extra bottom padding so the
  // border between rows sits cleanly underneath it.
  echoSentPillWrap: {
    alignItems:    'center',
    paddingBottom: verticalScale(spacing.s),             // 12px gap before next row border
  },
  echoSentPill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               scale(spacing.xs),                // 8px
    paddingHorizontal: scale(spacing.m),                 // 16px
    paddingVertical:   verticalScale(spacing.xxs),       // 4px
    borderRadius:      999,                              // full-radius pill
    borderWidth:       borderWidth.hairline,
    borderColor:       palette.navy.medium,              // #60739f — Border/Inverse-1
    backgroundColor:   'rgba(96, 115, 159, 0.18)',       // translucent navy.medium
  },
  echoSentText: {
    fontFamily: fontFamily.heading,
    fontSize:   moderateScale(fontSize.s),               // 16px (font/size/S)
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(20),
    color:      palette.gold.subtlest,                   // #fdfdf9
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
    fontFamily:  fontFamily.bodyLight,
    fontSize:    moderateScale(18),
    fontWeight:  '300',
    lineHeight:  moderateScale(18 * 1.5),
    color:       palette.gold.subtlest,
    textAlign:   'center',
    width:       '100%',
    alignSelf:   'stretch',   // override parent alignItems:'center' so text fills full width
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
