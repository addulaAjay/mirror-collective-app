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
import { SvgXml } from 'react-native-svg';
import { MOTIF_ICONS, getMotifIcon } from '@assets/motifs/MotifAssets';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';

type EchoLibraryNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MirrorEchoVaultLibrary'
>;

const GOLD = '#F2E2B1';
const SUBTEXT = 'rgba(253,253,249,0.92)';

// Mock data or icons if needed. Using local assets for consistency if available, otherwise icons.
// For Mail icon, we can use an image or existing icon component.
// Assuming we need to add specific styling.

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

          <LinearGradient
            colors={['rgba(253, 253, 249, 0.04)', 'rgba(253, 253, 249, 0.01)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.card}
          >
            {/* Echo Inbox Header */}
            <View style={styles.inboxHeader}>
              <View style={styles.inboxIconContainer}>
                <Image
                  source={require('@assets/mail.png')}
                  style={{ width: 24, height: 24, tintColor: GOLD }}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.inboxTitle}>Echo Inbox</Text>
            </View>

            <View style={{ flex: 1, width: '100%' }}>
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
                      {/* Recipient / Category Column */}
                      <View style={styles.rowLeft}>
                        {/* Avatar/Icon Group */}
                        <View style={styles.avatarGroup}>
                           <View style={styles.avatarContainer}>
                              {item.recipient?.motif && getMotifIcon(item.recipient.motif) ? (
                                <View style={{ width: 24, height: 24 }}>
                                  <SvgXml 
                                    xml={getMotifIcon(item.recipient.motif)?.xml || ''} 
                                    width="100%" 
                                    height="100%" 
                                  />
                                </View>
                              ) : item.recipient?.motif ? (
                                <Text style={{ fontSize: 18 }}>{item.recipient.motif}</Text>
                              ) : (
                                <Image 
                                  source={require('@assets/Group.png')} 
                                  style={styles.avatarImage} 
                                />
                              )}
                           </View>
                        </View>
                        
                        <View style={styles.rowTextWrap}>
                          <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                          <Text style={styles.rowSub}>
                             {item.scheduled_at ? `Unlocks ${formatDate(item.scheduled_at)}` : `Saved ${formatDate(item.created_at)}`}
                          </Text>
                        </View>
                      </View>

                      {/* Right Side: Recipient/Category Name */}
                      <View style={styles.rowRight}>
                         <Text style={styles.recipientText}>
                          {activeTab === 'RECIPIENT' 
                            ? (item.recipient?.name?.toUpperCase() || 'UNASSIGNED')
                            : (item.category?.toUpperCase() || 'UNCATEGORIZED')}
                        </Text>
                         <Text style={styles.arrowIcon}>{'>'}</Text>
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
              style={styles.createButton}
            >
              <Text style={styles.buttonText}>CREATE AN ECHO</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleManageRecipients}
              activeOpacity={0.9}
              style={styles.secondaryButton}
            >
              <Text style={styles.buttonText}>MANAGE RECIPIENTS</Text>
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
    paddingHorizontal: SPACING.XL,
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
  // INBOX HEADER
  inboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#A3B3CC',
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

  // CARD / LIST
  card: {
    width: '100%',
    borderRadius: 16,
    // paddingHorizontal: SPACING.LG, // Moved padding to children if needed
    // paddingTop: 0,
    // paddingBottom: SPACING.LG,
    alignSelf: 'center',
    ...SHADOWS.LIGHT,
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
    borderBottomWidth: 1,
    borderBottomColor: '#A3B3CC', // Default subtle border
    paddingBottom: 2,
  },
  headerText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 24,
    textAlign: 'center',
  },
  activeHeader: {
    color: '#FDFDF9', // Figma says text-paragraph-2 #FDFDF9 for Recipient?
    // Wait, Figma: RECIPIENT text color #FDFDF9, Category #A3B3CC
  },
  inactiveHeader: {
    color: '#A3B3CC', // text-inverse-paragraph-2
    borderBottomWidth: 0, // Inactive doesn't have border in Figma snippet? 
    // Actually Figma snippet shows: border-b for RECIPIENT.
  },
  activeIndicator: {
      // Replaced by borderBottom on tab
  },

  // LIST ROWS
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.25,
    borderBottomColor: '#D9A766', // border-brand-active
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
     borderColor: '#F2E2B1',
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
     color: '#FFFFFF',
     lineHeight: 26,
  },
  rowSub: {
     fontFamily: 'Inter-LightItalic', // Assuming font
     fontSize: 14,
     color: '#FFFFFF', // Italic text color
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
  createButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#A3B3CC',
    // backgroundColor: gradient handled in render? 
    // Figma uses gradient background for button.
    backgroundColor: 'rgba(253, 253, 249, 0.04)', // Approximate
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#A3B3CC',
    backgroundColor: 'rgba(253, 253, 249, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  title: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 28,
    color: GOLD,
    textAlign: 'center',
    textShadowColor: '#F0D4A8',
    textShadowRadius: 16,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: 'Inter-Light', // Assuming Inter-Light
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Removed old styles: iconButton, menuIcon, inlineLogoHeader, iconSpacer, inboxRow, inboxIconBox, etc.
});
