import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LogoHeader from '../components/LogoHeader';
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
    <View style={styles.container}>
      <LogoHeader />
      <View style={styles.content}>
        <Text style={styles.title}>WELCOME</Text>
        <Text style={styles.description}>
          This isn’t a quiz. It’s a reflection of you.
        </Text>
        <Text style={styles.description}>
          Take a moment to look where you are right now. Please explore your
          feelings and the one force guiding you.
        </Text>
        <Text style={styles.emphasis}>Let the Mirror listen.</Text>
        <GradientButton
          title="BEGIN"
          onPress={() => navigation.navigate('QuizQuestions')}
        />
      </View>
    </View>
  );
};

export default QuizWelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F1C',
    padding: 24,
    justifyContent: 'center',
  },
  content: {
    marginTop: 60,
  },
  title: {
    fontSize: 28,
    color: '#FFF',
    fontFamily: 'CormorantGaramond-Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    color: '#EEE',
    fontFamily: 'CormorantGaramond-Regular',
    marginBottom: 16,
    textAlign: 'center',
  },
  emphasis: {
    fontSize: 16,
    color: '#FFD700',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 32,
  },
});
