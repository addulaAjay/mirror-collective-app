import { palette } from '@theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@types';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { MOTIF_SVG } from '@assets/motifs-icons/MotifIconAssets';
import questionsData from '@assets/reflection-room-questions.json';
import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import ProgressBar from '@components/ProgressBar';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface QuestionOption {
  text?: string;
  label?: string;
  image?: string;
}

interface Question {
  id: number;
  question: string;
  type: 'text' | 'image';
  options: QuestionOption[];
}

const MOTIF_KEYS: Record<string, string> = {
  'rr-quiz-motif-star': 'radiant-burst',
  'rr-quiz-motif-blocks': 'blocks',
  'rr-quiz-motif-feather': 'feather',
  'rr-quiz-motif-compass': 'compass',
  'rr-quiz-motif-flow': 'spiral',
  'rr-quiz-motif-mirror': 'mirror',
};

const questions: Question[] = questionsData.questions as Question[];

const ReflectionRoomQuizScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  const handleNext = () => {
    if (!selected) return;
    setSelected(null);

    if (isLast) {
      navigation.navigate('ReflectionRoomLoading' as never);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >


          <View style={styles.progressWrap}>
            <ProgressBar progress={(currentIndex + 1) / questions.length} />
          </View>

          <Text style={styles.question}>{currentQuestion.question}</Text>

          {currentQuestion.type === 'text' ? (
            <View style={styles.cardsContainer}>
              {currentQuestion.options.map(option => (
                <TouchableOpacity
                  key={option.text}
                  style={[
                    styles.card,
                    selected === option.text && styles.cardSelected,
                    selected === option.text && styles.cardSelectedShadow,
                  ]}
                  onPress={() => setSelected(option.text!)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cardText}>{option.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.motifsGrid}>
              {currentQuestion.options.map(motif => (
                <TouchableOpacity
                  key={motif.label}
                  style={[
                    styles.motifWrapper,
                    selected === motif.label && styles.motifWrapperSelected,
                  ]}
                  onPress={() => setSelected(motif.label!)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.motifCircle,
                      selected === motif.label && styles.motifCircleSelected,
                    ]}
                  >
                    <View style={styles.motifIconWrapper}>
                      <SvgXml
                        xml={MOTIF_SVG[MOTIF_KEYS[motif.image!]] || ''}
                        width={84.5}
                        height={84.5}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.hint}>
            {'Choose the word that resonates.\nThere\'s no right answer.'}
          </Text>

          <View style={styles.bottomRow}>
            <TouchableOpacity
              style={styles.backSquare}
              onPress={() => {
                if (currentIndex === 0) {
                  navigation.goBack();
                } else {
                  setSelected(null);
                  setCurrentIndex(currentIndex - 1);
                }
              }}
              activeOpacity={0.8}
            >
              <Image
                source={require('@assets/back-arrow.png')}
                style={styles.backArrowImg}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.nextButton,
                !selected && styles.nextButtonDisabled,
                selected && styles.nextButtonEnabled,
              ]}
              onPress={handleNext}
              activeOpacity={0.8}
              disabled={!selected}
            >
              <Text style={styles.nextText}>
                {isLast ? 'FINISH' : 'NEXT'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default ReflectionRoomQuizScreen;

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: palette.navy.deep,
  },
  bgImage: {
    resizeMode: 'cover',
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: Math.max(20, screenWidth * 0.051),
    paddingBottom: Math.max(40, screenHeight * 0.05),
  },
  progressWrap: {
    width: Math.min(screenWidth * 0.796, 313),
    alignItems: 'center',
    marginTop: Math.max(16, screenHeight * 0.02),
    marginBottom: Math.max(24, screenHeight * 0.03),
  },
  question: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 24,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    marginBottom: Math.max(24, screenHeight * 0.03),
    paddingHorizontal: 8,
  },
  cardsContainer: {
    width: '100%',
    gap: 10,
    marginBottom: Math.max(24, screenHeight * 0.03),
  },
  card: {
    width: '100%',
    height: 64,
    backgroundColor: 'rgba(10, 18, 40, 0.7)',
    borderWidth: 0.5,
    borderColor: 'rgba(163, 179, 204, 0.3)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  cardSelected: {
    backgroundColor: 'rgba(20, 30, 60, 0.85)',
    borderWidth: 1,
    borderColor: palette.gold.DEFAULT,
  },
  cardSelectedShadow: {
    ...(Platform.OS === 'ios'
      ? {
          elevation: 12,
        }
      : {
          boxShadow: '0 0 12px 4px palette.gold.glow',
        }),
  },
  cardText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 22,
    color: palette.gold.subtlest,
    letterSpacing: 2,
    textAlign: 'center',
  },
  motifsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    rowGap: 24,
    columnGap: 65,
    marginBottom: Math.max(32, screenHeight * 0.04),
  },
  motifWrapper: {
    alignItems: 'center',
    borderRadius: 55,
  },
  motifWrapperSelected: {
    ...(Platform.OS === 'ios'
      ? {
          elevation: 12,
        }
      : {
          boxShadow: '0 0 12px 4px palette.gold.glow',
        }),
  },
  motifCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: palette.navy.DEFAULT,
    borderWidth: 0.25,
    borderColor: palette.navy.muted,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  motifCircleSelected: {
    borderWidth: 1.5,
    borderColor: palette.gold.DEFAULT,
  },
  motifIconWrapper: {
    width: 84.5,
    height: 84.5,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  motifImage: {
    width: '60%',
    height: '60%',
  },
  hint: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    color: palette.navy.light,
    textAlign: 'center',
    marginBottom: Math.max(28, screenHeight * 0.035),
    lineHeight: 28,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },
  backSquare: {
    position: 'absolute',
    left: 0,
    width: 52,
    height: 52,
    backgroundColor: 'rgba(10, 18, 40, 0.7)',
    borderWidth: 0.5,
    borderColor: 'rgba(163, 179, 204, 0.3)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrowImg: {
    width: 24,
    height: 24,
    tintColor: palette.gold.subtlest,
  },
  nextButton: {
    minWidth: 120,
    maxWidth: 140,
    height: 52,
    backgroundColor: 'rgba(10, 18, 40, 0.7)',
    borderWidth: 0.5,
    borderColor: 'rgba(163, 179, 204, 0.3)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  nextButtonEnabled: {
    ...(Platform.OS === 'ios'
      ? {
          elevation: 12,
        }
      : {
          boxShadow: '0 0 8px 2px palette.gold.glow',
        }),
  },
  nextButtonDisabled: {
    opacity: 0.4,
  },
  nextText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 24,
    color: palette.gold.DEFAULT,
    letterSpacing: 2,
  },
});
