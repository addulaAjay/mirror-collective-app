import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Image } from 'react-native';
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
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    resizeMode: 'cover',
  },
  card: {
    width: 345,
    height: 429,
    padding: 20,
    gap: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(155, 170, 194, 0.1)',
    borderColor: '#1A2238',
    borderWidth: 0.25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    // backdropFilter: 'blur(1px)',
  },
  content: {
    width: 305,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
  },
  title: {
    fontFamily: 'Cormorant Garamond',
    fontWeight: '300',
    fontSize: 32,
    lineHeight: 32,
    color: '#F2E2B1',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
  },
  description: {
    fontFamily: 'Cormorant Garamond',
    fontStyle: 'italic',
    fontWeight: '300',
    fontSize: 24,
    lineHeight: 29,
    color: '#FDFDF9',
    textAlign: 'center',
  },
  emphasis: {
    fontFamily: 'Cormorant Garamond',
    fontStyle: 'italic',
    fontWeight: '500',
    fontSize: 28,
    lineHeight: 32,
    color: '#F2E2B1',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
  },
  logo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 0,
    gap: 10, // Only supported in newer React Native versions or via `columnGap`/`rowGap` in libraries like Tamagui

    width: 100,
    height: 100,

    // Optional flex positioning (if part of a flex parent)
    flexGrow: 0,
  },
  buttonContainer: { alignItems: 'center', margin: 10 },
});