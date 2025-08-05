import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import LogoHeader from '../components/LogoHeader';
import GradientButton from '../components/GradientButton';
import OptionButton from '../components/OptionsButton';
import ProgressBar from '../components/ProgressBar';
import questions from '../../assets/questions.json';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import ImageOptionButton from '../components/ImageOptionButton';

type QuizQuestionsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'QuizQuestions'
>;

const QuizQuestionsScreen = () => {
  const navigation = useNavigation<QuizQuestionsScreenNavigationProp>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | { icon: any } | null>(null);
  const [answers, setAnswers] = useState<any[]>([]);

  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const imageMap = {
    candle: require('../../assets/candle.png'),
    lightning: require('../../assets/lightning.png'),
    tree: require('../../assets/tree.png'),
    crystal: require('../../assets/crystal.png'),
  };
  const handleNext = () => {
    if (!selected) return;
    setAnswers([...answers, selected]);
    setSelected(null);
    if (isLast) navigation.navigate('QuizTuning');
    else setCurrentIndex(currentIndex + 1);
  };

  const renderItem = ({ item }: any) => {
    if (currentQuestion.type === 'text') {
      return (
        <OptionButton
          label={item}
          selected={selected === item}
          onPress={() => setSelected(item)}
          style={styles.optionButton}
        />
      );
    } else if (currentQuestion.type === 'image') {
      return (
        <ImageOptionButton
          image={imageMap[item.image as keyof typeof imageMap]}
          selected={selected === item.label}
          onPress={() => setSelected(item.label)}
        />
      );
    }
    return null;
  };

  const keyExtractor = (item: any, index: number) => {
    if (currentQuestion.type === 'text') {
      return item;
    } else {
      return item.label || index.toString();
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/dark_mode_shimmer_bg.png')}
      style={styles.bg}
      imageStyle={styles.bgImage}
    >
      <View style={styles.container}>
        <LogoHeader />
        <View style={styles.progressWrap}>
          <ProgressBar progress={(currentIndex + 1) / questions.length} />
        </View>
        <Text style={styles.question}>{currentQuestion.question}</Text>
        {currentQuestion.type === 'text' ? (
          <FlatList
            data={currentQuestion.options}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.imageGrid}>
            {currentQuestion.options.map((item: any, index: number) => (
              <ImageOptionButton
                key={item.label || index}
                image={imageMap[item.image as keyof typeof imageMap]}
                selected={selected === item.label}
                onPress={() => setSelected(item.label)}
              />
            ))}
          </View>
        )}

        <View style={styles.nextWrap}>
          <GradientButton
            title={isLast ? 'Finish' : 'Next'}
            onPress={handleNext}
            disabled={!selected}
            style={{ width: 87, height: 48 }}
          />
        </View>
      </View>
    </ImageBackground>
  );
};

export default QuizQuestionsScreen;

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#0B0F1C' }, // fallback if image not found
  bgImage: { resizeMode: 'cover' },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
    flexDirection: 'column',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    rowGap: 32,
    columnGap: 24,
    paddingVertical: 24,
    paddingHorizontal: 12,
  },

  question: {
    width: 345,
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '500',
    color: '#F2E2B1',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 14,
    textShadowColor: 'rgba(0,0,0,0.35)', // improves contrast on light patches
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  list: { width: 345, paddingBottom: 24 },
  optionButton: { marginBottom: 16 },

  nextWrap: {
    width: 345,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  progressWrap: {
    width: '100%',
    marginTop: 80,
    marginBottom: 10,
    alignItems: 'center',
  },
});
