import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@types';
import React, { useState } from 'react';
import { palette } from '@theme';
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
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { MOTIF_ICONS } from '@assets/motifs/MotifAssets';
import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import MotifSelectionModal from '@components/MotifSelectionModal';
import { echoApiService } from '@services/api/echo';

type Props = NativeStackScreenProps<RootStackParamList, 'AddNewProfileScreen'>;

const { width } = Dimensions.get('window');

const GOLD = palette.gold.mid;
const LIGHT_GOLD = palette.gold.DEFAULT;
const OFFWHITE = palette.gold.subtlest;
const BLUE_GREY = palette.navy.light;
const SUBTEXT = 'rgba(253,253,249,0.75)';

const AddNewProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const mode = route.params?.mode ?? 'recipient';
  const isGuardian = mode === 'guardian';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [motif, setMotif] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const handleAddProfile = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Error', 'Please enter a name and email address');
      return;
    }

    try {
      setLoading(true);
      const response = isGuardian
        ? await echoApiService.addGuardian({ name, email })
        : await echoApiService.addRecipient({ name, email, motif: motif.trim() || undefined });
      if (response.success) {
        Alert.alert('Success', `${isGuardian ? 'Guardian' : 'Recipient'} added successfully`, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', response.error || `Failed to add ${isGuardian ? 'guardian' : 'recipient'}`);
      }
    } catch (error) {
      console.error('Add profile error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMotif = (motifId: string) => {
    setMotif(motifId);
    setModalVisible(false);
  };

  const contentWidth = Math.min(width * 0.88, 360);

  const selectedIcon = MOTIF_ICONS.find(m => m.id === motif);

  return (
    <BackgroundWrapper style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />
        
        {/* Header - Sticky */}
        <LogoHeader navigation={navigation} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, width: '100%' }}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title */}
            <View style={[styles.titleRow, { width: contentWidth }]}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Image source={require('@assets/back-arrow.png')} style={styles.backArrowImg} resizeMode="contain" />
              </TouchableOpacity>

              <Text style={styles.title}>{isGuardian ? 'ADD GUARDIAN' : 'ADD PROFILE'}</Text>

              <View style={{ width: 24 }} />
            </View>

            {/* Description */}
            <Text style={[styles.description, { width: contentWidth }]}>
              {isGuardian
                ? 'Your guardians can verify your identity and unlock legacy echoes.'
                : 'Your recipients will have access to echoes you share with them.'}
            </Text>

            {/* Add Icon Circle */}
            <View style={styles.iconWrap}>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
              >
                <LinearGradient
                  colors={['rgba(229, 214, 176, 0.05)', 'rgba(197, 157, 95, 0.05)']}
                  start={{x: 1, y: 0.5}}
                  end={{x: 0, y: 0.5}}
                  style={styles.iconOuter}
                >
                  <View style={styles.iconInner}>
                  {selectedIcon ? (
                    <SvgXml xml={selectedIcon.xml} width={80} height={80} />
                  ) : motif ? (
                    <Text style={[styles.iconLabel, { fontSize: 48 }]}>{motif}</Text>
                  ) : (
                    <Text style={styles.iconLabel}>Add Icon</Text>
                  )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={[styles.form, { width: contentWidth }]}>
              <Text style={styles.label}>Name</Text>
              <View style={styles.inputShell}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={isGuardian ? 'Enter name of guardian' : 'Enter name of recipient'}
                  placeholderTextColor={BLUE_GREY}
                  style={styles.input}
                />
              </View>

              <Text style={[styles.label, { marginTop: 16 }]}>Email Address</Text>
              <View style={styles.inputShell}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder={isGuardian ? 'Enter guardian email address' : 'Enter recipient email address'}
                  placeholderTextColor={BLUE_GREY}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>


            </View>

            {/* Add Button */}
            <TouchableOpacity 
              style={styles.addWrap}
              onPress={handleAddProfile}
              disabled={loading}
            >
              <View style={styles.addButton}>
                {loading ? (
                  <ActivityIndicator color={LIGHT_GOLD} />
                ) : (
                  <Text style={styles.addText}>ADD</Text>
                )}
              </View>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
        
        <MotifSelectionModal 
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSelect={handleSelectMotif}
        />
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default AddNewProfileScreen;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  root: {
    flex: 1,
    alignItems: 'center',
  },

  /* Title */
  titleRow: {
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backArrow: {
    fontSize: 22,
    color: LIGHT_GOLD,
  },
  backArrowImg: {
    width: 20,
    height: 20,
    tintColor: LIGHT_GOLD,
  },
  title: {
    fontSize: 28,
    color: LIGHT_GOLD,
    letterSpacing: 0,
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
    textShadowColor: palette.gold.glow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },

  /* Description */
  description: {
    marginTop: 12,
    textAlign: 'center',
    color: OFFWHITE,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Platform.select({
      ios: 'System', // Inter is not standard, using System as fallback or we assume custom font loaded
      android: 'sans-serif',
    }),
  },

  /* Icon Circle */
  iconWrap: {
    marginTop: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  iconOuter: {
    width: 186,
    height: 186,
    borderRadius: 93,
    borderWidth: 0.5,
    borderColor: palette.gold.warm,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(229, 214, 176, 1)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 25,
      },
      android: {
        boxShadow: '0 0 25px rgba(229, 214, 176, 0.30)',
      },
    }),
  },
  iconInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLabel: {
    color: 'white',
    fontSize: 24,
    textAlign: 'center',
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
    color: LIGHT_GOLD,
    fontSize: 20,
    marginBottom: 6,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Medium',
      android: 'serif',
    }),
  },
  inputShell: {
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: BLUE_GREY,
    backgroundColor: 'rgba(253,253,249,0.04)',
    paddingHorizontal: 16,
    height: 48,
    justifyContent: 'center',
  },
  input: {
    color: BLUE_GREY,
    fontSize: 16,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Italic',
      android: 'serif',
    }),
    fontStyle: 'italic',
    paddingVertical: 0,
    includeFontPadding: false,
  },

  /* Add button */
  addWrap: {
    marginTop: 8,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: BLUE_GREY,
    backgroundColor: 'rgba(253,253,249,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  addText: {
    color: LIGHT_GOLD,
    fontSize: 24,
    textAlign: 'center',
    textShadowColor: 'rgba(229,214,176,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 9,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },
});
