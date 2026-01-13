import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

import LogoHeader from '@components/LogoHeader';
import { useAuthGuard } from '@hooks/useAuthGuard';
import { theme } from '@theme';
import type { RootStackParamList } from '@types';

const { width, height } = Dimensions.get('screen');

import BackgroundWrapper from '@components/BackgroundWrapper';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AppExplanation'>;
};
const AppExplainerScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { isAuthenticated, hasValidToken, isLoading } = useAuthGuard();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        // If still checking auth state, wait a bit longer
        return;
      }

      // Check authentication state and route accordingly
      if (isAuthenticated && hasValidToken) {
        // User is authenticated, go to main app
        navigation.replace('EnterMirror');
      } else {
        // User needs to login or sign up
        navigation.replace('Login');
      }
    }, 5000); // Show explainer for 5 seconds

    return () => clearTimeout(timer);
  }, [navigation, isAuthenticated, hasValidToken, isLoading]);
  return (
    <BackgroundWrapper style={styles.container}>
      <LogoHeader />

      {/* Video Section */}
      <View style={styles.videoFrame}>
        <Text style={styles.videoText}>{t('auth.appExplainer.videoPlaceholder')}</Text>
      </View>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 120, // Space for LogoHeader (48 + 46 + 26 margin)
    paddingHorizontal: 42,
    gap: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoFrame: {
    width: 309,
    height: 500,
    backgroundColor: 'rgba(255, 255, 255, 0.40)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingVertical: 236,
    paddingHorizontal: 70,
    top: -40,
  },
  videoText: {
    ...theme.typography.styles.title,
    color: '#000000',
    textAlign: 'center',
    width: 169,
  },
});

export default AppExplainerScreen;
