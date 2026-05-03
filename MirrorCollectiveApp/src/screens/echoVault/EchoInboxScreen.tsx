/**
 * Echo Inbox Screen
 * Figma: Design-Master-File → Echo inbox (1436:1830)
 *
 * Shows echoes that have been entrusted TO the current user (received echoes).
 * Tabs: SENDER (who sent the echo) | CATEGORY (echo category)
 * Layout mirrors EchoVaultLibraryScreen but with:
 *   - Back arrow header instead of LogoHeader
 *   - No avatar circles in rows (Figma shows no avatars)
 *   - SENDER tab shows sender name on right (per user: "sender view similar to recipient view")
 *   - getInboxEchoes() API call
 *
 * Tokens (from Figma 1436:1830 variable defs):
 *   Heading M: Cormorant Regular 28/32 — "ECHO INBOX" title
 *   Body S Regular: Inter Regular 16/24 — subtitle
 *   Heading XS: Cormorant Regular 20/24 — row titles
 *   Body S Light: Inter Light 16/24 — right labels
 *   Body S Light Italic: Inter Light Italic 14/1.5 — date subtitles
 *   Border/Inverse-1 #60739f — card border (navy.medium)
 *   Border/Subtle #a3b3cc — row dividers, active tab underline
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
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button/Button';
import LogoHeader from '@components/LogoHeader';
import { echoApiService, type EchoResponse } from '@services/api/echo';

type EchoInboxNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'EchoInboxScreen'
>;

// ── Lock icon ─────────────────────────────────────────────────────────────────
const LockIcon: React.FC = () => (
  <Svg width={scale(22)} height={scale(22)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
      fill={palette.navy.light}
    />
  </Svg>
);

// ── Back arrow icon ───────────────────────────────────────────────────────────
const BackIcon: React.FC = () => (
  <Svg width={scale(20)} height={scale(20)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
      fill={palette.gold.DEFAULT}
    />
  </Svg>
);

// ── Screen ────────────────────────────────────────────────────────────────────
export function EchoInboxContent() {
  const navigation = useNavigation<EchoInboxNavigationProp>();
  const [echoes, setEchoes] = useState<EchoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'SENDER' | 'CATEGORY'>('SENDER');

  const fetchInboxEchoes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await echoApiService.getInboxEchoes();
      if (response.success && response.data) {
        setEchoes(response.data);
      } else {
        setError(response.error || 'Failed to load inbox');
      }
    } catch (err: any) {
      setError(`Failed to load inbox: ${err.message || ''}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInboxEchoes(); }, [fetchInboxEchoes]);

  const handleOpenItem = (item: EchoResponse) => {
    if (item.echo_type === 'AUDIO') {
      navigation.navigate('EchoAudioPlaybackScreen', { echoId: item.echo_id, title: item.title });
    } else if (item.echo_type === 'VIDEO') {
      navigation.navigate('EchoVideoPlaybackScreen', { echoId: item.echo_id, title: item.title });
    } else {
      navigation.navigate('EchoDetailScreen', { echoId: item.echo_id, title: item.title });
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  const getRightLabel = (item: EchoResponse) => {
    if (activeTab === 'SENDER') {
      return item.sender?.name?.toUpperCase() ?? 'UNKNOWN';
    }
    return item.category?.toUpperCase() ?? 'UNCATEGORIZED';
  };

  return (
    <BackgroundWrapper style={styles.bg} scrollable>
      <SafeAreaView style={styles.safe}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

        {/* Figma: LogoHeader (hamburger / MC logo / home) at top of outer column */}
        <LogoHeader navigation={navigation} />

        {/* Figma 1436:1831 — content column: gap:24 */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header section ───────────────────────────────────────────── */}
          {/* Figma 1439:1929 — flex-col gap:16 */}
          <View style={styles.headerSection}>
            {/*
              Figma 1439:1930 — justify-between, items-center
              Back arrow (left) | ECHO INBOX (center) | spacer (right)
            */}
            <View style={styles.titleRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backBtn}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <BackIcon />
              </TouchableOpacity>

              {/* Heading M: Cormorant Regular 28/32, #f2e1b0, glow shadow */}
              <Text style={styles.title}>ECHO INBOX</Text>

              {/* Equal-width spacer keeps title perfectly centered */}
              <View style={styles.titleSpacer} />
            </View>

            {/* Body S Regular: Inter Regular 16/24, white, centered */}
            <Text style={styles.subtitle}>
              Echoes entrusted to you are waiting for their moment, some beyond the present.
            </Text>
          </View>

          {/* ── List card ────────────────────────────────────────────────── */}
          {/*
            Figma 1436:1848 — gradient 0.01→0, border 0.25px #60739f (border-inverse-1),
            radius 16, padding 16, overflow hidden
          */}
          <View style={[styles.card, echoes.length > 0 && styles.cardFlex]}>
            <LinearGradient
              colors={['rgba(253,253,249,0.01)', 'rgba(253,253,249,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            {/* Tabs — Figma 1436:1849, gap:32 */}
            <View style={styles.tabs}>
              {(['SENDER', 'CATEGORY'] as const).map(tab => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.7}
                  style={[styles.tab, activeTab === tab && styles.tabActive]}
                >
                  {/*
                    Active: #fdfdf9 with border-bottom #a3b3cc
                    Inactive: #a3b3cc (text-inverse-paragraph-2)
                    Font: Cormorant Regular 24px (Heading S: font-size/XL)
                  */}
                  <Text style={[
                    styles.tabText,
                    activeTab === tab ? styles.tabTextActive : styles.tabTextInactive,
                  ]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* List content */}
            {loading ? (
              <View style={styles.stateBox}>
                <ActivityIndicator size="large" color={palette.gold.DEFAULT} />
              </View>
            ) : error ? (
              <View style={styles.stateBox}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={fetchInboxEchoes} style={styles.retryBtn}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : echoes.length === 0 ? (
              <View style={styles.stateBox}>
                <Text style={styles.emptyText}>No echoes received yet</Text>
                <Text style={styles.emptySubtext}>
                  Echoes sent to you will appear here
                </Text>
              </View>
            ) : (
              echoes.map((item, index) => {
                const isLast = index === echoes.length - 1;
                const isLocked = !!item.scheduled_at;
                return (
                  <TouchableOpacity
                    key={item.echo_id}
                    activeOpacity={0.9}
                    onPress={() => handleOpenItem(item)}
                    style={[styles.row, !isLast && styles.rowBorder]}
                  >
                    {/* Left: title + date */}
                    <View style={styles.rowLeft}>
                      <View style={styles.rowText}>
                        {/* Heading XS: Cormorant Regular 20/24, white */}
                        <Text style={styles.rowTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {/* Inter Light Italic 14/1.5, white */}
                        <Text style={styles.rowSub} numberOfLines={1}>
                          {isLocked
                            ? `Unlocks ${formatDate(item.scheduled_at!)}`
                            : `Saved ${formatDate(item.created_at)}`}
                        </Text>
                      </View>
                    </View>

                    {/* Right: label + lock */}
                    <View style={styles.rowRight}>
                      {/* Inter Light 16/24, #f2e1b0 */}
                      <Text style={styles.rowLabel}>{getRightLabel(item)}</Text>
                      {isLocked && <LockIcon />}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* ── CREATE ECHO button ────────────────────────────────────────── */}
          {/* Figma 1441:1955 — same primary button as library screen */}
          <Button
            variant="primary"
            size="L"
            title="CREATE ECHO"
            onPress={() => navigation.navigate('NewEchoScreen')}
            style={styles.btn}
          />
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
}

export default function EchoInboxScreen() {
  return <EchoInboxContent />;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create<{
  bg: ViewStyle;
  safe: ViewStyle;
  scroll: ViewStyle;
  scrollContent: ViewStyle;
  headerSection: ViewStyle;
  titleRow: ViewStyle;
  backBtn: ViewStyle;
  title: TextStyle;
  titleSpacer: ViewStyle;
  subtitle: TextStyle;
  card: ViewStyle;
  cardFlex: ViewStyle;
  tabs: ViewStyle;
  tab: ViewStyle;
  tabActive: ViewStyle;
  tabText: TextStyle;
  tabTextActive: TextStyle;
  tabTextInactive: TextStyle;
  row: ViewStyle;
  rowBorder: ViewStyle;
  rowLeft: ViewStyle;
  rowText: ViewStyle;
  rowTitle: TextStyle;
  rowSub: TextStyle;
  rowRight: ViewStyle;
  rowLabel: TextStyle;
  btn: ViewStyle;
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
  // Figma: left:24, outer gap:40 from header → content, inner gap:24 between sections
  scrollContent: {
    paddingHorizontal: scale(spacing.xl),         // 24px
    paddingTop:        verticalScale(30),          // outer column gap
    paddingBottom:     verticalScale(spacing.xxxl),
    gap:               verticalScale(spacing.xl),  // 24px inner gap
    flexGrow:          1,
  },

  // ── Header section ──────────────────────────────────────────────────────────
  // Figma 1439:1929 — flex-col gap:16
  headerSection: {
    gap:        verticalScale(spacing.m),          // 16px
    alignItems: 'center',
  },

  // Figma 1439:1930 — justify-between, items-center, w-full
  titleRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    width:          '100%',
  },

  backBtn: {
    width:          scale(44),
    height:         scale(44),
    alignItems:     'flex-start',
    justifyContent: 'center',
  },

  // Heading M: Cormorant Regular 28/32, #f2e1b0, glow shadow
  title: {
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

  // Mirrors backBtn width so title stays perfectly centered
  titleSpacer: {
    width: scale(44),
  },

  // Body S Regular: Inter Regular 16/24, white, centered
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize:   moderateScale(fontSize.s),
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(24),
    color:      palette.neutral.white,
    textAlign:  'center',
    width:      '100%',
  },

  // ── Card ────────────────────────────────────────────────────────────────────
  // Figma 1436:1848 — gradient bg, border 0.25px #60739f (border-inverse-1),
  // radius 16, padding 16, overflow hidden
  card: {
    width:        '100%',
    borderRadius: radius.m,
    borderWidth:  borderWidth.hairline,              // 0.25px
    borderColor:  palette.navy.medium,               // #60739f (border-inverse-1)
    padding:      scale(spacing.m),                  // 16px
    overflow:     'hidden',
  },
  cardFlex: {
    flex:      1,
    minHeight: scale(200),
  },

  // Tabs — Figma 1436:1849, gap:32, justify-center
  tabs: {
    flexDirection:  'row',
    justifyContent: 'center',
    alignItems:     'center',
    gap:            scale(32),
    marginBottom:   verticalScale(spacing.s),
  },
  tab: { paddingVertical: 2 },
  tabActive: {
    borderBottomWidth: 1,
    borderBottomColor: palette.navy.light,           // Border/Subtle #a3b3cc
  },

  // Cormorant Regular 24px (Heading S — font-size/XL)
  tabText: {
    fontFamily: fontFamily.heading,
    fontSize:   moderateScale(fontSize.xl),          // 24px
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(28),
    textAlign:  'center',
  },
  tabTextActive:   { color: palette.gold.subtlest },  // #fdfdf9
  tabTextInactive: { color: palette.navy.light },     // #a3b3cc

  // ── Rows ────────────────────────────────────────────────────────────────────
  // Figma: padding-y 16, border-bottom 0.25px #a3b3cc between rows
  row: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingVertical: verticalScale(spacing.m),       // 16px
  },
  rowBorder: {
    borderBottomWidth: borderWidth.hairline,
    borderBottomColor: palette.navy.light,
  },

  rowLeft: {
    flex:      1,
    maxWidth:  scale(240),
  },
  rowText: { flex: 1 },

  // Heading XS: Cormorant Regular 20/24, white
  rowTitle: {
    fontFamily: fontFamily.heading,
    fontSize:   moderateScale(fontSize.l),           // 20px
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(24),
    color:      palette.neutral.white,
  },

  // Inter Light Italic 14/1.5, white
  rowSub: {
    fontFamily: fontFamily.bodyItalic,
    fontStyle:  'italic',
    fontSize:   moderateScale(fontSize.xs),          // 14px
    fontWeight: '300',
    lineHeight: moderateScale(fontSize.xs * 1.5),
    color:      palette.neutral.white,
    opacity:    0.85,
  },

  rowRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           scale(8),
    maxWidth:      scale(80),
  },

  // Inter Light 16/24, #f2e1b0
  rowLabel: {
    fontFamily: fontFamily.bodyLight,
    fontSize:   moderateScale(fontSize.s),           // 16px
    fontWeight: '300',
    lineHeight: moderateScale(24),
    color:      palette.gold.DEFAULT,
    textAlign:  'center',
  },

  // ── Button ──────────────────────────────────────────────────────────────────
  btn: { alignSelf: 'center', width: scale(271) },

  // ── State views ─────────────────────────────────────────────────────────────
  stateBox: {
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: verticalScale(40),
  },
  errorText: {
    color:        palette.status.errorHover,
    fontSize:     moderateScale(14),
    textAlign:    'center',
    marginBottom: 12,
  },
  retryBtn: {
    paddingHorizontal: scale(20),
    paddingVertical:   verticalScale(8),
    borderRadius:      radius.s,
    borderWidth:       1,
    borderColor:       palette.gold.DEFAULT,
  },
  retryText: { color: palette.gold.DEFAULT, fontSize: moderateScale(14) },
  emptyText: {
    color:        palette.gold.subtlest,
    fontSize:     moderateScale(16),
    textAlign:    'center',
    marginBottom: verticalScale(8),
  },
  emptySubtext: {
    color:     palette.gold.subtlest,
    fontSize:  moderateScale(14),
    textAlign: 'center',
    opacity:   0.7,
  },
});
