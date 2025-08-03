import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import LogoHeader from '../components/LogoHeader';
import GradientButton from '../components/GradientButton';
import OptionButton from '../components/OptionsButton';
import ProgressBar from '../components/ProgressBar';
import questions from '../../assets/questions.json';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { useNavigation } from '@react-navigation/native';

type QuizQuestionsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'QuizQuestions'
>;

// type QuizQuestionsScreenRouteProp = RouteProp<
//   RootStackParamList,
//   'QuizQuestions'
// >;
const QuizQuestionsScreen = () => {
  const navigation = useNavigation<QuizQuestionsScreenNavigationProp>();
  // const route = useRoute<QuizQuestionsScreenRouteProp>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);

  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  const handleNext = () => {
    if (!selected) return;
    setAnswers([...answers, selected]);
    setSelected(null);
    if (isLast) {
      navigation.navigate('QuizTuning');
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const renderItem = ({ item }: { item: string }) => (
    <OptionButton
      label={item}
      selected={selected === item}
      onPress={() => setSelected(item)}
      style={styles.optionButton}
    />
  );

  return (
    <View style={styles.container}>
      <LogoHeader />
      <ProgressBar progress={(currentIndex + 1) / questions.length} />
      <Text style={styles.question}>{currentQuestion.question}</Text>
      <FlatList
        data={currentQuestion.options}
        keyExtractor={item => item}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
      <GradientButton
        title={isLast ? 'Finish' : 'Next'}
        onPress={handleNext}
        disabled={!selected}
      />
    </View>
  );
};

export default QuizQuestionsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F1C',
    padding: 24,
    paddingTop: 64,
  },
  question: {
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 22,
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  list: {
    marginBottom: 24,
  },
  optionButton: {
    marginBottom: 12,
  },
});
