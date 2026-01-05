import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';

import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';
import type { RootStackParamList } from '@types';

type QuizTuningScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'QuizTuning'
>;


const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

import BackgroundWrapper from '@components/BackgroundWrapper';

const QuizTuningScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<QuizTuningScreenNavigationProp>();

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

        <TouchableOpacity
          style={styles.enterButton}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.8}
        >
          <StarIcon width={20} height={20} />
          <Text style={styles.enterText}>{t('quiz.quizTuning.enterButton')}</Text>
          <StarIcon width={20} height={20} />
        </TouchableOpacity>
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
    marginTop: Math.max(60, screenHeight * 0.1),
    // marginBottom: Math.max(60, screenHeight * 0.07),
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Math.max(10, screenHeight * 0.01),
  },
  mirrorImage: {
    width: Math.min(screenWidth * 0.7, 275),
    height: Math.min(screenHeight * 0.5, 400),
    shadowColor: '#E5D6B0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: Math.max(30, screenHeight * 0.04),
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
  enterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Math.max(12, screenWidth * 0.03),
    justifyContent: 'center',
    marginTop: Math.max(20, screenHeight * 0.02),
    paddingVertical: Math.max(12, screenHeight * 0.015),
  },
  enterText: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: Math.min(screenWidth * 0.056, 22),
    fontWeight: '300',
    color: '#E5D6B0',
    textAlign: 'center',
    textShadowColor: '#E5D6B0',
    textShadowRadius: 8,
  },
});
