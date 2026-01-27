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
  ChooseRecipient: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'ChooseRecipient'>;

const { width } = Dimensions.get('window');

const GOLD = '#D7C08A';
const OFFWHITE = 'rgba(253,253,249,0.92)';
const SUBTEXT = 'rgba(253,253,249,0.65)';
const BORDER = 'rgba(253,253,249,0.18)';

const ChooseRecipientScreen: React.FC<Props> = ({ navigation }) => {
  const [legacy, setLegacy] = useState<'yes' | 'no' | null>(null);
  const [unlockOnDeath, setUnlockOnDeath] = useState(false);
  const [notes, setNotes] = useState('');

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

          <Text style={styles.title}>CHOOSE YOUR{'\n'}RECIPIENT</Text>

          <View style={{ width: 24 }} />
        </View>

        {/* Content */}
        <View style={[styles.content, { width: contentWidth }]}>
          {/* Recipient dropdown */}
          <Text style={styles.label}>Recipient</Text>
          <View style={styles.inputShell}>
            <Text style={styles.placeholder}>Choose from list</Text>
            <Text style={styles.chevron}>▾</Text>
          </View>

          {/* Legacy */}
          <View style={styles.legacyHeader}>
            <Text style={styles.label}>Legacy</Text>
            <Text style={styles.infoIcon}>ⓘ</Text>
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
        <TouchableOpacity style={styles.nextWrap}>
          <View style={styles.nextButton}>
            <Text style={styles.nextText}>NEXT</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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

  /* Content */
  content: { marginTop: 10 },

  label: {
    color: GOLD,
    fontSize: 16,
    marginBottom: 6,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },
  subLabel: {
    color: SUBTEXT,
    fontSize: 14,
    marginBottom: 6,
  },
  subtle: { color: SUBTEXT, fontSize: 12 },

  inputShell: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(7,9,14,0.35)',
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  placeholder: {
    color: 'rgba(253,253,249,0.55)',
    fontSize: 15,
  },
  chevron: { color: OFFWHITE, fontSize: 16 },
  calendar: { fontSize: 16 },

  legacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  infoIcon: { color: GOLD, fontSize: 14 },

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
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: GOLD,
    backgroundColor: 'transparent',
  },
  checkboxActive: {
    backgroundColor: 'rgba(215,192,138,0.7)',
  },
  checkLabel: {
    color: OFFWHITE,
    fontSize: 14,
    letterSpacing: 1,
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
  nextWrap: { marginTop: 10 },
  nextButton: {
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.45)',
    backgroundColor: 'rgba(7,9,14,0.4)',
  },
  nextText: {
    color: GOLD,
    fontSize: 18,
    letterSpacing: 1.5,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },
});
