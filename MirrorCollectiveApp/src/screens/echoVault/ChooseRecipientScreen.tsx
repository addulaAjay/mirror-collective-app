/**
 * Choose Recipient Screen
 * Figma: Design-Master-File → Choose Your Recipient (791:1488)
 *
 * Layout (top → bottom):
 *   LogoHeader
 *   Header row: ← | CHOOSE YOUR RECIPIENT | spacer
 *   "Recipient *" label + inline dropdown (Choose from list ▼ / ▲ + list)
 *   "Lock Date (only if required)" label + date input (calendar icon)
 *   "Letter to Recipient *" label + multiline textarea
 *   NEXT button
 *
 * Hidden (Day 2 / legacy):
 *   - "Legacy" section (Is this a legacy echo? YES/NO)
 *   - "Unlock upon death" checkbox
 *   - Guardian prompt modal
 *
 * On NEXT: navigate directly to NewEchoComposeScreen (no guardian flow).
 *
 * Tokens (from Figma 791:1488 variable defs):
 *   Heading M 28/32     → fontFamily.heading, Cormorant Regular — screen title
 *   Heading XS Bold 20/24 → fontFamily.heading weight 500 — section labels
 *   Body S Italic 16/24 → fontFamily.bodyItalic — placeholders
 *   Body S Regular 16/24 → fontFamily.body — selected values
 *   Border/Inverse-1 #60739f → palette.navy.medium — field borders
 *   Radius/S 12, radius/md 8, Space/M 16
 */

import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  borderWidth,
  fontFamily,
  fontSize,
  fontWeight,
  moderateScale,
  palette,
  scale,
  spacing,
  verticalScale,
} from '@theme';
import type { RootStackParamList } from '@types';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button/Button';
import LogoHeader from '@components/LogoHeader';
import TextInputField from '@components/TextInputField';
import { echoApiService, type Recipient } from '@services/api/echo';

type Props = NativeStackScreenProps<RootStackParamList, 'ChooseRecipientScreen'>;

// ── Back arrow ────────────────────────────────────────────────────────────────
const BackIcon: React.FC = () => (
  <Svg width={scale(20)} height={scale(20)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
      fill={palette.gold.DEFAULT}
    />
  </Svg>
);

// ── Screen ────────────────────────────────────────────────────────────────────
const ChooseRecipientScreen: React.FC<Props> = ({ navigation, route }) => {
  const { title, category, mode } = route.params;

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [lockDate, setLockDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');

  const fetchRecipients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await echoApiService.getRecipients();
      if (response.success && response.data) setRecipients(response.data);
    } catch (err) {
      console.error('Failed to load recipients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipients();
    const unsub = navigation.addListener('focus', fetchRecipients);
    return unsub;
  }, [navigation, fetchRecipients]);

  const handleDateChange = (_: any, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) setLockDate(date);
    if (Platform.OS === 'ios') setShowDatePicker(false);
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const handleNext = () => {
    if (!selectedRecipient) return;
    // Navigate directly to compose — no guardian prompt (Day 2 feature)
    navigation.navigate('NewEchoComposeScreen', {
      mode,
      title,
      category,
      hasRecipient: true,
      recipient:    selectedRecipient,
      recipientId:  selectedRecipient.recipient_id,
      recipientName: selectedRecipient.name,
      lockDate:     lockDate?.toISOString(),
    });
  };

  return (
    <BackgroundWrapper style={styles.bg} scrollable>
      <SafeAreaView style={styles.safe}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <LogoHeader navigation={navigation} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>

              {/* ── Header row ──────────────────────────────────────────── */}
              <View style={styles.headerRow}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backBtn}
                  accessibilityRole="button"
                >
                  <BackIcon />
                </TouchableOpacity>
                {/* Heading M: Cormorant Regular 28/32, #f2e1b0, glow */}
                <Text style={styles.screenTitle}>CHOOSE YOUR{'\n'}RECIPIENT</Text>
                <View style={styles.headerSpacer} />
              </View>

              {/* ── Recipient dropdown ─────────────────────────────────── */}
              {/*
                TextInputField (editable=false) as the trigger surface.
                Chevron icon overlaid absolutely on the right.
                Backdrop TouchableOpacity dismisses the inline list.
              */}
              <View style={styles.fieldGroup}>
                {/*
                  Outer TouchableOpacity = entire tap target (whole input area).
                  pointerEvents="none" on inner View prevents TextInput from
                  stealing taps — every tap anywhere on the field opens dropdown.
                  TextInputField label prop handles correct label styling.
                */}
                {/*
                  fieldWithIcon is relative. TouchableOpacity covers full area.
                  Icon is a SIBLING of TouchableOpacity, absolutely positioned
                  on fieldWithIcon with bottom:0 + fixed height = input field area.
                  This ensures icon centres in the INPUT, not in label+input.
                */}
                <View style={styles.fieldWithIcon}>
                  <TouchableOpacity
                    style={styles.fieldTouchable}
                    activeOpacity={0.9}
                    onPress={() => setDropdownOpen(o => !o)}
                  >
                    <View pointerEvents="none">
                      <TextInputField
                        label="Recipient"
                        placeholder="Choose from list"
                        value={selectedRecipient?.name ?? ''}
                      />
                    </View>
                  </TouchableOpacity>
                  {/* Chevron — sibling of TouchableOpacity, anchored to input bottom */}
                  <View style={styles.fieldIcon} pointerEvents="none">
                    <Svg width={scale(16)} height={scale(16)} viewBox="0 0 24 24" fill="none">
                      <Path
                        d={dropdownOpen ? 'M7 14l5-5 5 5' : 'M7 10l5 5 5-5'}
                        stroke={palette.gold.subtlest}
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                </View>

                {dropdownOpen && (
                  <TouchableOpacity
                    style={styles.dropdownBackdrop}
                    activeOpacity={1}
                    onPress={() => setDropdownOpen(false)}
                  />
                )}

                {/* Inline recipient list */}
                {dropdownOpen && (
                  <View style={styles.dropdownList}>
                    {loading ? (
                      <View style={styles.listState}>
                        <ActivityIndicator size="small" color={palette.gold.DEFAULT} />
                      </View>
                    ) : recipients.length === 0 ? (
                      <View style={styles.listState}>
                        <Text style={styles.emptyText}>No recipients yet</Text>
                      </View>
                    ) : (
                      recipients.map((r, idx) => {
                        const isLast = idx === recipients.length - 1;
                        return (
                          <TouchableOpacity
                            key={r.recipient_id}
                            style={[styles.dropdownOption, isLast && styles.dropdownOptionLast]}
                            activeOpacity={0.85}
                            onPress={() => { setSelectedRecipient(r); setDropdownOpen(false); }}
                          >
                            <Text style={styles.optionName}>{r.name}</Text>
                            <Text style={styles.optionEmail}>{r.email}</Text>
                          </TouchableOpacity>
                        );
                      })
                    )}
                    <TouchableOpacity
                      style={styles.addNewRow}
                      activeOpacity={0.85}
                      onPress={() => { setDropdownOpen(false); navigation.navigate('AddNewProfileScreen'); }}
                    >
                      <Text style={styles.addNewText}>+ Add New Recipient</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* ── Lock Date ─────────────────────────────────────────── */}
              {/*
                TextInputField (editable=false) as the trigger surface.
                Calendar icon overlaid absolutely on the right.
              */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldWithIcon}>
                  <TouchableOpacity
                    style={styles.fieldTouchable}
                    activeOpacity={0.9}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <View pointerEvents="none">
                      <TextInputField
                        label="Lock Date (only if required)"
                        placeholder="When do you want to open it?"
                        value={lockDate ? formatDate(lockDate) : ''}
                      />
                    </View>
                  </TouchableOpacity>
                  {/* Calendar — sibling, anchored to input bottom */}
                  <View style={styles.fieldIcon} pointerEvents="none">
                    <Image
                      source={require('@assets/calendar_month.png')}
                      style={styles.calendarIcon}
                      resizeMode="contain"
                    />
                  </View>
                </View>

                {showDatePicker && (
                  <DateTimePicker
                    value={lockDate ?? new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                    textColor={palette.gold.DEFAULT}
                    themeVariant="dark"
                  />
                )}
              </View>

              {/* ── Letter to Recipient ───────────────────────────────── */}
              <View style={styles.fieldGroup}>
                <TextInputField
                  label="Letter to Recipient"
                  placeholder="Write notes here"
                  value={notes}
                  onChangeText={setNotes}
                  size="L"
                  multiline
                />
              </View>

              {/* ── NEXT button ───────────────────────────────────────── */}
              <Button
                variant="primary"
                size="L"
                title="NEXT"
                onPress={handleNext}
                disabled={!selectedRecipient}
                active={!!selectedRecipient}
              />

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default ChooseRecipientScreen;

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create<{
  bg: ViewStyle;
  safe: ViewStyle;
  kav: ViewStyle;
  scroll: ViewStyle;
  scrollContent: ViewStyle;
  content: ViewStyle;
  // Header
  headerRow: ViewStyle;
  backBtn: ViewStyle;
  screenTitle: TextStyle;
  headerSpacer: ViewStyle;
  // Field groups
  fieldGroup: ViewStyle;
  fieldWithIcon: ViewStyle;
  fieldTouchable: ViewStyle;
  fieldIcon: ViewStyle;
  // Dropdown / picker
  dropdownBackdrop: ViewStyle;
  dropdownList: ViewStyle;
  dropdownOption: ViewStyle;
  dropdownOptionLast: ViewStyle;
  optionName: TextStyle;
  optionEmail: TextStyle;
  listState: ViewStyle;
  emptyText: TextStyle;
  addNewRow: ViewStyle;
  addNewText: TextStyle;
  calendarIcon: ImageStyle;
}>({
  bg:   { flex: 1 },
  safe: { flex: 1, backgroundColor: 'transparent' },
  kav:  { flex: 1, width: '100%' },

  scroll: { flex: 1 },
  scrollContent: {
    flexGrow:          1,
    paddingBottom:     verticalScale(spacing.xxxl),
  },
  content: {
    paddingHorizontal: scale(spacing.xl),               // 24px
    paddingTop:        verticalScale(spacing.l),
    gap:               verticalScale(spacing.l),         // 20px between sections
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  headerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width:          scale(44),
    height:         scale(44),
    justifyContent: 'center',
    alignItems:     'flex-start',
  },
  // Heading M: Cormorant Regular 28/32, #f2e1b0, glow
  screenTitle: {
    fontFamily:       fontFamily.heading,
    fontSize:         moderateScale(fontSize['2xl']),    // 28px
    fontWeight:       fontWeight.regular,
    lineHeight:       moderateScale(32),
    color:            palette.gold.DEFAULT,
    textAlign:        'center',
    textShadowColor:  'rgba(240,212,168,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    flex:             1,
  },
  headerSpacer: { width: scale(44) },

  // ── Field groups ────────────────────────────────────────────────────────────
  fieldGroup: { gap: verticalScale(spacing.xs) },       // 8px label-to-field gap

  // Heading XS Bold: Cormorant Medium 20/24, gold
  fieldLabel: {
    fontFamily: fontFamily.heading,
    fontWeight: '500',
    fontSize:   moderateScale(fontSize.l),
    lineHeight: moderateScale(24),
    color:      palette.gold.DEFAULT,
  },
  fieldLabelLight: {
    fontFamily: fontFamily.bodyLight,
    fontWeight: '300',
    fontSize:   moderateScale(fontSize.xs),
    lineHeight: moderateScale(20),
    color:      palette.navy.light,
  },
  required: { color: palette.gold.DEFAULT },
  fieldWithIcon:  { position: 'relative' },
  fieldTouchable: { width: '100%' },

  // Icon sibling of fieldTouchable, positioned absolutely on fieldWithIcon.
  // bottom: 0 = bottom of the entire TextInputField (label + input).
  // height: scale(40) ≈ input field height only — so the icon centres in
  // the INPUT area, not in label+input together.
  fieldIcon: {
    position:       'absolute',
    right:          scale(spacing.m),
    bottom:         0,
    height:         scale(40),
    justifyContent: 'center',
    alignItems:     'center',
    zIndex:         2,
  },

  // ── Dropdown / picker overlays ─────────────────────────────────────────────
  dropdownBackdrop: {
    position: 'absolute',
    top:      -200, left: -100, right: -100, bottom: -200,
    zIndex:   -1,
  },

  // Inline list
  dropdownList: {
    width:       '100%',
    borderWidth: borderWidth.hairline,
    borderColor: palette.navy.medium,
    borderTopWidth: 0,
    borderBottomLeftRadius:  8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
    maxHeight: verticalScale(220),
  },
  dropdownOption: {
    backgroundColor:   'rgba(253,253,249,0.05)',
    paddingVertical:   verticalScale(spacing.s),
    paddingHorizontal: scale(spacing.m),
    borderBottomWidth: borderWidth.hairline,
    borderBottomColor: palette.navy.medium,
  },
  dropdownOptionLast: {
    borderBottomWidth: 0,
  },
  // Body S Regular: Inter 16/24, gold
  optionName: {
    fontFamily: fontFamily.body,
    fontSize:   moderateScale(fontSize.s),
    lineHeight: moderateScale(24),
    color:      palette.gold.DEFAULT,
  },
  // Body XS Light: Inter Light 14/20, navy.light
  optionEmail: {
    fontFamily: fontFamily.bodyLight,
    fontWeight: '300',
    fontSize:   moderateScale(fontSize.xs),
    lineHeight: moderateScale(20),
    color:      palette.navy.light,
  },
  listState: {
    alignItems:    'center',
    paddingVertical: verticalScale(spacing.m),
    backgroundColor: 'rgba(253,253,249,0.05)',
  },
  emptyText: {
    fontFamily: fontFamily.body,
    fontSize:   moderateScale(fontSize.s),
    color:      palette.navy.light,
  },
  addNewRow: {
    alignItems:      'center',
    paddingVertical: verticalScale(spacing.s),
    backgroundColor: 'rgba(253,253,249,0.03)',
  },
  addNewText: {
    fontFamily: fontFamily.body,
    fontSize:   moderateScale(fontSize.s),
    color:      palette.gold.DEFAULT,
    opacity:    0.8,
  },

  calendarIcon: {
    width:     scale(20),
    height:    scale(20),
    tintColor: palette.navy.light,    // matches placeholder color (#a3b3cc = Text/Inverse Paragraph-2)
  },
});
