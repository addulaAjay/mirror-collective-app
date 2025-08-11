import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GradientButton from '../components/GradientButton';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types';
import { typography } from '../styles/typography';
type QuizWelcomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'QuizWelcome'
>;
// type QuizWelcomeScreenRouteProp = RouteProp<RootStackParamList, 'QuizWelcome'>;
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const QuizWelcomeScreen = () => {
  const navigation = useNavigation<QuizWelcomeScreenNavigationProp>();
  // const route = useRoute<QuizWelcomeScreenRouteProp>();
  return (
    <ImageBackground
      source={require('../../assets/dark_mode_shimmer_bg.png')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <Image
        source={require('../../assets/Mirror_Collective_Logo_RGB.png')}
        style={styles.logo}
      />
      <View style={styles.card}>
        <View style={styles.content}>
          <Text style={styles.title}>WELCOME</Text>
          <Text style={styles.description}>This isn’t a quiz.</Text>
          <Text style={styles.description}>It’s a reflection of you.</Text>
          <Text style={styles.description}>
            Take a moment to look into your life right now.
          </Text>
          <Text style={styles.description}>
            Pause to explore your feelings and the core forces guiding you.
          </Text>
          <Text style={styles.emphasis}>Let the Mirror listen.</Text>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <GradientButton
          title="BEGIN"
          onPress={() => navigation.navigate('QuizQuestions')}
        />
      </View>
    </ImageBackground>
  );
};

export default QuizWelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Math.max(24, screenWidth * 0.06),
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingTop: Math.max(40, screenHeight * 0.05),
    paddingBottom: Math.max(30, screenHeight * 0.04),
  },
  backgroundImage: {
    resizeMode: 'cover',
  },
  card: {
    width: Math.min(screenWidth * 0.9, 400),
    minHeight: screenHeight * 0.45,
    maxHeight: screenHeight * 0.65,
    padding: Math.max(20, screenWidth * 0.05),
    gap: Math.max(15, screenHeight * 0.02),
    borderRadius: Math.max(16, screenWidth * 0.04),
    backgroundColor: 'rgba(155, 170, 194, 0.1)',
    borderColor: '#1A2238',
    borderWidth: 0.25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Math.max(20, screenHeight * 0.025),
  },
  title: {
    ...typography.styles.headline,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
  },
  description: {
    ...typography.styles.bodyItalic,
    fontSize: 24,
    lineHeight: 29,
    textAlign: 'center',
  },
  emphasis: {
    ...typography.styles.title,
    fontSize: 28,
    lineHeight: 32,
    fontFamily: 'CormorantGaramond-MediumItalic',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
  },
  logo: {
    width: Math.min(screenWidth * 0.2, 100),
    height: Math.min(screenWidth * 0.2, 100),
    flexShrink: 0,
  },
  buttonContainer: {
    alignItems: 'center',
    width: '100%',
  },
});