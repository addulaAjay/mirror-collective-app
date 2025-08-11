import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import LogoHeader from '../components/LogoHeader';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import StarIcon from '../components/StarIcon';
import { typography } from '../styles/typography';

type QuizTuningScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'QuizTuning'
>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const QuizTuningScreen = () => {
  const navigation = useNavigation<QuizTuningScreenNavigationProp>();

  return (
    <ImageBackground
      source={require('../../assets/dark_mode_shimmer_bg.png')}
      style={styles.bg}
      imageStyle={styles.bgImage}
    >
      <View style={styles.container}>
        <LogoHeader />

        <View style={styles.content}>
          <Text style={styles.title}>MirrorGPT is tuning...</Text>
          <Text style={styles.message}>Your reflection has been received.</Text>
          <Text style={styles.message}>
            As you shift, grow, and evolve, the Mirror will reflect with you.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.bottomWrap}
          onPress={() => navigation.navigate('MirrorChat')}
          activeOpacity={0.8}
        >
          <StarIcon width={24} height={24} />
          <Text style={styles.enterText}>ENTER</Text>
          <StarIcon width={24} height={24} />
        </TouchableOpacity>
      </View>
    </ImageBackground>
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
    paddingHorizontal: Math.max(24, screenWidth * 0.06),
    paddingTop: Math.max(50, screenHeight * 0.06),
    paddingBottom: Math.max(40, screenHeight * 0.05),
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bgImage: {
    resizeMode: 'cover',
  },
  enterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Math.max(12, screenWidth * 0.03),
    justifyContent: 'center',
    marginTop: Math.max(30, screenHeight * 0.035),
  },
  enterText: {
    ...typography.styles.button,
    fontSize: Math.min(Math.max(24, screenWidth * 0.062), 28),
    lineHeight: Math.min(Math.max(30, screenWidth * 0.075), 35),
    textShadowColor: 'rgba(245, 230, 184, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Math.max(18, screenHeight * 0.022),
    paddingVertical: Math.max(20, screenHeight * 0.025),
    maxWidth: Math.min(screenWidth * 0.9, 400),
  },
  title: {
    ...typography.styles.headline,
    fontSize: Math.min(Math.max(32, screenWidth * 0.082), 40),
    lineHeight: Math.min(Math.max(40, screenWidth * 0.1), 48),
    textAlign: 'center',
    marginBottom: Math.max(24, screenHeight * 0.03),
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  message: {
    ...typography.styles.subtitle,
    fontSize: Math.min(Math.max(18, screenWidth * 0.047), 22),
    textAlign: 'center',
    lineHeight: Math.min(Math.max(24, screenWidth * 0.062), 28),
    maxWidth: Math.min(screenWidth * 0.85, 350),
    marginBottom: Math.max(8, screenHeight * 0.01),
  },
  bottomWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Math.max(12, screenWidth * 0.03),
    justifyContent: 'center',
    marginTop: Math.max(40, screenHeight * 0.05),
    paddingVertical: Math.max(20, screenHeight * 0.025),
  },
});
