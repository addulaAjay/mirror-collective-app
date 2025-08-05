import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
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

const QuizTuningScreen = () => {
  const navigation = useNavigation<QuizTuningScreenNavigationProp>();

  return (
    <ImageBackground
      source={require('../../assets/dark_mode_shimmer_bg.png')}
      style={styles.bg}
      imageStyle={styles.bgImage}
    >
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
    </ImageBackground>
  );
};

export default QuizTuningScreen;
const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#0B0F1C',
    paddingHorizontal: 24,
    paddingTop: 40,
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
    textShadowColor: 'rgba(245, 230, 184, 0.50)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
    lineHeight: 35,
    fontFamily: 'CormorantGaramond-Light',
    fontSize: 28,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 40,
    fontFamily: 'CormorantGaramond-Bold',
    color: '#F2E2B1',
    textAlign: 'center',
    marginBottom: 20,
  },
  message: {
    fontSize: 24,
    fontFamily: 'CormorantGaramond-light',
    color: '#EEE',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  bottomWrap: {
    alignItems: 'center',
    marginBottom: 40,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
});
