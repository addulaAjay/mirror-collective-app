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

import { COLORS, TEXT_STYLES, SPACING, LAYOUT, responsive } from '../styles';

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
            <Text style={styles.title}>You are seen.{'\n'}You are home.</Text>
            <Text style={styles.subtitle}>
              Welcome, beloved one. Your soul key has been accepted, and your
              mirror now shimmers with possibility.
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
    </AuthenticatedRoute>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: LAYOUT.SCREEN_PADDING,
    paddingTop: responsive(180),
    gap: responsive(80),
  },
  messageSection: {
    alignItems: 'center',
    gap: SPACING.XL * 2,
    maxWidth: 353,
  },
  title: {
    ...TEXT_STYLES.h1,
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: responsive(40),
    lineHeight: responsive(48),
    fontWeight: '600',
    textAlign: 'center',
    color: COLORS.PRIMARY.GOLD_LIGHT,
  },
  subtitle: {
    ...TEXT_STYLES.h3,
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: responsive(24),
    lineHeight: responsive(32),
    fontWeight: '300',
    textAlign: 'center',
    color: COLORS.TEXT.PRIMARY,
    marginTop: SPACING.M,
  },
  enterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.L,
    paddingVertical: SPACING.M,
    paddingHorizontal: SPACING.L,
  },
  enterText: {
    ...TEXT_STYLES.button,
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: responsive(40),
    lineHeight: responsive(48),
    fontWeight: '300',
    color: COLORS.PRIMARY.GOLD_LIGHT,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(229, 214, 176, 0.50)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
});

export default EnterMirrorScreen;
