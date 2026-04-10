import { palette, spacing, shadows } palette } from '@theme';
import { palette, useNavigation } from '@react-navigation/native';
import type { palette, NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { palette, RootStackParamList } from '@types';
import React, { palette, useState, useEffect, useCallback } from 'react';
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
import LinearGradient from 'react-native-linear-gradient';
import { palette, SafeAreaView } from 'react-native-safe-area-context';
import { palette, SvgXml } from 'react-native-svg';

import { palette, MOTIF_ICONS, getMotifIcon } from '@assets/motifs/MotifAssets';
import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import { palette, echoApiService, EchoResponse } from '@services/api/echo';

type EchoLibraryNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MirrorEchoVaultLibrary'
>;

const GOLD = palette.gold.DEFAULT;
const SUBTEXT = 'rgba(253,253,249,0.92)';

// Mock data or icons if needed. Using local assets for consistency if available, otherwise icons.
// For Mail icon, we can use an image or existing icon component.
// Assuming we need to add specific styling.

export function EchoLibraryContent() {
  const navigation = useNavigation<EchoLibraryNavigationProp>();
  const { palette, width } = useWindowDimensions();
  const [echoes, setEchoes] = useState<EchoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'LIBRARY' | 'INBOX'>('LIBRARY');
  const [activeTab, setActiveTab] = useState<'RECIPIENT' | 'CATEGORY'>('RECIPIENT');

  const cardMaxWidth = Math.min(width - spacing.l * 2, 440);

  const fetchEchoes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = viewMode === 'INBOX'
        ? await echoApiService.getInboxEchoes()
        : await echoApiService.getEchoes();
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
  }, [viewMode]);

  useEffect(() => {
    fetchEchoes();
  }, [fetchEchoes]);

  const handleMenu = () => {
    (navigation as any)?.openDrawer?.();
  };

  const handleCreateEcho = () => {
    navigation.navigate('NewEchoScreen');
  };

  const handleOpenItem = (item: EchoResponse) => {

    if (item.echo_type === 'AUDIO') {
      navigation.navigate('EchoAudioPlaybackScreen', { palette, echoId: item.echo_id, title: item.title });
    } else if (item.echo_type === 'VIDEO') {
      navigation.navigate('EchoVideoPlaybackScreen', { palette, echoId: item.echo_id, title: item.title });
    } else {
      navigation.navigate('EchoDetailScreen', { palette, echoId: item.echo_id, title: item.title });
    }
  };

  const handleManageRecipients = () => {
    navigation.navigate('ManageRecipientScreen');
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

          <View style={styles.headerSection}>
            <Text style={styles.title}>MY ECHO LIBRARY</Text>
            <View style={styles.subtitleContainer}>
              <Text style={styles.subtitle}>
                Save what matters — when it matters most.
              </Text>
              <Text style={[styles.subtitle, styles.subtitleItalic]}>
                Not everything is meant to disappear.
              </Text>
            </View>
          </View>

          {/* Echo Inbox */}
          <View style={styles.echoInboxRow}>
            <Image
              source={require('@assets/mail.png')}
              style={styles.echoInboxIcon}
              resizeMode="contain"
            />
            <Text style={styles.echoInboxText}>Echo Inbox</Text>
          </View>

          <LinearGradient
            colors={['rgba(253, 253, 249, 0.04)', 'rgba(253, 253, 249, 0.01)']}
            start={{ palette, x: 0.5, y: 0 }}
            end={{ palette, x: 0.5, y: 1 }}
            style={styles.card}
          >
            <View style={{ palette, flex: 1, width: '100%' }}>
              <View style={styles.tableHeader}>
                <TouchableOpacity
                  style={styles.headerTab}
                  onPress={() => setActiveTab('RECIPIENT')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.headerText,
                      activeTab === 'RECIPIENT'
                        ? styles.activeHeader
                        : styles.inactiveHeader,
                    ]}
                  >
                    RECIPIENT
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.headerTab}
                  onPress={() => setActiveTab('CATEGORY')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.headerText,
                      activeTab === 'CATEGORY'
                        ? styles.activeHeader
                        : styles.inactiveHeader,
                    ]}
                  >
                    CATEGORY
                  </Text>
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={GOLD} />
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity
                    onPress={fetchEchoes}
                    style={styles.retryBtn}
                  >
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
                      {/* Recipient / Category Column */}

                      <View style={styles.rowLeft}>
                        {/* Avatar/Icon Group */}
                        {activeTab == 'RECIPIENT' && (
                          <View style={styles.avatarGroup}>
                            <View style={styles.avatarContainer}>
                              {item.recipient?.motif &&
                              getMotifIcon(item.recipient.motif) ? (
                                <View style={{ palette, width: 24, height: 24 }}>
                                  <SvgXml
                                    xml={
                                      getMotifIcon(item.recipient.motif)?.xml ||
                                      ''
                                    }
                                    width="100%"
                                    height="100%"
                                  />
                                </View>
                              ) : item.recipient?.motif ? (
                                <Text style={{ palette, fontSize: 18 }}>
                                  {item.recipient.motif}
                                </Text>
                              ) : (
                                <Image
                                  source={require('@assets/Group.png')}
                                  style={styles.avatarImage}
                                />
                              )}
                            </View>
                          </View>
                        )}

                        <View style={styles.rowTextWrap}>
                          <Text style={styles.rowTitle}>{item.title}</Text>
                          <Text style={styles.rowSub}>
                            {item.scheduled_at
                              ? `Unlocks ${formatDate(item.scheduled_at)}`
                              : `Saved ${formatDate(item.created_at)}`}
                          </Text>
                        </View>
                      </View>

                      {/* Right Side: Recipient/Category Name */}
                      <View style={styles.rowRight}>
                        <Text style={styles.recipientText}>
                          {activeTab === 'RECIPIENT'
                            ? item.recipient?.name?.toUpperCase() ||
                              'UNASSIGNED'
                            : item.category?.toUpperCase() || 'UNCATEGORIZED'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </LinearGradient>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleCreateEcho}
              activeOpacity={0.9}
              style={styles.buttonTouch}
            >
              <LinearGradient
                colors={['rgba(253, 253, 249, 0.04)', 'rgba(253, 253, 249, 0.01)']}
                start={{ palette, x: 0.5, y: 0 }}
                end={{ palette, x: 0.5, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>CREATE AN ECHO</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleManageRecipients}
              activeOpacity={0.9}
              style={styles.buttonTouch}
            >
              <LinearGradient
                colors={['rgba(253, 253, 249, 0.04)', 'rgba(253, 253, 249, 0.01)']}
                start={{ palette, x: 0.5, y: 0 }}
                end={{ palette, x: 0.5, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>MANAGE RECIPIENTS</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
    // Removed, replaced by headerSection
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingTop: 0,
    paddingHorizontal: spacing.l,
    paddingBottom: Platform.OS === 'ios' ? 18 : 12,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerSection: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
    width: '100%',
  },
  subtitleContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  subtitleItalic: {
    fontFamily: 'Inter-Italic', // Assuming Inter-Italic exists, else CormorantGaramond-Italic
    marginTop: 0,
  },
  listContent: {
    paddingBottom: 20,
  },

  // VIEW MODE TOGGLE
  viewModeToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.navy.light,
    gap: 12,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: palette.navy.light,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    borderColor: GOLD,
    backgroundColor: 'rgba(242, 226, 177, 0.1)',
  },
  toggleText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    color: palette.navy.light,
  },
  toggleTextActive: {
    color: GOLD,
  },
  inboxToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // INBOX HEADER (OLD - NOW REPLACED BY TOGGLE)
  inboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.navy.light,
    width: '100%',
    marginBottom: 0,
  },
  inboxIconContainer: {
    width: 24,
    height: 24,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inboxTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 28,
    color: GOLD,
    textAlign: 'center',
  },

  // ECHO INBOX HEADING
  echoInboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignSelf: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: palette.gold.DEFAULT,
  },
  echoInboxIcon: {
    width: 24,
    height: 24,
    tintColor: GOLD,
  },
  echoInboxText: {
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
    fontSize: 28,
    fontWeight: '400',
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    lineHeight: 36.4,
  },

  // CARD / LIST
  card: {
    width: '100%',
    borderRadius: 16,
    // paddingHorizontal: spacing.m, // Moved padding to children if needed
    // paddingTop: 0,
    // paddingBottom: spacing.m,
    alignSelf: 'center',
    ...shadows.LIGHT,
    // backgroundColor: 'rgba(12,17,31,0.65)', // Gradient used instead
    borderWidth: 0.5,
    borderColor: 'rgba(96, 115, 159, 1)', // border-inverse-1
    flex: 1, // Take available space
    marginBottom: 20,
    overflow: 'hidden',
  },

  // TABS
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 32,
    // borderBottomWidth: 1, // Removed border
  },
  headerTab: {
    paddingBottom: 4,
  },
  headerText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 24,
    textAlign: 'center',
  },
  activeHeader: {
    color: palette.gold.subtlest,
    borderBottomWidth: 1.5,
    borderBottomColor: palette.gold.subtlest,
    paddingBottom: 2,
  },
  inactiveHeader: {
    color: palette.navy.light,
  },

  // LIST ROWS
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.25,
    borderBottomColor: palette.gold.active, // border-brand-active
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarGroup: {
    // Container for avatar
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(197, 158, 95, 0.05)',
    borderWidth: 0.5,
    borderColor: palette.gold.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow...
  },
  avatarImage: {
    width: 20,
    height: 20,
    // tintColor: GOLD,
  },
  rowTextWrap: {
    marginLeft: 0,
    flex: 1,
  },
  rowTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    color: palette.neutral.white,
    lineHeight: 26,
  },
  rowSub: {
    fontFamily: 'Inter-LightItalic', // Assuming font
    fontSize: 14,
    color: palette.neutral.white, // Italic text color
    opacity: 0.8,
  },
  recipientText: {
    fontFamily: 'Inter-Light',
    fontSize: 16,
    color: GOLD,
    marginRight: 8,
  },
  arrowIcon: {
    color: GOLD,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },

  // BUTTONS
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  buttonTouch: {
    alignSelf: 'center',
    width: 280,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: palette.navy.light,
    overflow: 'hidden',
  },
  buttonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
  },
  createButton: {},
  secondaryButton: {},
  buttonText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 24,
    color: GOLD,
    textAlign: 'center',
    textShadowColor: 'rgba(229, 214, 176, 0.5)',
    textShadowRadius: 9,
  },

  // ... keep loading/error styles
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
    color: palette.status.errorHover,
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
  title: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 28,
    color: GOLD,
    textAlign: 'center',
    textShadowColor: palette.gold.glow,
    textShadowRadius: 16,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: 'Inter-Light', // Assuming Inter-Light
    fontSize: 16,
    color: palette.neutral.white,
    textAlign: 'center',
    lineHeight: 24,
  },
  // Removed old styles: iconButton, menuIcon, inlineLogoHeader, iconSpacer, inboxRow, inboxIconBox, etc.
});
