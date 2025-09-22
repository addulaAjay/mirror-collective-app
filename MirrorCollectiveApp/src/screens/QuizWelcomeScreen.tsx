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

import { COLORS, SPACING, responsive } from '../styles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type QuizWelcomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'QuizWelcome'
>;

const QuizWelcomeScreen = () => {
  const navigation = useNavigation<QuizWelcomeScreenNavigationProp>();

  return (
    <ImageBackground
      source={require('../../assets/dark_mode_shimmer_bg.png')}
      style={styles.bg}
      imageStyle={styles.bgImage}
    >
      <View style={styles.container}>
        <View style={styles.topContent}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/mirror-collective-logo-circle.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Welcome Text */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcome}>WELCOME</Text>
          </View>

          {/* Card */}
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

        {/* Button */}
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
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  bgImage: {
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    paddingHorizontal: Math.max(SPACING.XL, screenWidth * 0.1),
    paddingTop: Math.max(SPACING.XXL, screenHeight * 0.056),
    paddingBottom: Math.max(SPACING.XL, screenHeight * 0.05),
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topContent: {
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: Math.max(SPACING.XXL, screenHeight * 0.056),
    marginBottom: Math.max(SPACING.XL, screenHeight * 0.047),
  },
  logo: {
    width: Math.min(screenWidth * 0.2, responsive(80)),
    height: Math.min(screenWidth * 0.2, responsive(80)),
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: Math.max(SPACING.XL, screenHeight * 0.047),
  },
  welcome: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: Math.min(screenWidth * 0.081, responsive(32)),
    fontWeight: '300',
    lineHeight: Math.min(screenWidth * 0.081, responsive(32)),
    color: COLORS.TEXT.SECONDARY, // was #E5D6B0
    textAlign: 'center',
    textShadowColor: COLORS.TEXT.SECONDARY,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    textTransform: 'uppercase',
  },
  card: {
    width: Math.min(screenWidth * 0.8, responsive(313)),
    paddingHorizontal: Math.max(SPACING.L, screenWidth * 0.05),
    paddingVertical: Math.max(SPACING.L, screenHeight * 0.023),
    borderRadius: SPACING.L,
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
    gap: Math.max(SPACING.XL, screenHeight * 0.038),
  },
  description: {
    fontSize: Math.min(screenWidth * 0.061, responsive(24)),
    textAlign: 'center',
    lineHeight: Math.min(screenWidth * 0.074, responsive(29)),
    maxWidth: Math.min(screenWidth * 0.695, responsive(273)),
  },
  regularText: {
    fontFamily: 'CormorantGaramond-Light',
    fontWeight: '300',
    color: COLORS.TEXT.PRIMARY, // was #FDFDF9
  },
  italicHighlight: {
    fontFamily: 'CormorantGaramond-MediumItalic',
    fontWeight: '300',
    color: COLORS.TEXT.SECONDARY, // was #F2E2B1
  },
  emphasis: {
    fontSize: Math.min(screenWidth * 0.071, responsive(28)),
    textAlign: 'center',
    lineHeight: Math.min(screenWidth * 0.081, responsive(32)),
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
  },
  emphasisText: {
    fontFamily: 'CormorantGaramond-MediumItalic',
    fontWeight: '500',
    color: COLORS.TEXT.SECONDARY,
  },
  mirrorHighlight: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontWeight: '600',
    color: COLORS.TEXT.SECONDARY,
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
