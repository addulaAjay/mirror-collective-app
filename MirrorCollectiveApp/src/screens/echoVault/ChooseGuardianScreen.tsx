import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@types';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  Platform,
  FlatList,
  ActivityIndicator,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import { echoApiService, Guardian } from '@services/api/echo';

type Props = NativeStackScreenProps<RootStackParamList, 'ChooseGuardianScreen'>;

const { width } = Dimensions.get('window');

const GOLD = '#D7C08A';
const OFFWHITE = 'rgba(253,253,249,0.92)';
const SUBTEXT = 'rgba(253,253,249,0.65)';
const BORDER = 'rgba(253,253,249,0.18)';
const SURFACE = 'rgba(7,9,14,0.35)';

const ChooseGuardianScreen: React.FC<Props> = ({ navigation, route }) => {
  const { title, category, mode, recipientId, recipientName, lockDate, unlockOnDeath } = route.params || {};
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

  const handleContinue = () => {
    if (selectedGuardian) {
      navigation.navigate('NewEchoComposeScreen', {
        mode,
        title,
        category,
        recipientId,
        recipientName,
        guardianId: selectedGuardian.guardian_id,
        guardianName: selectedGuardian.name,
        lockDate,
        unlockOnDeath,
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

        <LogoHeader navigation={navigation} />

        {/* Title */}
        <View style={styles.titleRowContainer}>
          <View style={[styles.titleRow, { width: contentWidth }]}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Image source={require('@assets/back-arrow.png')} style={styles.backArrowImg} resizeMode="contain" />
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
                <Text style={selectedGuardian ? styles.dropdownValueText : styles.dropdownPlaceholderText}>
                  {selectedGuardian ? selectedGuardian.name : 'Choose from list'}
                </Text>
                <View style={styles.dropdownRight}>
                  <Image source={require('@assets/down-arrow.png')} style={{ width: 16, height: 16, tintColor: OFFWHITE }} resizeMode="contain" />
                </View>
              </View>
            </LinearGradient>
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

        {/* Continue Button */}
        <View style={[styles.buttonContainer, { width: contentWidth }]}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedGuardian && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!selectedGuardian}
          >
            <Text style={styles.starLeft}>✦</Text>
            <Text style={styles.continueButtonText}>CONTINUE</Text>
            <Text style={styles.starRight}>✦</Text>
          </TouchableOpacity>
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
  backArrowImg: { width: 20, height: 20, tintColor: GOLD },
  title: {
    textAlign: 'center',
    color: GOLD,
    fontSize: 28,
    letterSpacing: 2,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
    textShadowColor: 'rgba(240, 212, 168, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
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
  dropdownShell: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 0.25,
    borderColor: '#60739F',
    marginBottom: 16,
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

  /* Continue Button */
  buttonContainer: {
    marginTop: 24,
    marginBottom: 20,
    alignSelf: 'center',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD,
    backgroundColor: 'rgba(215, 192, 138, 0.1)',
    gap: 12,
  },
  continueButtonDisabled: {
    opacity: 0.5,
    borderColor: SUBTEXT,
  },
  continueButtonText: {
    color: GOLD,
    fontSize: 20,
    letterSpacing: 2,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Medium',
      android: 'serif',
    }),
  },
  starLeft: {
    color: GOLD,
    fontSize: 16,
  },
  starRight: {
    color: GOLD,
    fontSize: 16,
  },
});
