import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  fontFamily,
  fontSize,
  moderateScale,
  palette,
  scaleCap,
  spacing,
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
// Logo aspect ratio from Figma: 313 × 487 (original SVG content dimensions)
// Note: viewBox is expanded to include glow, but rendered size uses original aspect ratio
const CONTAINER_WIDTH = screenWidth - 80; // 40px padding each side
const LOGO_WIDTH = scaleCap(CONTAINER_WIDTH, 313); // Original logo width
const LOGO_HEIGHT = LOGO_WIDTH * (487 / 313); // Original logo aspect ratio

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
          <MCLogo width={LOGO_WIDTH} height={LOGO_HEIGHT} />

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
  textBlock: {
    width: '100%',
    gap: spacing.xxs, // Figma: gap:4px between title and subtitle
  },
  // Figma: Cormorant Garamond Regular, 32px (3XL), lh:1.3, color gold.DEFAULT
  // Text shadow: 0 0 16px rgba(240,212,168,0.6) — golden glow
  title: {
    fontFamily: fontFamily.heading,                 // CormorantGaramond-Regular
    fontSize: moderateScale(fontSize['3xl'], 0.3),  // 32 base
    lineHeight: moderateScale(fontSize['3xl'] * 1.3, 0.3), // lh ratio 1.3
    textAlign: 'center',
    color: palette.gold.DEFAULT,                    // #f2e2b1
    textShadowColor: 'rgba(240, 212, 168, 0.6)',   // Figma glow — palette.gold.glow at 0.6
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  // Figma: Cormorant Garamond Medium, 20px (L), lh:1.3, color gold.DEFAULT
  subtitle: {
    fontFamily: fontFamily.headingMedium,           // CormorantGaramond-Medium
    fontSize: moderateScale(fontSize.l, 0.3),       // 20 base
    lineHeight: moderateScale(fontSize.l * 1.3, 0.3), // lh ratio 1.3
    textAlign: 'center',
    color: palette.gold.DEFAULT,                    // #f2e2b1
  },
});

export default MirrorAnimationScreen;
