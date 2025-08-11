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
// import type { RouteProp } from '@react-navigation/native';
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
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/Mirror_Collective_Logo_RGB.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.welcome}>WELCOME</Text>

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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Math.max(40, screenWidth * 0.102), // Exact 40px padding from Figma
    paddingVertical: 0,
    gap: Math.max(32, screenHeight * 0.038), // Exact 32px gap from Figma
    borderRadius: 15,
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: -1, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 26,
    elevation: 10,
  },
  backgroundImage: {
    resizeMode: 'cover',
  },
  logoContainer: {
    alignItems: 'center',
    gap: Math.max(16, screenHeight * 0.019), // Exact 16px gap from Figma
  },
  logo: {
    width: Math.min(screenWidth * 0.35, 140), // Larger size to match design
    height: Math.min(screenWidth * 0.35, 140), // Larger size to match design
  },
  welcome: {
    fontSize: Math.min(screenWidth * 0.081, 32), // Exact 32px height from Figma
    fontFamily: 'CormorantGaramond-Light',
    fontWeight: '300',
    textAlign: 'center',
    color: '#F2E2B1', // Exact fill4 color from Figma
    textShadowColor: '#E5D6B0', // Exact effect2 color from Figma
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10, // Exact 10px blur from Figma
    textTransform: 'uppercase',
  },
  card: {
    width: Math.min(screenWidth * 0.796, 313), // Exact 313px width from Figma
    paddingHorizontal: Math.max(20, screenWidth * 0.051), // Exact 20px padding from Figma
    paddingVertical: Math.max(20, screenHeight * 0.023), // Exact 20px padding from Figma
    borderRadius: 20, // Exact 20px border radius from Figma
    backgroundColor: 'rgba(155, 170, 194, 0.10)', // Exact fill5 from Figma
    borderColor: '#1A2238', // Exact stroke1 color from Figma
    borderWidth: 0.25, // Exact stroke width from Figma
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 19, // Exact 19px blur from Figma
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Math.max(20, screenHeight * 0.023), // Exact 20px gap from Figma
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Math.max(32, screenHeight * 0.038), // Exact 32px gap from Figma
  },
  description: {
    fontSize: Math.min(screenWidth * 0.061, 24), // Exact 24px from Figma
    textAlign: 'center',
    lineHeight: Math.min(screenWidth * 0.074, 29), // Exact 29.06px line height from Figma
    maxWidth: Math.min(screenWidth * 0.695, 273), // Exact 273px width from Figma
  },
  regularText: {
    fontFamily: 'CormorantGaramond-Light', // Light style from Figma
    fontWeight: '300',
    color: '#FDFDF9', // Exact white color from Figma (style 22)
  },
  italicHighlight: {
    fontFamily: 'CormorantGaramond-MediumItalic', // Light Italic from Figma
    fontWeight: '300',
    color: '#F2E2B1', // Exact highlight color from Figma (style 57, 73)
  },
  mediumItalicHighlight: {
    fontFamily: 'CormorantGaramond-MediumItalic', // Medium Italic from Figma
    fontWeight: '500',
    fontStyle: 'italic',
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
    fontFamily: 'CormorantGaramond-MediumItalic', // Medium Italic from Figma
    fontWeight: '500',
    color: '#F2E2B1', // Exact highlight color from Figma
  },
  mirrorHighlight: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic', // SemiBold Italic for "Mirror" (style 74)
    fontWeight: '600',
    color: '#F2E2B1', // Exact highlight color from Figma
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
