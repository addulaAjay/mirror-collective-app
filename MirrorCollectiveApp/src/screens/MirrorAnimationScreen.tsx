import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  type ViewStyle,
  type ImageStyle,
} from 'react-native';

import BackgroundWrapper from '@components/BackgroundWrapper';
import { useAuthGuard } from '@hooks/useAuthGuard';
import type { RootStackParamList } from '@types';

const { width: screenWidth } = Dimensions.get('window');

// Check if device is a tablet
const isTablet = screenWidth >= 600;


type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MirrorAnimation'>;
};

/**
 * MirrorAnimationScreen - Displays the mirror with glow effect
 *
 * Using layered approach with separate assets for flexibility.
 * For simpler approach with composite image, see MirrorAnimationScreen_SimpleVersion.tsx
 *
 * TODO: Once you export a composite image from Figma (Ellipse 734 + Asset 4 + Asset 3),
 * you can simplify this to just use a single Image component.
 */
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
        // User completed quiz, load the full result and show archetype screen
        const pendingQuiz = await QuizStorageService.getPendingQuizResults();
        
        if (pendingQuiz && pendingQuiz.archetypeResult) {
          // Load quiz data for archetype images
          const { default: questionsData } = await import('@assets/questions.json');
          const archetypeKey = pendingQuiz.archetypeResult.name.toLowerCase();
          const archetypeData = questionsData.archetypes[archetypeKey as keyof typeof questionsData.archetypes];
          
          // Static image mapping
          const archetypeImages = {
            'seeker-archetype.png': require('@assets/seeker-archetype.png'),
            'guardian-archetype.png': require('@assets/guardian-archetype.png'),
            'flamebearer-archetype.png': require('@assets/flamebearer-archetype.png'),
            'weaver-archetype.png': require('@assets/weaver-archetype.png'),
          };
          
          const archetypeWithImage = {
            ...archetypeData,
            image: archetypeImages[archetypeData.imagePath as keyof typeof archetypeImages],
          };
          
          navigation.replace('Archetype', { archetype: archetypeWithImage });
        } else {
          // Account is ready but no local quiz data? Go to sign in.
          navigation.replace('Login');
        }
      } else {
        // User hasn't completed quiz, show quiz welcome
        navigation.replace('QuizWelcome');
      }
    }
  }, [isAuthenticated, hasValidToken, navigation]);

  return (
    <BackgroundWrapper style={styles.container}>
      <View style={styles.contentContainer}>
        <TouchableOpacity
          onPress={handleEnter}
          style={styles.mirrorContainer}
          activeOpacity={0.8}
        >
          {/* Layer 1: Mirror frame (Asset 4) */}
          <Image
            source={require('@assets/Asset_4@2x-8.png')}
            style={styles.mirrorFrame}
            resizeMode="contain"
          />

          {/* Layer 2: Mirror reflection overlay (Asset 3) */}
          <Image
            source={require('@assets/Asset_3@2x-8.png')}
            style={styles.mirrorReflection}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create<{
  container: ViewStyle;
  contentContainer: ViewStyle;
  mirrorContainer: ViewStyle;
  mirrorFrame: ImageStyle;
  mirrorReflection: ImageStyle;
}>({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mirrorContainer: {
    width: isTablet ? '60%' : '90%', // Flexible width for different devices
    aspectRatio: 465 / 623, // Maintain original aspect ratio
    maxWidth: 465, // Don't exceed original design size
    maxHeight: 623,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mirrorFrame: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  mirrorReflection: {
    position: 'absolute',
    width: `${(382 / 465) * 100}%`, // 82.15% of parent width
    height: `${(359 / 623) * 100}%`, // 57.63% of parent height
    top: `${(130 / 623) * 100}%`, // 20.87% from top
    left: `${(42 / 465) * 100}%`, // 9.03% from left
  },
});

export default MirrorAnimationScreen;
