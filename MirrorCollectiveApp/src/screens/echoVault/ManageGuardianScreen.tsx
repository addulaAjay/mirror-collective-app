import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Platform,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  ManageGuardian: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'ManageGuardian'>;

const { width } = Dimensions.get('window');

const GOLD = '#D7C08A';
const OFFWHITE = 'rgba(253,253,249,0.92)';
const SUBTEXT = 'rgba(253,253,249,0.65)';
const BORDER = 'rgba(253,253,249,0.16)';
const SURFACE = 'rgba(7,9,14,0.35)';

const GUARDIANS = [
  { id: '1', name: 'EMMA', email: 'emma@email.com' },
  { id: '2', name: 'JAMES', email: 'james@email.com' },
  { id: '3', name: 'REBECCA', email: 'rebecca@email.com' },
  { id: '4', name: 'SARAH', email: 'sarah@email.com' },
];

const ManageGuardianScreen: React.FC<Props> = ({ navigation }) => {
  const contentWidth = Math.min(width * 0.88, 360);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <View style={styles.root}>
        {/* Background */}
        <LinearGradient
          colors={['#05060A', '#070915', '#0B0F1A']}
          style={StyleSheet.absoluteFill}
        />

        {/* Header */}
        <View style={[styles.header, { width: contentWidth }]}>
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={styles.iconText}>≡</Text>
          </TouchableOpacity>

          <View style={styles.brand}>
            <View style={styles.logoCircle} />
            <View>
              <Text style={styles.brandSmall}>The</Text>
              <Text style={styles.brandText}>MIRROR</Text>
              <Text style={styles.brandText}>COLLECTIVE</Text>
            </View>
          </View>

          <View style={{ width: 44 }} />
        </View>

        {/* Title */}
        <View style={[styles.titleRow, { width: contentWidth }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={styles.title}>MANAGE GUARDIAN</Text>

          <View style={{ width: 24 }} />
        </View>

        {/* Description */}
        <Text style={[styles.description, { width: contentWidth }]}>
          Selected recipients will be able to access your legacy echoes.
        </Text>

        {/* List */}
        <FlatList
          data={GUARDIANS}
          keyExtractor={item => item.id}
          style={{ width: contentWidth, marginTop: 10 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => <GuardianRow {...item} />}
        />

        {/* Add Guardian */}
        <TouchableOpacity style={styles.addWrap}>
          <View style={styles.addButton}>
            <Text style={styles.addText}>ADD GUARDIAN</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ManageGuardianScreen;

/* ---------------- ROW COMPONENT ---------------- */

const GuardianRow = ({ name, email }: { name: string; email: string }) => (
  <View style={styles.row}>
    <View style={styles.avatar}>
      <View style={styles.avatarInner} />
    </View>

    <View style={styles.rowText}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.email}>{email}</Text>
    </View>

    <TouchableOpacity style={styles.selectBtn}>
      <Text style={styles.selectText}>SELECT</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.deleteBtn}>
      <Text style={styles.deleteIcon}>🗑</Text>
    </TouchableOpacity>
  </View>
);

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#05060A' },
  root: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  },

  /* Header */
  header: {
    marginTop: 10,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: { width: 44, height: 44, justifyContent: 'center' },
  iconText: { color: OFFWHITE, fontSize: 22 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GOLD,
  },
  brandSmall: { color: GOLD, fontSize: 10, letterSpacing: 1 },
  brandText: { color: GOLD, fontSize: 12, letterSpacing: 2, lineHeight: 14 },

  /* Title */
  titleRow: {
    marginTop: 18,
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
});
