import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  palette,
  fontFamily,
  fontSize,
  fontWeight,
  scale,
  verticalScale,
  moderateScale,
  textShadow,
} from '@theme';
import type { RootStackParamList } from '@types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button';
import LogoHeader from '@components/LogoHeader';
import { QuizStorageService } from '@services/quizStorageService';

type ArchetypeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Archetype'
>;

interface ArchetypeScreenProps {
  route: {
    params: {
      archetype: {
        name: string;
        title: string;
        description: string;
        image: any;
      };
    };
  };
}

const ArchetypeScreen: React.FC<ArchetypeScreenProps> = ({ route }) => {
  const { t } = useTranslation();
  const navigation = useNavigation<ArchetypeScreenNavigationProp>();
  const { archetype } = route.params;

  const handleContinue = () => {
    navigation.navigate('Login');
  };

  const handleRetake = () => {
    Alert.alert(
      t('quiz.archetype.retakeTitle'),
      t('quiz.archetype.retakeMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('quiz.archetype.retakeConfirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await QuizStorageService.clearPendingQuizResults();
              await QuizStorageService.resetQuizState();
              navigation.reset({
                index: 0,
                routes: [{ name: 'QuizWelcome' }],
              });
            } catch (error) {
              console.error('Failed to reset quiz:', error);
            }
          },
        },
      ],
    );
  };

  // Archetype description from backend (via backendResult.archetype_details.description)
  // Format: "Para 1 text\n\n Para 2 text" — trim() removes leading space on para 2
  const descParts = archetype.description.split('\n\n');
  const para1 = descParts[0]?.trim() ?? archetype.description;
  const para2 = descParts[1]?.trim() ?? null;

  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage} scrollable>
      <SafeAreaView style={styles.safe}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />
        <LogoHeader />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View testID="archetype-container" style={styles.container}>
            {/* Content column — gap-[24px] between all sections, Figma: node 205:457 */}
            <View style={styles.content}>

              {/* Title */}
              <View style={styles.titleContainer}>
                <Text testID="archetype-title" style={styles.title}>
                  {archetype.title}
                </Text>
              </View>

              {/* Archetype Image — 240×240 square with shadow wrapper */}
              <View style={styles.imageShadowWrapper}>
                <Image
                  testID="archetype-image"
                  source={archetype.image}
                  style={styles.archetypeImage}
                  resizeMode="cover"
                />
              </View>

              {/* Description paragraphs */}
              <View style={styles.descriptionContainer}>
                <Text testID="archetype-description" style={styles.descriptionLight}>
                  {para1}
                </Text>
                {para2 ? (
                  <Text style={styles.descriptionItalic}>{para2}</Text>
                ) : null}
              </View>

            </View>
          </View>
        </ScrollView>

        {/* Pinned CTA — always visible regardless of how much description scrolled. */}
        <View style={styles.continueBar}>
          <Button
            variant="link"
            size="L"
            title="Click anywhere to continue"
            onPress={handleContinue}
            testID="archetype-continue"
          />
        </View>

        {/* Dev-only retake button — gated by __DEV__ so it only appears in
            debug/dev builds, never in production (TestFlight/App Store). */}
        {__DEV__ && (
          <TouchableOpacity onPress={handleRetake} style={styles.retakeButton}>
            <Text style={styles.retakeText}>
              {t('quiz.archetype.retakeButton')}
            </Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default ArchetypeScreen;

const styles = StyleSheet.create({
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

  // ScrollView holds the scrollable middle (title + image + description).
  // The Continue CTA and dev-only retake live below as siblings, pinned.
  scrollView: {
    flex: 1,
  },
  // No flexGrow on contentContainer — it would force the container to claim
  // at least the viewport's height, which on iOS prevents the ScrollView
  // from detecting overflow and disables scrolling. With natural sizing,
  // content scrolls when it exceeds the visible scroll area.
  scrollContent: {
    paddingTop:    verticalScale(40),
    paddingBottom: verticalScale(24),
  },

  // Figma: outer container left-[24px] w-[351px]
  container: {
    paddingHorizontal: scale(24),
    alignItems: 'center',
  },

  // Figma: node 205:457 — flex col gap-[24px] items-center w-full
  content: {
    width: '100%',
    alignItems: 'center',
    gap: scale(24),
  },

  // Figma: node 205:458 — w-[313px] items-center justify-center
  titleContainer: {
    width: scale(313),
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Figma: Heading/Heading L — Cormorant Regular 3XL, #e5d6b0, shadow 0 0 8px #e5d6b0
  title: {
    fontFamily: fontFamily.heading,
    fontSize: moderateScale(fontSize['3xl']),
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(fontSize['3xl'] * 1.3),
    letterSpacing: 0,
    color: palette.gold.warm,
    textAlign: 'center',
    textShadowColor: textShadow.glowSubtle.color,
    textShadowOffset: textShadow.glowSubtle.offset,
    textShadowRadius: textShadow.glowSubtle.radius,
  },

  // Figma: node 205:460 — 240×240, shadow 0 0 44px rgba(0,0,0,0.2)
  imageShadowWrapper: {
    width: scale(240),
    height: scale(240),
    shadowColor: palette.neutral.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 44,
    elevation: 8,
  },
  archetypeImage: {
    width: '100%',
    height: '100%',
  },

  // Figma: node 4023:2903 — gap-[24px] px-[24px] w-full
  descriptionContainer: {
    width: '100%',
    paddingHorizontal: scale(24),
    gap: scale(24),
  },

  // Figma: Body M/Body M Light — Inter Light 18px, lineHeight 1.5, #fdfdf9
  descriptionLight: {
    fontFamily: fontFamily.bodyLight,
    fontSize: moderateScale(fontSize.m),
    fontWeight: fontWeight.light,
    lineHeight: moderateScale(fontSize.m * 1.5),
    letterSpacing: 0,
    color: palette.gold.subtlest,
    textAlign: 'center',
  },

  // Figma: Body M/Body M Italic — Inter Italic 18px, lineHeight 1.5, #fdfdf9
  descriptionItalic: {
    fontFamily: fontFamily.bodyItalic,
    fontStyle: 'italic',              // Required on iOS alongside fontFamily to trigger italic rendering
    fontSize: moderateScale(fontSize.m),
    fontWeight: fontWeight.regular,
    lineHeight: moderateScale(fontSize.m * 1.5),
    letterSpacing: 0,
    color: palette.gold.subtlest,
    textAlign: 'center',
  },

  // Pinned Continue CTA — sibling of ScrollView so it always stays visible.
  continueBar: {
    width:            '100%',
    alignItems:       'center',
    paddingHorizontal: scale(24),
  },

  // Dev-only — not in Figma
  retakeButton: {
    alignSelf: 'center',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    marginBottom: verticalScale(8),
  },
  retakeText: {
    fontFamily: fontFamily.bodyItalic,
    fontStyle: 'italic',
    fontSize: moderateScale(fontSize.xs),
    color: 'rgba(242, 226, 177, 0.5)',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
