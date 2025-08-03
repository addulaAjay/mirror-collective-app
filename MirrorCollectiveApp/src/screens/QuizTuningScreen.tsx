import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LogoHeader from '../components/LogoHeader';
import GradientButton from '../components/GradientButton';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types';

type QuizTuningScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'QuizTuning'
>;

// type QuizTuningScreenRouteProp = RouteProp<RootStackParamList, 'QuizTuning'>;
const QuizTuningScreen = () => {
  const navigation = useNavigation<QuizTuningScreenNavigationProp>();
  // const route = useRoute<ResetPasswordScreenRouteProp>();
  return (
    <View style={styles.container}>
      <LogoHeader />
      <View style={styles.content}>
        <Text style={styles.title}>MirrorGPT is tuning...</Text>
        <Text style={styles.message}>Your reflection has been received.</Text>
        <Text style={styles.message}>
          As you shift, grow, and evolve, the Mirror will reflect with you.
        </Text>
        <GradientButton
          title="ENTER ✦"
          onPress={() => navigation.navigate('MirrorChat')}
        />
      </View>
    </View>
  );
};

export default QuizTuningScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F1C',
    padding: 24,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontFamily: 'CormorantGaramond-Bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 20,
  },
  message: {
    fontSize: 18,
    fontFamily: 'CormorantGaramond-Regular',
    color: '#EEE',
    textAlign: 'center',
    marginBottom: 16,
  },
});
