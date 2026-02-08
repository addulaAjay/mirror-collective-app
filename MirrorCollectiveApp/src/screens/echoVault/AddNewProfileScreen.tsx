import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundWrapper from '@components/BackgroundWrapper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@types';
import LogoHeader from '@components/LogoHeader';
import { SvgXml } from 'react-native-svg';
import MotifSelectionModal from '@components/MotifSelectionModal';
import { MOTIF_ICONS } from '@assets/motifs/MotifAssets';
import { echoApiService } from '@services/api/echo';

type Props = NativeStackScreenProps<RootStackParamList, 'AddNewProfileScreen'>;

const { width } = Dimensions.get('window');

const GOLD = '#D7C08A';
const LIGHT_GOLD = '#f2e2b1';
const OFFWHITE = '#fdfdf9';
const BLUE_GREY = '#a3b3cc';
const SUBTEXT = 'rgba(253,253,249,0.75)';

const AddNewProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [motif, setMotif] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const handleAddRecipient = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Error', 'Please enter a name and email address');
      return;
    }

    try {
      setLoading(true);
      const response = await echoApiService.addRecipient({ 
        name, 
        email, 
        motif: motif.trim() || undefined 
      });
      if (response.success) {
        Alert.alert('Success', 'Recipient added successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', response.error || 'Failed to add recipient');
      }
    } catch (error) {
      console.error('Add recipient error:', error);
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
                <Text style={styles.backArrow}>←</Text>
              </TouchableOpacity>

              <Text style={styles.title}>ADD PROFILE</Text>

              <View style={{ width: 24 }} />
            </View>

            {/* Description */}
            <Text style={[styles.description, { width: contentWidth }]}>
              Your recipients/guardians will have access to echoes you share with
              them.
            </Text>

            {/* Add Icon Circle */}
            <View style={styles.iconWrap}>
              <TouchableOpacity 
                style={styles.iconOuter}
                onPress={() => setModalVisible(true)}
              >
                <View style={styles.iconInner}>
                  {selectedIcon ? (
                    <View style={{ width: 80, height: 80 }}>
                      <SvgXml xml={selectedIcon.xml} width="100%" height="100%" />
                    </View>
                  ) : motif ? (
                    <Text style={[styles.iconLabel, { fontSize: 48 }]}>{motif}</Text>
                  ) : (
                    <Text style={styles.iconLabel}>Add Icon</Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={[styles.form, { width: contentWidth }]}>
              <Text style={styles.label}>Name</Text>
              <View style={styles.inputShell}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter name of recipient/guardian"
                  placeholderTextColor={BLUE_GREY}
                  style={styles.input}
                />
              </View>

              <Text style={[styles.label, { marginTop: 16 }]}>Email Address</Text>
              <View style={styles.inputShell}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter recipient/guardian email address"
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
              onPress={handleAddRecipient}
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
  title: {
    fontSize: 28,
    color: LIGHT_GOLD,
    letterSpacing: 0,
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
    textShadowColor: '#f0d4a8',
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
    borderWidth: 0, // Removed border as per design image it looks like a gradient or masked image, simplifying for now or keeping minimal
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(215,192,138,0.1)', // Placeholder for the ellipse image
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
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    minHeight: 40,
    maxHeight: 80,
  },
  input: {
    color: BLUE_GREY,
    fontSize: 20,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Italic',
      android: 'serif',
    }),
    fontStyle: 'italic',
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
