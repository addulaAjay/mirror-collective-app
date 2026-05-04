import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  fontFamily,
  fontSize,
  lineHeight,
  moderateScale,
  palette,
  scaleCap,
  spacing,
  textShadow,
} from '@theme';
import type { RootStackParamList } from '@types';
import React, { useCallback } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import MCLogo from '@components/MCLogo';
import { useAuthGuard } from '@hooks/useAuthGuard';

// Figma: MC-Design-Master-File node 203:2409
// Layout: logo centered + "START REFLECTING" + "Click anywhere to continue"

const { width: screenWidth } = Dimensions.get('screen');

// Figma: container left:40px, width:313px on 393px screen
// Logo aspect ratio from Figma: 313 × 487
const CONTAINER_WIDTH = screenWidth - 80; // 40px padding each side
const LOGO_WIDTH = scaleCap(CONTAINER_WIDTH, 313); // Figma design width
const LOGO_HEIGHT = LOGO_WIDTH * (487 / 313); // Maintain aspect ratio

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MirrorAnimation'>;
};

const MirrorAnimationScreen: React.FC<Props> = ({ navigation }) => {
  const { isAuthenticated, hasValidToken } = useAuthGuard();

  const handleEnter = useCallback(async () => {
    if (isAuthenticated && hasValidToken) {
      navigation.replace('EnterMirror');
    } else {
      // Check if user has completed the quiz anonymously
      const { QuizStorageService } = await import('@services/quizStorageService');
      const hasCompletedQuiz = await QuizStorageService.hasCompletedQuiz();

      if (hasCompletedQuiz) {
        const pendingQuiz = await QuizStorageService.getPendingQuizResults();

        if (pendingQuiz?.backendResult) {
          const archetypeDetails = pendingQuiz.backendResult.archetype_details;

          const archetypeImages = {
            'seeker-archetype.png': require('@assets/seeker-archetype.png'),
            'guardian-archetype.png': require('@assets/guardian-archetype.png'),
            'flamebearer-archetype.png': require('@assets/flamebearer-archetype.png'),
            'weaver-archetype.png': require('@assets/weaver-archetype.png'),
          };

          const archetypeWithImage = {
            ...archetypeDetails,
            image: archetypeImages[archetypeDetails.imagePath as keyof typeof archetypeImages],
          };

          navigation.replace('Archetype', { archetype: archetypeWithImage });
        } else {
          navigation.replace('Login');
        }
      } else {
        navigation.replace('QuizWelcome');
      }
    }
  }, [isAuthenticated, hasValidToken, navigation]);

  return (
    <BackgroundWrapper style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity
          style={styles.content}
          onPress={handleEnter}
          activeOpacity={1}
        >
          <View style={styles.logoContainer}>
            <MCLogo width={LOGO_WIDTH} height={LOGO_HEIGHT} />
          </View>

          <View style={styles.textBlock}>
            <Text style={styles.title}>START REFLECTING</Text>
            <Text style={styles.subtitle}>Click anywhere to continue</Text>
          </View>
        </TouchableOpacity>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40, // Figma: left:40px on 393px screen
    gap: 60,               // Figma: gap between logo and text block
  },
  // Figma: Glow Drop Shadow effect — blur:10, spread:3, #F0D4A8 at 30%
  logoContainer: {
    shadowColor: palette.gold.glow,     // #F0D4A8
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,                 // 30% from Figma
    shadowRadius: 10,                   // blur:10 from Figma
    elevation: 10,                      // Android shadow
  },
  textBlock: {
    width: '100%',
    gap: spacing.xxs, // Figma: gap:4px between title and subtitle
  },
  // Figma: Heading/Heading M (Cormorant) — font:Heading, weight:400, size:2XL, line-height:XL
  // Text color: Text/Paragraph-1 (#f2e2b1)
  // Glow Drop Shadow: X:0 Y:0 Blur:10 Spread:3 #F0D4A8 · 30%
  // Second shadow (Blur:60) not applied due to React Native single-shadow limitation
  title: {
    fontFamily: fontFamily.heading,                    // CormorantGaramond-Regular (weight 400)
    fontSize: moderateScale(fontSize['2xl'], 0.3),     // 28 base
    lineHeight: moderateScale(lineHeight.xl, 0.3),     // 32 base
    textAlign: 'center',
    color: palette.gold.DEFAULT,                       // #f2e2b1 (Text/Paragraph-1)
    textShadowColor: textShadow.glow.color,            // textShadow.glow from design system
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: textShadow.glow.radius,
  },
  // Figma: Cormorant Garamond Medium, 20px (L), lh:1.3, color gold.DEFAULT
  subtitle: {
    fontFamily: fontFamily.headingMedium,           // CormorantGaramond-Medium
    fontSize: moderateScale(fontSize.l, 0.3),       // 20 base
    lineHeight: moderateScale(fontSize.l * 1.3, 0.3), // lh ratio 1.3
    textAlign: 'center',
    color: palette.gold.DEFAULT,  
    textShadowColor: textShadow.glow.color,            // textShadow.glow from design system
    textShadowOffset: textShadow.glow.offset,
    textShadowRadius: textShadow.glow.radius,                  // #f2e2b1
  },
});

export default MirrorAnimationScreen;
