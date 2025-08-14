import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GradientButton from '../components/GradientButton';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
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
      style={styles.bg}
      imageStyle={styles.bgImage}
    >
      <View style={styles.container}>
        <View style={styles.topContent}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/mirror-collective-logo-circle.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.welcomeContainer}>
            <Text style={styles.welcome}>WELCOME</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.content}>
              <Text style={styles.description}>
                <Text style={styles.regularText}>This isn't a quiz.</Text>
                {'\n'}
                <Text style={styles.italicHighlight}>
                  It's a reflection of you.
                </Text>
                {'\n\n'}
                <Text style={styles.regularText}>Take a moment to </Text>
                <Text style={styles.italicHighlight}>look into your life</Text>
                <Text style={styles.regularText}> right now.</Text>
                {'\n\n'}
                <Text style={styles.italicHighlight}>Pause</Text>
                <Text style={styles.regularText}>
                  {' '}
                  to explore your feelings and the core forces guiding you.
                </Text>
              </Text>
              <Text style={styles.emphasis}>
                <Text style={styles.emphasisText}>Let the </Text>
                <Text style={styles.mirrorHighlight}>Mirror</Text>
                <Text style={styles.emphasisText}> listen.</Text>
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <GradientButton
            title="BEGIN"
            onPress={() => navigation.navigate('QuizQuestions')}
          />
        </View>
      </View>
    </ImageBackground>
  );
};

export default QuizWelcomeScreen;

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#0B0F1C',
  },
  bgImage: {
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    paddingHorizontal: Math.max(40, screenWidth * 0.102),
    paddingTop: Math.max(48, screenHeight * 0.056),
    paddingBottom: Math.max(40, screenHeight * 0.05),
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topContent: {
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: Math.max(48, screenHeight * 0.056),
    marginBottom: Math.max(40, screenHeight * 0.047),
  },
  logo: {
    width: Math.min(screenWidth * 0.3, 100),
    height: Math.min(screenWidth * 0.3, 100),
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: Math.max(40, screenHeight * 0.047),
  },
  welcome: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: Math.min(screenWidth * 0.081, 32),
    fontWeight: '300',
    lineHeight: Math.min(screenWidth * 0.081, 32),
    color: '#E5D6B0',
    textAlign: 'center',
    textShadowColor: '#E5D6B0',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    textTransform: 'uppercase',
  },
  card: {
    width: Math.min(screenWidth * 0.8, 313),
    paddingHorizontal: Math.max(20, screenWidth * 0.051),
    paddingVertical: Math.max(20, screenHeight * 0.023),
    borderRadius: 20,
    backgroundColor: 'rgba(155, 170, 194, 0.10)',
    borderColor: 'rgba(26, 34, 56, 0.3)',
    borderWidth: 1,
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 19,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Math.max(32, screenHeight * 0.038), // Exact 32px gap from Figma
  },
  description: {
    fontSize: Math.min(screenWidth * 0.061, 24), // Exact 24px from Figma
    textAlign: 'center',
    lineHeight: Math.min(screenWidth * 0.074, 24), // Exact 29.06px line height from Figma
    maxWidth: Math.min(screenWidth * 0.695, 273), // Exact 273px width from Figma
  },
  regularText: {
    fontFamily: 'CormorantGaramond-Light', // Light style from Figma
    fontWeight: '300',
    color: '#FDFDF9', // Exact white color from Figma (style 22)
  },
  italicHighlight: {
    fontFamily: 'CormorantGaramond-Italic', // Light Italic from Figma
    fontWeight: '300',
    color: '#F2E2B1', // Exact highlight color from Figma (style 57, 73)
  },
  mediumItalicHighlight: {
    fontFamily: 'CormorantGaramond-Italic', // Medium Italic from Figma
    fontWeight: '500',
    color: '#F2E2B1', // Exact highlight color from Figma (style 41)
  },
  emphasis: {
    fontSize: Math.min(screenWidth * 0.071, 28), // Exact 28px from Figma
    textAlign: 'center',
    lineHeight: Math.min(screenWidth * 0.081, 32), // Exact 32px line height from Figma
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4, // Exact 4px blur from Figma
  },
  emphasisText: {
    fontFamily: 'CormorantGaramond-Italic', // Medium Italic from Figma
    fontWeight: '500',
    color: '#F2E2B1', // Exact highlight color from Figma
  },
  mirrorHighlight: {
    fontFamily: 'CormorantGaramond-Italic', // SemiBold Italic for "Mirror" (style 74)
    fontWeight: '600',
    color: '#F2E2B1', // Exact highlight color from Figma
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
