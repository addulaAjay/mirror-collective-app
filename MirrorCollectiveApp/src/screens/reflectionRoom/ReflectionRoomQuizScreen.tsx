/**
 * Reflection Room — Quiz (4 questions, Figma nodes 7128:3856 (Q1),
 * 7128:4201 (Q2), 7128:4545 (Q3), 7128:4971 (Q4)).
 *
 * Source: 03_UI_DEVELOPER_HANDOFF.md §12.4 (canonical prompts + footer
 * microcopy) + 01_BACKEND_IMPLEMENTATION_SPEC.md §5.1 (answer enums).
 *
 * Behavior:
 *  - Renders Q1..Q4 from the canonical questions data, in order.
 *  - Word questions show vertically-stacked glass chips. Q3 shows a
 *    motif-icon grid using the existing MOTIF_SVG asset map.
 *  - Footer microcopy switches between word and icon variants per spec.
 *  - Back button on Q1 returns to QuizEntry; later questions step back
 *    one question at a time.
 *  - Final NEXT/FINISH navigates to ReflectionRoomLoading with the full
 *    QuizAnswers payload as a route param. Loading owns the API call.
 *
 * Presentation matches Figma:
 *  - Word chips: 305-wide glass buttons (transparent-white gradient,
 *    0.25px border/bold, radius 12), Inter Light body text (S) with a
 *    gold glow. Selected chips take the gold "Text Button Selected"
 *    treatment (gold rim + stronger glow).
 *  - Prompt: Cormorant Heading XL / lineHeight 2XL, gold, glow shadow.
 *  - Footer: Cormorant Italic L / lineHeight XL, inverse-paragraph-2.
 *  - Nav row: bordered back box (flipped arrow) · centered NEXT glass
 *    button (asymmetric top-right radius) · symmetric spacer for centering.
 */

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { SvgXml } from 'react-native-svg';

import { MOTIF_SVG } from '@assets/motifs-icons/MotifIconAssets';
import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import ProgressBar from '@components/ProgressBar';
import {
  borderWidth,
  fontFamily,
  fontSize,
  glassGradient,
  lineHeight,
  palette,
  radius,
  scale,
  spacing,
  textShadow,
  verticalScale,
} from '@theme';
import type { RootStackParamList } from '@types';

import {
  QUIZ_QUESTIONS,
  isCompleteAnswers,
  type AnyQuestion,
  type PartialQuizAnswers,
} from '@features/reflection-room/data/quizQuestions';
import type { QuizAnswers } from '@features/reflection-room/api/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Figma "Transparent White Gradient" — top → bottom, near-transparent white.
const CHIP_GRADIENT = [glassGradient.echoSecondary.start, glassGradient.echoSecondary.end];

interface QuestionViewProps {
  question: AnyQuestion;
  selectedValue: string | undefined;
  onSelect: (value: string) => void;
}

const WordOptions: React.FC<QuestionViewProps> = ({
  question,
  selectedValue,
  onSelect,
}) => {
  if (question.type !== 'word') return null;
  return (
    <View style={styles.wordList} accessibilityRole="radiogroup">
      {question.options.map(option => {
        const isSelected = selectedValue === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={option.label}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <LinearGradient
              colors={CHIP_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[styles.wordChip, isSelected && styles.wordChipSelected]}
            >
              <Text
                style={[
                  styles.wordChipText,
                  isSelected && styles.wordChipTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </LinearGradient>
          </Pressable>
        );
      })}
    </View>
  );
};

const IconOptions: React.FC<QuestionViewProps> = ({
  question,
  selectedValue,
  onSelect,
}) => {
  if (question.type !== 'icon') return null;
  return (
    <View style={styles.iconGrid} accessibilityRole="radiogroup">
      {question.options.map(option => {
        const isSelected = selectedValue === option.value;
        const xml =
          MOTIF_SVG[option.motifKey] ??
          MOTIF_SVG[option.motifKey.replace('_', '-')] ??
          '';
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={option.label}
            style={({ pressed }) => [styles.iconCell, pressed && styles.pressed]}
          >
            <View
              style={[
                styles.iconCircle,
                isSelected && styles.iconCircleSelected,
              ]}
            >
              <SvgXml xml={xml} width={scale(84)} height={scale(84)} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const ReflectionRoomQuizScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<PartialQuizAnswers>({});

  const question = QUIZ_QUESTIONS[currentIndex];
  const isLast = currentIndex === QUIZ_QUESTIONS.length - 1;
  const selectedValue = (answers as Record<string, string>)[`q${question.id}`];

  const select = (value: string) => {
    setAnswers(prev => ({ ...prev, [`q${question.id}`]: value }));
  };

  const goBack = () => {
    if (currentIndex === 0) {
      navigation.goBack();
      return;
    }
    setCurrentIndex(idx => idx - 1);
  };

  const goNext = () => {
    if (!selectedValue) return;
    if (isLast) {
      // All four answers must be set if we're on the final question and
      // it has a selected value (UI guarantees this through prior gating,
      // but we still type-narrow for the API call).
      if (!isCompleteAnswers(answers)) return;
      const payload: QuizAnswers = answers as QuizAnswers;
      navigation.replace('ReflectionRoomLoading', { answers: payload });
      return;
    }
    setCurrentIndex(idx => idx + 1);
  };

  const progress = (currentIndex + 1) / QUIZ_QUESTIONS.length;

  return (
    <BackgroundWrapper style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.progressWrap}>
            <ProgressBar progress={progress} width={scale(345)} />
          </View>

          <Text
            style={styles.prompt}
            accessibilityRole="header"
            accessibilityLabel={question.prompt}
          >
            {question.prompt}
          </Text>

          {question.type === 'word' ? (
            <WordOptions
              question={question}
              selectedValue={selectedValue}
              onSelect={select}
            />
          ) : (
            <IconOptions
              question={question}
              selectedValue={selectedValue}
              onSelect={select}
            />
          )}

          <Text style={styles.footer}>{question.footer}</Text>

          <View style={styles.navRow}>
            <Pressable
              onPress={goBack}
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={8}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
            >
              <Image
                source={require('@assets/back-arrow.png')}
                style={styles.arrow}
                resizeMode="contain"
              />
            </Pressable>

            <Pressable
              onPress={goNext}
              disabled={!selectedValue}
              accessibilityRole="button"
              accessibilityLabel={isLast ? 'Finish quiz' : 'Next question'}
              accessibilityState={{ disabled: !selectedValue }}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <LinearGradient
                colors={CHIP_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[
                  styles.nextButton,
                  !selectedValue && styles.nextButtonDisabled,
                ]}
              >
                <Text style={styles.nextText}>{isLast ? 'FINISH' : 'NEXT'}</Text>
              </LinearGradient>
            </Pressable>

            {/* Symmetric spacer mirroring the back box so NEXT stays centered
                (Figma node 7128:4178 — an equal-weight, contentless box). */}
            <View style={styles.navSpacer} accessibilityElementsHidden />
          </View>
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default ReflectionRoomQuizScreen;

const CHIP_WIDTH = scale(305);
const BACK_BOX = scale(44);

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  progressWrap: {
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  prompt: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.l,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    paddingHorizontal: spacing.s,
    textShadowColor: textShadow.glow.color,
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: textShadow.glow.radius,
  },
  wordList: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: spacing.s,
    gap: spacing.m,
  },
  wordChip: {
    width: CHIP_WIDTH,
    maxWidth: '100%',
    height: verticalScale(55),
    borderRadius: radius.s,
    borderWidth: borderWidth.hairline,
    borderColor: palette.navy.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  wordChipSelected: {
    borderColor: palette.gold.DEFAULT,
    borderWidth: borderWidth.thin,
  },
  wordChipText: {
    fontFamily: fontFamily.bodyLight,
    fontSize: fontSize.s,
    lineHeight: lineHeight.m,
    color: palette.gold.subtlest,
    textAlign: 'center',
    textShadowColor: textShadow.glow.color,
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: textShadow.glow.radius,
  },
  wordChipTextSelected: {
    color: palette.gold.DEFAULT,
    textShadowColor: textShadow.glowStrong.color,
    textShadowRadius: textShadow.glowStrong.radius,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    rowGap: spacing.l,
    columnGap: spacing.xxl,
  },
  iconCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: scale(110),
    height: scale(110),
    borderRadius: radius.full,
    borderWidth: borderWidth.hairline,
    borderColor: palette.navy.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSelected: {
    borderColor: palette.gold.DEFAULT,
    borderWidth: borderWidth.regular,
  },
  footer: {
    fontFamily: fontFamily.headingItalic,
    fontSize: fontSize.l,
    lineHeight: lineHeight.l,
    color: palette.navy.light,
    textAlign: 'center',
    paddingHorizontal: spacing.l,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.m,
    marginTop: spacing.xs,
  },
  backButton: {
    width: BACK_BOX,
    height: BACK_BOX,
    borderRadius: radius.s,
    borderWidth: borderWidth.hairline,
    borderColor: palette.navy.light,
    backgroundColor: palette.surface.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    width: scale(20),
    height: scale(20),
    tintColor: palette.navy.light,
  },
  nextButton: {
    minWidth: scale(104),
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderTopLeftRadius: radius.s,
    borderBottomLeftRadius: radius.s,
    borderBottomRightRadius: radius.s,
    borderTopRightRadius: radius.m,
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextText: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.l,
    lineHeight: lineHeight.l,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    textShadowColor: textShadow.warmGlow.color,
    textShadowOffset: textShadow.warmGlow.offset,
    textShadowRadius: textShadow.warmGlow.radius,
  },
  navSpacer: {
    width: BACK_BOX,
    height: BACK_BOX,
  },
  pressed: { opacity: 0.7 },
});
