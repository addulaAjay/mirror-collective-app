import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';


import { QuizStorageService } from '@services/quizStorageService';
import { Alert } from 'react-native';
import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';


type ArchetypeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Archetype'
>;


const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

interface ArchetypeScreenProps {
  route: {
    params: {
      archetype: {
        name: string;
        title: string;
        description: string;
        image: any;
      };
    };
  };
}

const ArchetypeScreen: React.FC<ArchetypeScreenProps> = ({ route }) => {
  const { t } = useTranslation();
  const navigation = useNavigation<ArchetypeScreenNavigationProp>();
  const { archetype } = route.params;

  const handleContinue = () => {
    // After viewing archetype, continue into auth flow
    navigation.navigate('Login');
  };

  const handleRetake = () => {
    Alert.alert(
      t('quiz.archetype.retakeTitle') || 'Retake Quiz?',
      t('quiz.archetype.retakeMessage') || 'This will discard your current results and start a new quiz.',
      [
        {
          text: t('common.cancel') || 'Cancel',
          style: 'cancel',
        },
        {
          text: t('quiz.archetype.retakeConfirm') || 'Retake',
          style: 'destructive',
          onPress: async () => {
            try {
              await QuizStorageService.clearPendingQuizResults();
              await QuizStorageService.resetQuizState();
              navigation.reset({
                index: 0,
                routes: [{ name: 'QuizWelcome' }],
              });
            } catch (error) {
              console.error('Failed to reset quiz:', error);
            }
          },
        },
      ],
    );
  };

  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <TouchableOpacity testID="archetype-container" style={styles.container} onPress={handleContinue}>
        <LogoHeader />

        {/* Archetype Title */}
        <View style={styles.titleContainer}>
          <Text testID="archetype-title" style={styles.title}>{archetype.title}</Text>
        </View>

        {/* Archetype Image */}
        <View style={styles.imageContainer}>
          <Image
            testID="archetype-image"
            source={archetype.image}
            style={styles.archetypeImage}
            resizeMode="contain"
          />
        </View>

        {/* Description */}
        <View testID="archetype-description" style={styles.descriptionContainer}>
          {archetype.description
            .split('\n\n')
            .map((paragraph, paragraphIndex) => (
              <Text
                key={paragraphIndex}
                style={
                  paragraphIndex === 0
                    ? styles.description
                    : styles.questionText
                }
              >
                {paragraphIndex === 0
                  ? paragraph.split(' ').map((word, index) => (
                      <Text
                        key={index}
                        style={
                          index === 0
                            ? styles.descriptionFirstWord
                            : styles.descriptionRest
                        }
                      >
                        {word}
                        {index < paragraph.split(' ').length - 1 ? ' ' : ''}
                      </Text>
                    ))
                  : paragraph}
              </Text>
            ))}
        </View>
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>Click anywhere to continue</Text>
        </View>

        {/* Continue Text */}
        <Text testID="archetype-continue-text" style={styles.continueText}>{t('quiz.archetype.continuePrompt')}</Text>

        {/* Retake Option */}
        <TouchableOpacity onPress={handleRetake} style={styles.retakeButton}>
          <Text style={styles.retakeText}>{t('quiz.archetype.retakeButton') || 'Not you? Retake Quiz'}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </BackgroundWrapper>
  );
};

export default ArchetypeScreen;

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#0B0F1C',
  },
  bgImage: {
    resizeMode: 'cover',
  },
  container: {
    paddingHorizontal: Math.max(20, screenWidth * 0.051),
    paddingTop: Math.max(48, screenHeight * 0.056),
    paddingBottom: Math.max(30, screenHeight * 0.035),
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: Math.max(60, screenHeight * 0.1),
    // marginBottom: Math.max(60, screenHeight * 0.01),
  },
  title: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: Math.min(screenWidth * 0.082, 32),
    fontWeight: '300',
    lineHeight: Math.min(screenWidth * 0.082, 32),
    color: '#E5D6B0',
    textAlign: 'center',
    textShadowColor: '#E5D6B0',
    textShadowRadius: 8,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  archetypeImage: {
    width: Math.min(screenWidth * 0.7, 275),
    height: Math.min(screenHeight * 0.5, 424),
    shadowColor: '#E5D6B0',
    shadowOffset: { width: 0, height: 0 },
    // shadowOpacity: 0.3,
    shadowRadius: 40,
  },
  descriptionContainer: {
    width: Math.min(screenWidth * 0.8, 313),
    alignItems: 'center',
    marginBottom: Math.max(40, screenHeight * 0.047),
  },
  hintContainer: {
    width: Math.min(screenWidth * 0.76, 284),
    alignSelf: 'center',
    marginBottom: Math.max(16, screenHeight * 0.02),
  },
  hintText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: Math.min(screenWidth * 0.061, 24),
    fontWeight: '400',
    color: '#F2E2B1',
    textAlign: 'center',
    lineHeight: Math.min(screenWidth * 0.079, 31.2),
  },
  description: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: Math.min(screenWidth * 0.051, 20),
    fontWeight: '300',
    lineHeight: Math.min(screenWidth * 0.064, 25),
    color: '#FDFDF9',
    textAlign: 'center',
  },
  descriptionFirstWord: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: Math.min(screenWidth * 0.051, 20),
    color: '#FDFDF9',
  },
  descriptionRest: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: Math.min(screenWidth * 0.051, 20),
    color: '#FDFDF9',
  },
  questionText: {
    fontFamily: 'CormorantGaramond-MediumItalic',
    fontSize: Math.min(screenWidth * 0.051, 20),
    color: '#FDFDF9',
    textAlign: 'center',
    marginTop: Math.max(10, screenHeight * 0.012),
  },
  continueText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: Math.min(screenWidth * 0.061, 24),
    fontWeight: '400',
    color: '#F2E2B1',
    textAlign: 'center',
    lineHeight: Math.min(screenWidth * 0.079, 31.2),
    flex: 1,
    bottom: Math.max(40, screenHeight * 0.05),
    alignSelf: 'center',
  },
  retakeButton: {
    position: 'absolute',
    bottom: Math.max(10, screenHeight * 0.015),
    alignSelf: 'center',
    padding: 10,
  },
  retakeText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: Math.min(screenWidth * 0.04, 16),
    color: 'rgba(242, 226, 177, 0.6)', // Subtle gold
    textDecorationLine: 'underline',
  },
});
