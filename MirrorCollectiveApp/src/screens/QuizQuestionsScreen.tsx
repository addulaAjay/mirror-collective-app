import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ImageBackground,
  Dimensions,
  Alert,
} from 'react-native';
import GradientButton from '../components/GradientButton';
import OptionButton from '../components/OptionsButton';
import ProgressBar from '../components/ProgressBar';
import LogoHeader from '../components/LogoHeader';
import questionsData from '../../assets/questions.json';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import ImageOptionButton from '../components/ImageOptionButton';
import {
  calculateQuizResult,
  createUserAnswer,
  type QuizData,
  type UserAnswer,
} from '../utils/archetypeScoring';
import { QuizStorageService } from '../services/quizStorageService';
import type { QuizSubmissionRequest } from '../types';
// Typography styles are now defined directly in component styles
import { COLORS, TEXT_STYLES, SPACING, LAYOUT } from '../styles';
type QuizQuestionsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'QuizQuestions'
>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const QuizQuestionsScreen = () => {
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
  const imageMap = {
    candle: require('../../assets/candle.png'),
    lightning: require('../../assets/lightning.png'),
    tree: require('../../assets/tree.png'),
    crystal: require('../../assets/crystal.png'),
    golden_thread: require('../../assets/tree.png'), // placeholder - need golden_thread image
  };
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
        'seeker-archetype.png': require('../assets/seeker-archetype.png'),
        'guardian-archetype.png': require('../assets/guardian-archetype.png'),
        'flamebearer-archetype.png': require('../assets/flamebearer-archetype.png'),
        'weaver-archetype.png': require('../assets/weaver-archetype.png'),
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
          'Storage Error',
          'Unable to save your quiz results temporarily. Your archetype will still be shown, but please complete registration to save your results.',
          [
            {
              text: 'Continue',
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

  const renderItem = ({ item }: any) => {
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
          image={imageMap[item.image as keyof typeof imageMap]}
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
    <ImageBackground
      source={require('../../assets/dark_mode_shimmer_bg.png')}
      style={styles.bg}
      imageStyle={styles.bgImage}
    >
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
                    image={imageMap[item.image as keyof typeof imageMap]}
                    selected={selected === item.label}
                    onPress={() => setSelected(item.label)}
                  />
                ))}
              </View>
            )}
          </View>

          <View style={styles.nextWrap}>
            <GradientButton
              title={isLast ? 'Finish' : 'Next'}
              onPress={handleNext}
              disabled={!selected}
              style={styles.nextButton}
            />
          </View>
        </View>
      </View>
    </ImageBackground>
  );
};

export default QuizQuestionsScreen;

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  bgImage: {
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    paddingHorizontal: Math.max(LAYOUT.SCREEN_PADDING * 2, screenWidth * 0.1),
    paddingTop: Math.max(SPACING.XL, screenHeight * 0.05),
    paddingBottom: Math.max(SPACING.L, screenHeight * 0.04),
    alignItems: 'center',
  },
  progressWrap: {
    width: Math.min(screenWidth * 0.8, 313),
    alignItems: 'center',
    marginTop: Math.max(SPACING.XXL, screenHeight * 0.1),
    marginBottom: SPACING.L,
  },
  question: {
    ...TEXT_STYLES.h3,
    fontFamily: 'CormorantGaramond-Italic',
    fontWeight: '300',
    fontSize: Math.min(screenWidth * 0.061, 24),
    lineHeight: Math.min(screenWidth * 0.072, 28),
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    textShadowColor: COLORS.PRIMARY.GOLD_LIGHT,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    marginVertical: SPACING.L,
    width: Math.min(screenWidth * 0.8, 313),
  },
  list: {
    width: '100%',
    paddingBottom: SPACING.L,
    alignItems: 'center',
    flexGrow: 0,
  },
  optionButton: {
    marginBottom: SPACING.M,
    width: Math.min(screenWidth * 0.8, 313),
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    rowGap: SPACING.L,
    columnGap: SPACING.L,
    paddingVertical: SPACING.L,
    width: '100%',
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
    alignItems: 'center',
    paddingVertical: SPACING.M,
    flex: 1,
  },
  nextWrap: {
    width: '100%',
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: SPACING.L,
  },
  nextButton: {
    width: Math.min(screenWidth * 0.26, 102),
    height: LAYOUT.BUTTON_HEIGHT,
  },
});