/**
 * Reflection Room — Quiz (4 questions, Figma node 4654-3272).
 *
 * Source: 03_UI_DEVELOPER_HANDOFF.md §12.4 (canonical prompts + footer
 * microcopy) + 01_BACKEND_IMPLEMENTATION_SPEC.md §5.1 (answer enums).
 *
 * Behavior:
 *  - Renders Q1..Q4 from the canonical questions data, in order.
 *  - Word questions show vertically-stacked text chips. Q3 shows a
 *    motif-icon grid using the existing MOTIF_SVG asset map.
 *  - Footer microcopy switches between word and icon variants per spec.
 *  - Back button on Q1 returns to QuizEntry; later questions step back
 *    one question at a time.
 *  - Final NEXT/FINISH navigates to ReflectionRoomLoading with the full
 *    QuizAnswers payload as a route param. Loading owns the API call.
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
import { SvgXml } from 'react-native-svg';

import { MOTIF_SVG } from '@assets/motifs-icons/MotifIconAssets';
import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import ProgressBar from '@components/ProgressBar';
import {
  borderWidth,
  fontFamily,
  fontSize,
  lineHeight,
  palette,
  radius,
  spacing,
  textShadow,
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
            style={({ pressed }) => [
              styles.wordChip,
              isSelected && styles.wordChipSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.wordChipText,
                isSelected && styles.wordChipTextSelected,
              ]}
            >
              {option.label}
            </Text>
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
            style={({ pressed }) => [
              styles.iconCell,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.iconCircle,
                isSelected && styles.iconCircleSelected,
              ]}
            >
              <SvgXml xml={xml} width={84} height={84} />
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
            <ProgressBar progress={progress} />
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
              style={({ pressed }) => [
                styles.nextButton,
                !selectedValue && styles.nextButtonDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.nextText}>{isLast ? 'FINISH' : 'NEXT'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default ReflectionRoomQuizScreen;

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: palette.navy.deep },
  safe: { flex: 1 },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.xxxl,
    gap: spacing.l,
  },
  progressWrap: {
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.s,
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
    gap: spacing.xs,
  },
  wordChip: {
    height: 64,
    borderRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: 'rgba(163, 179, 204, 0.3)',
    backgroundColor: 'rgba(10, 18, 40, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.s,
  },
  wordChipSelected: {
    borderColor: palette.gold.DEFAULT,
    borderWidth: borderWidth.regular,
    backgroundColor: 'rgba(20, 30, 60, 0.85)',
  },
  wordChipText: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.l,
    color: palette.gold.subtlest,
    letterSpacing: 2,
    textAlign: 'center',
  },
  wordChipTextSelected: {
    color: palette.gold.DEFAULT,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    rowGap: spacing.l,
    columnGap: spacing.xxxl,
  },
  iconCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: radius.full,
    borderWidth: borderWidth.hairline,
    borderColor: palette.navy.muted,
    backgroundColor: palette.navy.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSelected: {
    borderColor: palette.gold.DEFAULT,
    borderWidth: borderWidth.regular,
  },
  footer: {
    fontFamily: fontFamily.bodyItalic,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.s,
    color: palette.gold.subtlest,
    textAlign: 'center',
    paddingHorizontal: spacing.l,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.s,
    marginTop: spacing.s,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: { width: 20, height: 20, tintColor: palette.gold.DEFAULT },
  nextButton: {
    minWidth: 120,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.l,
    borderRadius: radius.s,
    borderWidth: borderWidth.thin,
    borderColor: palette.gold.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    borderColor: palette.navy.light,
    opacity: 0.5,
  },
  nextText: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.l,
    color: palette.gold.DEFAULT,
    letterSpacing: 2,
  },
  pressed: { opacity: 0.7 },
});
