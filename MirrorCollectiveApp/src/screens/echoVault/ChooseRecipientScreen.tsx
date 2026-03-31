import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@types';
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
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';
import { echoApiService, Recipient } from '@services/api/echo';

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
  const [showGuardianPrompt, setShowGuardianPrompt] = useState(false);
  const [lockDate, setLockDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

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
      // Show guardian prompt modal
      setShowGuardianPrompt(true);
    }
  };

  const handleGuardianPromptYes = () => {
    setShowGuardianPrompt(false);
    // Navigate to ChooseGuardianScreen
    navigation.navigate('ChooseGuardianScreen', {
      mode,
      title,
      category,
      recipientId: selectedRecipient?.recipient_id,
      recipientName: selectedRecipient?.name,
      lockDate: lockDate?.toISOString(),
      unlockOnDeath,
    });
  };

  const handleGuardianPromptNo = () => {
    setShowGuardianPrompt(false);
    // Navigate directly to compose
    navigation.navigate('NewEchoComposeScreen', {
      mode,
      title,
      category,
      hasRecipient: true,
      recipient: selectedRecipient,
      recipientId: selectedRecipient?.recipient_id,
      recipientName: selectedRecipient?.name,
      unlockOnDeath,
      lockDate: lockDate?.toISOString(),
      // No guardianId
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // Close picker on both platforms when date is selected or dismissed
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (event.type === 'dismissed' || event.type === 'set') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setLockDate(selectedDate);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
            <Image source={require('@assets/back-arrow.png')} style={styles.backArrowImg} resizeMode="contain" />
          </TouchableOpacity>

          <Text style={styles.title}>CHOOSE YOUR{'\n'}RECIPIENT</Text>

          <View style={{ width: 24 }} />
        </View>

        {/* Content */}
        <View style={[styles.content, { width: contentWidth }]}>
          {/* Recipient dropdown */}
          <Text style={styles.label}>Recipient</Text>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setShowDropdown(true)}
            style={{ width: '100%' }}
          >
            <LinearGradient
              colors={['rgba(253,253,249,0.04)', 'rgba(253,253,249,0.01)']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.dropdownShell}
            >
              <View style={styles.dropdownContent}>
                <View style={styles.dropdownLeft} />
                <Text style={selectedRecipient ? styles.dropdownValueText : styles.dropdownPlaceholderText}>
                  {selectedRecipient ? selectedRecipient.name : 'Choose from list'}
                </Text>
                <View style={styles.dropdownRight}>
                  <Image source={require('@assets/down-arrow.png')} style={{ width: 16, height: 16, tintColor: OFFWHITE }} resizeMode="contain" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Legacy */}
          <LinearGradient
            colors={['rgba(253, 253, 249, 0.04)', 'rgba(253, 253, 249, 0.01)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.legacyCard}
          >
            <View style={styles.legacyRow}>
              <Text style={styles.label}>Legacy</Text>
              <TouchableOpacity hitSlop={10}>
                <Text style={styles.infoIcon}>ⓘ</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.legacyCheckRow}>
              <Text style={[styles.subLabel, { flex: 1, marginBottom: 0 }]}>Is this a legacy echo?</Text>
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
          </LinearGradient>

          {/* Lock date */}
          <Text style={[styles.label, { marginTop: 18 }]}>
            Lock Date <Text style={styles.subtle}>(only if required)</Text>
          </Text>

          <TouchableOpacity
            style={styles.inputShell}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={lockDate ? styles.selectedText : styles.placeholder}>
              {lockDate ? formatDate(lockDate) : 'When do you want to open it?'}
            </Text>
            <Image source={require('@assets/calendar_month.png')} style={styles.calendar} />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={lockDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
              textColor={GOLD}
              themeVariant="dark"
            />
          )}

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
              placeholderTextColor="#60739F"
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
          <LinearGradient
            colors={['rgba(253,253,249,0.04)', 'rgba(253,253,249,0.01)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.nextGradient}
          >
            <Text style={styles.nextText}>NEXT</Text>
          </LinearGradient>
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

        {/* Guardian Prompt Modal */}
        <Modal
          visible={showGuardianPrompt}
          transparent
          animationType="fade"
          onRequestClose={() => setShowGuardianPrompt(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.guardianPromptCard}>
              <Text style={styles.guardianPromptTitle}>Assign a Guardian?</Text>
              <Text style={styles.guardianPromptText}>
                A Guardian can manage the release of this Echo on your behalf.
                Would you like to assign one?
              </Text>
              
              <View style={styles.guardianPromptButtons}>
                <TouchableOpacity
                  style={[styles.guardianPromptButton, styles.guardianPromptButtonYes]}
                  onPress={handleGuardianPromptYes}
                >
                  <Text style={styles.guardianPromptButtonText}>Yes</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.guardianPromptButton, styles.guardianPromptButtonNo]}
                  onPress={handleGuardianPromptNo}
                >
                  <Text style={[styles.guardianPromptButtonText, styles.guardianPromptButtonTextNo]}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
  backArrowImg: { width: 20, height: 20, tintColor: GOLD },
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
    color: '#60739F',
    fontSize: 15,
  },
  selectedText: {
    color: OFFWHITE,
    fontSize: 15,
  },
  chevron: { color: OFFWHITE, fontSize: 16 },
  calendar: { width: 20, height: 20},
  dropdownShell: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 0.25,
    borderColor: '#60739F',
    marginBottom: 12,
    height: 48,
    justifyContent: 'center',
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  dropdownLeft: { width: 24 },
  dropdownRight: { width: 24, alignItems: 'flex-end' as const },
  dropdownValueText: {
    flex: 1,
    color: OFFWHITE,
    fontSize: 15,
    textAlign: 'center',
  },
  dropdownPlaceholderText: {
    flex: 1,
    color: 'rgba(253,253,249,0.55)',
    fontSize: 15,
    textAlign: 'center',
  },

  legacyCard: {
    width: '100%',
    paddingTop: 8,
    paddingHorizontal: 8,
    paddingBottom: 4,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 12,
  },
  legacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  legacyCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    justifyContent: 'space-between',
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
  nextGradient: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
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

  /* Guardian Prompt Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guardianPromptCard: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: '#1A1F2E',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: GOLD,
  },
  guardianPromptTitle: {
    color: GOLD,
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Medium',
      android: 'serif',
    }),
  },
  guardianPromptText: {
    color: OFFWHITE,
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  guardianPromptButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  guardianPromptButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GOLD,
  },
  guardianPromptButtonYes: {
    backgroundColor: GOLD,
  },
  guardianPromptButtonNo: {
    backgroundColor: 'transparent',
  },
  guardianPromptButtonText: {
    fontSize: 18,
    color: '#1A1F2E',
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Medium',
      android: 'serif',
    }),
  },
  guardianPromptButtonTextNo: {
    color: GOLD,
  },
});
