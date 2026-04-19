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
  textShadow,
  borderWidth,
  spacing,
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

import BackgroundWrapper from '@components/BackgroundWrapper';
import CircularLogoMark from '@components/CircularLogoMark';
import GradientButton from '@components/GradientButton';
import { QuizStorageService } from '@services/quizStorageService';

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

  useEffect(() => {
    const checkPendingResults = async () => {
      try {
        const pendingResults = await QuizStorageService.getPendingQuizResults();
        if (pendingResults?.backendResult) {
          console.log(
            'Found pending quiz results, redirecting to Archetype screen',
          );

          const archetypeDetails =
            pendingResults.backendResult.archetype_details;

          const archetypeWithImage = {
            ...archetypeDetails,
            image:
              archetypeImages[
                archetypeDetails.imagePath as keyof typeof archetypeImages
              ],
          };

          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'Archetype',
                params: {
                  archetype: archetypeWithImage,
                  quizResult: {
                    finalArchetype:
                      pendingResults.backendResult.final_archetype,
                    assignmentReason:
                      pendingResults.backendResult.assignment_reason,
                    totalScores: pendingResults.backendResult.total_scores,
                  },
                },
              },
            ],
          });
        }
      } catch (error) {
        console.error('Error checking pending quiz results:', error);
      }
    };

    checkPendingResults();
  }, [navigation]);

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

          {/* Card — Figma specs: Border:0.25px Radius:20px Padding:L/M */}
          <View style={styles.cardContainer}>
            <Text style={styles.description}>
              <Text style={styles.regularText}>
                A few quick reflections to reveal your
              </Text>
              <Text style={styles.italicHighlight}> starting parttern.</Text>
              {'\n\n'}
              <Text style={styles.regularText}>No judgment. No labels. </Text>
              {'\n'}
              <Text style={styles.italicHighlight}>Just insight.</Text>
              {'\n\n'}
              <Text style={styles.regularText}>This is where </Text>
              <Text style={styles.italicHighlight}>change begins.</Text>
            </Text>
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
              glassGradient.echoSecondary.start,
              glassGradient.echoSecondary.end,
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
  cardContainer: ViewStyle;
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
    textShadowColor: textShadow.glow.color,
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: textShadow.glow.radius,
    textTransform: 'uppercase',
  },
  // Figma card specs: Radius:20px Border:0.25px Padding:L(20)/M(16) Height:251px Width:313px
  // Background: Transparent White Gradient, Border: Border/Subtle
  // Shadow: X:0 Y:0 Blur:15 Spread:3 #F2E2B1 · 30%
  cardContainer: {
    alignSelf: 'center',
    width: scale(313),
    minHeight: verticalScale(251),
    borderRadius: radius.l, // Figma: 20px
    borderWidth: borderWidth.hairline, // Figma: 0.25px
    borderColor: palette.navy.light, // Figma: Border/Subtle
    backgroundColor: palette.navy.card, // Transparent gradient background
    paddingVertical: verticalScale(spacing.l), // Figma: Spacing/L (20px)
    paddingHorizontal: scale(spacing.m), // Figma: Spacing/M (16px)
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: palette.gold.DEFAULT, // Figma: #F2E2B1
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
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
    borderWidth: borderWidth.thin,
    borderColor: palette.navy.light,
    borderRadius: radius.m,
  },
  glassButtonContent: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    minWidth: 0,
  },
  glassButtonText: {
    color: palette.gold.DEFAULT, // Override default theme color
  },
  devClearCache: {
    color: palette.gold.mid, // Muted gold for dev-only text
    fontSize: fontSize.xxs,
    textDecorationLine: 'underline',
  },
});
