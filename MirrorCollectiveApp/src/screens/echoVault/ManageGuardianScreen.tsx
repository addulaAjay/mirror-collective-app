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
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundWrapper from '@components/BackgroundWrapper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@types';
import { echoApiService, Guardian } from '@services/api/echo';
import LogoHeader from '@components/LogoHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageGuardianScreen'>;

const { width } = Dimensions.get('window');

const GOLD = '#D7C08A';
const OFFWHITE = 'rgba(253,253,249,0.92)';
const SUBTEXT = 'rgba(253,253,249,0.65)';
const BORDER = 'rgba(253,253,249,0.16)';
const SURFACE = 'rgba(7,9,14,0.35)';

const ManageGuardianScreen: React.FC<Props> = ({ navigation }) => {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const contentWidth = Math.min(width * 0.88, 360);

  const fetchGuardians = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await echoApiService.getGuardians();
      if (response.success && response.data) {
        setGuardians(response.data);
      } else {
        setError(response.error || 'Failed to load guardians');
      }
    } catch (err) {
      setError('Failed to load guardians');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuardians();
  }, [fetchGuardians]);

  const handleRemoveGuardian = async (id: string) => {
    Alert.alert(
      'Remove Guardian',
      'Are you sure you want to remove this guardian?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await echoApiService.removeGuardian(id);
              if (response.success) {
                setGuardians(prev => prev.filter(g => g.guardian_id !== id));
              } else {
                Alert.alert('Error', response.error || 'Failed to remove guardian');
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to remove guardian');
            }
          },
        },
      ]
    );
  };

  const handleAddGuardian = () => {
    navigation.navigate('AddNewProfileScreen');
  };

  const renderGuardianRow = ({ item }: { item: Guardian }) => (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <View style={styles.avatarInner} />
      </View>

      <View style={styles.rowText}>
        <Text style={styles.name}>{item.name.toUpperCase()}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>

      <TouchableOpacity style={styles.selectBtn}>
        <Text style={styles.selectText}>SELECT</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleRemoveGuardian(item.guardian_id)}
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

            <Text style={styles.title}>MANAGE{'\n'}GUARDIAN</Text>

            <View style={{ width: 24 }} />
          </View>
        </View>

        {/* Description */}
        <Text style={[styles.description, { width: contentWidth }]}>
          Selected recipients will be able to access your legacy echoes.
        </Text>

        {/* List */}
        {loading ? (
          <ActivityIndicator size="large" color={GOLD} style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchGuardians} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={guardians}
            keyExtractor={item => item.guardian_id}
            style={{ width: contentWidth, marginTop: 10 }}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={renderGuardianRow}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No guardians added yet</Text>
            }
          />
        )}

        {/* Add Guardian */}
        <TouchableOpacity style={styles.addWrap} onPress={handleAddGuardian}>
          <View style={styles.addButton}>
            <Text style={styles.addText}>ADD GUARDIAN</Text>
          </View>
        </TouchableOpacity>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default ManageGuardianScreen;

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
    fontSize: 26,
    color: GOLD,
    letterSpacing: 1.5,
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
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

  selectBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.45)',
    marginRight: 8,
  },
  selectText: {
    color: GOLD,
    fontSize: 12,
    letterSpacing: 1,
  },

  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: {
    fontSize: 14,
    color: OFFWHITE,
  },

  /* Add button */
  addWrap: {
    marginBottom: 20,
  },
  addButton: {
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.45)',
    backgroundColor: 'rgba(7,9,14,0.4)',
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
