// EchoDetailScreen.tsx
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
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
import LogoHeader from '@components/LogoHeader';
import { echoApiService, EchoResponse } from '@services/api/echo';

type Props = NativeStackScreenProps<RootStackParamList, 'EchoDetailScreen'>;


const { width: W, height: H } = Dimensions.get('window');

const GOLD = '#D7C08A';
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

  const contentWidth = useMemo(() => Math.min(W * 0.88, 360), []);
  const textBoxHeight = useMemo(() => Math.min(H * 0.65, 515), []);

  useEffect(() => {
    fetchEchoDetails();
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

        {/* Text box */}
        <LinearGradient
          colors={['rgba(253,253,249,0.04)', 'rgba(253,253,249,0.01)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.textBoxShell, { width: contentWidth, height: textBoxHeight }]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.bodyText}>{body}</Text>
          </ScrollView>
        </LinearGradient>

        {/* Bottom actions */}
        <View style={[styles.actionsRow, { width: contentWidth }]}>
          <ActionIconButton icon={require('@assets/download.png')} onPress={() => {}} />
          <ActionPrimaryButton
            label="VAULT"
            onPress={() => setFolderModalOpen(true)}
          />
          <ActionIconButton icon={require('@assets/edit-icon.png')} onPress={() => {}} />
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

/* ---------- Buttons ---------- */

const ActionIconButton = ({
  icon,
  onPress,
}: {
  icon: ReturnType<typeof require>;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
    >
      <LinearGradient
        colors={['rgba(253,253,249,0.04)', 'rgba(253,253,249,0.01)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.iconBtnShell}
      >
        <Image source={icon} style={styles.iconBtnImg} resizeMode="contain" />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const ActionPrimaryButton = ({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <LinearGradient
        colors={['rgba(253,253,249,0.04)', 'rgba(253,253,249,0.01)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.primaryBtnShell}
      >
        <Text style={styles.primaryBtnText}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent', alignItems: 'center' },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#05060A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  root: {
    flex: 1,
  },

  titleRowContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backIcon: { color: 'rgba(215,192,138,0.9)', fontSize: 30, marginLeft: 2 },
  backArrowImg: { width: 20, height: 20, tintColor: 'rgba(215,192,138,0.9)' },
  screenTitle: {
    color: 'rgba(215,192,138,0.92)',
    fontSize: 28,
    letterSpacing: 2,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
    maxWidth: '78%',
    textAlign: 'center',
    textShadowColor: 'rgba(240, 212, 168, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  titleRightSpacer: { width: 44, height: 44 },

  textBoxShell: {
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 0.2,
    borderColor: '#9BAAC2',
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(229,214,176,1)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.30,
        shadowRadius: 15,
        elevation: 5,
      },
      android: {
        boxShadow: '0 0 15px 0 rgba(229, 214, 176, 0.30)',
      },
    }),
  },
  scrollContent: { paddingBottom: 8 },
  bodyText: {
    color: 'rgba(253,253,249,0.84)',
    fontSize: 15,
    lineHeight: 22,
  },

  actionsRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
    paddingBottom: 18,
  },
  iconBtnShell: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#A3B3CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnImg: {
    width: 22,
    height: 22,
    tintColor: 'rgba(215,192,138,0.92)',
  },

  primaryBtnShell: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#A3B3CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: 'rgba(215,192,138,0.92)',
    fontSize: 18,
    letterSpacing: 1.4,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
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
