import {
  COLORS,
  SHADOWS,
  SPACING,
  SCREEN_DIMENSIONS,
  PLATFORM_SPECIFIC,
} from '@constants';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@types';
import { echoApiService, EchoResponse } from '@services/api/echo';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';

type EchoLibraryNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MirrorEchoVaultLibrary'
>;

const GOLD = '#D7C08A';
const SUBTEXT = 'rgba(253,253,249,0.65)';

export function EchoLibraryContent() {
  const navigation = useNavigation<EchoLibraryNavigationProp>();
  const { width } = useWindowDimensions();
  const [echoes, setEchoes] = useState<EchoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'RECIPIENT' | 'CATEGORY'>('RECIPIENT');

  const cardMaxWidth = Math.min(width - SPACING.XL * 2, 440);

  const fetchEchoes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await echoApiService.getEchoes();
      if (response.success && response.data) {
        setEchoes(response.data);
      } else {
        setError(response.error || `Failed to load echoes (${JSON.stringify(response)})`);
        console.log('Echo fetch error response:', response);
      }
    } catch (err: any) {
      console.error('Echo load error:', err);
      setError(`Failed to load echoes: ${err.message || JSON.stringify(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEchoes();
  }, []);

  const handleMenu = () => {
    (navigation as any)?.openDrawer?.();
  };

  const handleCreateEcho = () => {
    navigation.navigate('NewEchoScreen');
  };

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
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <BackgroundWrapper style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        />

        <View style={styles.contentWrapper}>
          <LogoHeader navigation={navigation} />

          <View style={styles.topRow}>
            <View style={styles.logoWrap}>
              <Text style={styles.title}>ECHO LIBRARY</Text>
            </View>
          </View>

          <Text style={styles.subtitle}>
            Preserve echoes that hold meaning beyond{'\n'}the present moment.
          </Text>

          <LinearGradient
            colors={['rgba(155, 170, 194, 0.05)', 'rgba(155, 170, 194, 0.22)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.card}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.tableHeader}>
                <TouchableOpacity 
                  style={styles.headerTab}
                  onPress={() => setActiveTab('RECIPIENT')}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.headerText, 
                    activeTab === 'RECIPIENT' ? styles.activeHeader : styles.inactiveHeader
                  ]}>RECIPIENT</Text>
                  {activeTab === 'RECIPIENT' && <View style={styles.activeIndicator} />}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.headerTab}
                  onPress={() => setActiveTab('CATEGORY')}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.headerText, 
                    activeTab === 'CATEGORY' ? styles.activeHeader : styles.inactiveHeader
                  ]}>CATEGORY</Text>
                  {activeTab === 'CATEGORY' && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={GOLD} />
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity onPress={fetchEchoes} style={styles.retryBtn}>
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : echoes.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No echoes yet</Text>
                  <Text style={styles.emptySubtext}>
                    Create your first echo to preserve a message
                  </Text>
                </View>
              ) : (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                >
                  {echoes.map(item => (
                    <TouchableOpacity
                      key={item.echo_id}
                      activeOpacity={0.9}
                      onPress={() => handleOpenItem(item)}
                      style={styles.row}
                    >
                      <View style={styles.rowLeft}>
                        <View style={styles.avatar}>
                          <Image source={require('../../assets/Group.png')} />
                        </View>
                        <View style={styles.rowTextWrap}>
                          <Text style={styles.rowTitle}>{item.title}</Text>
                          <Text style={styles.rowSub}>
                            Saved {formatDate(item.created_at)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.rowRight}>
                        <Text style={styles.recipientText}>
                          {activeTab === 'RECIPIENT' 
                            ? (item.recipient?.name?.toUpperCase() || 'UNASSIGNED')
                            : (item.category?.toUpperCase() || 'UNCATEGORIZED')}
                        </Text>
                        <View style={styles.smallInfoCircle}>
                          <Text style={styles.smallInfoText}>i</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </LinearGradient>

          <TouchableOpacity
            onPress={handleCreateEcho}
            activeOpacity={0.9}
            style={styles.createButton}
          >
            <Text style={styles.createText}>CREATE AN ECHO</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
}

export default function MirrorEchoVaultLibraryScreen() {
  return <EchoLibraryContent />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  background: {
    flex: 1,
    justifyContent: 'flex-start',
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.XL,
    marginTop: 30, // Consistent with other title rows
  },

  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuIcon: {
    color: 'rgba(253,253,249,0.92)',
    fontSize: 22,
    marginTop: -1,
  },

  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 44,
  },

  inlineLogoHeader: {
    position: 'relative',
    top: 0,
  },

  iconSpacer: {
    width: 44,
    height: 44,
  },

  contentWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingTop: 0, // Header already has padding
    paddingHorizontal: SPACING.XL,
    paddingBottom: Platform.OS === 'ios' ? 18 : 12,
  },

  title: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 28,
    color: '#F2E2B1',
    textAlign: 'center',
    letterSpacing: 1.2,
    textShadowColor: COLORS.TEXT.TITLE,
    textShadowRadius: 8,
  },

  subtitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
    opacity: 0.9,
  },

  inboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
    marginBottom: 14,
  },

  inboxIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  inboxIconImage: {
    width: 14,
    height: 14,
    tintColor: 'rgba(242,226,177,0.9)',
  },

  inboxText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 25,
    lineHeight: 25,
    color: '#F2E2B1',
    letterSpacing: 0.6,
  },

  gradientWrapper: {
    width: '100%',
    borderRadius: SPACING.XL,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(229,214,176,0.18)',
  },

  card: {
    width: '100%',
    borderRadius: SPACING.LG,
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.LG,
    paddingBottom: SPACING.LG,
    alignSelf: 'center',
    ...SHADOWS.LIGHT,
    backgroundColor: 'rgba(12,17,31,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(229,214,176,0.12)',
    minHeight: SCREEN_DIMENSIONS.HEIGHT * 0.48,
    maxHeight: SCREEN_DIMENSIONS.HEIGHT * 0.56,
  },

  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229,214,176,0.12)',
  },

  headerTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },

  headerText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    letterSpacing: 1.2,
    textAlign: 'center',
  },

  activeHeader: {
    color: GOLD,
    fontFamily: 'CormorantGaramond-Bold',
  },

  inactiveHeader: {
    color: 'rgba(255,255,255,0.4)',
  },

  activeIndicator: {
    position: 'absolute',
    bottom: -1,
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: GOLD,
    borderRadius: 1,
  },

  listContent: {
    paddingTop: 10,
    paddingBottom: 6,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229,214,176,0.12)',
  },

  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 10,
  },

  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(229,214,176,0.75)',
    backgroundColor: 'rgba(229,214,176,0.1)',
  },

  rowTextWrap: {
    flex: 1,
  },

  rowTitle: {
    fontFamily: 'CormorantGaramond-Bold',
    fontSize: 14,
    color: 'rgba(253,253,249,0.92)',
  },

  rowSub: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 14,
    color: 'rgba(253,253,249,0.55)',
    marginTop: 2,
  },

  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  recipientText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 12,
    letterSpacing: 1.2,
    color: 'rgba(242,226,177,0.7)',
  },

  smallInfoCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(229,214,176,0.55)',
    backgroundColor: 'rgba(9,14,28,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  smallInfoText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 12,
    color: 'rgba(229,214,176,0.9)',
    marginTop: -1,
  },

  createButton: {
    width: '72%',
    maxWidth: 320,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(229,214,176,0.55)',
    backgroundColor: 'rgba(12,18,32,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },

  createText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    fontWeight: '400',
    color: 'rgba(242,226,177,0.95)',
    letterSpacing: 1.6,
  },

  // Loading/Error/Empty states
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GOLD,
  },
  retryText: {
    color: GOLD,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: SUBTEXT,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    color: SUBTEXT,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
});
