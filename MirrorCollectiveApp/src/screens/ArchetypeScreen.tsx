import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import LogoHeader from '../components/LogoHeader';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { COLORS, SPACING, TEXT_STYLES } from '../styles';

type ArchetypeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Archetype'
>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ArchetypeScreenProps {
  route: {
    params: {
      archetype: {
        name: string;
        title: string;
        description: string;
        image: any;
      };
    };
  };
}

const ArchetypeScreen: React.FC<ArchetypeScreenProps> = ({ route }) => {
  const navigation = useNavigation<ArchetypeScreenNavigationProp>();
  const { archetype } = route.params;

  const handleContinue = () => {
    navigation.navigate('QuizTuning');
  };

  return (
    <ImageBackground
      source={require('../../assets/dark_mode_shimmer_bg.png')}
      style={styles.bg}
      imageStyle={styles.bgImage}
    >
      <TouchableOpacity style={styles.container} onPress={handleContinue}>
        <LogoHeader />

        {/* Archetype Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{archetype.title}</Text>
        </View>

        {/* Archetype Image */}
        <View style={styles.imageContainer}>
          <Image
            source={archetype.image}
            style={styles.archetypeImage}
            resizeMode="contain"
          />
        </View>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          {archetype.description
            .split('\n\n')
            .map((paragraph, paragraphIndex) => (
              <Text
                key={paragraphIndex}
                style={
                  paragraphIndex === 0
                    ? styles.description
                    : styles.questionText
                }
              >
                {paragraphIndex === 0
                  ? paragraph.split(' ').map((word, index) => (
                      <Text
                        key={index}
                        style={
                          index === 0
                            ? styles.descriptionFirstWord
                            : styles.descriptionRest
                        }
                      >
                        {word}
                        {index < paragraph.split(' ').length - 1 ? ' ' : ''}
                      </Text>
                    ))
                  : paragraph}
              </Text>
            ))}
        </View>

        {/* Continue Text */}
        <Text style={styles.continueText}>Click anywhere to continue</Text>
      </TouchableOpacity>
    </ImageBackground>
  );
};

export default ArchetypeScreen;

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
    paddingHorizontal: Math.max(SPACING.L, screenWidth * 0.051),
    paddingTop: Math.max(SPACING.XL, screenHeight * 0.056),
    paddingBottom: Math.max(SPACING.M, screenHeight * 0.035),
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: Math.max(SPACING.XXL, screenHeight * 0.1),
  },
  title: {
    ...TEXT_STYLES.h1,
    fontFamily: 'CormorantGaramond-Light',
    fontWeight: '300',
    fontSize: Math.min(screenWidth * 0.082, 32),
    lineHeight: Math.min(screenWidth * 0.082, 32),
    color: COLORS.PRIMARY.GOLD_LIGHT,
    textShadowColor: COLORS.PRIMARY.GOLD_LIGHT,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    textAlign: 'center',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.L,
  },
  archetypeImage: {
    width: Math.min(screenWidth * 0.7, 275),
    height: Math.min(screenHeight * 0.5, 424),
    shadowColor: COLORS.PRIMARY.GOLD_LIGHT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
  },
  descriptionContainer: {
    width: Math.min(screenWidth * 0.8, 313),
    alignItems: 'center',
    marginBottom: Math.max(SPACING.XL, screenHeight * 0.047),
  },
  description: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: Math.min(screenWidth * 0.051, 20),
    fontWeight: '300',
    lineHeight: Math.min(screenWidth * 0.064, 25),
    color: COLORS.TEXT.PRIMARY,
    textAlign: 'center',
  },
  descriptionFirstWord: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: Math.min(screenWidth * 0.051, 20),
    color: COLORS.TEXT.PRIMARY,
  },
  descriptionRest: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: Math.min(screenWidth * 0.051, 20),
    color: COLORS.TEXT.PRIMARY,
  },
  questionText: {
    fontFamily: 'CormorantGaramond-MediumItalic',
    fontSize: Math.min(screenWidth * 0.051, 20),
    color: COLORS.TEXT.PRIMARY,
    textAlign: 'center',
    marginTop: Math.max(SPACING.S, screenHeight * 0.012),
  },
  continueText: {
    fontFamily: 'CormorantGaramond-LightItalic',
    fontSize: Math.min(screenWidth * 0.036, 14),
    fontWeight: '300',
    color: COLORS.TEXT.TERTIARY,
    textAlign: 'center',
    position: 'absolute',
    bottom: Math.max(SPACING.XL, screenHeight * 0.05),
    alignSelf: 'center',
  },
});
