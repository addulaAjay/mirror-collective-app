import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
  FlatList,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundWrapper from '@components/BackgroundWrapper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@types';
import { echoApiService, Guardian } from '@services/api/echo';
import LogoHeader from '@components/LogoHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'ChooseGuardianScreen'>;

const { width } = Dimensions.get('window');

const GOLD = '#D7C08A';
const OFFWHITE = 'rgba(253,253,249,0.92)';
const SUBTEXT = 'rgba(253,253,249,0.65)';
const BORDER = 'rgba(253,253,249,0.18)';
const SURFACE = 'rgba(7,9,14,0.35)';

const ChooseGuardianScreen: React.FC<Props> = ({ navigation }) => {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuardian, setSelectedGuardian] = useState<Guardian | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notes, setNotes] = useState('');
  const [scope, setScope] = useState<string[]>([]);
  const [triggers, setTriggers] = useState<string[]>([]);

  const contentWidth = Math.min(width * 0.88, 360);

  const fetchGuardians = useCallback(async () => {
    try {
      setLoading(true);
      const response = await echoApiService.getGuardians();
      if (response.success && response.data) {
        setGuardians(response.data);
      }
    } catch (err) {
      console.error('Failed to load guardians:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuardians();
  }, [fetchGuardians]);

  const toggle = (
    value: string,
    list: string[],
    setList: (v: string[]) => void,
  ) => {
    setList(
      list.includes(value) ? list.filter(v => v !== value) : [...list, value],
    );
  };

  const handleSelectGuardian = (guardian: Guardian) => {
    setSelectedGuardian(guardian);
    setShowDropdown(false);
  };

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

            <Text style={styles.title}>CHOOSE YOUR{'\n'}GUARDIAN</Text>

            <View style={{ width: 24 }} />
          </View>
        </View>

        {/* Description */}
        <Text style={[styles.description, { width: contentWidth }]}>
          Designate a person(s) to receive your memories. Nothing is shared
          until your chosen triggers occur.
        </Text>

        {/* Content */}
        <View style={[styles.content, { width: contentWidth }]}>
          {/* Guardian dropdown */}
          <Text style={styles.label}>Guardian</Text>
          <TouchableOpacity
            style={styles.inputShell}
            onPress={() => setShowDropdown(true)}
          >
            <Text style={selectedGuardian ? styles.selectedText : styles.placeholder}>
              {selectedGuardian ? selectedGuardian.name : 'Choose from list'}
            </Text>
            <Text style={styles.chevron}>▾</Text>
          </TouchableOpacity>

          {/* Scope of Access */}
          <SectionCard title="Scope of Access">
            <CheckRow
              label="Entire Vault"
              checked={scope.includes('vault')}
              onPress={() => toggle('vault', scope, setScope)}
            />
            <CheckRow
              label="Selected folders"
              checked={scope.includes('folders')}
              onPress={() => toggle('folders', scope, setScope)}
            />
            <CheckRow
              label="Legacy Capsule"
              checked={scope.includes('legacy')}
              onPress={() => toggle('legacy', scope, setScope)}
            />
          </SectionCard>

          {/* Activation Trigger */}
          <SectionCard title="Activation Trigger">
            <CheckRow
              label="Verified Passing"
              checked={triggers.includes('passing')}
              onPress={() => toggle('passing', triggers, setTriggers)}
            />
            <CheckRow
              label="Time-lock"
              checked={triggers.includes('time')}
              onPress={() => toggle('time', triggers, setTriggers)}
            />
            <CheckRow
              label="Prolonged Inactivity"
              checked={triggers.includes('inactive')}
              onPress={() => toggle('inactive', triggers, setTriggers)}
            />
          </SectionCard>

          {/* Letter */}
          <Text style={[styles.label, { marginTop: 18 }]}>
            Letter to Guardian
          </Text>
          <View style={[styles.inputShell, styles.textArea]}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Write notes here"
              placeholderTextColor="rgba(253,253,249,0.45)"
              multiline
              style={styles.textAreaInput}
            />
          </View>
        </View>

        {/* Dropdown Modal */}
        <Modal
          visible={showDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDropdown(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDropdown(false)}
          >
            <View style={[styles.dropdownContainer, { width: contentWidth }]}>
              <Text style={styles.dropdownTitle}>Select Guardian</Text>
              {loading ? (
                <ActivityIndicator size="small" color={GOLD} />
              ) : guardians.length === 0 ? (
                <Text style={styles.emptyText}>No guardians available</Text>
              ) : (
                <FlatList
                  data={guardians}
                  keyExtractor={(item, index) => item.guardian_id || index.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => handleSelectGuardian(item)}
                    >
                      <Text style={styles.dropdownItemName}>{item.name}</Text>
                      <Text style={styles.dropdownItemEmail}>{item.email}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default ChooseGuardianScreen;

/* ---------------- SUB COMPONENTS ---------------- */

const SectionCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.infoIcon}>ⓘ</Text>
    </View>
    {children}
  </View>
);

const CheckRow = ({
  label,
  checked,
  onPress,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.checkRow} onPress={onPress}>
    <View style={[styles.checkbox, checked && styles.checkboxActive]} />
    <Text style={styles.checkLabel}>{label}</Text>
  </TouchableOpacity>
);

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
    textAlign: 'center',
    color: GOLD,
    fontSize: 26,
    letterSpacing: 1.5,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },

  description: {
    marginTop: 12,
    textAlign: 'center',
    color: SUBTEXT,
    fontSize: 14,
    lineHeight: 20,
  },

  /* Content */
  content: { marginTop: 14 },

  label: {
    color: GOLD,
    fontSize: 16,
    marginBottom: 6,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },

  inputShell: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  placeholder: { color: 'rgba(253,253,249,0.55)', fontSize: 15 },
  selectedText: { color: OFFWHITE, fontSize: 15 },
  chevron: { color: OFFWHITE, fontSize: 16 },

  /* Cards */
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    padding: 14,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    color: GOLD,
    fontSize: 16,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },
  infoIcon: { color: GOLD, fontSize: 14 },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 6,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: GOLD,
  },
  checkboxActive: {
    backgroundColor: 'rgba(215,192,138,0.7)',
  },
  checkLabel: {
    color: OFFWHITE,
    fontSize: 14,
  },

  textArea: {
    height: 120,
    alignItems: 'flex-start',
  },
  textAreaInput: {
    flex: 1,
    width: '100%',
    color: OFFWHITE,
    fontSize: 15,
    textAlignVertical: 'top',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    backgroundColor: '#0B0F1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    maxHeight: 300,
  },
  dropdownTitle: {
    color: GOLD,
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  dropdownItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  dropdownItemName: {
    color: OFFWHITE,
    fontSize: 16,
  },
  dropdownItemEmail: {
    color: SUBTEXT,
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    color: SUBTEXT,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
