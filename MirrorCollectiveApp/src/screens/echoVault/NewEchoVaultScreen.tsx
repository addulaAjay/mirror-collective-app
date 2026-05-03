/**
 * New Echo Screen
 * Figma: Design-Master-File → New Echo (211:1597)
 *
 * Layout (top → bottom, all within left:24 w:345 gap:24 column):
 *   LogoHeader (MC logo header)
 *   Header row: ← | NEW ECHO | spacer
 *   Title input          — gradient 0.01→0, border 0.25px #a3b3cc, radius 12, py:12 px:16
 *   Hero illustration    — 216×200, brain/constellation asset
 *   Category dropdown    — gradient 0.01→0, border 0.25px #60739f, radius 12, h:48
 *   Recipient row        — gradient bg, TOP-ONLY radius 12, padding 8px (Spacing/XS)
 *   Action buttons row   — gap:32, 3×{72×64} flat bg-surface, border 0.5px brand, shadow
 *   NEXT button          — gradient 0.01→0, border 0.5px #a3b3cc, radius 16 (Radius/M)
 *
 * Token audit (from Figma 211:1597 variable defs):
 *   Heading M 28/32 → fontFamily.heading, Cormorant Regular
 *   Heading S 24/28 → fontFamily.heading 24/28 (NEXT button)
 *   Body S Italic 16/24 → fontFamily.bodyItalic (placeholder, dropdown, recipient label)
 *   Body S Medium 16/24 → fontFamily.body weight 500 (YES/NO labels)
 *   Text/Paragraph-1 #f2e1b0 → palette.gold.DEFAULT
 *   Text/Paragraph-2 #fdfdf9 → palette.gold.subtlest
 *   Icon/Subtle #dfe3ec → palette.navy.lighter
 *   Border/Subtle #a3b3cc → palette.navy.light
 *   Border/Inverse-1 #60739f → palette.navy.medium
 *   Border/Brand #f2e1b0 → palette.gold.DEFAULT
 *   Bg/Surface rgba(163,179,204,0.05) → palette.surface.DEFAULT
 *   Radius/S 12, Radius/M 16, Spacing/XS 8, Spacing/S 12, Spacing/M 16, Spacing/L 20
 */

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  borderWidth,
  fontFamily,
  fontSize,
  fontWeight,
  moderateScale,
  palette,
  radius,
  scale,
  spacing,
  verticalScale,
} from '@theme';
import type { RootStackParamList } from '@types';
import React, { useState } from 'react';
import {
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
import Svg, { Path, Rect } from 'react-native-svg';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button/Button';
import LogoHeader from '@components/LogoHeader';
import TextInputField from '@components/TextInputField';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'NewEchoScreen'>;

// ── Category options ──────────────────────────────────────────────────────────
// Categories per Figma 734:1308
const CATEGORIES = ['Grief', 'Love', 'Healing', 'Loss', 'Memory'];

// ── Checkbox icon — Figma imgComponent7/8 (20×20 outlined square) ─────────────
const CheckboxIcon: React.FC<{ checked: boolean }> = ({ checked }) => (
  <Svg width={scale(20)} height={scale(20)} viewBox="0 0 20 20" fill="none">
    <Rect
      x={0.5} y={0.5} width={19} height={19}
      rx={3.5}
      stroke={palette.gold.DEFAULT}
      strokeWidth={1}
      fill={checked ? 'rgba(215,192,138,0.25)' : 'transparent'}
    />
    {checked && (
      <Path
        d="M4.5 10l4 4 7-8"
        stroke={palette.gold.DEFAULT}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
  </Svg>
);

// ── Back arrow icon ───────────────────────────────────────────────────────────
const BackIcon: React.FC = () => (
  <Svg width={scale(20)} height={scale(20)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
      fill={palette.gold.DEFAULT}
    />
  </Svg>
);

// ── Action button ─────────────────────────────────────────────────────────────
// ── Action button components ──────────────────────────────────────────────────
// Figma 220:2035 — all 3 buttons have IDENTICAL styling:
//   bg Bg/Surface, border 0.5px Border/Brand #f2e1b0, radius 12,
//   shadow 0 0 15px rgba(242,226,177,0.3), padding 16v/20h
// Icons are always gold (palette.gold.DEFAULT) regardless of selection.
// Selected state ONLY changes the background highlight.

interface ActionBtnProps {
  children: React.ReactNode;
  selected: boolean;
  onPress: () => void;
}
const ActionBtn: React.FC<ActionBtnProps> = ({ children, selected, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
    <View style={[styles.actionBtn, selected && styles.actionBtnSelected]}>
      {children}
    </View>
  </TouchableOpacity>
);

// T button — Figma: 29×32 serif "T" icon = Cormorant Garamond character, gold
const TextModeIcon: React.FC = () => (
  <Text style={styles.actionTextIcon}>T</Text>
);

// Mic button — Figma: 24×24 Material mic icon in 29×32 container
const MicModeIcon: React.FC = () => (
  <Image source={require('@assets/mic.png')} style={styles.actionImgIcon} resizeMode="contain" />
);

// Video button — Figma: 24×24 Material videocam icon in 32×32 container
const VideoModeIcon: React.FC = () => (
  <Image source={require('@assets/videocam.png')} style={styles.actionImgIcon} resizeMode="contain" />
);

// ── Screen ────────────────────────────────────────────────────────────────────
const NewEchoScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [hasRecipient, setHasRecipient] = useState<'yes' | 'no' | null>(null);
  const [mode, setMode] = useState<'text' | 'audio' | 'video'>('text');

  const onNext = () => {
    if (!title.trim()) return;
    const cat = category || 'Uncategorized';
    if (hasRecipient === 'yes') {
      navigation.navigate('ChooseRecipientScreen', { title, category: cat, mode });
    } else {
      navigation.navigate('NewEchoComposeScreen', {
        mode,
        title,
        category: cat,
        hasRecipient: false,
      });
    }
  };

  return (
    <BackgroundWrapper style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

        {/* Figma: LogoHeader always at top */}
        <LogoHeader navigation={navigation} />

        {/*
          Screen is NOT scrollable — fixed layout filling the viewport.
          Dropdown expands inline with its own internal scroll.
          KeyboardAvoidingView keeps NEXT button above keyboard.
        */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            {/*
              Figma 220:2027 — content column:
              left:24, top:140, w:345, gap:24, items-center
            */}
            <View style={styles.content}>

              {/* ── Header row (222:2091) ─────────────────────────────── */}
              {/* back | NEW ECHO | spacer — justify-between, items-center */}
              <View style={styles.headerRow}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <BackIcon />
                </TouchableOpacity>

                {/* Heading M: Cormorant Regular 28/32, #f2e1b0, glow shadow */}
                <Text style={styles.screenTitle}>NEW ECHO</Text>

                {/* Equal spacer so title stays centred */}
                <View style={styles.headerSpacer} />
              </View>

              {/* ── Title input (220:2029) — uses MC TextInputField component */}
              <TextInputField
                value={title}
                onChangeText={setTitle}
                placeholder="Enter Title here"
                placeholderAlign="center"
                textAlign='center'
                size="S"
              />

              {/* ── Hero illustration (780:1043) ──────────────────────── */}
              {/* Figma: 216×200 container, image overflows (large brain constellation) */}
              <View style={styles.illustrationWrap}>
                <Image
                  source={require('@assets/mirror_echo_illustration.png')}
                  style={styles.illustrationImg}
                  resizeMode="contain"
                />
              </View>

              {/* ── Category dropdown (734:1307 / 734:1308) ──────────────
                Figma: ONE right-side chevron only (▼ closed, ▲ open).
                No left arrow — confirmed by Figma screenshot.
                Outside-tap: transparent absolute overlay dismisses it.
              */}
              {/* Invisible full-screen backdrop — only active when open */}
              {categoryOpen && (
                <TouchableOpacity
                  style={styles.dropdownBackdrop}
                  activeOpacity={1}
                  onPress={() => setCategoryOpen(false)}
                />
              )}

              <View style={styles.dropdownWrap}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setCategoryOpen(o => !o)}
                >
                  <View style={[styles.dropdownShell, categoryOpen && styles.dropdownShellOpen]}>
                    <Text style={[styles.dropdownText, !category && styles.dropdownPlaceholder]}>
                      {category ?? 'Choose echo category'}
                    </Text>

                    {/* Single right chevron — ▼ closed, ▲ open */}
                    <Svg width={scale(16)} height={scale(16)} viewBox="0 0 24 24" fill="none">
                      <Path
                        d={categoryOpen ? 'M7 14l5-5 5 5' : 'M7 10l5 5 5-5'}
                        stroke={palette.gold.subtlest}
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                </TouchableOpacity>

                {/* Inline option list — visible when open */}
                {/* Inline list — own ScrollView so ONLY the list scrolls */}
                {categoryOpen && (
                  <ScrollView
                    style={styles.dropdownList}
                    scrollEnabled
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                  >
                    {CATEGORIES.map((cat, idx) => {
                      const isLast = idx === CATEGORIES.length - 1;
                      return (
                        <TouchableOpacity
                          key={cat}
                          activeOpacity={0.85}
                          style={[
                            styles.dropdownOption,
                            isLast && styles.dropdownOptionLast,
                          ]}
                          onPress={() => { setCategory(cat); setCategoryOpen(false); }}
                        >
                          <Text style={styles.dropdownOptionText}>{cat}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>

              {/* ── Recipient row (1030:1153) ─────────────────────────── */}
              {/*
                Figma: backdrop-blur:30, gradient 0.01→0, padding 8px (Spacing/XS),
                TOP-ONLY corners rounded (radius 12) — rounded-tl-[12px] rounded-tr-[12px]
                justify-between, items-start
              */}
              {/* Plain View — LinearGradient caused same double-border + width issues */}
              <View style={styles.recipientRow}>
                {/* Body S Italic: Inter Italic 16/24, #fdfdf9, flex:1 shrinks first */}
                <Text style={styles.recipientLabel} numberOfLines={2}>
                  Do you have a recipient?
                </Text>

                {/* YES/NO checkboxes — gap:16, shrink-proof */}
                <View style={styles.recipientChoices}>
                  <TouchableOpacity
                    onPress={() => setHasRecipient('yes')}
                    style={styles.choiceBtn}
                    activeOpacity={0.8}
                  >
                    <CheckboxIcon checked={hasRecipient === 'yes'} />
                    <Text style={styles.choiceLabel}>YES</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setHasRecipient('no')}
                    style={styles.choiceBtn}
                    activeOpacity={0.8}
                  >
                    <CheckboxIcon checked={hasRecipient === 'no'} />
                    <Text style={styles.choiceLabel}>NO</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* ── Action buttons row (220:2035) ─────────────────────── */}
              {/*
                Figma: flex gap:32 h:64 items-center justify-center w-full
                3 buttons: T text, Mic, Videocam — each 72×64
                Each: bg Bg/Surface, border 0.5px Border/Brand, radius 12, shadow,
                padding 16v/20h — NOT gradient, flat fill
              */}
              <View style={styles.actionRow}>
                <ActionBtn selected={mode === 'text'}  onPress={() => setMode('text')}>
                  <TextModeIcon />
                </ActionBtn>
                <ActionBtn selected={mode === 'audio'} onPress={() => setMode('audio')}>
                  <MicModeIcon />
                </ActionBtn>
                <ActionBtn selected={mode === 'video'} onPress={() => setMode('video')}>
                  <VideoModeIcon />
                </ActionBtn>
              </View>

              {/* ── NEXT button (220:2042 — Component 2) ──────────────── */}
              {/*
                Figma: backdrop-blur:30, gradient 0.01→0, border 0.5px #a3b3cc (Border/Subtle),
                radius 16 (Radius/M), padding 12v/16h, gap:8
                Text: Heading S Cormorant Regular 24/28, #f2e1b0, warm glow shadow
                Width: content-sized (not full width)
              */}
              <Button
                variant="primary"
                title="NEXT"
                onPress={onNext}
              />

            </View>
        </KeyboardAvoidingView>

      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default NewEchoScreen;

// ── Styles ────────────────────────────────────────────────────────────────────


const styles = StyleSheet.create<{
  bg: ViewStyle;
  safe: ViewStyle;
  kav: ViewStyle;
  dropdownList: ViewStyle;
  content: ViewStyle;
  // Header
  headerRow: ViewStyle;
  backBtn: ViewStyle;
  screenTitle: TextStyle;
  headerSpacer: ViewStyle;
  // Title input
  dropdownBackdrop: ViewStyle;
  // Illustration
  illustrationWrap: ViewStyle;
  illustrationImg: ImageStyle;
  // Category dropdown
  dropdownWrap: ViewStyle;
  dropdownShell: ViewStyle;
  dropdownShellOpen: ViewStyle;
  dropdownText: TextStyle;
  dropdownPlaceholder: TextStyle;
  dropdownOption: ViewStyle;
  dropdownOptionLast: ViewStyle;
  dropdownOptionText: TextStyle;
  // Recipient row
  recipientRow: ViewStyle;
  recipientLabel: TextStyle;
  recipientChoices: ViewStyle;
  choiceBtn: ViewStyle;
  choiceLabel: TextStyle;
  // Action buttons
  actionRow: ViewStyle;
  actionBtn: ViewStyle;
  actionBtnSelected: ViewStyle;
  actionTextIcon: TextStyle;
  actionImgIcon: ImageStyle;
  // Modal
  modalBackdrop: ViewStyle;
  modalCard: ViewStyle;
  modalTitle: TextStyle;
  modalItem: ViewStyle;
  modalItemText: TextStyle;
}>({
  bg:   { flex: 1 },
  safe: { flex: 1, backgroundColor: 'transparent' },
  kav:  { flex: 1, width: '100%' },

  // Dropdown list — internally scrollable, maxHeight keeps it from taking
  // over the screen. Only THESE items scroll, not the whole screen.
  dropdownList: {
    maxHeight: verticalScale(200),
  },

  // Content column — gap:24 between all children
  // alignItems:'stretch' (default) lets children with width:'100%' work correctly.
  // Elements that need centering (illustration) use alignSelf:'center'.
  content: {
    flex:              1,
    width:             '100%',
    paddingHorizontal: scale(spacing.xl),         // 24px — Figma left:24
    paddingTop:        verticalScale(spacing.l),  // breathing room below LogoHeader
    paddingBottom:     verticalScale(spacing.xl),
    gap:               verticalScale(spacing.xl), // 24px between sections
  },

  // ── Header row ──────────────────────────────────────────────────────────────
  // Figma 222:2091 — justify-between, items-center, w-full
  headerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    width:          '100%',
  },
  backBtn: {
    width:          scale(44),
    height:         scale(44),
    justifyContent: 'center',
    alignItems:     'flex-start',
  },
  // Heading M: Cormorant Regular 28/32, #f2e1b0, glow text-shadow
  screenTitle: {
    fontFamily:       fontFamily.heading,
    fontSize:         moderateScale(fontSize['2xl']),    // 28px
    fontWeight:       fontWeight.regular,
    lineHeight:       moderateScale(32),                 // font/line-height/XL
    color:            palette.gold.DEFAULT,
    textShadowColor:  'rgba(240,212,168,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  headerSpacer: { width: scale(44) },

  // Absolute backdrop — covers full screen, only rendered when dropdown is open.
  // Tapping it closes the dropdown (outside-tap dismiss).
  // zIndex -1 keeps it behind the dropdown list.
  dropdownBackdrop: {
    position:   'absolute',
    top:        -200,
    left:       -100,
    right:      -100,
    bottom:     -200,
    zIndex:     -1,
  },

  // ── Illustration (780:1043) ──────────────────────────────────────────────────
  // Figma container: 216×200, image larger than container (overflows)
  illustrationWrap: {
    width:          scale(216),
    height:         scale(200),
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'visible',
    alignSelf:      'center',
  },
  illustrationImg: {
    width:  scale(216),
    height: scale(200),
  },

  // ── Category dropdown (Component2 / 734:1307) ────────────────────────────────
  // gradient 0.01→0, border 0.25px Border/Inverse-1 (#60739f), h:48, radius 12
  dropdownWrap: { width: '100%' },
  // Plain View — no LinearGradient to avoid iOS double-border artifact.
  // Gradient was rgba(253,253,249,0.01)→0 = near-invisible anyway.
  dropdownShell: {
    width:             '100%',
    height:            verticalScale(48),
    borderRadius:      radius.s,                        // 12px
    borderWidth:       borderWidth.hairline,            // 0.25px
    borderColor:       palette.navy.medium,             // #60739f (Border/Inverse-1)
    backgroundColor:   'transparent',
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: scale(spacing.m),                // 16px
    paddingVertical:   verticalScale(spacing.s),        // 12px
    gap:               scale(10),
  },
  // Body S Italic: Inter Italic 16/24, #fdfdf9, center (flex:1 makes it fill space)
  dropdownText: {
    flex:       1,
    fontFamily: fontFamily.bodyItalic,
    fontStyle:  'italic',
    fontSize:   moderateScale(fontSize.s),
    lineHeight: moderateScale(24),
    color:      palette.gold.subtlest,
    textAlign:  'center',
  },
  // When closed, full radius. When open, flatten bottom corners.
  dropdownShellOpen: {
    borderBottomLeftRadius:  0,
    borderBottomRightRadius: 0,
  },

  dropdownPlaceholder: { opacity: 0.7 },

  // Inline dropdown option row — Figma 734:1306
  // bg: rgba(253,253,249,0.05) (Bg/Surface-Raised), border 0.25px #60739f
  dropdownOption: {
    backgroundColor:  'rgba(253,253,249,0.05)',
    borderWidth:      borderWidth.hairline,
    borderColor:      palette.navy.medium,
    paddingVertical:  verticalScale(spacing.s),
    paddingHorizontal: scale(spacing.m),
    alignItems:       'center',
    justifyContent:   'center',
  },
  // Last option: rounded bottom corners (Radius/XS = 8px per Figma)
  dropdownOptionLast: {
    borderBottomLeftRadius:  8,
    borderBottomRightRadius: 8,
  },
  // Option text: Inter Regular 16/24, #f2e1b0 (gold — NOT white/placeholder)
  dropdownOptionText: {
    fontFamily: fontFamily.body,
    fontWeight: fontWeight.regular,
    fontSize:   moderateScale(fontSize.s),
    lineHeight: moderateScale(24),
    color:      palette.gold.DEFAULT,
    textAlign:  'center',
  },

  // ── Recipient row (1030:1153) ─────────────────────────────────────────────────
  // gradient 0.01→0, TOP-ONLY radius 12, padding 8px (Spacing/XS), justify-between
  // Plain View — no LinearGradient (same double-border artifact as input).
  // Gradient was 0.01→0 = near-invisible; replaced with transparent bg.
  // flexShrink on label ensures long text yields space to YES/NO buttons
  // rather than pushing them off screen.
  recipientRow: {
    flexDirection:       'row',
    alignItems:          'center',
    justifyContent:      'space-between',
    padding:             scale(spacing.xs),             // 8px (Spacing/XS)
    borderTopLeftRadius: radius.s,                      // Figma: rounded-tl-[12px]
    borderTopRightRadius: radius.s,                     // Figma: rounded-tr-[12px]
    backgroundColor:     'transparent',
  },
  // Body S Italic: Inter Italic 16/24, #fdfdf9
  // flex:1 + flexShrink:1 allow label to shrink if total row overflows
  recipientLabel: {
    fontFamily: fontFamily.bodyItalic,
    fontStyle:  'italic',
    fontSize:   moderateScale(fontSize.s),
    lineHeight: moderateScale(24),
    color:      palette.gold.subtlest,
    flex:       1,
    flexShrink: 1,
    marginRight: scale(spacing.xs),                     // gap from label to YES/NO
  },
  // YES/NO choices: flex-row with fixed gap, no shrink so they always show fully
  recipientChoices: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           scale(spacing.m),                    // 16px (Spacing/M)
    flexShrink:    0,                                   // never compress choices
  },
  choiceBtn: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           scale(spacing.xs),                   // 8px (Spacing/XS)
  },
  // Body S Medium: Inter 500 16/24, #f2e1b0
  choiceLabel: {
    fontFamily: fontFamily.body,
    fontWeight: '500',
    fontSize:   moderateScale(fontSize.s),
    lineHeight: moderateScale(24),
    color:      palette.gold.DEFAULT,
  },

  // ── Action buttons row (220:2035) ─────────────────────────────────────────────
  // flex gap:32 h:64 items-center justify-center w-full
  actionRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            scale(32),
    width:          '100%',
    height:         verticalScale(64),
  },
  // Each action button: Bg/Surface, border 0.5px Border/Brand, radius 12, shadow, 72×64
  // Figma: bg rgba(163,179,204,0.05) — flat, NOT gradient
  actionBtn: {
    width:           scale(72),
    height:          verticalScale(64),
    borderRadius:    radius.s,                          // 12px
    borderWidth:     borderWidth.thin,                  // 0.5px
    borderColor:     palette.gold.DEFAULT,              // Border/Brand #f2e1b0
    backgroundColor: palette.surface.DEFAULT,          // Bg/Surface rgba(163,179,204,0.05)
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical:  verticalScale(spacing.m),         // 16px (Spacing/M)
    paddingHorizontal: scale(spacing.l),                // 20px (Spacing/L)
    // Figma: shadow 0 0 15px rgba(242,226,177,0.3)
    boxShadow:       '0px 0px 15px 0px rgba(242, 226, 177, 0.3)',
    shadowColor:     palette.gold.warm,
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   0.3,
    shadowRadius:    15,
    elevation:       6,
  },
  // Selected: subtle gold bg highlight only — icon colour stays gold always
  actionBtnSelected: {
    backgroundColor: 'rgba(242,226,177,0.1)',
  },
  // T icon: Cormorant Garamond serif "T", 28px, gold — matches Figma imgProperty1Text
  actionTextIcon: {
    fontFamily: fontFamily.heading,
    fontSize:   moderateScale(32),
    fontWeight: fontWeight.regular,
    color:      palette.gold.DEFAULT,
    lineHeight: moderateScale(32),
  },
  // Mic/video icons: 29×32 container to match Figma icon dimensions, always gold tint
  actionImgIcon: {
    width:     scale(29),
    height:    scale(32),
    tintColor: palette.gold.DEFAULT,
  },

  // ── Modal ──────────────────────────────────────────────────────────────────────
  modalBackdrop: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: scale(spacing.xl),
  },
  modalCard: {
    width:           '100%',
    borderRadius:    radius.m,
    backgroundColor: 'rgba(10,12,18,0.96)',
    borderWidth:     borderWidth.regular,
    borderColor:     'rgba(215,192,138,0.25)',
    padding:         scale(spacing.m),
  },
  modalTitle: {
    fontFamily:   fontFamily.heading,
    fontSize:     moderateScale(fontSize.xl),
    fontWeight:   fontWeight.regular,
    color:        palette.gold.DEFAULT,
    textAlign:    'center',
    marginBottom: verticalScale(spacing.s),
  },
  modalItem: {
    paddingVertical:   verticalScale(spacing.s),
    paddingHorizontal: scale(spacing.s),
    borderRadius:      radius.s,
    borderWidth:       borderWidth.thin,
    borderColor:       'rgba(253,253,249,0.10)',
    marginBottom:      verticalScale(spacing.xs),
    backgroundColor:   'rgba(253,253,249,0.04)',
  },
  modalItemText: {
    fontFamily: fontFamily.body,
    fontSize:   moderateScale(fontSize.s),
    color:      palette.gold.subtlest,
    textAlign:  'center',
  },
});
