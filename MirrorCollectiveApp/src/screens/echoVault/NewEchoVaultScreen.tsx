// NewEchoScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Image,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  NewEcho: undefined;
  // add other routes as needed
};

type Props = NativeStackScreenProps<RootStackParamList, 'NewEcho'>;

const { width: W, height: H } = Dimensions.get('window');

const GOLD = '#D7C08A';
const OFFWHITE = 'rgba(253, 253, 249, 0.92)';
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

  const contentWidth = useMemo(() => Math.min(W * 0.88, 360), []);

  const onNext = () => {
    // TODO: validate & navigate
    // navigation.navigate('NextScreen' as any);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Background */}
      <View style={styles.root}>
        {/* If you have a real background image, replace with ImageBackground */}
        <LinearGradient
          colors={['#06070A', '#0A0C12', '#0B0F1A']}
          style={StyleSheet.absoluteFill}
        />

        {/* Top Header */}
        <View style={[styles.headerRow, { width: contentWidth }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.iconBtn}
            onPress={() => {
              // open drawer / menu
            }}
          >
            <Text style={styles.iconText}>≡</Text>
          </TouchableOpacity>

          <View style={styles.brandWrap}>
            {/* Replace with your logo asset */}
            <View style={styles.logoCircle}>
              <Text style={styles.logoMark}>⟡</Text>
            </View>

            <View style={styles.brandTextWrap}>
              <Text style={styles.brandTop}>The</Text>
              <Text style={styles.brandMain}>MIRROR</Text>
              <Text style={styles.brandMain}>COLLECTIVE</Text>
            </View>
          </View>

          {/* spacer to keep brand centered */}
          <View style={styles.headerRightSpacer} />
        </View>

        {/* Back row + title */}
        <View style={[styles.titleRow, { width: contentWidth }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>NEW ECHO</Text>

          {/* spacer to balance back icon */}
          <View style={styles.titleRightSpacer} />
        </View>

        {/* Content */}
        <View style={[styles.content, { width: contentWidth }]}>
          {/* Title input */}
          <LinearGradient
            colors={['rgba(253,253,249,0.08)', 'rgba(253,253,249,0.03)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.inputShell}
          >
            <View style={styles.inputInnerBorder}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Enter Title here"
                placeholderTextColor="rgba(253,253,249,0.55)"
                style={styles.textInput}
              />
            </View>
          </LinearGradient>

          {/* Brain illustration placeholder */}
          <View style={styles.illustrationWrap}>
            {/* Replace with your brain image/svg */}
            <View style={styles.brainPlaceholder}>
              <Text style={styles.brainText}>✦</Text>
            </View>
          </View>

          {/* Category dropdown */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setCategoryOpen(true)}
          >
            <LinearGradient
              colors={['rgba(253,253,249,0.07)', 'rgba(253,253,249,0.03)']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.dropdownShell}
            >
              <View style={styles.dropdownInnerBorder}>
                <Text
                  style={[
                    styles.dropdownText,
                    !category && { color: 'rgba(253,253,249,0.70)' },
                  ]}
                >
                  {category ?? 'Choose echo category'}
                </Text>
                <Text style={styles.dropdownChevron}>▾</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Recipient yes/no */}
          <View style={styles.recipientRow}>
            <Text style={styles.recipientLabel}>Do you have a recipient?</Text>

            <View style={styles.recipientOptions}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.recipientOption}
                onPress={() => setRecipientChoice('yes')}
              >
                <View
                  style={[
                    styles.checkbox,
                    recipientChoice === 'yes' && styles.checkboxChecked,
                  ]}
                />
                <Text style={styles.recipientOptionText}>YES</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.recipientOption}
                onPress={() => setRecipientChoice('no')}
              >
                <View
                  style={[
                    styles.checkbox,
                    recipientChoice === 'no' && styles.checkboxChecked,
                  ]}
                />
                <Text style={styles.recipientOptionText}>NO</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action buttons row */}
          <View style={styles.actionRow}>
            <ActionSquare label="T" onPress={() => {}} />
            <ActionSquare label="🎤" onPress={() => {}} />
            <ActionSquare label="📹" onPress={() => {}} />
          </View>

          {/* Next */}
          <TouchableOpacity activeOpacity={0.9} onPress={onNext}>
            <LinearGradient
              colors={['rgba(253,253,249,0.10)', 'rgba(253,253,249,0.03)']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.nextShell}
            >
              <View style={styles.nextInnerBorder}>
                <Text style={styles.nextText}>NEXT</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

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
      </View>
    </SafeAreaView>
  );
};

const ActionSquare = ({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <LinearGradient
        colors={['rgba(253,253,249,0.10)', 'rgba(253,253,249,0.03)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.actionShell}
      >
        <View style={styles.actionInnerBorder}>
          <Text style={styles.actionIcon}>{label}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

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

  headerRow: {
    marginTop: 10,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: OFFWHITE,
    fontSize: 24,
    opacity: 0.9,
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(215,192,138,0.10)',
  },
  logoMark: {
    color: GOLD,
    fontSize: 16,
  },
  brandTextWrap: {
    alignItems: 'center',
  },
  brandTop: {
    color: 'rgba(215,192,138,0.85)',
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 1,
  },
  brandMain: {
    color: 'rgba(215,192,138,0.92)',
    fontSize: 12,
    letterSpacing: 2,
    lineHeight: 14,
  },
  headerRightSpacer: {
    width: 44,
    height: 44,
  },

  titleRow: {
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backIcon: {
    color: 'rgba(215,192,138,0.9)',
    fontSize: 30,
    marginLeft: 2,
  },
  screenTitle: {
    color: 'rgba(215,192,138,0.92)',
    fontSize: 34,
    letterSpacing: 2,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },
  titleRightSpacer: {
    width: 44,
    height: 44,
  },

  content: {
    marginTop: 18,
    alignItems: 'center',
    flex: 1,
  },

  inputShell: {
    width: '100%',
    borderRadius: 18,
    padding: 1,
    borderWidth: 1,
    borderColor: SURFACE_BORDER_2,
  },
  inputInnerBorder: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: 'rgba(7,9,14,0.35)',
  },
  textInput: {
    color: OFFWHITE,
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },

  illustrationWrap: {
    width: '100%',
    alignItems: 'center',
    marginTop: 26,
    marginBottom: 22,
    flexGrow: 1,
    justifyContent: 'center',
  },
  brainPlaceholder: {
    width: Math.min(W * 0.52, 220),
    height: Math.min(W * 0.42, 180),
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.25)',
    backgroundColor: 'rgba(215,192,138,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brainText: {
    color: 'rgba(215,192,138,0.7)',
    fontSize: 28,
  },

  dropdownShell: {
    width: '100%',
    borderRadius: 18,
    padding: 1,
    borderWidth: 1,
    borderColor: SURFACE_BORDER_2,
    marginBottom: 14,
  },
  dropdownInnerBorder: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: 'rgba(7,9,14,0.30)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    color: OFFWHITE,
    fontSize: 16,
    fontStyle: 'italic',
    letterSpacing: 0.4,
  },
  dropdownChevron: {
    color: OFFWHITE,
    fontSize: 18,
    opacity: 0.9,
    marginLeft: 10,
  },

  recipientRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 16,
  },
  recipientLabel: {
    color: 'rgba(253,253,249,0.75)',
    fontSize: 16,
    fontStyle: 'italic',
  },
  recipientOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  recipientOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: 'rgba(215,192,138,0.85)',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: 'rgba(215,192,138,0.55)',
  },
  recipientOptionText: {
    color: 'rgba(253,253,249,0.75)',
    fontSize: 14,
    letterSpacing: 1.4,
  },

  actionRow: {
    width: '100%',
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  actionShell: {
    width: Math.min(W * 0.23, 92),
    height: Math.min(W * 0.23, 92),
    borderRadius: 18,
    padding: 1,
    borderWidth: 1,
    borderColor: SURFACE_BORDER_2,
  },
  actionInnerBorder: {
    flex: 1,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
    backgroundColor: 'rgba(7,9,14,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    color: 'rgba(215,192,138,0.92)',
    fontSize: 30,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },

  nextShell: {
    alignSelf: 'center',
    marginTop: 2,
    borderRadius: 18,
    padding: 1,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.35)',
    marginBottom: 22,
  },
  nextInnerBorder: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.45)',
    paddingVertical: 10,
    paddingHorizontal: 34,
    backgroundColor: 'rgba(7,9,14,0.22)',
  },
  nextText: {
    color: 'rgba(215,192,138,0.92)',
    fontSize: 22,
    letterSpacing: 2,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },

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
