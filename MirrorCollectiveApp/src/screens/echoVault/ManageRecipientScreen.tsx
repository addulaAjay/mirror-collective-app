
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { palette, textShadow } from '@theme';
import { RootStackParamList } from '@types';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { MOTIF_ICONS, getMotifIcon } from '@assets/motifs/MotifAssets';
import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import { echoApiService, Recipient } from '@services/api/echo';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageRecipientScreen'>;

const { width } = Dimensions.get('window');

const GOLD = palette.gold.mid;
const OFFWHITE = 'rgba(253,253,249,0.92)';
const SUBTEXT = 'rgba(253,253,249,0.65)';
const BORDER = 'rgba(253,253,249,0.16)';
const SURFACE = 'rgba(7,9,14,0.35)';

const ManageRecipientScreen: React.FC<Props> = ({ navigation }) => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const contentWidth = Math.min(width * 0.88, 360);

  const fetchRecipients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await echoApiService.getRecipients();
      if (response.success && response.data) {
        setRecipients(response.data);
      } else {
        setError(response.error || 'Failed to load recipients');
      }
    } catch (err) {
      setError('Failed to load recipients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipients();
    const unsubscribe = navigation.addListener('focus', fetchRecipients);
    return unsubscribe;
  }, [navigation, fetchRecipients]);

  const handleRemoveRecipient = async (id: string) => {
    Alert.alert(
      'Remove Recipient',
      'Are you sure you want to remove this recipient?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await echoApiService.removeRecipient(id);
              if (response.success) {
                setRecipients(prev => prev.filter(r => r.recipient_id !== id));
              } else {
                Alert.alert('Error', response.error || 'Failed to remove recipient');
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to remove recipient');
            }
          },
        },
      ]
    );
  };

  const handleAddRecipient = () => {
    navigation.navigate('AddNewProfileScreen');
  };

  const handleManageGuardians = () => {
    navigation.navigate('ManageGuardianScreen');
  };

  const renderRecipientRow = ({ item }: { item: Recipient }) => (
    <View style={styles.row}>
      <View style={styles.avatar}>
        {item.profile_image_url ? (
          <Image
            source={{ uri: item.profile_image_url }}
            style={styles.avatarImg}
            resizeMode="cover"
          />
        ) : item.motif && getMotifIcon(item.motif) ? (
          <View style={{ width: 28, height: 28 }}>
            <SvgXml
              xml={getMotifIcon(item.motif)?.xml || ''}
              width="100%"
              height="100%"
            />
          </View>
        ) : item.motif ? (
          <Text style={{ fontSize: 20 }}>{item.motif}</Text>
        ) : (
          <View style={styles.avatarInner} />
        )}
      </View>

      <View style={styles.rowText}>
        <Text style={styles.name}>{item.name.toUpperCase()}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleRemoveRecipient(item.recipient_id)}
      >
        <Image source={require('@assets/delete.png')} style={styles.deleteIcon} resizeMode="contain" />
      </TouchableOpacity>
    </View>
  );

  return (
    <BackgroundWrapper style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />

        <LogoHeader navigation={navigation} />

        {/* Title */}
        <View style={styles.titleRowContainer}>
          <View style={[styles.titleRow, { width: contentWidth }]}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Image source={require('@assets/back-arrow.png')} style={styles.backArrowImg} resizeMode="contain" />
            </TouchableOpacity>

            <Text style={styles.title}>MANAGE{'\n'}RECIPIENTS</Text>

            <View style={{ width: 24 }} />
          </View>
        </View>

        {/* Description */}
        <Text style={[styles.description, { width: contentWidth }]}>
          Choose who can access echoes you share.
        </Text>

        {/* List */}
        {loading ? (
          <ActivityIndicator size="large" color={GOLD} style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchRecipients} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={recipients}
            keyExtractor={item => item.recipient_id}
            style={{ width: contentWidth, marginTop: 10, flex: 1 }}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={renderRecipientRow}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No recipients added yet</Text>
            }
          />
        )}

        {/* Buttons */}
        <View style={[styles.buttonContainer, { width: contentWidth }]}>
          <TouchableOpacity activeOpacity={0.8} onPress={handleAddRecipient}>
            <LinearGradient
              colors={['rgba(253,253,249,0.04)', 'rgba(253,253,249,0.01)']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.addButton}
            >
              <Text style={styles.addText}>ADD RECIPIENT</Text>
            </LinearGradient>
          </TouchableOpacity>

          <LinearGradient
            colors={['rgba(253,253,249,0.04)', 'rgba(253,253,249,0.01)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.guardianCard}
          >
            <Text style={styles.guardianCardTitle}>Need a Vault Guardian?</Text>
            <Text style={styles.guardianCardDesc}>
              Choose someone you trust to manage {'\n'} access if something happens to you.
            </Text>
            <TouchableOpacity activeOpacity={0.9} onPress={handleManageGuardians}>
              <LinearGradient
                colors={['rgba(253, 253, 249, 0.04)', 'rgba(253,253,249,0.01)']}
                start={{ x: 0.5, y: 1 }}
                end={{ x: 0.5, y: 0 }}
                style={styles.guardianWrap}
              >
                <Text style={styles.guardianText}>MANAGE GUARDIANS</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default ManageRecipientScreen;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent', alignItems: 'center' },
  root: {
    flex: 1,
  },

  /* Title */
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
  backArrow: { fontSize: 22, color: GOLD },
  backArrowImg: { width: 20, height: 20, tintColor: GOLD },
  title: {
    fontSize: 28,
    color: GOLD,
    letterSpacing: 2,
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
    textShadowColor: textShadow.glowSubtle.color,
    textShadowOffset: textShadow.glowSubtle.offset,
    textShadowRadius: 16,
  },

  description: {
    marginTop: 10,
    textAlign: 'center',
    color: SUBTEXT,
    fontSize: 14,
    lineHeight: 20,
  },

  /* Row */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(215,192,138,0.08)',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 21,
  },
  avatarInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: GOLD,
    opacity: 0.8,
  },

  rowText: { flex: 1, marginLeft: 12 },
  name: {
    color: OFFWHITE,
    fontSize: 15,
    letterSpacing: 1,
  },
  email: {
    color: SUBTEXT,
    fontSize: 12,
    marginTop: 2,
  },

  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  deleteIcon: {
    width: 16,
    height: 16,
    tintColor: OFFWHITE,
  },

  /* Buttons */
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    gap: 12,
    alignItems: 'center',
  },
  addButton: {
    // paddingVertical: 12,
    // paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: palette.navy.light,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  addText: {
    color: palette.gold.warm,
    fontSize: 24,
    letterSpacing: 2,
    padding: 14,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Medium',
      android: 'serif',
    }),
    textShadowColor: textShadow.glowSubtle.color,
    textShadowOffset: textShadow.glowSubtle.offset,
    textShadowRadius: textShadow.glowSubtle.radius,
  },
  guardianCard: {
    width: '100%',
    borderRadius: 16,
    // borderWidth: 1,
    // borderColor: 'rgba(215,192,138,0.25)',
    // paddingVertical: 16,
    // paddingHorizontal: 0,
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(229,214,176,0.25)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
      },
      android: {
        boxShadow: '0 4 19 4 rgba(0,0,0,0.10), 0 0 15 2 rgba(229,214,176,0.25)',
      },
    }),
  },
  guardianCardTitle: {
    color: palette.gold.warm,
    fontSize: 16,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
    marginBottom: 6,
    paddingTop: 10,
  },
  guardianCardDesc: {
    color: SUBTEXT,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 14,
  },
  guardianWrap: {
    // paddingVertical: 8,
    // paddingHorizontal: 20,
    marginBottom: 10,
    borderRadius: 13,
    borderWidth: 0.25,
    minHeight: 44,
    borderColor: palette.navy.muted,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(229,214,176,0.25)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
      },
      android: {
        boxShadow: '0 4 19 4 rgba(0,0,0,0.10), 0 0 15 2 rgba(229,214,176,0.25)',
      },
    }),
  },
  guardianText: {
    color: palette.gold.warm,
    fontSize: 20,
    letterSpacing: 1.5,
    paddingHorizontal: 10,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },

  /* Error/Empty states */
  errorContainer: {
    marginTop: 40,
    alignItems: 'center',
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
  emptyText: {
    color: SUBTEXT,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
});
