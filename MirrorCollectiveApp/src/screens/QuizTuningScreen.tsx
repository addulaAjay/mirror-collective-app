import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@types';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';

type QuizTuningScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'QuizTuning'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');


const QuizTuningScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<QuizTuningScreenNavigationProp>();
  const route = useRoute();

  // Extract archetype + quizResult passed from QuizQuestions
  const { archetype, quizResult } = (route as any).params || {};

  // Automatically navigate to Archetype once "tuning" is done
  useEffect(() => {
    const timeout = setTimeout(() => {
      navigation.replace('Archetype', {
        archetype,
        quizResult,
      } as any);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [navigation, archetype, quizResult]);

  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <View style={styles.container}>
        <LogoHeader />

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{t('quiz.quizTuning.title')}</Text>
        </View>

        <View style={styles.mirrorContainer}>
          <Image
            source={require('@assets/oval-mirror-golden-frame.png')}
            style={styles.mirrorImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.messageContainer}>
          <Text style={styles.message}>{t('quiz.quizTuning.message')}</Text>
          <Text style={styles.subMessage}>
            {t('quiz.quizTuning.subMessage')}
          </Text>
        </View>
      </View>
    </BackgroundWrapper>
  );
};

export default QuizTuningScreen;
const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#0B0F1C',
  },
  container: {
    flex: 1,
    paddingHorizontal: Math.max(40, screenWidth * 0.102),
    paddingTop: Math.max(48, screenHeight * 0.056),
    paddingBottom: Math.max(30, screenHeight * 0.035),
    alignItems: 'center',
  },
  bgImage: {
    resizeMode: 'cover',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: Math.max(20, screenHeight * 0.08),
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
  mirrorContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mirrorImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    maxWidth: 275,
    maxHeight: 400,
    shadowColor: '#E5D6B0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: Math.max(10, screenHeight * 0.02),
  },
  message: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: Math.min(screenWidth * 0.051, 20),
    fontWeight: '300',
    color: '#FDFDF9',
    textAlign: 'center',
    marginBottom: Math.max(10, screenHeight * 0.025),
  },
  subMessage: {
    fontFamily: 'CormorantGaramond-LightItalic',
    fontSize: Math.min(screenWidth * 0.051, 20),
    color: '#FDFDF9',
    textAlign: 'center',
    lineHeight: Math.min(screenWidth * 0.064, 25),
  },
});
