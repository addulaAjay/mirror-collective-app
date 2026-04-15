import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  palette,
  radius,
  fontFamily,
  fontSize,
  fontWeight,
  glassGradient,
  scale,
  verticalScale,
  moderateScale,
  modalColors,
} from '@theme';
import type { RootStackParamList } from '@types';
import React from 'react';
import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


import questionsData from '@assets/questions.json';
import BackgroundWrapper from '@components/BackgroundWrapper';
import CircularLogoMark from '@components/CircularLogoMark';
import GradientButton from '@components/GradientButton';
import { QuizStorageService } from '@services/quizStorageService';
import type { QuizData } from '@utils/archetypeScoring';

type QuizWelcomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'QuizWelcome'
>;

// Static image mapping (centralize this if used in multiple places)
const archetypeImages = {
  'seeker-archetype.png': require('@assets/seeker-archetype.png'),
  'guardian-archetype.png': require('@assets/guardian-archetype.png'),
  'flamebearer-archetype.png': require('@assets/flamebearer-archetype.png'),
  'weaver-archetype.png': require('@assets/weaver-archetype.png'),
};

const QuizWelcomeScreen = () => {
  const navigation = useNavigation<QuizWelcomeScreenNavigationProp>();


  const quizData = questionsData as QuizData;

  useEffect(() => {
    const checkPendingResults = async () => {
      try {
        const pendingResults = await QuizStorageService.getPendingQuizResults();
        if (pendingResults && pendingResults.archetypeResult && pendingResults.detailedResult) {
          console.log('Found pending quiz results, redirecting to Archetype screen');

          const archetypeKey = pendingResults.archetypeResult.name.toLowerCase();
          const archetypeData = quizData.archetypes[archetypeKey];

          if (archetypeData) {
            const archetypeWithImage = {
              ...archetypeData,
              image: archetypeImages[archetypeData.imagePath as keyof typeof archetypeImages],
            };

            navigation.reset({
              index: 0,
              routes: [{
                name: 'Archetype',
                params: {
                  archetype: archetypeWithImage,
                  quizResult: pendingResults.detailedResult
                }
              }]
            });
          }
        }
      } catch (error) {
        console.error('Error checking pending quiz results:', error);
      }
    };

    checkPendingResults();
  }, [navigation, quizData.archetypes]);

  // const route = useRoute<QuizWelcomeScreenRouteProp>();
  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <SafeAreaView style={styles.safe}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />
        {/* Figma: node 203:2413 — QuizWelcome layout
            Outer column: left:40, top:114, width:313, gap:60
            Child 1: logoWelcomeGroup (gap:32) → logo + WELCOME
            Child 2: card (h:251)
            Child 3: BEGIN button
        */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Group 1: logo + WELCOME — gap:32 between them */}
          <View style={styles.logoWelcomeGroup}>
            <CircularLogoMark size={100} />
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcome}>WELCOME</Text>
            </View>
          </View>

          {/* Card — gradient border glow (same three-layer pattern as TermsAndConditionsScreen) */}
          <View style={styles.cardShadow}>
            <View style={styles.cardGradientBorder}>
              <View style={styles.cardClip}>
                <Text style={styles.description}>
                  <Text style={styles.regularText}>
                    A few quick reflections to reveal your
                  </Text>
                  <Text style={styles.italicHighlight}> starting role.</Text>
                  {'\n\n'}
                  <Text style={styles.regularText}>
                    No judgment. No labels.{' '}
                  </Text>
                  {'\n'}
                  <Text style={styles.italicHighlight}>Just insight.</Text>
                  {'\n\n'}
                  <Text style={styles.regularText}>This is where </Text>
                  <Text style={styles.italicHighlight}>change begins.</Text>
                </Text>
              </View>
            </View>
          </View>

          {/* BEGIN button — inline in gap:60 column, matches Figma */}
          <GradientButton
            title="BEGIN"
            onPress={() => navigation.navigate('QuizQuestions')}
            style={styles.glassButtonWrapper}
            containerStyle={styles.glassButtonContainer}
            contentStyle={styles.glassButtonContent}
            textStyle={styles.glassButtonText}
            gradientColors={[
              'rgba(253, 253, 249, 0.01)',
              'rgba(253, 253, 249, 0.00)',
            ]}
          />

          {__DEV__ && (
            <Text
              style={styles.devClearCache}
              onPress={async () => {
                await QuizStorageService.resetEverything();
                Alert.alert('Success', 'Cache Cleared!');
              }}
            >
              [DEV] Clear Quiz Cache
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default QuizWelcomeScreen;

const styles = StyleSheet.create<{
  bg: ViewStyle;
  safe: ViewStyle;
  bgImage: ImageStyle;
  scrollContent: ViewStyle;
  logoWelcomeGroup: ViewStyle;
  welcomeContainer: ViewStyle;
  welcome: TextStyle;
  cardShadow: ViewStyle;
  cardGradientBorder: ViewStyle;
  cardClip: ViewStyle;
  description: TextStyle;
  regularText: TextStyle;
  italicHighlight: TextStyle;
  glassButtonWrapper: ViewStyle;
  glassButtonContainer: ViewStyle;
  glassButtonContent: ViewStyle;
  glassButtonText: TextStyle;
  devClearCache: TextStyle;
}>({
  bg: {
    flex: 1,
  },
  safe: {
    flex: 1,
    backgroundColor: palette.neutral.transparent,
  },
  bgImage: {
    resizeMode: 'cover',
  },
  scrollContent: {
    paddingHorizontal: scale(40), // Figma left:40 scaled
    paddingTop: verticalScale(90), // Reduced from 114 to fit content
    paddingBottom: verticalScale(80), // Extra bottom space for button
    alignItems: 'center',
    gap: verticalScale(50), // Slightly reduced gap to fit content
  },
  logoWelcomeGroup: {
    alignItems: 'center',
    width: '100%',
    gap: verticalScale(32),
  },
  welcomeContainer: {
    alignItems: 'center',
    width: '100%',
    minHeight: verticalScale(52),
  },
  welcome: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.regular,
    letterSpacing: 0,
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    textShadowColor: palette.gold.warm,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    textTransform: 'uppercase',
  },
  // Three-layer gradient border pattern (matches TermsAndConditionsScreen)
  // backgroundColor gives iOS CALayer a concrete shape to render the gold
  // glow shadow from. palette.navy.deep matches the app background tone.
  cardShadow: {
    alignSelf: 'center',
    width: scale(313),
    borderRadius: radius.s,
    backgroundColor: palette.navy.deep,

    shadowColor: modalColors.textGoldMuted,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: moderateScale(16),
    elevation: 8,
  },
  // overflow:hidden clips to border radius; paddingHorizontal:0.5 = left+right gradient border
  cardGradientBorder: {
    borderRadius: radius.s,
    overflow: 'hidden',
    paddingHorizontal: 0.5,
  },
  // marginVertical:0.25 = top+bottom gradient border; dark background for content
  cardClip: {
    marginVertical: 0.25,
    borderRadius: radius.s - 0.25,
    overflow: 'hidden',
    backgroundColor: palette.navy.card,
    minHeight: verticalScale(251),
    paddingVertical: verticalScale(20),
    paddingHorizontal: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: moderateScale(fontSize.xl), // fontSize.xl = 24px
    textAlign: 'center',
    lineHeight: moderateScale(fontSize.xl) * 1.3,
  },
  regularText: {
    fontFamily: fontFamily.heading,
    fontWeight: fontWeight.regular,
    color: palette.gold.subtlest,
  },
  italicHighlight: {
    fontFamily: fontFamily.headingItalic,
    fontStyle: 'italic', // Required on iOS alongside fontFamily to trigger italic rendering
    fontWeight: fontWeight.regular,
    color: palette.gold.DEFAULT,
  },
  // Figma BEGIN button: border:0.5px #a3b3cc, rounded-m (16px), gradient 0.04→0.01
  glassButtonWrapper: {
    backgroundColor: palette.neutral.transparent,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    borderRadius: radius.m,
  },
  glassButtonContainer: {
    borderWidth: 0.5,
    borderColor: palette.navy.light,
    borderRadius: radius.m,
  },
  glassButtonContent: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    minWidth: 0,
  },
  glassButtonText: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize.xl), // 24px
    fontWeight: fontWeight.regular, // 400
    lineHeight: moderateScale(fontSize.xl) * 1.3, // 31.2px
    letterSpacing: 0,
    color: palette.gold.DEFAULT,
    textShadowColor: 'rgba(229, 214, 176, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 9,
  },
  devClearCache: {
    color: glassGradient.border.shadowColor, // gold.DEFAULT @ ~50% — dev only
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
