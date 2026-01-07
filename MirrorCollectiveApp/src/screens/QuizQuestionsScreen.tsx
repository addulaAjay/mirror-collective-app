import { BORDER_RADIUS, COLORS, SPACING } from '@constants';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@types';
import type { QuizSubmissionRequest } from '@types';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';

import questionsData from '@assets/questions.json';
import BackgroundWrapper from '@components/BackgroundWrapper';
import GradientButton from '@components/GradientButton';
import ImageOptionButton, {
  type ImageOptionSymbol,
} from '@components/ImageOptionButton';
import LogoHeader from '@components/LogoHeader';
import OptionButton from '@components/OptionsButton';
import ProgressBar from '@components/ProgressBar';
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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const QuizQuestionsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<QuizQuestionsScreenNavigationProp>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | { icon: any } | null>(null);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);

  // Extract questions array from the new structure
  const quizData = questionsData as QuizData;
  const questions = quizData.questions;

  // Reset any previous quiz state when component mounts
  useEffect(() => {
    const resetPreviousQuizState = async () => {
      try {
        await QuizStorageService.resetQuizState();
      } catch (error) {
        console.error('Failed to reset previous quiz state:', error);
      }
    };

    resetPreviousQuizState();
  }, []);

  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const symbolSequence: ImageOptionSymbol[] = ['star', 'brick', 'spiral', 'mirror'];
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
      selectedOption,
      optionIndex,
    );

    const newAnswers = [...answers, userAnswer];
    setAnswers(newAnswers);

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
          // Store the detailed quiz result for future use
          detailedResult: quizResult,
        };

        // Store temporarily - will be submitted after successful registration
        await QuizStorageService.storePendingQuizResults(quizSubmission);

        // Navigate to archetype screen with calculated result
        navigation.navigate('Archetype', {
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
                navigation.navigate('Archetype', {
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

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    if (currentQuestion.type === 'text') {
      return (
        <OptionButton
          label={item.text}
          selected={selected === item.text}
          onPress={() => setSelected(item.text)}
          style={styles.optionButton}
        />
      );
    } else if (currentQuestion.type === 'image') {
      return (
        <ImageOptionButton
          symbolType={symbolSequence[index % symbolSequence.length]}
          selected={selected === item.label}
          onPress={() => setSelected(item.label)}
        />
      );
    }
    return null;
  };

  const keyExtractor = (item: any, index: number) => {
    if (currentQuestion.type === 'text') {
      return item.text;
    } else {
      return item.label || index.toString();
    }
  };

  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <View style={styles.container}>
        <LogoHeader />

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
              <FlatList
                data={currentQuestion.options}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
              />
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
              title={isLast ? t('quiz.quizQuestions.finishButton') : t('quiz.quizQuestions.nextButton')}
              onPress={handleNext}
              disabled={!selected}
              style={styles.glassButtonWrapper}
              containerStyle={styles.glassButtonContainer}
              contentStyle={styles.glassButtonContent}
              textStyle={styles.glassButtonText}
              gradientColors={['rgba(253, 253, 249, 0.04)', 'rgba(253, 253, 249, 0.01)']}
            />
          </View>
        </View>
      </View>
    </BackgroundWrapper>
  );
};

export default QuizQuestionsScreen;

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#0B0F1C',
  },
  bgImage: {
    resizeMode: 'cover',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  container: {
    paddingHorizontal: Math.max(40, screenWidth * 0.102), // Match Figma padding
    paddingTop: Math.max(40, screenHeight * 0.047), // Reduced to prevent overlap
    paddingBottom: Math.max(30, screenHeight * 0.035),
    alignItems: 'center',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    rowGap: Math.max(30, screenHeight * 0.035),
    columnGap: Math.max(30, screenWidth * 0.08),
    paddingVertical: Math.max(30, screenHeight * 0.035),
    // paddingHorizontal: Math.max(20, screenWidth * 0.05),
    width: '100%',
  },

  question: {
    fontFamily: 'CormorantGaramond-Regular', // Match Figma typography
    fontSize: Math.min(screenWidth * 0.061, 24), // Proportional to text size in Figma
    fontWeight: '300',
    lineHeight: Math.min(screenWidth * 0.072, 28), // Tight line height
    color: '#E5D6B0', // Exact fill1 color from Figma
    width: Math.min(screenWidth * 0.796, 313), // Match header width
    textAlign: 'center',
    marginTop: Math.max(20, screenHeight * 0.025),
    marginBottom: Math.max(20, screenHeight * 0.025),
    textShadowColor: '#E5D6B0', // Exact effect5 glow shadow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  list: {
    width: '100%',
    paddingBottom: Math.max(20, screenHeight * 0.025),
    alignItems: 'center',
    flexGrow: 0,
  },
  optionButton: {
    marginBottom: Math.max(16, screenHeight * 0.019), // Exact 16px gap from Figma layout6
    width: Math.min(screenWidth * 0.796, 313), // Match container width
  },

  contentArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: screenHeight * 0.5,
  },
  optionsContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Math.max(16, screenHeight * 0.02),
    flex: 1,
  },
  nextWrap: {
    width: '100%',
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: Math.max(20, screenHeight * 0.025),
  },
  progressWrap: {
    width: Math.min(screenWidth * 0.796, 313), // Match header and question width
    alignItems: 'center',
    marginTop: Math.max(60, screenHeight * 0.1), // Standardized spacing across all screens
    marginBottom: Math.max(20, screenHeight * 0.025),
  },
  nextButton: {
    // Remove conflicting size constraints - let GradientButton handle responsive sizing
  },
  glassButtonWrapper: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    borderRadius: BORDER_RADIUS.MD,
  },
  glassButtonContainer: {
    borderWidth: 0.5,
    borderRadius: BORDER_RADIUS.MD,
  },
  glassButtonContent: {
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.XXL,
    minWidth: 0,
  },
  glassButtonText: {
    color: COLORS.PRIMARY.GOLD,
    fontSize: Math.min(screenWidth * 0.05, 18),
  },
});
