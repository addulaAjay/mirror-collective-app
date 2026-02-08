import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '@theme';
import type { RootStackParamList } from '@types';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthenticatedRoute from '@components/AuthenticatedRoute';
import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import StarIcon from '@components/StarIcon';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EnterMirror'>;
};

const EnterMirrorScreen: React.FC<Props> = ({ navigation }) => {
  const handleEnter = () => {
    navigation.navigate('TalkToMirror');
  };

  return (
    <AuthenticatedRoute>
      <BackgroundWrapper style={styles.bg}>
        <SafeAreaView style={styles.safe}>
          <LogoHeader />

          <View style={styles.contentContainer}>
            {/* Main Welcome Message */}
            <View style={styles.messageSection}>
              <Text style={styles.title}>YOU’RE IN.{'\n'}THIS IS YOUR SPACE TO GROW.</Text>
              <Text style={styles.subtitle}>Your reflection is captured. {'\n'} The Mirror is now tuned to you — {'\n'}your patterns, your growth, your {'\n'}progress.{'\n'}{'\n'} No pressure. No judgment. Just {'\n'}clarity, over time. </Text>
                <Text style={styles.subtitleItalic}>It’s time to step into a journey toward {'\n'} a better you.</Text>
            </View>

            {/* Enter Button */}
            <TouchableOpacity
              style={styles.enterButton}
              onPress={handleEnter}
              activeOpacity={0.8}
            >
              <StarIcon width={24} height={24} />
              <Text style={styles.enterText}>ENTER</Text>
              <StarIcon width={24} height={24} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </BackgroundWrapper>
    </AuthenticatedRoute>
  );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    width: '100%',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 40,
    gap: 80,
    justifyContent: 'center',
  },
  messageSection: {
    alignItems: 'center',
    gap: 40,
    maxWidth: 353,
  },
  title: {
    ...theme.typography.styles.headline,
    color: '#F2E2B1',
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 32,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 48,
  },
  subtitle: {
    ...theme.typography.styles.welcome,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    color: '#FDFDF9',
    fontSize: 18,
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 16,
  },
  subtitleItalic: {
    ...theme.typography.styles.welcome,
    fontFamily: 'Inter',
    fontStyle: 'italic',
    color: '#FDFDF9',
    fontSize: 18,
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 24,
  },
  enterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  enterText: {
    ...theme.typography.styles.button,
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 32,
    lineHeight: 48,
    color: theme.colors.button.primary,
    fontWeight: '400',
    textShadowColor: 'rgba(229, 214, 176, 0.50)',
    textTransform: 'uppercase',
    textShadowRadius: 4,
  },
});

export default EnterMirrorScreen;
