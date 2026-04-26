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
import type { RootStackParamList } from '@types';
import type { QuizSubmissionRequest } from '@types';
import type { QuizQuestion } from '@types';
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
      <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
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
      <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
        <SafeAreaView style={styles.safe}>
          <StatusBar
            barStyle="light-content"
            translucent
            backgroundColor="transparent"
          />
          <LogoHeader />
          <View style={styles.container}>
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
      <LogoHeader />
      <View style={styles.container}>

        {/* Progress Bar - exact positioning from Figma */}
        <View style={styles.progressWrap}>
          <ProgressBar progress={(currentIndex + 1) / questions.length} />
        </View>

        {/* Question */}
        <Text style={styles.question}>{currentQuestion.question}</Text>

        {/* Options */}
        <View style={styles.contentArea}>
          <View style={styles.optionsContainer}>
            {currentQuestion.type === 'text' ? (
              <ScrollView
                style={styles.textOptionsScroll}
                contentContainerStyle={styles.textOptionsList}
                showsVerticalScrollIndicator={false}
                scrollEnabled={true}
                bounces={false}
              >
                {currentQuestion.options.map((item: any) => (
                  <OptionButton
                    key={item.text}
                    label={item.text}
                    selected={selected === item.text}
                    onPress={() => setSelected(item.text)}
                    style={styles.optionButton}
                  />
                ))}
              </ScrollView>
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
          </View>

          <View style={styles.nextWrap}>
            <Button
              variant="primary"
              size="L"
              active={!!selected}
              title={isLast ? t('quiz.quizQuestions.finishButton') : t('quiz.quizQuestions.nextButton')}
              onPress={handleNext}
              disabled={!selected}
            />
          </View>
        </View>
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
  container: {
    paddingHorizontal: scale(40),  // Figma: 40px left/right margin
    paddingBottom: verticalScale(20),  // Reduced from 30px to match Figma spacing
    alignItems: 'center',
    flex: 1,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    rowGap: verticalScale(30),
    columnGap: scale(30),
    paddingVertical: verticalScale(30),
    width: '100%',
  },
  question: {
    fontFamily: fontFamily.heading,        // Figma: Cormorant Garamond
    fontSize: moderateScale(fontSize.xl),  // Figma: 24px
    fontWeight: fontWeight.regular,        // Figma: 400 (not 300!)
    lineHeight: moderateScale(fontSize.xl) * 1.3,  // Figma: 31.2px (24 × 1.3)
    letterSpacing: 0,
    color: palette.gold.DEFAULT,           // Figma: #f2e2b1 rgb(242, 226, 177)
    width: scale(313),
    textAlign: 'center',
    marginBottom: verticalScale(60),  // Figma: 60px gap to options
    textShadowColor: textShadow.glow.color,                // Glow: #F0D4A8 · 30%
    textShadowOffset: textShadow.glow.offset,              // X:0 Y:0
    textShadowRadius: textShadow.glow.radius,              // Blur:10
  },
  textOptionsScroll: {
    width: '100%',
    flexGrow: 0,
  },
  textOptionsList: {
    alignItems: 'center',
    gap: verticalScale(16), // Figma: gap-16px between options
  },
  optionButton: {
    width: scale(313),
  },
  contentArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionsContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextWrap: {
    width: '100%',
    alignItems: 'center',
  },
  progressWrap: {
    width: scale(313),
    alignItems: 'center',
    // iOS safe area top (~47px) vs Figma Android status bar (24px) = 23px extra consumed.
    // Reducing from verticalScale(48) to verticalScale(25) lands the progress bar at the
    // correct Figma position (148px from top) and frees space for the 60px button gap.
    marginTop: verticalScale(25),
    marginBottom: verticalScale(60),
  },
});
