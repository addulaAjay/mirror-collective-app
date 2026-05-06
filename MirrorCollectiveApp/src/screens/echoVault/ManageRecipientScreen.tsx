
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { palette, fontFamily, textShadow } from '@theme';
import { RootStackParamList } from '@types';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { getMotifIcon } from '@assets/motifs/MotifAssets';
import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button/Button';
import LogoHeader from '@components/LogoHeader';
import { echoApiService, Recipient } from '@services/api/echo';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageRecipientScreen'>;

const GOLD = palette.gold.mid;

const ManageRecipientScreen: React.FC<Props> = ({ navigation }) => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch {
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

  const handleRemoveRecipient = (id: string) => {
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
            } catch {
              Alert.alert('Error', 'Failed to remove recipient');
            }
          },
        },
      ],
    );
  };

  const renderAvatar = (item: Recipient) => {
    const motifIcon = item.motif ? getMotifIcon(item.motif) : null;
    const initials = item.name
      .split(' ')
      .map(w => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    return (
      <View style={styles.avatarGlow}>
        <View style={styles.avatarRing}>
          {item.profile_image_url ? (
            <Image
              source={{ uri: item.profile_image_url }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : motifIcon ? (
            <SvgXml xml={motifIcon.xml} width={28} height={28} />
          ) : item.motif ? (
            <Text style={styles.avatarEmoji}>{item.motif}</Text>
          ) : (
            <Text style={styles.avatarInitials}>{initials}</Text>
          )}
        </View>
      </View>
    );
  };

  const renderRow = ({ item, index }: { item: Recipient; index: number }) => {
    const isLast = index === recipients.length - 1;
    return (
      <View style={[styles.row, !isLast && styles.rowBorder]}>
        <View style={styles.rowLeft}>
          {renderAvatar(item)}
          <View style={styles.rowText}>
            <Text style={styles.name}>{item.name.toUpperCase()}</Text>
            <Text style={styles.email}>{item.email}</Text>
          </View>
        </View>

        <View style={styles.rowRight}>
          {item.has_shared_echoes && (
            <Text style={styles.sharedBadge}>SHARED</Text>
          )}
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => handleRemoveRecipient(item.recipient_id)}
          >
            <Image
              source={require('@assets/delete.png')}
              style={styles.deleteIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <BackgroundWrapper style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LogoHeader navigation={navigation} />

        <View style={styles.container}>
          {/* Title row */}
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Image
                source={require('@assets/back-arrow.png')}
                style={styles.backArrow}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text style={styles.title}>MANAGE RECIPIENTS</Text>
            <View style={styles.titleSpacer} />
          </View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>Choose who can access echoes you share.</Text>

          {/* Recipient list */}
          {loading ? (
            <ActivityIndicator size="large" color={GOLD} style={styles.loader} />
          ) : error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={fetchRecipients} style={styles.retryBtn}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={recipients}
              keyExtractor={item => item.recipient_id}
              renderItem={renderRow}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No recipients added yet.</Text>
              }
            />
          )}

          {/* Add Recipient button */}
          <View style={styles.addButtonWrap}>
            <Button
              variant="secondary"
              size="L"
              title="ADD RECIPIENT"
              onPress={() => navigation.navigate('AddNewProfileScreen')}
            />
          </View>
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default ManageRecipientScreen;

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, backgroundColor: 'transparent' },

  container: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 24,
    marginTop: 20,
  },

  /* Title */
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backArrow: {
    width: 20,
    height: 20,
    tintColor: GOLD,
  },
  titleSpacer: { width: 20 },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 28,
    lineHeight: 32,
    color: palette.gold.warm,
    fontFamily: 'CormorantGaramond-Regular',
    letterSpacing: 1,
    textShadowColor: textShadow.glowSubtle.color,
    textShadowOffset: textShadow.glowSubtle.offset,
    textShadowRadius: 10,
  },

  /* Subtitle */
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    color: palette.neutral.white,
    fontFamily: fontFamily.bodyLight,
    marginTop: -8,
  },

  /* List */
  list: { flex: 1, marginTop: -8 },
  listContent: { paddingBottom: 16 },

  /* Row */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingLeft: 16,
  },
  rowBorder: {
    borderBottomWidth: 0.25,
    borderBottomColor: '#a3b3cc',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  /* Avatar — mirrors EchoVaultLibraryScreen two-layer pattern */
  avatarGlow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    boxShadow: '0px 0px 10px 3px rgba(240, 212, 168, 0.3)',
    shadowColor: palette.gold.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarRing: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.gold.DEFAULT,
    backgroundColor: 'rgba(197,158,95,0.05)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    position: 'absolute',
    width: '100%',
    height: '150%',
    top: '-7%',
    left: 0,
  },
  avatarEmoji: { fontSize: 18 },
  avatarInitials: {
    fontSize: 15,
    color: palette.gold.warm,
    fontFamily: 'CormorantGaramond-Regular',
    letterSpacing: 0.5,
  },

  /* Row text */
  rowText: { flex: 1 },
  name: {
    fontSize: 20,
    lineHeight: 24,
    color: palette.neutral.white,
    fontFamily: 'CormorantGaramond-Regular',
  },
  email: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.neutral.white,
    fontFamily: fontFamily.bodyItalic,
  },

  /* SHARED badge */
  sharedBadge: {
    fontSize: 16,
    lineHeight: 24,
    color: palette.gold.warm,
    fontFamily: fontFamily.bodyLight,
  },

  /* Delete icon */
  deleteIcon: {
    width: 20,
    height: 20,
    tintColor: palette.neutral.white,
  },

  /* Add button */
  addButtonWrap: { alignItems: 'center', paddingBottom: 24 },

  /* States */
  loader: { marginTop: 40 },
  errorBox: { alignItems: 'center', marginTop: 40 },
  errorText: { color: palette.status.errorHover, fontSize: 14, textAlign: 'center', marginBottom: 12 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: GOLD },
  retryText: { color: GOLD, fontSize: 14 },
  emptyText: { color: 'rgba(253,253,249,0.5)', fontSize: 14, textAlign: 'center', marginTop: 40 },
});
