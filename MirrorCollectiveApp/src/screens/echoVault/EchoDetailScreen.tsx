import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fontFamily, fontSize, lineHeight, palette, spacing } from '@theme';
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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button/Button';
import LogoHeader from '@components/LogoHeader';
import { echoApiService, EchoResponse } from '@services/api/echo';

type Props = NativeStackScreenProps<RootStackParamList, 'EchoDetailScreen'>;

const { width: W } = Dimensions.get('window');

const EchoDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { echoId } = route.params;
  const [echo, setEcho] = useState<EchoResponse | null>(null);
  const [loading, setLoading] = useState(true);
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

        {/* Main content — gap: 24 between title, text box, actions */}
        <View style={[styles.contentContainer, { width: contentWidth }]}>

          {/* Title row: back | title | edit */}
          <View style={styles.titleRow}>
            <TouchableOpacity activeOpacity={0.85} style={styles.titleBtn} onPress={() => navigation.goBack()}>
              <Image source={require('@assets/back-arrow.png')} style={styles.backArrowImg} resizeMode="contain" />
            </TouchableOpacity>

            <Text style={styles.screenTitle} numberOfLines={1}>{title}</Text>

            <TouchableOpacity activeOpacity={0.85} style={styles.titleBtn} onPress={() => {}}>
              <Image source={require('@assets/edit-icon.png')} style={styles.editIconImg} resizeMode="contain" />
            </TouchableOpacity>
          </View>

          {/* Scrollable text box */}
          <LinearGradient
            colors={['rgba(253,253,249,0.01)', 'rgba(253,253,249,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.textBox}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <Text style={styles.bodyText}>{body}</Text>
            </ScrollView>
          </LinearGradient>

          {/* Action buttons: download | VAULT | edit */}
          <View style={styles.actionsRow}>
            <EchoIconButton icon={require('@assets/download.png')} onPress={() => {}} />
            <Button
              variant="primary"
              size="L"
              title="VAULT"
              onPress={() => setFolderModalOpen(true)}
            />
            <EchoIconButton icon={require('@assets/edit-icon.png')} onPress={() => {}} />
          </View>

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

/* ── Icon-only action button ────────────────────────────────────────────── */

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
      style={styles.iconBtnGradient}
    >
      <Image source={icon} style={styles.iconBtnImg} resizeMode="contain" />
    </LinearGradient>
  </TouchableOpacity>
);

/* ── Styles ─────────────────────────────────────────────────────────────── */

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
  editIconImg: {
    width: 20,
    height: 20,
    tintColor: 'rgba(215,192,138,0.9)',
  },
  screenTitle: {
    flex: 1,
    color: 'rgba(215,192,138,0.92)',
    fontSize: fontSize['2xl'],      // 28px — Figma: font/size/2XL
    lineHeight: lineHeight.xl,      // 32px
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: fontFamily.heading,
    }),
    textAlign: 'center',
    textShadowColor: 'rgba(240,212,168,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },

  /* Scrollable text box */
  textBox: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 0.2,
    borderColor: palette.navy.light,
    padding: spacing.m,           // 16px
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(229,214,176,1)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: {
        boxShadow: '0 0 15px 0 rgba(229,214,176,0.3)',
      },
    }),
  },
  scrollContent: {
    paddingBottom: spacing.xs,
  },
  bodyText: {
    color: 'rgba(253,253,249,1)',
    fontFamily: fontFamily.body,  // Inter Regular
    fontSize: fontSize.s,         // 16px — Figma: font/size/S
    lineHeight: lineHeight.m,     // 24px — Figma: font/line-height/M
    fontWeight: '400',
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
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: palette.navy.light,
    overflow: 'hidden',
  },
  iconBtnGradient: {
    flex: 1,
    paddingHorizontal: spacing.m,  // 16px
    paddingVertical: spacing.s,    // 12px
    alignItems: 'center',
    justifyContent: 'center',
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
