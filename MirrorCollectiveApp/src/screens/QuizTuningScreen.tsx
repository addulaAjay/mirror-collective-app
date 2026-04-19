import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  palette,
  fontFamily,
  fontSize,
  fontWeight,
  textShadow,
  scale,
  verticalScale,
  moderateScale,
} from '@theme';
import type { RootStackParamList } from '@types';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import MCLogo from '@components/MCLogo';

type QuizTuningScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'QuizTuning'>;

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
      <SafeAreaView style={styles.safe}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />
        <LogoHeader />
        <View style={styles.container}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{t('quiz.quizTuning.title')}</Text>
          </View>

          <View style={styles.mirrorContainer}>
            <MCLogo width={scale(245)} height={verticalScale(381)} />
          </View>

          <View style={styles.messageContainer}>
            <Text style={styles.message}>{t('quiz.quizTuning.message')}</Text>
            <Text style={styles.subMessage}>{t('quiz.quizTuning.subMessage')}</Text>
          </View>
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default QuizTuningScreen;

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  safe: {
    flex: 1,
    backgroundColor: palette.neutral.transparent,
  },
  container: {
    flex: 1,
    paddingHorizontal: scale(40),
    paddingBottom: verticalScale(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgImage: {
    resizeMode: 'cover',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: verticalScale(72),
  },
  title: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize['3xl']),
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(fontSize['3xl'] * 1.3),
    letterSpacing: 0,
    color: palette.gold.warm,
    textAlign: 'center',
    textShadowColor: palette.gold.warm,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  mirrorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(28),
  },
  messageContainer: {
    alignItems: 'center',
    marginTop: verticalScale(28),
    marginBottom: verticalScale(8),
  },
  message: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.s),
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(fontSize.s * 1.5),
    color: palette.gold.subtlest,
    textAlign: 'center',
  },
  subMessage: {
    fontFamily: fontFamily.body,
    fontSize: moderateScale(fontSize.s),
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(fontSize.s * 1.5),
    color: palette.gold.subtlest,
    textAlign: 'center',
  },
});
