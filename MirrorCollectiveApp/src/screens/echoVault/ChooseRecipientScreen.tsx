/**
 * Choose Recipient Screen
 * Figma: Design-Master-File → Choose Your Recipient (791:1488)
 *
 * Layout (top → bottom):
 *   LogoHeader
 *   Header row: ← | CHOOSE YOUR RECIPIENT | spacer
 *   "Recipient *" label + inline dropdown (Choose from list ▼ / ▲ + list)
 *   "Lock Date (only if required)" label + date input (calendar icon)
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
  theme,
  verticalScale,
} from '@theme';
import type { RootStackParamList } from '@types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
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
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button/Button';
import LogoHeader from '@components/LogoHeader';
import TextInputField from '@components/TextInputField';
import { echoApiService, type Recipient } from '@services/api/echo';

type Props = NativeStackScreenProps<RootStackParamList, 'ChooseRecipientScreen'>;

// ── Back arrow ────────────────────────────────────────────────────────────────
// Use the shared `back-arrow.png` asset to stay pixel-aligned with every
// other screen. The Material arrow_back SVG path occupies only ~67% of its
// viewBox, so rendering it at 20×20 made the glyph visibly smaller than
// the PNG which fills its frame edge-to-edge.
const BackIcon: React.FC = () => (
  <Image
    source={require('@assets/back-arrow.png')}
    style={styles.backArrowImg}
    resizeMode="contain"
  />
);

// ── Screen ────────────────────────────────────────────────────────────────────
const ChooseRecipientScreen: React.FC<Props> = ({ navigation, route }) => {
  const {
    title,
    category,
    editEchoId,
    prefillRecipient,
    prefillLockDate,
    prefillContent,
  } = route.params;

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(
    // Hydrate from prefill if present so the dropdown opens already filled.
    // We coerce the lightweight prefill payload into a Recipient — the picker
    // only displays name/profile_image_url so the missing fields don't matter.
    prefillRecipient
      ? ({
          recipient_id: prefillRecipient.recipient_id,
          user_id: '',
          name: prefillRecipient.name,
          email: prefillRecipient.email,
          motif: prefillRecipient.motif,
          profile_image_url: prefillRecipient.profile_image_url,
          created_at: '',
        } as Recipient)
      : null,
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [lockDate, setLockDate] = useState<Date | null>(
    prefillLockDate ? new Date(prefillLockDate) : null,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  // iOS shows the spinner inside a modal and commits on "Done", so edits are
  // staged here until confirmed. Android commits immediately on selection.
  const [draftDate, setDraftDate] = useState<Date>(new Date());

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

  const openDatePicker = () => {
    setDraftDate(lockDate ?? new Date());
    setShowDatePicker(true);
  };

  const handleDateChange = (_: any, date?: Date) => {
    if (Platform.OS === 'android') {
      // Android dialog is self-dismissing; commit immediately.
      setShowDatePicker(false);
      if (date) setLockDate(date);
      return;
    }
    // iOS: stage the spinner value; "Done" commits it.
    if (date) setDraftDate(date);
  };

  const confirmDate = () => {
    setLockDate(draftDate);
    setShowDatePicker(false);
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  /**
   * Navigate forward to the compose step, passing the chosen recipient and
   * lock date along. Works for both create and edit flows — the only
   * difference is whether `editEchoId` is propagated so compose PATCHes the
   * existing echo instead of creating a new one.
   */
  const handleNext = () => {
    if (!selectedRecipient) return;
    // Both create and edit now use the unified CreateEchoScreen; editEchoId
    // makes it load the existing draft (message + attachments) and PATCH.
    navigation.navigate('CreateEchoScreen', {
      title,
      category,
      recipientId: selectedRecipient.recipient_id,
      recipientName: selectedRecipient.name,
      lockDate: lockDate?.toISOString(),
      ...(editEchoId ? { editEchoId, initialContent: prefillContent } : {}),
    });
  };

  return (
    <BackgroundWrapper style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        />
        <LogoHeader navigation={navigation} />

        <KeyboardAwareScrollView
          style={[styles.kav, styles.scroll]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          bottomOffset={16}
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

              {/* Trigger — Figma 780:1969. Mirrors TextInputField one-for-one
                  so the closed trigger reads as the same surface as the Lock
                  Date input: same near-white vertical gradient, same drop
                  shadow, same border. The gradient hides while the dropdown
                  is open (matching TextInputField's `!isFocused` condition).
              */}
              <TouchableOpacity
                style={[
                  styles.dropdownTrigger,
                  dropdownOpen && styles.dropdownTriggerOpen,
                ]}
                activeOpacity={0.9}
                onPress={() => setDropdownOpen(o => !o)}
              >
                {!dropdownOpen && (
                  <LinearGradient
                    colors={['rgba(253,253,249,0.04)', 'rgba(253,253,249,0.01)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                  />
                )}
                <Text
                  style={[
                    styles.dropdownTriggerText,
                    selectedRecipient ? styles.dropdownTriggerSelected : null,
                  ]}
                  numberOfLines={1}
                >
                  {selectedRecipient?.name ?? 'Choose from list'}
                </Text>
                <Svg
                  width={scale(16)}
                  height={scale(16)}
                  viewBox="0 0 24 24"
                  fill="none"
                >
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
                        <ActivityIndicator
                          size="small"
                          color={palette.gold.DEFAULT}
                        />
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
                            style={[
                              styles.dropdownOption,
                              isLast && styles.dropdownOptionLast,
                            ]}
                            activeOpacity={0.85}
                            onPress={() => {
                              setSelectedRecipient(r);
                              setDropdownOpen(false);
                            }}
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
                      onPress={() => {
                        setDropdownOpen(false);
                        navigation.navigate('AddNewProfileScreen');
                      }}
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
                  activeOpacity={0.7}
                  onPress={openDatePicker}
                  accessibilityRole="button"
                  accessibilityLabel="Choose lock date"
                >
                  <View pointerEvents="none">
                    <TextInputField
                      label="Lock Date (only if required)"
                      placeholder="When do you want to open it?"
                      placeholderAlign="left"
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

              {/* Android: native self-dismissing dialog. */}
              {Platform.OS === 'android' && showDatePicker && (
                <DateTimePicker
                  value={lockDate ?? new Date()}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}

              {/* iOS: spinner in a confirm/cancel sheet — responsive + clear. */}
              {Platform.OS === 'ios' && (
                <Modal
                  visible={showDatePicker}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setShowDatePicker(false)}
                >
                  <TouchableOpacity
                    style={styles.pickerBackdrop}
                    activeOpacity={1}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <View style={styles.pickerCard}>
                      <View style={styles.pickerHeader}>
                        <TouchableOpacity
                          onPress={() => setShowDatePicker(false)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.pickerCancel}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={confirmDate}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.pickerDone}>Done</Text>
                        </TouchableOpacity>
                      </View>
                      <DateTimePicker
                        value={draftDate}
                        mode="date"
                        display="spinner"
                        onChange={handleDateChange}
                        minimumDate={new Date()}
                        textColor={palette.gold.DEFAULT}
                        themeVariant="dark"
                      />
                    </View>
                  </TouchableOpacity>
                </Modal>
              )}
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
        </KeyboardAwareScrollView>
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
  pickerBackdrop: ViewStyle;
  pickerCard: ViewStyle;
  pickerHeader: ViewStyle;
  pickerCancel: TextStyle;
  pickerDone: TextStyle;
  calendarIcon: ImageStyle;
  backArrowImg: ImageStyle;
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
    // Mirror the TextInputField label so the Recipient and Lock Date labels
    // are visually identical: Cormorant Medium 20/32, Text/Paragraph-2 white.
    fontFamily: fontFamily.headingMedium,
    fontSize:   moderateScale(fontSize.l, 0.3),
    lineHeight: lineHeight.xl,
    color:      palette.gold.subtlest,
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

  // ── Dropdown trigger — mirrors TextInputField (Lock Date) one-for-one
  //    so Recipient and Lock Date are visually indistinguishable.
  //    Reference: src/components/TextInputField.tsx `field`, `fieldInactive`.
  //
  //    Three pieces beyond the obvious border/padding:
  //      - overflow:'hidden' so the LinearGradient rendered as the
  //        first child clips to the rounded corners
  //      - theme.shadows.input — the soft drop shadow under the field
  //        (0/4 offset, 12 radius, black @ 25 %) that gives Lock Date
  //        its visible depth against the page background
  //      - the near-white 0.04 -> 0.01 vertical gradient lives in the
  //        JSX above (only when closed) so the surface itself reads as
  //        a softly-lit panel, not a flat tint
  //    Without these the border colour matches but the field doesn't.
  dropdownTrigger: {
    minHeight:         48,                       // Figma: Hug (48px)
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: spacing.m,                // 16 — Figma: Spacing/M
    paddingVertical:   spacing.s,                // 12 — Figma: Spacing/S
    borderRadius:      radius.m,                 // 16 — Figma: Radius/M (was radius.s = 12)
    borderWidth:       0.5,
    borderColor:       palette.navy.light,       // #a3b3cc — Figma: Border/Subtle
    overflow:          'hidden',                 // clip the inner LinearGradient to borderRadius
    ...theme.shadows.input,                      // Figma: drop shadow 0 4 12 black 25%
  },
  // When expanded, flatten the bottom corners so the trigger flows
  // seamlessly into the inline option list. Top corners stay at
  // radius.m to match the TextInputField corner radius.
  dropdownTriggerOpen: {
    borderTopLeftRadius:     radius.m,
    borderTopRightRadius:    radius.m,
    borderBottomLeftRadius:  0,
    borderBottomRightRadius: 0,
    borderBottomWidth:       0,
    backgroundColor:         'rgba(163,179,204,0.05)',
  },
  // Placeholder typography copied from theme.typography.styles.inputPlaceholder
  // (the same semantic style TextInputField renders for its placeholder),
  // so "Choose from list" reads identically to "When do you want to open it?".
  dropdownTriggerText: {
    flex:       1,
    fontFamily: fontFamily.body,                 // Inter Regular — not italic
    fontSize:   moderateScale(fontSize.s, 0.3),  // 16 base with input scale factor
    lineHeight: lineHeight.m,                    // 24
    color:      palette.navy.light,              // #a3b3cc — Text/Inverse Paragraph-2
    textAlign:  'left',
  },
  // Filled-state override — mirrors TextInputField's `input` text colour
  // (Text/Paragraph-2 white) so a selected recipient reads like a typed
  // value would in the Lock Date field.
  dropdownTriggerSelected: {
    fontFamily: fontFamily.body,
    color:      palette.gold.subtlest,           // #fdfdf9 — matches TextInputField input
  },

  // ── Dropdown list ──────────────────────────────────────────────────────────
  dropdownBackdrop: {
    position: 'absolute',
    top: -200, left: -100, right: -100, bottom: -200,
    zIndex: -1,
  },
  dropdownList: {
    width:                   '100%',
    borderWidth:             0.5,
    borderTopWidth:          0,
    borderColor:             palette.navy.light,
    // Match the trigger's radius.m so the open shape has the same
    // corner radius top and bottom.
    borderBottomLeftRadius:  radius.m,
    borderBottomRightRadius: radius.m,
    overflow:                'hidden',
    maxHeight:               verticalScale(260),
  },
  dropdownOption: {
    backgroundColor:   'rgba(253,253,249,0.05)',
    paddingVertical:   verticalScale(spacing.s),
    paddingHorizontal: scale(spacing.m),
    borderBottomWidth: 0.25,
    borderBottomColor: palette.navy.light,
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


  // ── iOS date-picker sheet ────────────────────────────────────────────────
  pickerBackdrop: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent:  'flex-end',
  },
  pickerCard: {
    backgroundColor:   palette.navy.deep,
    borderTopLeftRadius:  radius.l,
    borderTopRightRadius: radius.l,
    borderTopWidth:    0.5,
    borderColor:       palette.navy.light,
    paddingBottom:     verticalScale(spacing.xl),
  },
  pickerHeader: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    paddingHorizontal: scale(spacing.l),
    paddingVertical:   verticalScale(spacing.s),
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(163,179,204,0.25)',
  },
  pickerCancel: {
    fontFamily: fontFamily.body,
    fontSize:   moderateScale(fontSize.s),
    color:      palette.navy.light,
  },
  pickerDone: {
    fontFamily: fontFamily.heading,
    fontSize:   moderateScale(fontSize.l),
    color:      palette.gold.DEFAULT,
  },

  calendarIcon: {
    width:     scale(20),
    height:    scale(20),
    tintColor: palette.navy.light,    // matches placeholder color (#a3b3cc = Text/Inverse Paragraph-2)
  },
  backArrowImg: {
    width:     scale(20),
    height:    scale(20),
    tintColor: palette.gold.DEFAULT,
  },
});
