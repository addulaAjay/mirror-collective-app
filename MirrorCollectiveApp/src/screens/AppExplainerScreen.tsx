import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import Button from '@components/Button';
import LogoHeader from '@components/LogoHeader';
import { useAuthGuard } from '@hooks/useAuthGuard';
import type { RootStackParamList } from '@types';
import { palette, radius } from '@theme';

const { width, height } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AppExplanation'>;
};

const AppExplainerScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { isAuthenticated, hasValidToken, isLoading } = useAuthGuard();

  const handleNext = () => {
    if (isAuthenticated && hasValidToken) {
      navigation.replace('EnterMirror');
    } else {
      navigation.replace('Login');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) return;

      if (isAuthenticated && hasValidToken) {
        navigation.replace('EnterMirror');
      } else {
        navigation.replace('Login');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigation, isAuthenticated, hasValidToken, isLoading]);

  return (
    <BackgroundWrapper style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />

        <View style={styles.content}>
          <View style={styles.videoFrame}>
            <Text style={styles.videoText}>
              {t('auth.appExplainer.videoPlaceholder', 'App explainer\nvideo')}
            </Text>
          </View>

          <View style={styles.nextWrap}>
            <Button
              variant="gradient"
              title="NEXT"
              onPress={handleNext}
              style={styles.glassButtonWrapper}
              containerStyle={styles.glassButtonContainer}
              contentStyle={styles.glassButtonContent}
              textStyle={styles.glassButtonText}
              gradientColors={[
                'rgba(253, 253, 249, 0.08)',
                'rgba(253, 253, 249, 0.02)',
              ]}
            />
          </View>
        </View>
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
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },

  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 28,
  },

  videoFrame: {
    width: width * 0.88,
    height: height * 0.58,
    maxHeight: 560,
    minHeight: 420,
    backgroundColor: 'rgba(183, 184, 191, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },

  videoText: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 26,
    lineHeight: 34,
    color: palette.neutral.dark,
    textAlign: 'center',
  },

  nextWrap: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },

  glassButtonWrapper: {
    backgroundColor: 'transparent',
    borderRadius: radius.s,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  glassButtonContainer: {
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 18,
    overflow: 'hidden',
  },

  glassButtonContent: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },

  glassButtonText: {
    color: palette.gold.warm,
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 22,
    lineHeight: 28,
    textTransform: 'uppercase',
  },
});

export default AppExplainerScreen;
