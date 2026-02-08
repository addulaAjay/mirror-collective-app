// NewEchoVaultScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Modal,
  Pressable,
  Platform,
  Image,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundWrapper from '@components/BackgroundWrapper';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@types';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';


type Props = NativeStackScreenProps<RootStackParamList, 'NewEchoScreen'>;

const { width: W, height: H } = Dimensions.get('window');

const GOLD = '#F2E2B1'; // Updated from Figma: #F2E2B1
const OFFWHITE = '#FDFDF9'; // Updated from Figma: #FDFDF9
const SURFACE_BORDER = 'rgba(253, 253, 249, 0.18)';
const SURFACE_BORDER_2 = 'rgba(253, 253, 249, 0.08)';

const CATEGORIES = [
  'Gratitude',
  'Reflection',
  'Affirmation',
  'Request',
  'Apology',
  'Memory',
];

const NewEchoScreen: React.FC<Props> = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [recipientChoice, setRecipientChoice] = useState<'yes' | 'no' | null>(
    null,
  );
  const [categoryOpen, setCategoryOpen] = useState(false);

  const [selectedMode, setSelectedMode] = useState<'text' | 'audio' | 'video'>('text');

  const contentWidth = useMemo(() => Math.min(W * 0.88, 360), []);

  const onNext = () => {
    if (!title.trim()) {
      return;
    }

    if (recipientChoice === 'yes') {
      navigation.navigate('ChooseRecipientScreen', {
        title,
        category: category || 'Uncategorized',
        mode: selectedMode,
      });
      return;
    }

    // Navigate to Compose screen with params
    navigation.navigate('NewEchoComposeScreen', {
      mode: selectedMode,
      title: title,
      category: category || 'Uncategorized',
      hasRecipient: false,
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

        {/* Top Header */}
        <LogoHeader navigation={navigation} />

        {/* Updated Header Layout per Figma */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: GOLD, fontSize: 30 }}>‹</Text>
          </TouchableOpacity>
          
          <Text style={styles.screenTitle}>NEW ECHO</Text>
          
          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1, width: '100%' }}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Content */}
            <View style={[styles.content, { width: contentWidth }]}>
              {/* Title input - Updated Styling */}
              <LinearGradient
                colors={['rgba(253,253,249,0.04)', 'rgba(253,253,249,0.01)']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.inputShell}
              >
                <View style={styles.inputContainer}>
                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Enter Title here"
                        placeholderTextColor="rgba(253,253,249,0.5)"
                        style={styles.textInput}
                    />
                </View>
              </LinearGradient>

              {/* Illustration - Replaced Placeholder */}
              <View style={styles.illustrationWrap}>
                <Image
                    source={require('@assets/mirror_echo_illustration.png')}
                    style={styles.illustrationImage}
                    resizeMode="contain"
                />
              </View>

              {/* Category dropdown - Updated Styling */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setCategoryOpen(true)}
                style={{ width: '100%' }}
              >
                <LinearGradient
                  colors={['rgba(253,253,249,0.04)', 'rgba(253,253,249,0.01)']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.dropdownShell}
                >
                    <View style={styles.dropdownContent}>
                        {/* Icon + Text Group */}
                        <View style={styles.dropdownLeft}>
                            <Text style={{ color: OFFWHITE, fontSize: 18, transform: [{ scaleY: -1 }] }}>▾</Text>
                        </View>

                         <Text
                            style={[
                                styles.dropdownText,
                                !category && { color: OFFWHITE, opacity: 0.9 }, 
                            ]}
                            >
                            {category ?? 'Choose echo category'}
                        </Text>

                        <View style={styles.dropdownRight}>
                             <Text style={{ color: OFFWHITE, fontSize: 18, transform: [{ scaleY: -1 }] }}>▾</Text>
                        </View>
                    </View>
                </LinearGradient>
              </TouchableOpacity>


              {/* Recipient yes/no - Updated to "Do you have a recipient?" block */}
              <View style={styles.recipientQuestion}>
                <Text style={styles.recipientQuestion}>Do you have a recipient?</Text>
                
                <View style={styles.recipientButtons}>
                     <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.recipientBtn}
                        onPress={() => setRecipientChoice('yes')}
                     >
                        <View style={[styles.radioOuter, recipientChoice === 'yes' && styles.radioOuterSelected]}>
                            {recipientChoice === 'yes' && <View style={styles.radioInner} />}
                        </View>
                        <Text style={[styles.recipientBtnText, recipientChoice === 'yes' && styles.recipientBtnTextSelected]}>YES</Text>
                     </TouchableOpacity>

                     <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.recipientBtn}
                        onPress={() => setRecipientChoice('no')}
                     >
                        <View style={[styles.radioOuter, recipientChoice === 'no' && styles.radioOuterSelected]}>
                             {recipientChoice === 'no' && <View style={styles.radioInner} />}
                        </View>
                        <Text style={[styles.recipientBtnText, recipientChoice === 'no' && styles.recipientBtnTextSelected]}>NO</Text>
                     </TouchableOpacity>
                </View>
              </View>



              {/* Action buttons row - Updated Icons */}
              <View style={styles.actionRow}>
                <ActionSquare 
                  emoji="T" 
                  selected={selectedMode === 'text'}
                  onPress={() => setSelectedMode('text')} 
                />
                <ActionSquare 
                  emoji="🎤" 
                  selected={selectedMode === 'audio'}
                  onPress={() => setSelectedMode('audio')} 
                />
                <ActionSquare 
                  emoji="📹" 
                  selected={selectedMode === 'video'}
                  onPress={() => setSelectedMode('video')} 
                />
              </View>

              {/* Next Button - Updated to Standard Primary Action Style */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onNext}
                style={styles.nextWrap}
              >
                <StarIcon width={24} height={24} />
                <Text style={styles.nextText}>NEXT</Text>
                <StarIcon width={24} height={24} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Category modal */}
        <Modal
          visible={categoryOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setCategoryOpen(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setCategoryOpen(false)}
          >
            <Pressable style={[styles.modalCard, { width: contentWidth }]}>
              <Text style={styles.modalTitle}>Choose a category</Text>

              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c}
                  activeOpacity={0.85}
                  style={styles.modalItem}
                  onPress={() => {
                    setCategory(c);
                    setCategoryOpen(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{c}</Text>
                </TouchableOpacity>
              ))}
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

const ActionSquare = ({
  emoji,
  onPress,
  selected,
}: {
  emoji: string;
  onPress: () => void;
  selected?: boolean;
}) => {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{ flex: 1 }}>
      <LinearGradient
        colors={['rgba(253,253,249,0.05)', 'rgba(253,253,249,0.01)']} 
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[
            styles.actionShell, 
            selected && { borderColor: GOLD, backgroundColor: 'rgba(242, 226, 177, 0.1)' } 
        ]}
      >
          <Text style={{ fontSize: 30, color: selected ? GOLD : 'rgba(242, 226, 177, 0.92)' }}>{emoji}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  root: {
    flex: 1,
  },

  /* Header */
  headerContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)' // Add a subtle back for touch target
  },
  screenTitle: {
    color: '#F2E2B1',
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
  headerSpacer: {
      width: 40, // Balance back button
  },

  scrollContent: {
      flexGrow: 1,
      alignItems: 'center',
      paddingBottom: 60,
  },
  content: {
    paddingTop: 10,
    alignItems: 'center',
    width: '100%',
  },

  /* Title Input */
  inputShell: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#A3B3CC', // var(--border/subtle)
    marginBottom: 24,
  },
  inputContainer: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
  },
  textInput: {
    color: '#FDFDF9', // var(--text/paragraph-2)
    fontSize: 16, // var(--font/size/s)
    fontFamily: 'Inter', // var(--font/family/body)
    fontStyle: 'italic',
    textAlign: 'center',
    width: '100%',
  },

  /* Illustration */
  illustrationWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 160, 
    marginBottom: 20,
  },
  illustrationImage: {
      width: '100%',
      height: '100%',
  },

  /* Dropdown */
  dropdownShell: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 0.25,
    borderColor: '#60739F', // var(--border/inverse-1)
    // Wait, in Figma, Component 2 (Dropdown) is above the recipient block.
    marginBottom: 24, 
    height: 48,
    justifyContent: 'center',
  },
  dropdownContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
  },
  dropdownText: {
    color: '#FDFDF9',
    fontSize: 16,
    fontFamily: 'Inter',
    fontStyle: 'italic',
  },
  dropdownLeft: {
      width: 24,
      alignItems: 'center',
  },
  dropdownRight: {
    width: 24,
    alignItems: 'center',
  },
  
  /* Recipient Block - Changed to Column for Visibility */
  recipientBlock: {
      width: '100%',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(253, 253, 249, 0.12)',
      padding: 16,
      marginBottom: 20,
      backgroundColor: 'rgba(253, 253, 249, 0.02)',
  },
  recipientQuestion: {
      color: '#FDFDF9',
      fontSize: 16,
      fontFamily: 'Inter',
      fontStyle: 'italic',
      marginBottom: 16,
      textAlign: 'center',
  },
  recipientButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 32,
  },
  recipientBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
  },
  radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: '#F2E2B1',
      alignItems: 'center',
      justifyContent: 'center',
  },
  radioOuterSelected: {
      borderColor: '#F2E2B1',
  },
  radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#F2E2B1',
  },
  recipientBtnText: {
      color: '#F2E2B1',
      fontSize: 16,
      fontFamily: 'Inter',
      fontWeight: '500',
  },
  recipientBtnTextSelected: {
      fontWeight: '700',
  },


  /* Action Row */
  actionRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between', // gap 32px in Figma, assume justify-between handles for small screens, or gap.
    gap: 16,
    marginBottom: 32,
  },
  actionShell: {
    flex: 1, // Distribute evenly
    height: 72, // Fixed height from Figma
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#F2E2B1', // var(--border/brand)
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow from Figma
    shadowColor: '#F2E2B1',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 5,
  },

  /* Next Button - Updated to Star Flanked Style */
  nextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 20, // Reduced from 40 for better visibility
    width: '100%',
    paddingVertical: 10,
  },
  nextText: {
    fontFamily: 'CormorantGaramond-Medium',
    fontSize: 28,
    fontWeight: '500',
    color: '#E5D6B0',
    textShadowColor: 'rgba(229, 214, 176, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    textTransform: 'uppercase',
  },


  /* Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(10,12,18,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.25)',
    padding: 14,
  },
  modalTitle: {
    color: 'rgba(215,192,138,0.92)',
    fontSize: 16,
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(253,253,249,0.10)',
    marginBottom: 10,
    backgroundColor: 'rgba(253,253,249,0.04)',
  },
  modalItemText: {
    color: OFFWHITE,
    fontSize: 15,
    textAlign: 'center',
  },
});

export default NewEchoScreen;
