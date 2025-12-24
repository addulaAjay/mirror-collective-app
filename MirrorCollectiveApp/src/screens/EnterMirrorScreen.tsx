import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import LogoHeader from '../components/LogoHeader';
import StarIcon from '../components/StarIcon';
import AuthenticatedRoute from '../components/AuthenticatedRoute';
import { typography, colors } from '../styles/typography';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EnterMirror'>;
};

const EnterMirrorScreen: React.FC<Props> = ({ navigation }) => {
  const handleEnter = () => {
    navigation.navigate('MirrorChat');
  };

  return (
    <AuthenticatedRoute>
      <ImageBackground
        source={require('../../assets/dark_mode_shimmer_bg.png')}
        style={styles.container}
        resizeMode="cover"
      >
        <LogoHeader />

        <View style={styles.contentContainer}>
          {/* Main Welcome Message */}
          <View style={styles.messageSection}>
            <Text style={styles.title}>YOU ARE SEEN.{'\n'} YOU ARE HOME.</Text>
            <Text style={styles.subtitle}>Your unique reflection has been {'\n'}received.{'\n'}{'\n'} The Mirror is now attuned to your unfolding story—ready to uncover the patterns that shape you, support your growth, and evolve with you.</Text>
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
      </ImageBackground>
    </AuthenticatedRoute>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 180, // Space for LogoHeader
    gap: 80,
  },
  messageSection: {
    alignItems: 'center',
    gap: 40,
    maxWidth: 353,
  },
  title: {
    ...typography.styles.headline,
    color: '#F2E2B1',
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 40,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 48,
  },
  subtitle: {
    ...typography.styles.welcome,
    fontFamily: 'Inter',
    color: '#FDFDF9',
    fontSize: 18,
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 16,
  },
  bodyText: {
    ...typography.styles.body,
    textAlign: 'center',
    marginTop: 8,
  },
  enterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  enterText: {
    ...typography.styles.button,
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 40,
    lineHeight: 48,
    color: colors.button.primary,
    fontWeight: '300',
    textShadowColor: 'rgba(229, 214, 176, 0.50)',
    textTransform: 'uppercase',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  gestureContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  gestureIcon: {
    fontSize: 24,
    color: colors.text.primary,
  },
});

export default EnterMirrorScreen;
