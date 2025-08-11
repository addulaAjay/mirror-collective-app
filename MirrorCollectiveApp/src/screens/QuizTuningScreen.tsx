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
    paddingTop: Math.max(40, screenHeight * 0.05),
    paddingBottom: Math.max(30, screenHeight * 0.04),
    justifyContent: 'space-evenly',
  },
  bgImage: {
    resizeMode: 'cover',
  },
  enterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    marginTop: 20,
  },
  enterText: {
    ...typography.styles.button,
    fontSize: 28,
    lineHeight: 35,
    textShadowColor: 'rgba(245, 230, 184, 0.50)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: Math.max(12, screenHeight * 0.015),
    paddingVertical: Math.max(20, screenHeight * 0.025),
  },
  title: {
    ...typography.styles.headline,
    fontSize: 40,
    textAlign: 'center',
    marginBottom: 20,
  },
  message: {
    ...typography.styles.subtitle,
    fontSize: Math.min(Math.max(20, screenWidth * 0.055), 26),
    textAlign: 'center',
    lineHeight: Math.min(Math.max(24, screenWidth * 0.065), 32),
    maxWidth: Math.min(screenWidth * 0.85, 400),
  },
  bottomWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Math.max(10, screenWidth * 0.025),
    justifyContent: 'center',
  },
});
