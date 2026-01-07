import { BORDER_RADIUS, COLORS, SPACING } from '@constants';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@types';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import BackgroundWrapper from '@components/BackgroundWrapper';
import GradientButton from '@components/GradientButton';

type QuizWelcomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'QuizWelcome'
>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive font size helper - scales with screen but has min/max bounds
const responsiveFontSize = (baseSize: number, minSize: number, maxSize: number) => {
  const widthScale = screenWidth / 375; // Base on iPhone 11 width
  const heightScale = screenHeight / 812; // Base on iPhone 11 height
  const scale = Math.min(widthScale, heightScale);
  const size = baseSize * scale;
  return Math.max(minSize, Math.min(maxSize, size));
};

// Check if device is a tablet (width > 600)
const isTablet = screenWidth >= 600;


const QuizWelcomeScreen = () => {
  const navigation = useNavigation<QuizWelcomeScreenNavigationProp>();
  const cardGradient = [
    'rgba(253, 253, 249, 0.04)',
    'rgba(253, 253, 249, 0.01)',
  ];
  // const route = useRoute<QuizWelcomeScreenRouteProp>();
  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
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

          <View style={styles.cardWrapper}>
            <LinearGradient
              colors={cardGradient}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.cardGradient}
              pointerEvents="none"
            />
            <View style={styles.cardContent}>
              <Text style={styles.description}>
                <Text style={styles.regularText}>This isn't a quiz.</Text>
                {'\n'}
                <Text style={styles.italicHighlight}>
                  It's a reflection.
                </Text>
                {'\n\n'}
                <Text style={styles.regularText}>These first prompts help the Mirror understand your inner style— </Text>
                {'\n'}
                <Text style={styles.italicHighlight}>how you see, feel, and grow.</Text>
                {/* <Text style={styles.regularText}> right now.</Text> */}
                {'\n\n'}
                <Text style={styles.regularText}>
                  There’s no right answer. 
                </Text>
                {'\n'}
                <Text style={styles.italicHighlight}>Just be you.  </Text>

              </Text>
              <Text style={[styles.emphasis, styles.descriptionMaxWidth]}>
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
            style={styles.glassButtonWrapper}
            containerStyle={styles.glassButtonContainer}
            contentStyle={styles.glassButtonContent}
            textStyle={styles.glassButtonText}
            gradientColors={['rgba(253, 253, 249, 0.04)', 'rgba(253, 253, 249, 0.01)']}
          />
        </View>
      </View>
    </BackgroundWrapper>
  );
};

export default QuizWelcomeScreen;

const styles = StyleSheet.create<{
  bg: ViewStyle;
  bgImage: ImageStyle;
  container: ViewStyle;
  topContent: ViewStyle;
  logoContainer: ViewStyle;
  logo: ImageStyle;
  welcomeContainer: ViewStyle;
  welcome: TextStyle;
  cardWrapper: ViewStyle;
  cardGradient: ViewStyle;
  cardContent: ViewStyle;
  descriptionMaxWidth: TextStyle;
  description: TextStyle;
  regularText: TextStyle;
  italicHighlight: TextStyle;
  mediumItalicHighlight: TextStyle;
  emphasis: TextStyle;
  emphasisText: TextStyle;
  mirrorHighlight: TextStyle;
  buttonContainer: ViewStyle;
  glassButtonWrapper: ViewStyle;
  glassButtonContainer: ViewStyle;
  glassButtonContent: ViewStyle;
  glassButtonText: TextStyle;
}>({
  bg: {
    flex: 1,
    backgroundColor: '#0B0F1C',
  },
  bgImage: {
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    paddingHorizontal: isTablet ? '10%' : '8%', // Flexible horizontal padding
    paddingTop: screenHeight * 0.06, // 6% of screen height
    paddingBottom: screenHeight * 0.05, // 5% of screen height
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: screenHeight * 0.02,
    marginBottom: screenHeight * 0.03,
  },
  logo: {
    width: responsiveFontSize(80, 60, 100),
    height: responsiveFontSize(80, 60, 100),
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: screenHeight * 0.04,
  },
  welcome: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: responsiveFontSize(32, 24, 40),
    fontWeight: '300',
    letterSpacing: 2,
    color: '#E5D6B0',
    textAlign: 'center',
    textShadowColor: '#E5D6B0',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    textTransform: 'uppercase',
  },
  cardWrapper: {
    width: isTablet ? '70%' : '85%', // Flexible width
    maxWidth: 400, // Max width for tablets
    padding: isTablet ? 24 : 20,
    borderRadius: 20,
    borderWidth: 0.25,
    borderColor: '#1A2238',
    backgroundColor: 'transparent',
    shadowColor: 'rgba(242, 226, 177, 0.5)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8, // Android shadow
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    // gap: 20,
  },
  descriptionMaxWidth: {
    width: '100%',
  },
  description: {
    fontSize: responsiveFontSize(22, 18, 26),
    textAlign: 'center',
    lineHeight: responsiveFontSize(28, 24, 32),
    width: '100%',
  },
  regularText: {
    fontFamily: 'CormorantGaramond-Light',
    fontWeight: '300',
    color: '#FDFDF9',
  },
  italicHighlight: {
    fontFamily: 'CormorantGaramond-MediumItalic',
    fontWeight: '300',
    color: '#F2E2B1',
  },
  mediumItalicHighlight: {
    fontFamily: 'CormorantGaramond-MediumItalic',
    fontWeight: '500',
    color: '#F2E2B1',
  },
  emphasis: {
    fontSize: responsiveFontSize(26, 22, 32),
    textAlign: 'center',
    lineHeight: responsiveFontSize(32, 28, 38),
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
  },
  emphasisText: {
    fontFamily: 'CormorantGaramond-MediumItalic',
    fontWeight: '500',
    color: '#F2E2B1',
  },
  mirrorHighlight: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontWeight: '600',
    color: '#F2E2B1',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: screenHeight * 0.02,
  },
  glassButtonWrapper: {
    // Override GradientButton's default outer glow to match the smaller outlined style
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    borderRadius: BORDER_RADIUS.MD,
  },
  glassButtonContainer: {
    borderWidth: 0.5,
    borderRadius: BORDER_RADIUS.MD,
  },
  glassButtonContent: {
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.XXL,
    minWidth: 0,
  },
  glassButtonText: {
    color: COLORS.PRIMARY.GOLD,
    fontSize: responsiveFontSize(18, 16, 20),
  },
});
