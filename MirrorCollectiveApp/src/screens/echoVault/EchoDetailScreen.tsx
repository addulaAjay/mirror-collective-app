// EchoDetailScreen.tsx
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  palette, fontFamily, fontSize, fontWeight, lineHeight,
  spacing, radius, borderWidth, textShadow,
  scale, verticalScale, moderateScale,
} from '@theme';
import { RootStackParamList } from '@types';
import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  ScrollView,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button';
import LogoHeader from '@components/LogoHeader';
import { echoApiService, EchoResponse } from '@services/api/echo';

type Props = NativeStackScreenProps<RootStackParamList, 'EchoDetailScreen'>;


const { width: W, height: H } = Dimensions.get('window');

const GOLD = palette.gold.mid;
const OFFWHITE = 'rgba(253,253,249,0.92)';
const SUBTEXT = 'rgba(253,253,249,0.70)';
const BORDER = 'rgba(253,253,249,0.16)';
const BORDER_SOFT = 'rgba(253,253,249,0.08)';
const SURFACE = 'rgba(7,9,14,0.36)';

const EchoDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { echoId } = route.params; 
  const [echo, setEcho] = useState<EchoResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [vaulting, setVaulting] = useState(false);

  // Recipient if the echo has a sender field (they sent it to us)
  const isRecipient = !!echo?.sender;

  const contentWidth = useMemo(() => Math.min(W * 0.88, 360), []);
  const textBoxHeight = useMemo(() => Math.min(H * 0.65, 515), []);

  useEffect(() => {
    fetchEchoDetails();
  }, [echoId]);

  const handleDownload = async () => {
    if (!echo) return;
    try {
      await Share.share({ message: echo.content || echo.title });
    } catch { /* user dismissed */ }
  };

  const handleVault = async () => {
    if (!echo || vaulting) return;
    setVaulting(true);
    try {
      const res = await echoApiService.createEcho({
        title: echo.title,
        category: echo.category,
        echo_type: echo.echo_type,
        content: echo.content,
      });
      if (!res.success) throw new Error('Failed to save to vault.');
      Alert.alert('Saved', 'Echo added to your vault.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add to vault.');
    } finally {
      setVaulting(false);
    }
  };

  const handleEdit = () => {
    if (!echo) return;
    // Route through ChooseRecipientScreen so the edit flow matches the
    // create flow's two-step pattern (Recipient → Compose). The recipient
    // screen propagates editEchoId on to the compose step.
    navigation.navigate('ChooseRecipientScreen', {
      mode: echo.echo_type.toLowerCase() as 'text' | 'audio' | 'video',
      title: echo.title,
      category: echo.category,
      editEchoId: echo.echo_id,
      prefillRecipient: echo.recipient,
      prefillLockDate: echo.release_date,
      prefillContent: echo.content,
      prefillLetter: echo.letter_to_recipient,
    });
  };

  const fetchEchoDetails = async () => {
    try {
      setLoading(true);
      const response = await echoApiService.getEcho(echoId);
      if (response.data) {
        setEcho(response.data);
      } else {
        Alert.alert('Error', 'Echo not found');
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Failed to fetch echo details:', error);
      Alert.alert('Error', error.message || 'Failed to load echo details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GOLD} />
      </View>
    );
  }

  if (!echo) {
    return null; 
  }

  const title = echo.title || 'Untitled Echo';
  const body = echo.echo_type === 'TEXT' 
    ? (echo.content || 'No content provided.')
    : `[${echo.echo_type} Content Placeholder]\n\nThis media type is not yet fully supported in this view.`;

  return (
    <BackgroundWrapper style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />

        <LogoHeader navigation={navigation} />

        {/* Back + Title */}
        <View style={styles.titleRowContainer}>
          <View style={[styles.titleRow, { width: contentWidth }]}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Image source={require('@assets/back-arrow.png')} style={styles.backArrowImg} resizeMode="contain" />
            </TouchableOpacity>

            <Text style={styles.screenTitle} numberOfLines={1}>
              {title}
            </Text>

            <View style={styles.titleRightSpacer} />
          </View>
        </View>

        {/* Text box — View as container so ScrollView touches aren't blocked */}
        <View style={[styles.textBoxShell, { width: contentWidth, height: textBoxHeight }]}>
          <LinearGradient
            colors={['rgba(253,253,249,0.04)', 'rgba(253,253,249,0.01)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: radius.xs }]}
            pointerEvents="none"
          />
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.bodyText}>{body}</Text>
          </ScrollView>
        </View>

        {/* Bottom actions */}
        <View style={[styles.actionsRow, { width: contentWidth }]}>
          <EchoIconButton icon={require('@assets/download.png')} onPress={handleDownload} />
          <Button
            variant="primary"
            size="L"
            title={vaulting ? 'SAVING...' : 'VAULT'}
            onPress={handleVault}
            style={styles.vaultBtn}
          />
          {/* Edit icon hidden once the echo is RELEASED — the backend
              rejects updates on locked/released echoes, so there's
              nothing the user could change at that point. */}
          {!isRecipient && echo?.status === 'DRAFT' && (
            <EchoIconButton icon={require('@assets/edit-icon.png')} onPress={handleEdit} />
          )}
        </View>

        {/* Folder modal sheet */}
        <Modal
          visible={folderModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setFolderModalOpen(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setFolderModalOpen(false)}
          >
            <Pressable
              style={[styles.sheet, { width: Math.min(W * 0.92, 420) }]}
            >
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>
                  Choose folders that you want to share with this Guardian
                </Text>
                <TouchableOpacity
                  onPress={() => setFolderModalOpen(false)}
                  style={styles.sheetClose}
                  activeOpacity={0.85}
                >
                  <Text style={styles.sheetCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.sheetBody}>
                <Text style={styles.sheetHint}>
                  (Stub UI) Add your folder list here.
                </Text>

                <View style={styles.fakeRow}>
                  <View style={styles.fakeBox} />
                  <Text style={styles.fakeLabel}>Family</Text>
                </View>
                <View style={styles.fakeRow}>
                  <View style={styles.fakeBox} />
                  <Text style={styles.fakeLabel}>Legacy Capsule</Text>
                </View>
                <View style={styles.fakeRow}>
                  <View style={styles.fakeBox} />
                  <Text style={styles.fakeLabel}>Selected Memories</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setFolderModalOpen(false)}
                  style={styles.sheetCtaWrap}
                >
                  <LinearGradient
                    colors={[
                      'rgba(253,253,249,0.10)',
                      'rgba(253,253,249,0.03)',
                    ]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.sheetCtaShell}
                  >
                    <View style={styles.sheetCtaInner}>
                      <Text style={styles.sheetCtaText}>SAVE TO VAULT</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default EchoDetailScreen;

/* ---------- Icon-only action button ---------- */

const EchoIconButton = ({
  icon,
  onPress,
}: {
  icon: ReturnType<typeof require>;
  onPress: () => void;
}) => (
  <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.iconBtnShell}>
    <Image source={icon} style={styles.iconBtnImg} resizeMode="contain" />
  </TouchableOpacity>
);

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent', alignItems: 'center' },
  loadingContainer: {
    flex: 1,
    backgroundColor: palette.navy.deep,
    justifyContent: 'center',
    alignItems: 'center',
  },
  root: {
    flex: 1,
  },

  titleRowContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: verticalScale(spacing.m),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: scale(44),
    height: scale(44),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backArrowImg: {
    width: scale(20),
    height: scale(20),
    tintColor: palette.gold.DEFAULT,
  },
  screenTitle: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize['2xl']),
    fontWeight: fontWeight.regular,
    color: palette.gold.DEFAULT,
    maxWidth: '78%',
    textAlign: 'center',
    textShadowColor: textShadow.glowSubtle.color,
    textShadowOffset: textShadow.glowSubtle.offset,
    textShadowRadius: textShadow.glowSubtle.radius,
  },
  titleRightSpacer: { width: scale(44), height: scale(44) },

  // Text box — outer glow via boxShadow (RN 0.80), gradient is absoluteFill background
  textBoxShell: {
    marginTop: verticalScale(spacing.m),
    borderRadius: radius.xs,
    borderWidth: 0.2,
    borderColor: palette.navy.light,
    padding: scale(spacing.m),
    overflow: 'hidden',
    boxShadow: '0px 0px 15px 0px rgba(229,214,176,0.3)',
    shadowColor: '#e5d6ae',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  scrollContent: { paddingBottom: scale(spacing.xs) },
  bodyText: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.xs),
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.m,
    color: palette.neutral.white,
  },

  actionsRow: {
    marginTop: verticalScale(spacing.m),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(spacing.xl),   // Figma: gap 24px
    justifyContent: 'center',
    paddingBottom: verticalScale(spacing.m),
  },
  // Icon-only button — same paddingVertical/Horizontal as Button size="L" for equal height
  iconBtnShell: {
    paddingVertical: verticalScale(spacing.s),   // matches Button L paddingVertical (12px)
    paddingHorizontal: scale(spacing.m),          // matches Button L paddingHorizontal (16px)
    borderRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(253,253,249,0.03)',
  },
  iconBtnImg: {
    width: scale(24),
    height: scale(24),
    tintColor: palette.gold.DEFAULT,
  },
  vaultBtn: {
    minWidth: scale(110),
  },

  /* Modal sheet */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 26,
  },
  sheet: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.22)',
    backgroundColor: 'rgba(10,12,18,0.96)',
    overflow: 'hidden',
  },
  sheetHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(253,253,249,0.08)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  sheetTitle: {
    flex: 1,
    color: 'rgba(215,192,138,0.92)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  sheetClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(253,253,249,0.10)',
    backgroundColor: 'rgba(253,253,249,0.03)',
  },
  sheetCloseText: { color: OFFWHITE, fontSize: 14, opacity: 0.9 },

  sheetBody: { padding: 14 },
  sheetHint: {
    color: SUBTEXT,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },

  fakeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  fakeBox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: GOLD,
    backgroundColor: 'transparent',
  },
  fakeLabel: { color: OFFWHITE, fontSize: 14 },

  sheetCtaWrap: { marginTop: 14 },
  sheetCtaShell: {
    borderRadius: 14,
    padding: 1,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.28)',
  },
  sheetCtaInner: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    backgroundColor: 'rgba(7,9,14,0.28)',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCtaText: {
    color: 'rgba(215,192,138,0.92)',
    fontSize: 16,
    letterSpacing: 1.2,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },
});
