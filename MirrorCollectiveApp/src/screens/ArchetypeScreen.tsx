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
    // Navigate to next screen in the flow
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
    backgroundColor: '#0B0F1C',
  },
  bgImage: {
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    paddingHorizontal: Math.max(20, screenWidth * 0.051),
    paddingTop: Math.max(48, screenHeight * 0.056),
    paddingBottom: Math.max(30, screenHeight * 0.035),
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: Math.max(60, screenHeight * 0.1),
    // marginBottom: Math.max(60, screenHeight * 0.01),
  },
  title: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: Math.min(screenWidth * 0.082, 32),
    fontWeight: '300',
    lineHeight: Math.min(screenWidth * 0.082, 32),
    color: '#E5D6B0',
    textAlign: 'center',
    textShadowColor: '#E5D6B0',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  archetypeImage: {
    width: Math.min(screenWidth * 0.7, 275),
    height: Math.min(screenHeight * 0.5, 424),
    shadowColor: '#E5D6B0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
  },
  descriptionContainer: {
    width: Math.min(screenWidth * 0.8, 313),
    alignItems: 'center',
    marginBottom: Math.max(40, screenHeight * 0.047),
  },
  description: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: Math.min(screenWidth * 0.051, 20),
    fontWeight: '300',
    lineHeight: Math.min(screenWidth * 0.064, 25),
    color: '#FDFDF9',
    textAlign: 'center',
  },
  descriptionFirstWord: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: Math.min(screenWidth * 0.051, 20),
    color: '#FDFDF9',
  },
  descriptionRest: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: Math.min(screenWidth * 0.051, 20),
    color: '#FDFDF9',
  },
  questionText: {
    fontFamily: 'CormorantGaramond-MediumItalic',
    fontSize: Math.min(screenWidth * 0.051, 20),
    color: '#FDFDF9',
    textAlign: 'center',
    marginTop: Math.max(10, screenHeight * 0.012),
  },
  continueText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: Math.min(screenWidth * 0.061, 24),
    fontWeight: '400',
    color: '#F2E2B1',
    textAlign: 'center',
    lineHeight: Math.min(screenWidth * 0.079, 31.2),
    position: 'absolute',
    bottom: Math.max(40, screenHeight * 0.05),
    alignSelf: 'center',
  },
});
