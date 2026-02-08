import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Platform,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { MOTIF_ICONS, getMotifIcon } from '@assets/motifs/MotifAssets';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundWrapper from '@components/BackgroundWrapper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@types';
import { echoApiService, Recipient } from '@services/api/echo';
import LogoHeader from '@components/LogoHeader';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageRecipientScreen'>;

const { width } = Dimensions.get('window');

const GOLD = '#D7C08A';
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

  useFocusEffect(
    useCallback(() => {
      fetchRecipients();
    }, [fetchRecipients])
  );

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
        {item.motif && getMotifIcon(item.motif) ? (
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
        <Text style={styles.deleteIcon}>🗑</Text>
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
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>

            <Text style={styles.title}>MANAGE{'\n'}RECIPIENTS</Text>

            <View style={{ width: 24 }} />
          </View>
        </View>

        {/* Description */}
        <Text style={[styles.description, { width: contentWidth }]}>
          Create and manage the people you want to leave echoes for.
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
          <TouchableOpacity style={styles.addWrap} onPress={handleAddRecipient}>
            <View style={styles.addButton}>
              <Text style={styles.addText}>ADD RECIPIENT</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.guardianWrap} onPress={handleManageGuardians}>
            <Text style={styles.guardianText}>MANAGE GUARDIANS</Text>
          </TouchableOpacity>
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
  title: {
    fontSize: 28,
    color: GOLD,
    letterSpacing: 2,
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
    textShadowColor: 'rgba(240, 212, 168, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
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
    fontSize: 14,
    color: OFFWHITE,
  },

  /* Buttons */
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    gap: 12,
  },
  addWrap: {
    width: '100%',
  },
  addButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.45)',
    backgroundColor: 'rgba(7,9,14,0.4)',
    alignItems: 'center',
  },
  addText: {
    color: GOLD,
    fontSize: 16,
    letterSpacing: 1.5,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },
  guardianWrap: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.25)',
    backgroundColor: 'rgba(7,9,14,0.2)',
    alignItems: 'center',
  },
  guardianText: {
    color: SUBTEXT,
    fontSize: 14,
    letterSpacing: 1.5,
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
  emptyText: {
    color: SUBTEXT,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
});
