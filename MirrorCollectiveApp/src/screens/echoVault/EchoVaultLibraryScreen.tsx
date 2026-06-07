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

import { useFocusEffect, useNavigation } from '@react-navigation/native';
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
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ImageStyle,
  type ListRenderItem,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import {
  GestureHandlerRootView,
  Swipeable,
  // RN's TouchableOpacity eats the first tap inside a Swipeable; use the
  // gesture-handler one for the swipe action buttons.
  TouchableOpacity as GHTouchableOpacity,
} from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { SvgXml } from 'react-native-svg';

import { getMotifIcon } from '@assets/motifs/MotifAssets';
import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button/Button';
import { CachedImage } from '@components/CachedImage';
import LogoHeader from '@components/LogoHeader';
import { useInfiniteList } from '@hooks/useInfiniteList';
import { echoApiService, type EchoResponse } from '@services/api/echo';
import { resumeMediaMultipart } from '@services/api/multipart';
import {
  type PendingUpload,
  listResumableUploads,
  removePending,
} from '@services/api/pendingUploads';


import { ResumeUploadBanner } from './ResumeUploadBanner';

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

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

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

// ── Back arrow — uses the shared `back-arrow.png` asset so the glyph
// matches Compose / Detail / Audio / Video / Recipient. Inline Material
// SVG only fills ~67% of its viewBox and renders visibly smaller.
const BackArrowIcon: React.FC = () => (
  <Image
    source={require('@assets/back-arrow.png')}
    style={styles.backArrowImg}
    resizeMode="contain"
  />
);

// ── Lock icon — Figma 7545:2403: gold padlock inside a thin gold circle ───────
const LockIcon: React.FC = () => (
  <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={11} stroke={palette.gold.DEFAULT} strokeWidth={1} />
    <G transform="translate(6 6.25) scale(0.5)">
      <Path
        d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
        fill={palette.gold.DEFAULT}
      />
    </G>
  </Svg>
);

// ── Swipe-action icons (Figma 7545:2374): gold outline pencil + trash ─────────
const EditIcon: React.FC = () => (
  <Svg width={scale(20)} height={scale(20)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 20h4L18.5 9.5l-4-4L4 16v4z"
      stroke={palette.gold.DEFAULT}
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
    <Path
      d="M13.5 6.5l4 4"
      stroke={palette.gold.DEFAULT}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
);

const TrashIcon: React.FC = () => (
  <Svg width={scale(20)} height={scale(20)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 7h14M10 4h4M6 7l1 13h10l1-13M10 11v6M14 11v6"
      stroke={palette.gold.DEFAULT}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
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
  /**
   * When a video echo has a poster frame attached, use that as the
   * avatar instead of the recipient identity image. The recipient
   * still surfaces via the rightLabel column; the avatar slot is
   * better spent showing what the echo CONTAINS than who it's FOR.
   * Falls back to the recipient profile → motif → placeholder ladder
   * when no poster is available.
   */
  poster?: string;
}
const EchoAvatar: React.FC<AvatarProps> = ({ motif, profileImage, poster }) => (
  <View style={styles.avatarGlow}>
    <View style={styles.avatarRing}>
      {/* Recipient identity wins: profile image → motif. The video poster is
          only a last resort (e.g. My Vault video echoes with no recipient) so
          a video thumbnail never masquerades as the recipient's avatar. */}
      {profileImage ? (
        // CachedImage strips presigned-URL query params for the cache
        // key, so paging back through the vault list doesn't re-download
        // the same avatar bytes on every refresh.
        <CachedImage
          source={{ uri: profileImage }}
          style={styles.avatarImg}
          contentFit="cover"
        />
      ) : motif && getMotifIcon(motif) ? (
        <SvgXml xml={getMotifIcon(motif)?.xml || ''} width="60%" height="60%" />
      ) : poster ? (
        <CachedImage
          source={{ uri: poster }}
          style={styles.avatarImg}
          contentFit="cover"
        />
      ) : (
        <Image source={require('@assets/Group.png')} style={styles.avatarFallback} />
      )}
    </View>
  </View>
);

// ── Row renderer ─────────────────────────────────────────────────────────────
// Swipe-left-to-delete wrapper. Only used for DRAFT echoes (the only rows the
// library lets you delete inline). Holds its own Swipeable ref so the panel
// closes when the action fires.
const DraftSwipeRow: React.FC<{
  onEdit: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}> = ({ onEdit, onDelete, children }) => {
  const ref = useRef<React.ElementRef<typeof Swipeable>>(null);
  const close = () => ref.current?.close();
  return (
    <Swipeable
      ref={ref}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
      renderRightActions={() => (
        <View style={styles.swipeActions}>
          <GHTouchableOpacity
            style={styles.swipeIconBtn}
            activeOpacity={0.85}
            onPress={() => {
              close();
              onEdit();
            }}
            accessibilityRole="button"
            accessibilityLabel="Edit echo"
          >
            <EditIcon />
          </GHTouchableOpacity>
          <GHTouchableOpacity
            style={styles.swipeIconBtn}
            activeOpacity={0.85}
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel="Delete echo"
          >
            <TrashIcon />
          </GHTouchableOpacity>
        </View>
      )}
    >
      {/* Opaque backing: without it the right-action panel shows THROUGH the
          transparent row, so Edit/Delete visually overlap the recipient name +
          lock. An opaque row hides the actions until it's slid aside. */}
      <View style={styles.swipeRowBg}>{children}</View>
    </Swipeable>
  );
};

// Factored out so FlatList's renderItem reference is stable across renders.
// Returns a ListRenderItem<EchoResponse> closed over the active tab + the
// row tap handler; `total` is used to suppress the trailing border on the
// last row (matches the pre-FlatList visual). DRAFT rows are wrapped in a
// swipe-to-delete panel.
function renderEchoRow(
  activeTab: 'RECIPIENT' | 'CATEGORY',
  onOpen: (item: EchoResponse) => void,
  onEdit: (item: EchoResponse) => void,
  onDelete: (item: EchoResponse) => void,
  total: number,
): ListRenderItem<EchoResponse> {
  return ({ item, index }) => {
    const isLast = index === total - 1;
    const uiState = deriveUiState(item);
    const showLock = uiState === 'scheduled' || uiState === 'guardian-locked';
    const showSentPill = uiState === 'sent';
    const subtitle =
      uiState === 'scheduled'
        ? `Unlocks ${formatDate(item.release_date!)}`
        : uiState === 'guardian-locked' && item.lock_date
          ? `Locked ${formatDate(item.lock_date)}`
          : `Saved ${formatDate(item.created_at)}`;
    const rightLabel =
      activeTab === 'RECIPIENT'
        ? item.recipient?.name?.toUpperCase() || 'MY VAULT'
        : item.category?.toUpperCase() || 'UNCATEGORIZED';
    const rowGroup = (
      <View style={[styles.rowGroup, !isLast && styles.rowBorder]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => onOpen(item)}
          style={styles.row}
        >
          <View style={styles.rowLeft}>
            <EchoAvatar
              motif={item.recipient?.motif}
              profileImage={item.recipient?.profile_image_url}
              poster={item.echo_type === 'VIDEO' ? item.poster_url : undefined}
            />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.rowSub} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
          </View>
          <View style={styles.rowRight}>
            <Text style={styles.rowLabel} numberOfLines={1}>
              {rightLabel}
            </Text>
            {showLock && <LockIcon />}
          </View>
        </TouchableOpacity>
        {/* Echo Sent pill — renders only on RELEASED status (the
            authoritative signal from the backend, set when the recipient
            notification has been sent). */}
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

    // Only DRAFT echoes can be edited/deleted inline (swipe left → Edit/Delete).
    return item.status === 'DRAFT' ? (
      <DraftSwipeRow
        onEdit={() => onEdit(item)}
        onDelete={() => onDelete(item)}
      >
        {rowGroup}
      </DraftSwipeRow>
    ) : (
      rowGroup
    );
  };
}

// ── Screen ───────────────────────────────────────────────────────────────────

export function EchoLibraryContent() {
  const navigation = useNavigation<EchoLibraryNavigationProp>();
  const [activeTab, setActiveTab] = useState<'RECIPIENT' | 'CATEGORY'>('RECIPIENT');

  // Bound to the new paginated /api/echoes contract. Page size 50 matches
  // the backend's clamp default; loadMore fires from FlatList.onEndReached
  // until next_cursor is null.
  const fetchEchoPage = useCallback(
    (opts: { limit?: number; cursor?: string | null }) =>
      echoApiService.getEchoesPage(opts),
    [],
  );

  const {
    items: echoes,
    loading,
    loadingMore,
    refreshing,
    error,
    loadMore,
    refresh,
  } = useInfiniteList<EchoResponse>(fetchEchoPage);

  // ── Resume-upload state ───────────────────────────────────────────
  // Holds the rows returned by listResumableUploads(). Refreshed on
  // every screen focus so the user sees pending uploads as soon as
  // they navigate back to the vault, including the cold-start case.
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [resumingEchoId, setResumingEchoId] = useState<string | null>(null);
  const [resumeProgress, setResumeProgress] = useState(0);

  /** Probe used by listResumableUploads to filter rows whose source
   *  file has been reclaimed by the OS. Returns false on any error so
   *  a borderline-broken cache state can't keep a stale row alive. */
  const fileExists = useCallback(async (path: string): Promise<boolean> => {
    try {
      const stripped = path.startsWith('file://') ? path.slice(7) : path;
      return await ReactNativeBlobUtil.fs.exists(stripped);
    } catch {
      return false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const rows = await listResumableUploads(fileExists);
        if (!cancelled) setPending(rows);
      })();
      return () => {
        cancelled = true;
      };
    }, [fileExists]),
  );

  const handleResumeContinue = useCallback(
    async (row: PendingUpload) => {
      setResumingEchoId(row.echoId);
      setResumeProgress(0);
      try {
        const result = await resumeMediaMultipart(
          echoApiService,
          row,
          stage => {
            // Map upload progress to a single 0..1 progress fraction
            // for the banner. We weight 'uploading' as 0..0.95 and
            // 'finalizing' as 0.95..1 to match the new-echo screens.
            if (stage.type === 'uploading' && stage.total > 0) {
              setResumeProgress(Math.min(0.95, stage.sent / stage.total));
            } else if (stage.type === 'finalizing') {
              setResumeProgress(0.97);
            }
          },
        );
        setResumeProgress(1);
        if (!result.success) {
          // The resume helper handles abort + pending-row cleanup on
          // failure internally; we just surface the message.
          console.warn('Resume failed:', result.error ?? 'unknown');
        }
      } catch (err) {
        // Network failure / non-recoverable error already cleaned up
        // inside resumeMediaMultipart's catch. Log and move on.
        console.warn('Resume threw:', err);
      } finally {
        setResumingEchoId(null);
        setResumeProgress(0);
        // Drop the row from the local pending list and refresh the
        // vault so the newly-complete echo shows up.
        setPending(p => p.filter(r => r.echoId !== row.echoId));
        await refresh();
      }
    },
    [refresh],
  );

  const handleResumeDismiss = useCallback(
    async (row: PendingUpload) => {
      // Best-effort cleanup: abort the S3 session so the bucket
      // lifecycle rule doesn't have to (it would, after 7d, but we
      // can free the storage now). Then drop the pending row + the
      // cached source file.
      try {
        await echoApiService.abortMultipart(row.echoId, row.uploadId, row.key);
      } catch (err) {
        console.warn('Dismiss abort failed (harmless):', err);
      }
      await removePending(row.echoId);
      await ReactNativeBlobUtil.fs
        .unlink(
          row.cachedFileUri.startsWith('file://')
            ? row.cachedFileUri.slice(7)
            : row.cachedFileUri,
        )
        .catch(() => undefined);
      setPending(p => p.filter(r => r.echoId !== row.echoId));
    },
    [],
  );

  // Unified read-only view: all echo types open in CreateEchoScreen's view mode
  // (message + every attachment with playback), replacing the per-type screens.
  const handleOpenItem = (item: EchoResponse) => {
    navigation.navigate('CreateEchoScreen', { viewEchoId: item.echo_id });
  };

  // Swipe-left → Edit: open the draft in the edit flow (prefilled) via
  // ChooseRecipientScreen → CreateEchoScreen edit mode.
  const handleEditItem = useCallback(
    (item: EchoResponse) => {
      navigation.navigate('ChooseRecipientScreen', {
        title: item.title,
        category: item.category,
        editEchoId: item.echo_id,
        prefillRecipient: item.recipient,
        prefillLockDate: item.release_date,
        prefillContent: item.content,
        prefillLetter: item.letter_to_recipient,
      });
    },
    [navigation],
  );

  // Swipe-left → Delete for DRAFT echoes. Optimistically hides the row,
  // soft-deletes on the backend, then refreshes to reconcile (restores on fail).
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const handleDeleteItem = useCallback(
    (item: EchoResponse) => {
      Alert.alert(
        'Delete echo?',
        `Delete "${item.title || 'this echo'}"? You can't undo this here.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setHiddenIds(prev => new Set(prev).add(item.echo_id));
              const res = await echoApiService.deleteEcho(item.echo_id);
              if (!res.success) {
                setHiddenIds(prev => {
                  const next = new Set(prev);
                  next.delete(item.echo_id);
                  return next;
                });
                Alert.alert('Could not delete', res.error ?? 'Please try again.');
                return;
              }
              refresh();
            },
          },
        ],
      );
    },
    [refresh],
  );

  const visibleEchoes = echoes.filter(e => !hiddenIds.has(e.echo_id));

  return (
    <GestureHandlerRootView style={styles.ghRoot}>
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
            <Text style={styles.subtitleHint}>
              Slide to edit or delete your echo.
            </Text>
          </View>

          {/* Resume banner — surfaces in-flight multipart uploads that
              survived a force-quit. Rendered above the rest of the
              vault content so the user can act on it first. Empty
              `pending` returns null, so this costs nothing when there's
              no recovery work. */}
          <ResumeUploadBanner
            pending={pending}
            resumingEchoId={resumingEchoId}
            resumingProgress={resumeProgress}
            onContinue={handleResumeContinue}
            onDismiss={handleResumeDismiss}
          />

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
              <TouchableOpacity onPress={refresh} style={styles.retryBtn}>
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
                style={[StyleSheet.absoluteFill, { borderRadius: radius.m }]}
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
              {/* Echo rows — virtualized via FlatList so a 1k-echo vault
                  doesn't pin 1k row Views in memory and the JS thread
                  doesn't render them all upfront. onEndReached drives
                  the cursor-paginated /api/echoes/page fetcher. */}
              <FlatList<EchoResponse>
                data={visibleEchoes}
                keyExtractor={item => item.echo_id}
                renderItem={renderEchoRow(
                  activeTab,
                  handleOpenItem,
                  handleEditItem,
                  handleDeleteItem,
                  visibleEchoes.length,
                )}
                showsVerticalScrollIndicator={false}
                style={styles.listScroll}
                contentContainerStyle={styles.listScrollContent}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                // removeClippedSubviews wraps each row in an overflow:hidden
                // cell, which trims the avatar's gold glow at the row's left
                // edge. windowSize=5 + initialNumToRender=12 already cap the
                // mounted-row count, so we don't need the extra clipping.
                removeClippedSubviews={false}
                initialNumToRender={12}
                maxToRenderPerBatch={10}
                windowSize={5}
                refreshing={refreshing}
                onRefresh={refresh}
                ListFooterComponent={
                  loadingMore ? (
                    <View style={styles.footerLoader}>
                      <ActivityIndicator size="small" color="#f2e1b0" />
                    </View>
                  ) : null
                }
              />
            </View>
          )}

          {/* ── Buttons — fixed at bottom ─────────────────────────────── */}
          <View style={styles.btnGroup}>
            <Button
              variant="primary"
              size="L"
              title='CREATE ECHO'
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
    </GestureHandlerRootView>
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
  footerLoader: ViewStyle;
  titleGroup: ViewStyle;
  headerRow: ViewStyle;
  backBtn: ViewStyle;
  backArrowImg: ImageStyle;
  headerSpacer: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  subtitleHint: TextStyle;
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
  ghRoot: ViewStyle;
  swipeRowBg: ViewStyle;
  rowGroup: ViewStyle;
  swipeActions: ViewStyle;
  swipeIconBtn: ViewStyle;
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
  // Inner ScrollView — only the echo rows scroll.
  // The avatar's gold glow extends ~13px outward (10 blur + 3 spread). The
  // FlatList wraps a UIScrollView whose default clipsToBounds=true clips
  // child shadows at the scroll-view boundary. The row's left edge sits
  // at the FlatList's content-area left edge, so the LEFT side of the
  // glow was getting cleanly cut. paddingHorizontal here pads the rows
  // away from the scroll-view edges so the halo renders inside the clip.
  listScroll: { flex: 1 },
  listScrollContent: {
    flexGrow: 1,
    // Small — the avatar inset that keeps its halo unclipped now lives on
    // rowGroup (see note there), since the Swipeable clips at the row edge.
    paddingHorizontal: scale(2),
  },
  footerLoader: {
    paddingVertical: verticalScale(12),
    alignItems: 'center',
  },

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
    width:          scale(44),
    height:         scale(44),
    justifyContent: 'center',
    alignItems:     'flex-start',
  },
  backArrowImg: {
    width:     scale(20),
    height:    scale(20),
    tintColor: palette.gold.DEFAULT,
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
  // Swipe-gesture hint — smaller muted italic so it reads as guidance, not brand.
  subtitleHint: {
    fontFamily: fontFamily.bodyItalic,
    fontStyle:  'italic',
    fontSize:   moderateScale(fontSize.xs),      // 14px
    lineHeight: moderateScale(20),
    color:      palette.navy.light,
    textAlign:  'center',
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
  // No overflow:hidden here — the LinearGradient applies its own borderRadius
  // so it still clips to the rounded corners, while leaving room for child
  // glows (avatar gold halo) to extend past the card edge without being
  // trimmed.
  // Base card — no flex; wraps content in empty state
  cardGlow: {
    width:           '100%',
    borderRadius:    radius.m,
    borderWidth:     borderWidth.hairline,
    // Figma 1065:1847: Border/Inverse-1 #60739f @ 0.25px.
    borderColor:     palette.navy.medium,
    // Solid dark-navy panel — the design's card uses a backdrop-blur over the
    // starfield (a soft, star-free dark panel) which RN can't reproduce; a solid
    // navy.card is the faithful approximation AND lets the swipe-row backing
    // blend in seamlessly (no more dark-blue patch on draft rows).
    backgroundColor: palette.navy.card,
    paddingVertical: scale(spacing.m),
    // Horizontal padding lives on listScrollContent instead so the
    // avatar's gold glow has room inside the FlatList's scroll-view
    // clip. Net distance from card edge to row content stays at 16px
    // (this 2 + listScrollContent 14).
    paddingHorizontal: scale(2),
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
    fontSize:   moderateScale(fontSize.xl),             // 24px (font/size/XL, Figma 1065:1850)
    fontWeight: fontWeight.regular,                     // Cormorant Regular
    lineHeight: moderateScale(28),                      // font/size/2XL
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
  ghRoot: {
    flex: 1,
  },
  // Opaque backing for swipeable (DRAFT) rows so the revealed Edit/Delete panel
  // never shows through the row content. navy.card matches the (now solid) card
  // panel exactly, so a draft row is indistinguishable from the rest at rest.
  swipeRowBg: {
    width: '100%',
    backgroundColor: palette.navy.card,
  },
  rowGroup: {
    width: '100%',
    // Inset the row content so the avatar's gold halo fits INSIDE the row's
    // own bounds. DRAFT rows are wrapped in a Swipeable whose container is
    // overflow:hidden, which clips anything past the row edge — so FlatList
    // padding alone can't save the halo; the avatar must sit ≥ its glow
    // radius (~13px) in from the edge.
    paddingHorizontal: scale(16),
  },
  // Swipe-left delete action (DRAFT rows only).
  // Swipe-reveal action panel: gold outline Edit + Delete icon buttons.
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(spacing.s),
    paddingHorizontal: scale(spacing.s),
  },
  swipeIconBtn: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    borderWidth: borderWidth.thin,
    borderColor: palette.gold.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(spacing.s),          // 16px (Spacing/M)
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
  // Use `boxShadow` only (no legacy shadow* props). The legacy iOS shadow
  // system computes shadowPath from the layer's opaque content — and since
  // this View has no backgroundColor, it falls back to inspecting child
  // layers, which on RN 0.80 produces a directional halo trimmed on the
  // left. boxShadow renders the shadow as part of the view's own draw pass
  // and supports the Figma `spread` value (3px) natively, which the legacy
  // shadow* API can't express.
  avatarGlow: {
    width:         scale(40),
    height:        scale(40),
    borderRadius:  scale(20),
    boxShadow:     '0px 0px 10px 3px rgba(240, 212, 168, 0.45)',
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
