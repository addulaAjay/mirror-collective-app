import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  palette,
  textShadow,
  fontFamily,
  fontSize,
  fontWeight,
  scale,
  verticalScale,
  moderateScale,
} from '@theme';
import type { QuizQuestion } from '@types';
import type { QuizSubmissionRequest } from '@types';
import type { RootStackParamList } from '@types';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button';
import ImageOptionButton, {
  type ImageOptionSymbol,
} from '@components/ImageOptionButton';
import LogoHeader from '@components/LogoHeader';
import OptionButton from '@components/OptionsButton';
import ProgressBar from '@components/ProgressBar';
import { quizApiService } from '@services/api/quiz';
import { QuizStorageService } from '@services/quizStorageService';

// Simple answer tracking for UI state
interface SimpleAnswer {
  questionId: number;
  answerText: string;
}

type QuizQuestionsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'QuizQuestions'
>;

const QuizQuestionsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<QuizQuestionsScreenNavigationProp>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | { icon: any } | null>(null);
  const [answers, setAnswers] = useState<SimpleAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  // Reset state and fetch questions
  useEffect(() => {
    const initializeQuiz = async () => {
      try {
        setIsLoading(true);
        // Reset previous state
        await QuizStorageService.resetQuizState();
        
        // Fetch questions from API
        const response = await quizApiService.getQuestions();
        
        if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
           console.log('Using questions from API');
           setQuestions(response.data);
        } else {
           console.error('Failed to load questions from API');
           Alert.alert(
             'Error',
             'Unable to load quiz questions. Please check your connection and try again.',
             [{ text: 'OK', onPress: () => navigation.goBack() }]
           );
        }
      } catch (error) {
        console.error('Failed to fetch questions:', error);
        Alert.alert(
          'Error',
          'Unable to load quiz questions. Please check your connection and try again.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeQuiz();
  }, []);

  if (isLoading) {
    return (
      <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage} scrollable>
        <SafeAreaView style={styles.safe}>
          <StatusBar
            barStyle="light-content"
            translucent
            backgroundColor="transparent"
          />
          <LogoHeader />
          <View style={styles.loadingContainer}>
            <View style={styles.loadingContent}>
              <ActivityIndicator size="large" color={palette.gold.warm} />
              <Text style={styles.loadingText}>{t('quiz.quizQuestions.loading')}</Text>
            </View>
          </View>
        </SafeAreaView>
      </BackgroundWrapper>
    );
  }

  // Ensure questions exist
  if (!questions || questions.length === 0) {
    return (
      <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage} scrollable>
        <SafeAreaView style={styles.safe}>
          <StatusBar
            barStyle="light-content"
            translucent
            backgroundColor="transparent"
          />
          <LogoHeader />
          <View style={styles.loadingContainer}>
            <Text style={styles.question}>Unable to load quiz. Please try again later.</Text>
          </View>
        </SafeAreaView>
      </BackgroundWrapper>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const symbolSequence: ImageOptionSymbol[] = [
    'star',
    'brick',
    'spiral',
    'mirror',
  ];
  const handleNext = async () => {
    if (!selected) return;

    // Find the selected option
    const selectedOption = currentQuestion.options.find(option => {
      if (currentQuestion.type === 'text') {
        return option.text === selected;
      } else {
        return option.label === selected;
      }
    });

    if (!selectedOption) return;

    const answerText = selectedOption.text || selectedOption.label || '';

    // Store simple answer for backend submission
    const newAnswers = [
      ...answers,
      {
        questionId: currentQuestion.id,
        answerText,
      },
    ];
    setAnswers(newAnswers);
    setSelected(null);

    if (isLast) {
      // Submit raw answers to backend for calculation
      try {
        const quizSubmission: QuizSubmissionRequest = {
          quizType: 'archetype', // Quiz identifier for multi-quiz support
          answers: newAnswers.map(answer => ({
            questionId: answer.questionId,
            question: questions.find(q => q.id === answer.questionId)?.question || '',
            answer: answer.answerText,
            answeredAt: new Date().toISOString(),
            type: questions.find(q => q.id === answer.questionId)?.type as
              | 'text'
              | 'image',
          })),
          completedAt: new Date().toISOString(),
          quizVersion: '1.0',
        };

        // Submit to backend (backend calculates the result)
        await QuizStorageService.submitAnonymousQuiz(quizSubmission);
        
        // Backend calculated and stored the result
        // Fetch from storage which was set during submission
        const storedQuiz = await QuizStorageService.getPendingQuizResults();
        
        if (storedQuiz?.backendResult) {
          const { final_archetype, assignment_reason, total_scores, archetype_details } = storedQuiz.backendResult;
          
          // Static image mapping for React Native (dynamic require not supported)
          const archetypeImages = {
            'seeker-archetype.png': require('@assets/seeker-archetype.png'),
            'guardian-archetype.png': require('@assets/guardian-archetype.png'),
            'flamebearer-archetype.png': require('@assets/flamebearer-archetype.png'),
            'weaver-archetype.png': require('@assets/weaver-archetype.png'),
          };

          const archetypeWithImage = {
            ...archetype_details,
            image: archetypeImages[archetype_details.imagePath as keyof typeof archetypeImages],
          };

          // Navigate with backend-calculated result
          navigation.navigate('QuizTuning', {
            archetype: archetypeWithImage,
            quizResult: {
              finalArchetype: final_archetype,
              assignmentReason: assignment_reason,
              totalScores: total_scores,
            },
          });
        } else {
          throw new Error('No backend result received');
        }
      } catch (error) {
        console.error('Failed to submit quiz results:', error);
        // Show error - don't navigate to avoid showing incomplete data
        Alert.alert(
          t('quiz.quizQuestions.storageErrorTitle'),
          t('quiz.quizQuestions.storageErrorMessage'),
        );
      }
    } else {
      setCurrentIndex(currentIndex + 1);
    }
    setSelected(null);
  };

  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <SafeAreaView style={styles.safe}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />
      {/*
        Layout shape (sticky-CTA pattern, only options scroll):
          ┌─────────────────────────────┐
          │ LogoHeader        (pinned)  │
          │ ProgressBar       (pinned)  │
          │ Question          (pinned)  │
          ├─────────────────────────────┤
          │ ScrollView (flex:1) — clips │
          │   to its bounds. Options    │
          │   scroll inside; nothing    │
          │   bleeds into the button.   │
          ├─────────────────────────────┤
          │ NEXT button       (pinned)  │
          └─────────────────────────────┘
        Only the options list scrolls; question and CTA stay in place.
        Card glow shadows render into the contentContainer's vertical
        padding (16 top, 60 bottom = Figma gap to button) — no need for
        overflow:visible on the ScrollView, so options can't render under
        the button.
      */}
      <LogoHeader />

      {/* Figma: Progress bar at top:148 — w:345 (24px gutter). */}
      <View style={styles.progressWrap}>
        <ProgressBar progress={(currentIndex + 1) / questions.length} />
      </View>

      <Text style={styles.question}>{currentQuestion.question}</Text>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentQuestion.type === 'text' ? (
          <View style={styles.textOptionsList}>
            {currentQuestion.options.map((item: any) => (
              <OptionButton
                key={item.text}
                label={item.text}
                selected={selected === item.text}
                onPress={() => setSelected(item.text)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.imageGrid}>
            {currentQuestion.options.map((item: any, index: number) => (
              <ImageOptionButton
                key={item.label || index}
                symbolType={symbolSequence[index % symbolSequence.length]}
                selected={selected === item.label}
                onPress={() => setSelected(item.label)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Pinned CTA — always visible regardless of content size. */}
      <View style={styles.buttonBar}>
        <Button
          variant="primary"
          size="L"
          active={!!selected}
          title={(isLast
            ? t('quiz.quizQuestions.finishButton')
            : t('quiz.quizQuestions.nextButton')
          ).toUpperCase()}
          onPress={handleNext}
          disabled={!selected}
        />
      </View>
    </SafeAreaView>
  </BackgroundWrapper>
);
};

export default QuizQuestionsScreen;

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  safe: {
    flex: 1,
    backgroundColor: palette.neutral.transparent,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: verticalScale(40),
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: verticalScale(40),
  },
  loadingText: {
    marginTop: verticalScale(20),
    color: palette.gold.warm,
    fontSize: moderateScale(fontSize.s),
    fontFamily: fontFamily.heading,
  },
  bgImage: {
    resizeMode: 'cover',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.neutral.overlay,
  },
  // Figma: Progress bar at top:148, w:345 (24px gutter — wider than content).
  // Logo header bottom sits ≈ 30px above the bar (Figma 148 - 118).
  progressWrap: {
    width:      scale(345),
    alignSelf:  'center',
    marginTop:  verticalScale(30),
  },

  // Question (203:2521) — pinned above the scroll area.
  // alignSelf:'center' + Figma 60px gaps via marginTop / marginBottom.
  question: {
    fontFamily:        fontFamily.heading,
    fontSize:          moderateScale(fontSize.xl),
    fontWeight:        fontWeight.regular,
    lineHeight:        moderateScale(fontSize.xl) * 1.3,
    letterSpacing:     0,
    color:             palette.gold.DEFAULT,
    width:             scale(313),
    alignSelf:         'center',
    textAlign:         'center',
    marginTop:         verticalScale(60),    // Figma 60px gap from progress bar
    marginBottom:      verticalScale(44),    // 44 + scrollContent paddingTop:16 = 60 (Figma gap to first option)
    textShadowColor:   textShadow.glow.color,
    textShadowOffset:  textShadow.glow.offset,
    textShadowRadius:  textShadow.glow.radius,
  },

  // Scrollable area — only this scrolls. flex:1 takes remaining height
  // between question and buttonBar. Default overflow (clip to bounds) so
  // scrolling options never bleed into the button area below.
  scrollArea: {
    flex:  1,
    width: '100%',
  },
  // contentContainer — top padding gives shadow room above first card,
  // bottom padding is the Figma 60px gap to the button (when content fits)
  // plus shadow room below last card. alignItems:center keeps the cards
  // centered in the full-screen width so the gutter stays even.
  scrollContent: {
    flexGrow:      1,
    alignItems:    'center',
    paddingTop:    verticalScale(16),
    paddingBottom: verticalScale(60),
  },

  // Figma 203:2522 — flex-col gap:16 between option buttons.
  // Explicit width: scale(313) is the single source of truth for card
  // width. Cards inside have width:'100%' so they fill this exactly.
  textOptionsList: {
    width:      scale(313),
    alignItems: 'stretch',
    gap:        verticalScale(16),
  },

  // Figma 203:2425 — 280×280 grid container, gap 40 row + col, 4× 120×120 items
  // The +2 buffer is a sub-pixel rounding fix: scale(120)*2 + scale(40) is
  // mathematically equal to scale(280), but on devices like iPhone 17 Pro
  // floating-point drift in JS multiplication makes the row total exceed the
  // container width by a fraction of a pixel, forcing each item onto its own
  // row. The 2px headroom is invisible visually and breaks the tie.
  imageGrid: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    justifyContent: 'center',
    alignItems:     'center',
    rowGap:         verticalScale(40),
    columnGap:      scale(40),
    width:          scale(280) + 2,
    alignSelf:      'center',
  },

  // Pinned CTA bar at the bottom of the safe area. Width:100% so the Button
  // (content-sized) can center via alignItems. paddingBottom matches the
  // gap previously held by container's paddingBottom for safe-area separation.
  buttonBar: {
    width:         '100%',
    alignItems:    'center',
    paddingBottom: verticalScale(20),
  },
});
