import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  borderWidth as borderWidthToken,
  fontFamily,
  fontSize,
  lineHeight,
  palette,
  radius,
  spacing,
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
import Button from '@components/Button/Button';
import LogoHeader from '@components/LogoHeader';
import TextInputField from '@components/TextInputField';
import { echoApiService, EchoResponse } from '@services/api/echo';

type Props = NativeStackScreenProps<RootStackParamList, 'EchoDetailScreen'>;

const { width: W } = Dimensions.get('window');

const EchoDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { echoId } = route.params;
  const [echo, setEcho] = useState<EchoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);

  const contentWidth = useMemo(() => Math.min(W * 0.88, 360), []);

  useEffect(() => {
    fetchEchoDetails();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [echoId]);

  const fetchEchoDetails = async () => {
    try {
      setLoading(true);
      const response = await echoApiService.getEcho(echoId);
      if (response.data) {
        setEcho(response.data);
        setDraftContent(response.data.content || '');
      } else {
        Alert.alert('Error', 'Echo not found');
        navigation.goBack();
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to load echo details';
      Alert.alert('Error', msg);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (!echo) return;
    setDraftContent(echo.content || '');
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!echo) return;
    setIsSavingEdit(true);
    try {
      const response = await echoApiService.updateEcho(echoId, { content: draftContent });
      if (!response.success) {
        const errorMsg = response.error ?? 'Failed to save changes';
        const isLocked = /locked|released/i.test(errorMsg);
        Alert.alert(
          isLocked ? 'Echo Locked' : 'Error',
          isLocked
            ? 'This echo has already been locked or released and can no longer be edited.'
            : errorMsg,
          [{ text: 'OK', onPress: () => isLocked && setIsEditing(false) }],
        );
        return;
      }
      setEcho(prev => prev ? { ...prev, content: draftContent } : null);
      setIsEditing(false);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to save changes';
      Alert.alert('Error', msg);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDownload = async () => {
    if (!echo) return;
    const echoTitle = echo.title || 'Echo';
    const body = echo.content || '';
    try {
      await Share.share({ message: `${echoTitle}\n\n${body}`, title: echoTitle });
    } catch {
      // user dismissed share sheet — no action needed
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={palette.gold.mid} />
      </View>
    );
  }

  if (!echo) return null;

  const title = echo.title || 'Untitled Echo';
  const body = echo.echo_type === 'TEXT'
    ? (echo.content || 'No content provided.')
    : `[${echo.echo_type} Content]\n\nThis media type is not yet supported in this view.`;

  return (
    <BackgroundWrapper style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        <LogoHeader navigation={navigation} />

        <View style={[styles.contentContainer, { width: contentWidth }]}>

          {/* Title row: back | title | spacer */}
          <View style={styles.titleRow}>
            <TouchableOpacity activeOpacity={0.85} style={styles.titleBtn} onPress={() => navigation.goBack()}>
              <Image source={require('@assets/back-arrow.png')} style={styles.backArrowImg} resizeMode="contain" />
            </TouchableOpacity>

            <Text style={styles.screenTitle} numberOfLines={1}>{title}</Text>

            <View style={styles.titleBtn} />
          </View>

          {isEditing ? (
            /* Edit mode: TextInputField fills space, no shadow wrapper */
            <TextInputField
              value={draftContent}
              onChangeText={setDraftContent}
              multiline
              size="L"
              autoFocus
              placeholderAlign="left"
              style={styles.editFieldWrapper}
              fieldStyle={styles.editField}
            />
          ) : (
            /* View mode: shadow wrapper + overflow-clipped card + scrollable text */
            <View style={styles.cardShadow}>
              <View style={styles.card}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={styles.scrollViewFill}
                  contentContainerStyle={styles.scrollContent}
                >
                  <Text style={styles.bodyText}>{body}</Text>
                </ScrollView>
              </View>
            </View>
          )}

          {/* View mode: download | VAULT | edit — Edit mode: single SAVE TO VAULT */}
          {isEditing ? (
            <Button
              variant="primary"
              size="L"
              title={isSavingEdit ? 'SAVING...' : 'SAVE TO VAULT'}
              onPress={handleSaveEdit}
              disabled={isSavingEdit}
            />
          ) : (
            <View style={styles.actionsRow}>
              <EchoIconButton icon={require('@assets/download.png')} onPress={handleDownload} />
              <Button
                variant="primary"
                size="L"
                title="VAULT"
                onPress={() => setFolderModalOpen(true)}
              />
              <EchoIconButton icon={require('@assets/edit-icon.png')} onPress={handleEdit} />
            </View>
          )}

        </View>

        {/* Vault folder modal */}
        <Modal
          visible={folderModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setFolderModalOpen(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setFolderModalOpen(false)}>
            <Pressable style={[styles.sheet, { width: Math.min(W * 0.92, 420) }]}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Choose folders to share with this Guardian</Text>
                <TouchableOpacity onPress={() => setFolderModalOpen(false)} style={styles.sheetClose} activeOpacity={0.85}>
                  <Text style={styles.sheetCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.sheetBody}>
                {['Family', 'Legacy Capsule', 'Selected Memories'].map(folder => (
                  <View key={folder} style={styles.folderRow}>
                    <View style={styles.folderCheckbox} />
                    <Text style={styles.folderLabel}>{folder}</Text>
                  </View>
                ))}
                <Button
                  variant="secondary"
                  size="L"
                  title="SAVE TO VAULT"
                  onPress={() => setFolderModalOpen(false)}
                  style={styles.sheetCta}
                />
              </View>
            </Pressable>
          </Pressable>
        </Modal>

      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default EchoDetailScreen;

/* ── Icon-only action button ──────────────────────────────────────────────── */

const EchoIconButton = ({
  icon,
  onPress,
}: {
  icon: ReturnType<typeof require>;
  onPress: () => void;
}) => (
  <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.iconBtn}>
    <LinearGradient
      colors={['rgba(253,253,249,0.01)', 'rgba(253,253,249,0)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
    <Image source={icon} style={styles.iconBtnImg} resizeMode="contain" />
  </TouchableOpacity>
);

/* ── Styles ───────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, backgroundColor: 'transparent', alignItems: 'center' },

  loadingContainer: {
    flex: 1,
    backgroundColor: palette.navy.deep,
    justifyContent: 'center',
    alignItems: 'center',
  },

  contentContainer: {
    flex: 1,
    marginTop: 20,
    paddingBottom: 22,
    gap: 24,
  },

  /* Title row */
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrowImg: {
    width: 20,
    height: 20,
    tintColor: 'rgba(215,192,138,0.9)',
  },
  screenTitle: {
    flex: 1,
    color: 'rgba(215,192,138,0.92)',
    fontSize: fontSize['2xl'],
    lineHeight: lineHeight.xl,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: fontFamily.heading,
    }),
    textAlign: 'center',
    textShadowColor: 'rgba(240,212,168,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },

  /* View mode: shadow wrapper (no overflow) + clipped card */
  cardShadow: {
    flex: 1,
    borderRadius: radius.l,
    shadowColor: palette.gold.DEFAULT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  card: {
    flex: 1,
    borderRadius: radius.l,                 // 20px
    borderWidth: borderWidthToken.hairline, // 0.25px
    borderColor: palette.navy.light,
    backgroundColor: palette.navy.card,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    overflow: 'hidden',                     // bounds ScrollView so it scrolls
  },

  scrollViewFill: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xs,
  },
  bodyText: {
    color: 'rgba(253,253,249,1)',
    fontFamily: fontFamily.body,
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    fontWeight: '400',
  },

  /* Edit mode: TextInputField fills space, no shadow */
  editFieldWrapper: {
    flex: 1,
  },
  editField: {
    flex: 1,
  },

  /* Action row */
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 24,
  },

  /* Icon-only button */
  iconBtn: {
    minHeight: 52,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: palette.navy.light,
    overflow: 'hidden',
  },
  iconBtnImg: {
    width: 24,
    height: 24,
    tintColor: 'rgba(215,192,138,0.92)',
  },

  /* Vault modal */
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
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(253,253,249,0.08)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  sheetTitle: {
    flex: 1,
    color: 'rgba(215,192,138,0.92)',
    fontSize: fontSize.xs,
    lineHeight: lineHeight.s,
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
  sheetCloseText: {
    color: 'rgba(253,253,249,0.92)',
    fontSize: fontSize.xs,
    opacity: 0.9,
  },
  sheetBody: {
    padding: spacing.s,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  folderCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: palette.gold.mid,
  },
  folderLabel: {
    color: 'rgba(253,253,249,0.92)',
    fontSize: fontSize.xs,
  },
  sheetCta: {
    marginTop: spacing.s,
  },
});
