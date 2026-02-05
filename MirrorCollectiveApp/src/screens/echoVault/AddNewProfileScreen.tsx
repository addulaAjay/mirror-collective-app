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
import { RootStackParamList } from '@types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddNewProfileScreen'>;

const { width } = Dimensions.get('window');

const GOLD = '#D7C08A';
const OFFWHITE = 'rgba(253,253,249,0.92)';
const SUBTEXT = 'rgba(253,253,249,0.75)';

const AddNewProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

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

          <Text style={styles.title}>ADD NEW PROFILE</Text>

          <View style={{ width: 24 }} />
        </View>

        {/* Description */}
        <Text style={[styles.description, { width: contentWidth }]}>
          Your recipients/guardians will have access to echoes you share with
          them.
        </Text>

        {/* Add Icon Circle */}
        <View style={styles.iconWrap}>
          <View style={styles.iconOuter}>
            <View style={styles.iconInner}>
              <Text style={styles.iconLabel}>Add Icon</Text>
            </View>
          </View>
        </View>

        {/* Form */}
        <View style={[styles.form, { width: contentWidth }]}>
          <Text style={styles.label}>Name</Text>
          <View style={styles.inputShell}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter name of recipient/guardian"
              placeholderTextColor="rgba(253,253,249,0.45)"
              style={styles.input}
            />
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>Email Address</Text>
          <View style={styles.inputShell}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter recipient/guardian email address"
              placeholderTextColor="rgba(253,253,249,0.45)"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Add Button */}
        <TouchableOpacity style={styles.addWrap}>
          <View style={styles.addButton}>
            <Text style={styles.addText}>ADD</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AddNewProfileScreen;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#05060A',
  },
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
  iconBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  iconText: {
    color: OFFWHITE,
    fontSize: 22,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GOLD,
  },
  brandSmall: {
    color: GOLD,
    fontSize: 10,
    letterSpacing: 1,
  },
  brandText: {
    color: GOLD,
    fontSize: 12,
    letterSpacing: 2,
    lineHeight: 14,
  },

  /* Title */
  titleRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backArrow: {
    fontSize: 22,
    color: GOLD,
  },
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

  /* Description */
  description: {
    marginTop: 12,
    textAlign: 'center',
    color: SUBTEXT,
    fontSize: 14,
    lineHeight: 20,
  },

  /* Icon Circle */
  iconWrap: {
    marginTop: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  iconOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(215,192,138,0.08)',
  },
  iconInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(253,253,249,0.15)',
    backgroundColor: 'rgba(7,9,14,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLabel: {
    color: OFFWHITE,
    fontSize: 18,
    letterSpacing: 1,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },

  /* Form */
  form: {
    marginBottom: 24,
  },
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
    borderColor: 'rgba(253,253,249,0.2)',
    backgroundColor: 'rgba(7,9,14,0.35)',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 8,
  },
  input: {
    color: OFFWHITE,
    fontSize: 15,
  },

  /* Add button */
  addWrap: {
    marginTop: 8,
  },
  addButton: {
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.45)',
    backgroundColor: 'rgba(7,9,14,0.4)',
  },
  addText: {
    color: GOLD,
    fontSize: 18,
    letterSpacing: 1.5,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },
});
