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
  lineHeight,
  moderateScale,
  palette,
  radius,
  scale,
  spacing,
  verticalScale,
} from '@theme';
import type { RootStackParamList } from '@types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

  const { top: topInset } = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const letterFieldRef = useRef<View>(null);

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [lockDate, setLockDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');

  // Scroll the letter field into view when it receives focus
  const scrollToLetterField = useCallback(() => {
    setTimeout(() => {
      letterFieldRef.current?.measureLayout(
        scrollViewRef.current as any,
        (_x, y) => scrollViewRef.current?.scrollTo({ y, animated: true }),
        () => scrollViewRef.current?.scrollToEnd({ animated: true }),
      );
    }, 100);
  }, []);

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
    <BackgroundWrapper style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <LogoHeader navigation={navigation} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          // Offset = safe area top inset + LogoHeader (~60px) so iOS calculates
          // the correct padding to keep the focused field above the keyboard.
          keyboardVerticalOffset={topInset + 60}
          style={styles.kav}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
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
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Recipient</Text>

                {/* Trigger — Figma 780:1969 */}
                <TouchableOpacity
                  style={[styles.dropdownTrigger, dropdownOpen && styles.dropdownTriggerOpen]}
                  activeOpacity={0.9}
                  onPress={() => setDropdownOpen(o => !o)}
                >
                  <Text
                    style={[
                      styles.dropdownTriggerText,
                      selectedRecipient ? styles.dropdownTriggerSelected : null,
                    ]}
                    numberOfLines={1}
                  >
                    {selectedRecipient?.name ?? 'Choose from list'}
                  </Text>
                  <Svg width={scale(16)} height={scale(16)} viewBox="0 0 24 24" fill="none">
                    <Path
                      d={dropdownOpen ? 'M7 14l5-5 5 5' : 'M7 10l5 5 5-5'}
                      stroke={palette.gold.subtlest}
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>

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
                    <ScrollView
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                      bounces={false}
                    >
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
                    </ScrollView>
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
              <View ref={letterFieldRef} style={styles.fieldGroup}>
                <TextInputField
                  label="Letter to Recipient"
                  placeholder="Write notes here"
                  value={notes}
                  onChangeText={setNotes}
                  size="L"
                  multiline
                  maxHeight={verticalScale(160)}
                  onFocus={scrollToLetterField}
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
  fieldLabel: TextStyle;
  fieldWithIcon: ViewStyle;
  fieldTouchable: ViewStyle;
  fieldIcon: ViewStyle;
  // Dropdown trigger
  dropdownTrigger: ViewStyle;
  dropdownTriggerOpen: ViewStyle;
  dropdownTriggerText: TextStyle;
  dropdownTriggerSelected: TextStyle;
  // Dropdown list
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
  fieldGroup: { gap: verticalScale(spacing.xs) },

  fieldLabel: {
    fontFamily: fontFamily.heading,
    fontWeight: fontWeight.medium,
    fontSize:   moderateScale(fontSize.l),
    lineHeight: lineHeight.m,
    color:      palette.gold.DEFAULT,
  },
  fieldWithIcon:  { position: 'relative' },
  fieldTouchable: { width: '100%' },
  fieldIcon: {
    position:       'absolute',
    right:          scale(spacing.m),
    bottom:         0,
    height:         scale(40),
    justifyContent: 'center',
    alignItems:     'center',
    zIndex:         2,
  },

  // ── Dropdown trigger — Figma 780:1969 ──────────────────────────────────────
  dropdownTrigger: {
    height:            scale(48),
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: scale(spacing.m),
    paddingVertical:   verticalScale(spacing.xs),
    borderRadius:      radius.s,
    borderWidth:       0.5,
    borderColor:       palette.navy.medium,
    backgroundColor:   'rgba(253,253,249,0.01)',
  },
  dropdownTriggerOpen: {
    borderTopLeftRadius:     radius.xs,
    borderTopRightRadius:    radius.xs,
    borderBottomLeftRadius:  0,
    borderBottomRightRadius: 0,
    borderBottomWidth:       0,
    backgroundColor:         'rgba(163,179,204,0.05)',
  },
  dropdownTriggerText: {
    flex:       1,
    fontFamily: fontFamily.bodyItalic,
    fontSize:   moderateScale(fontSize.s),
    lineHeight: lineHeight.m,
    color:      palette.gold.subtlest,
    textAlign:  'center',
  },
  dropdownTriggerSelected: {
    fontFamily: fontFamily.body,
    color:      palette.gold.DEFAULT,
  },

  // ── Dropdown list ──────────────────────────────────────────────────────────
  dropdownBackdrop: {
    position: 'absolute',
    top: -200, left: -100, right: -100, bottom: -200,
    zIndex: -1,
  },
  dropdownList: {
    width:                   '100%',
    borderWidth:             0.25,
    borderTopWidth:          0,
    borderColor:             palette.navy.medium,
    borderBottomLeftRadius:  radius.xs,
    borderBottomRightRadius: radius.xs,
    overflow:                'hidden',
    maxHeight:               verticalScale(260),
  },
  dropdownOption: {
    backgroundColor:   'rgba(253,253,249,0.05)',
    paddingVertical:   verticalScale(spacing.s),
    paddingHorizontal: scale(spacing.m),
    borderBottomWidth: 0.25,
    borderBottomColor: palette.navy.medium,
    alignItems:        'center',
  },
  dropdownOptionLast: { borderBottomWidth: 0 },
  optionName: {
    fontFamily: fontFamily.body,
    fontSize:   moderateScale(fontSize.s),
    lineHeight: lineHeight.m,
    color:      palette.gold.DEFAULT,
    textAlign:  'center',
  },
  optionEmail: {
    fontFamily: fontFamily.bodyLight,
    fontWeight: fontWeight.light,
    fontSize:   moderateScale(fontSize.xs),
    lineHeight: lineHeight.xs,
    color:      palette.navy.light,
    textAlign:  'center',
  },
  listState: {
    alignItems:      'center',
    paddingVertical: verticalScale(spacing.m),
    backgroundColor: 'rgba(253,253,249,0.05)',
  },
  emptyText: {
    fontFamily: fontFamily.body,
    fontSize:   moderateScale(fontSize.s),
    color:      palette.navy.light,
  },
  addNewRow: {
    backgroundColor:   'rgba(253,253,249,0.05)',
    paddingVertical:   verticalScale(spacing.s),
    paddingHorizontal: scale(spacing.m),
    alignItems:        'center',
  },
  addNewText: {
    fontFamily: fontFamily.heading,
    fontSize:   moderateScale(fontSize.l),
    lineHeight: lineHeight.m,
    color:      palette.gold.DEFAULT,
    textAlign:  'center',
  },


  calendarIcon: {
    width:     scale(20),
    height:    scale(20),
    tintColor: palette.navy.light,    // matches placeholder color (#a3b3cc = Text/Inverse Paragraph-2)
  },
});
