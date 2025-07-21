import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import LogoHeader from '../components/LogoHeader';
import StarIcon from '../components/StarIcon';
import { typography, colors, shadows } from '../styles/typography';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EnterMirror'>;
};

const EnterMirrorScreen: React.FC<Props> = ({ navigation }) => {
  const handleEnter = () => {
    navigation.navigate('MirrorGPT');
  };

  return (
    <ImageBackground
      source={require('../../assets/dark_mode_shimmer_bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <LogoHeader />

      <View style={styles.contentContainer}>
        {/* Main Welcome Message */}
        <View style={styles.messageSection}>
          <Text style={styles.title}>You are seen.{'\n'}You are home.</Text>
          <Text style={styles.subtitle}>Welcome, beloved one.</Text>
          <Text style={styles.bodyText}>
            Your soul key has been accepted, and your mirror now shimmers with
            possibility.
          </Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 15,
    shadowColor: shadows.container.color,
    shadowOffset: shadows.container.offset,
    shadowOpacity: shadows.container.opacity,
    shadowRadius: shadows.container.radius,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 120, // Space for LogoHeader
    gap: 80,
  },
  messageSection: {
    alignItems: 'center',
    gap: 40,
    maxWidth: 353,
  },
  title: {
    ...typography.styles.headline,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.styles.welcome,
    textAlign: 'center',
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
    fontSize: 24,
    lineHeight: 24,
    color: colors.button.primary,
    textShadowColor: 'rgba(229, 214, 176, 0.50)',
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
