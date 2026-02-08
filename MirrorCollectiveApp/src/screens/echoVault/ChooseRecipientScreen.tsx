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
import { echoApiService, Recipient } from '@services/api/echo';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';

type Props = NativeStackScreenProps<RootStackParamList, 'ChooseRecipientScreen'>;

const { width } = Dimensions.get('window');

const GOLD = '#D7C08A';
const OFFWHITE = 'rgba(253,253,249,0.92)';
const SUBTEXT = 'rgba(253,253,249,0.65)';
const BORDER = 'rgba(253,253,249,0.18)';

const ChooseRecipientScreen: React.FC<Props> = ({ navigation, route }) => {
  const { title, category, mode } = route.params; 
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [legacy, setLegacy] = useState<'yes' | 'no' | null>(null);
  const [unlockOnDeath, setUnlockOnDeath] = useState(false);
  const [notes, setNotes] = useState('');

  const contentWidth = Math.min(width * 0.88, 360);

  const fetchRecipients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await echoApiService.getRecipients();
      if (response.success && response.data) {
        setRecipients(response.data);
      }
    } catch (err) {
      console.error('Failed to load recipients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  const handleSelectRecipient = (recipient: Recipient) => {
    setSelectedRecipient(recipient);
    setShowDropdown(false);
  };

  const handleNext = () => {
    if (selectedRecipient) {
      // Navigate to next screen with recipient data
      navigation.navigate('NewEchoComposeScreen', {
        mode,
        title,
        category,
        hasRecipient: true,
        recipient: selectedRecipient,
        recipientId: selectedRecipient.recipient_id,
        recipientName: selectedRecipient.name,
      });
    }
  };

  return (
    <BackgroundWrapper style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />

        {/* Header */}
        {/* Header */}
        <LogoHeader navigation={navigation} />

        {/* Title */}
        <View style={[styles.titleRow, { width: contentWidth }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={styles.title}>CHOOSE YOUR{'\n'}RECIPIENT</Text>

          <View style={{ width: 24 }} />
        </View>

        {/* Content */}
        <View style={[styles.content, { width: contentWidth }]}>
          {/* Recipient dropdown */}
          <Text style={styles.label}>Recipient</Text>
          <TouchableOpacity
            style={styles.inputShell}
            onPress={() => setShowDropdown(true)}
          >
            <Text style={selectedRecipient ? styles.selectedText : styles.placeholder}>
              {selectedRecipient ? selectedRecipient.name : 'Choose from list'}
            </Text>
            <Text style={styles.chevron}>▾</Text>
          </TouchableOpacity>

          {/* Legacy */}
          <View style={styles.legacyRow}>
            <Text style={styles.label}>Legacy</Text>
            <TouchableOpacity hitSlop={10}>
              <Text style={styles.infoIcon}>ⓘ</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subLabel}>Is this a legacy echo?</Text>

          <View style={styles.row}>
            <CheckOption
              label="YES"
              active={legacy === 'yes'}
              onPress={() => setLegacy('yes')}
            />
            <CheckOption
              label="NO"
              active={legacy === 'no'}
              onPress={() => setLegacy('no')}
            />
          </View>

          {/* Lock date */}
          <Text style={[styles.label, { marginTop: 18 }]}>
            Lock Date <Text style={styles.subtle}>(only if required)</Text>
          </Text>

          <View style={styles.inputShell}>
            <Text style={styles.placeholder}>When do you want to open it?</Text>
            <Text style={styles.calendar}>📅</Text>
          </View>

          {/* Unlock on death */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => setUnlockOnDeath(!unlockOnDeath)}
          >
            <View
              style={[styles.checkbox, unlockOnDeath && styles.checkboxActive]}
            />
            <Text style={styles.checkboxLabel}>Unlock upon death</Text>
          </TouchableOpacity>

          {/* Letter */}
          <Text style={[styles.label, { marginTop: 18 }]}>
            Letter to Recipient
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

        {/* Next */}
        <TouchableOpacity
          style={[styles.nextAction, !selectedRecipient && styles.disabled]}
          onPress={handleNext}
          disabled={!selectedRecipient}
        >
          <StarIcon width={24} height={24} color={GOLD} />
          <Text style={styles.nextActionText}>NEXT</Text>
          <StarIcon width={24} height={24} color={GOLD} />
        </TouchableOpacity>

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
              <Text style={styles.dropdownTitle}>Select Recipient</Text>
              {loading ? (
                <ActivityIndicator size="small" color={GOLD} />
              ) : recipients.length === 0 ? (
                <Text style={styles.emptyText}>No recipients available</Text>
              ) : (
                <FlatList
                  data={recipients}
                  keyExtractor={item => item.recipient_id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => handleSelectRecipient(item)}
                    >
                      <Text style={styles.dropdownItemName}>{item.name}</Text>
                      <Text style={styles.dropdownItemEmail}>{item.email}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
              {/* Add New Recipient Button */}
              <TouchableOpacity
                style={styles.addNewButton}
                onPress={() => {
                   setShowDropdown(false);
                   navigation.navigate('AddNewProfileScreen');
                }}
              >
                  <Text style={styles.addNewText}>+ Add New Recipient</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default ChooseRecipientScreen;

/* ---------------- COMPONENTS ---------------- */

const CheckOption = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.checkOption} onPress={onPress}>
    <View style={[styles.checkbox, active && styles.checkboxActive]} />
    <Text style={styles.checkLabel}>{label}</Text>
  </TouchableOpacity>
);

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent', alignItems: 'center' },
  root: {
    flex: 1,
  },

  /* Header */
  header: {
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
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backArrow: { fontSize: 22, color: GOLD },
  title: {
    textAlign: 'center',
    color: GOLD,
    fontSize: 28,
    letterSpacing: 0,
    textShadowColor: GOLD,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },

  /* Content */
  content: { marginTop: 10 },

  label: {
    color: GOLD,
    fontSize: 20,
    marginBottom: 6,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Medium',
      android: 'serif',
    }),
  },
  subLabel: {
    color: '#60739F',
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: 'Inter-Italic',
      android: 'sans-serif',
    }),
  },
  subtle: { 
    color: GOLD, 
    fontSize: 14,
    fontFamily: Platform.select({
      ios: 'Inter-Light',
      android: 'sans-serif',
    }),
    opacity: 0.8,
  },

  inputShell: {
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#60739F',
    backgroundColor: 'rgba(253,253,249,0.04)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    minHeight: 48,
  },
  placeholder: {
    color: 'rgba(253,253,249,0.55)',
    fontSize: 15,
  },
  selectedText: {
    color: OFFWHITE,
    fontSize: 15,
  },
  chevron: { color: OFFWHITE, fontSize: 16 },
  calendar: { fontSize: 16 },

  legacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    marginBottom: 6,
  },
  infoIcon: { 
    color: GOLD, 
    fontSize: 16,
    opacity: 0.8,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 10,
  },

  checkOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 0, // Making it a square for now, or match Figma's Component 7
    borderWidth: 1,
    borderColor: GOLD,
    backgroundColor: 'transparent',
  },
  checkboxActive: {
    backgroundColor: 'rgba(215,192,138,0.7)',
  },
  checkLabel: {
    color: GOLD,
    fontSize: 14,
    fontFamily: Platform.select({
      ios: 'Inter-Regular',
      android: 'sans-serif',
    }),
  },
  checkboxLabel: {
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

  /* Next */
  nextAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  nextActionText: {
    color: GOLD,
    fontSize: 24,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
    textShadowColor: 'rgba(229, 214, 176, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 9,
    letterSpacing: 2,
  },
  disabled: {
    opacity: 0.5,
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
  addNewButton: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    alignItems: 'center',
  },
  addNewText: {
    color: GOLD,
    fontSize: 16,
    fontFamily: Platform.select({
       ios: 'CormorantGaramond-SemiBold',
       android: 'serif',
    }),
  },
});
