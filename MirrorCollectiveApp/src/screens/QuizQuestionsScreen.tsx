import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  palette,
  radius,
  borderWidth,
  textShadow,
  glassGradient,
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

import questionsData from '@assets/questions.json';
import BackgroundWrapper from '@components/BackgroundWrapper';
import GradientButton from '@components/GradientButton';
import ImageOptionButton, {
  type ImageOptionSymbol,
} from '@components/ImageOptionButton';
import LogoHeader from '@components/LogoHeader';
import OptionButton from '@components/OptionsButton';
import ProgressBar from '@components/ProgressBar';
import { quizApiService } from '@services/api/quiz';
import { QuizStorageService } from '@services/quizStorageService';
import {
  calculateQuizResult,
  createUserAnswer,
  type QuizData,
  type UserAnswer,
} from '@utils/archetypeScoring';
// Typography styles are now defined directly in component styles

type QuizQuestionsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'QuizQuestions'
>;

const QuizQuestionsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<QuizQuestionsScreenNavigationProp>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | { icon: any } | null>(null);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  // Extract static data for fallback/archetype mapping
  const quizData = questionsData as QuizData;

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
           console.log('Using local questions (API response empty or invalid)');
           setQuestions(quizData.questions);
        }
      } catch (error) {
        console.error('Failed to fetch questions, using fallback:', error);
        setQuestions(quizData.questions);
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

    // Find the selected option to get archetype and other details
    const selectedOption = currentQuestion.options.find(option => {
      if (currentQuestion.type === 'text') {
        return option.text === selected;
      } else {
        return option.label === selected;
      }
    });

    if (!selectedOption) return;

    // Find the option index
    const optionIndex = currentQuestion.options.findIndex(option => {
      if (currentQuestion.type === 'text') {
        return option.text === selected;
      } else {
        return option.label === selected;
      }
    });

    // Create proper UserAnswer object
    const userAnswer = createUserAnswer(
      currentQuestion.id,
      currentQuestion.question,
      selectedOption as any, // Cast to any to avoid type mismatch between API QuizOption and internal QuestionOption
      optionIndex,
    );

    const newAnswers = [...answers, userAnswer];
    setAnswers(newAnswers);
    setSelected(null);

    if (isLast) {
      // Use new scoring system to calculate quiz result
      const quizResult = calculateQuizResult(newAnswers, quizData);

      // Map archetype name to full archetype object from questions.json
      const archetypeKey = quizResult.finalArchetype.toLowerCase();
      const archetypeData = quizData.archetypes[archetypeKey];

      // Static image mapping for React Native (dynamic require not supported)
      const archetypeImages = {
        'seeker-archetype.png': require('@assets/seeker-archetype.png'),
        'guardian-archetype.png': require('@assets/guardian-archetype.png'),
        'flamebearer-archetype.png': require('@assets/flamebearer-archetype.png'),
        'weaver-archetype.png': require('@assets/weaver-archetype.png'),
      };

      const archetypeWithImage = {
        ...archetypeData,
        image:
          archetypeImages[
            archetypeData.imagePath as keyof typeof archetypeImages
          ],
      };

      // Store quiz results temporarily until user registration
      try {
        const quizSubmission: QuizSubmissionRequest = {
          answers: newAnswers.map(answer => ({
            questionId: answer.questionId,
            question: answer.question,
            answer:
              answer.selectedOption.text || answer.selectedOption.label || '',
            answeredAt: new Date().toISOString(),
            type: questions.find(q => q.id === answer.questionId)?.type as
              | 'text'
              | 'image',
          })),
          completedAt: new Date().toISOString(),
          archetypeResult: {
            id: archetypeWithImage.id,
            name: archetypeWithImage.name,
            title: archetypeWithImage.title,
          },
          quizVersion: '1.0',
          // Transform the quiz result to match backend schema
          detailedResult: {
            primaryArchetype: quizResult.finalArchetype,
            scores: quizResult.totalScores,
            confidence: 0.85, // Default confidence for quiz-based results
            analysis: {
              strengths: [],
              challenges: [],
              recommendations: [],
            },
          },
        };

        // Submit immediately (or queue for offline retry)
        await QuizStorageService.submitAnonymousQuiz(quizSubmission);

        // Navigate to tuning screen first, then Archetype
        navigation.navigate('QuizTuning', {
          archetype: archetypeWithImage,
          quizResult, // Pass the full calculated result
        });
      } catch (error) {
        console.error('Failed to store quiz results temporarily:', error);
        // Show error but still allow navigation
        Alert.alert(
          t('quiz.quizQuestions.storageErrorTitle'),
          t('quiz.quizQuestions.storageErrorMessage'),
          [
            {
              text: t('quiz.quizQuestions.continueButton'),
              onPress: () =>
                navigation.navigate('QuizTuning', {
                  archetype: archetypeWithImage,
                  quizResult,
                }),
            },
          ],
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
            <GradientButton
              title={
                isLast
                  ? t('quiz.quizQuestions.finishButton')
                  : t('quiz.quizQuestions.nextButton')
              }
              onPress={handleNext}
              disabled={!selected}
              style={styles.glassButtonWrapper}
              containerStyle={styles.glassButtonContainer}
              contentStyle={styles.glassButtonContent}
              textStyle={styles.glassButtonText}
              gradientColors={[
                glassGradient.button.start,
                glassGradient.button.end,
              ]}
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
    // Figma: DROP_SHADOW 16px blur, palette.gold.glow at 60% opacity
    textShadowColor: textShadow.glow.color,
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: textShadow.glow.radius,
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
  nextButton: {
    // GradientButton handles responsive sizing
  },
  glassButtonWrapper: {
    backgroundColor: palette.neutral.transparent,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    borderRadius: radius.m,  // Match BEGIN button (16px)
  },
  glassButtonContainer: {
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
    borderRadius: radius.m,  // Match BEGIN button (16px)
  },
  glassButtonContent: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),  // Match BEGIN button
    minWidth: 0,
  },
  glassButtonText: {
    fontFamily: fontFamily.heading,        // Figma: Cormorant Garamond
    fontSize: moderateScale(fontSize.xl),  // Figma: 24px
    fontWeight: fontWeight.regular,        // Figma: 400
    lineHeight: moderateScale(fontSize.xl) * 1.3,  // Figma: 31.2px
    letterSpacing: 0,
    color: palette.gold.DEFAULT,           // Figma: #f2e2b1
    textShadowColor: textShadow.warmGlow.color,
    textShadowOffset: textShadow.warmGlow.offset,
    textShadowRadius: textShadow.warmGlow.radius,
  },
});
