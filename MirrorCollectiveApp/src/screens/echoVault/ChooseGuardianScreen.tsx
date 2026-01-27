import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  ChooseGuardian: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'ChooseGuardian'>;

const { width } = Dimensions.get('window');

const GOLD = '#D7C08A';
const OFFWHITE = 'rgba(253,253,249,0.92)';
const SUBTEXT = 'rgba(253,253,249,0.65)';
const BORDER = 'rgba(253,253,249,0.18)';
const SURFACE = 'rgba(7,9,14,0.35)';

const ChooseGuardianScreen: React.FC<Props> = ({ navigation }) => {
  const [notes, setNotes] = useState('');
  const [scope, setScope] = useState<string[]>([]);
  const [triggers, setTriggers] = useState<string[]>([]);

  const contentWidth = Math.min(width * 0.88, 360);

  const toggle = (
    value: string,
    list: string[],
    setList: (v: string[]) => void,
  ) => {
    setList(
      list.includes(value) ? list.filter(v => v !== value) : [...list, value],
    );
  };

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

          <Text style={styles.title}>CHOOSE YOUR{'\n'}GUARDIAN</Text>

          <View style={{ width: 24 }} />
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
          <View style={styles.inputShell}>
            <Text style={styles.placeholder}>Choose from list</Text>
            <Text style={styles.chevron}>▾</Text>
          </View>

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
      </View>
    </SafeAreaView>
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
});
