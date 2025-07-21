import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import LogoHeader from '../components/LogoHeader';
import { typography, shadows } from '../styles/typography';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AppExplanation'>;
};
const AppExplainerScreen: React.FC<Props> = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      // TODO: Add logic to check if user needs setup vs login
      // For now, navigate to login screen
      navigation.replace('Login');
    }, 5000); // Show video for 5 seconds

    return () => clearTimeout(timer);
  }, [navigation]);
  return (
    <ImageBackground
      source={require('../../assets/dark_mode_shimmer_bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <LogoHeader />

      {/* Video Section */}
      <View style={styles.videoFrame}>
        <Text style={styles.videoText}>App explainer video</Text>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 48,
    paddingHorizontal: 42,
    gap: 40,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: shadows.container.color,
    shadowOffset: shadows.container.offset,
    shadowOpacity: shadows.container.opacity,
    shadowRadius: shadows.container.radius,
    elevation: 10,
  },
  videoFrame: {
    width: 309,
    height: 600,
    backgroundColor: 'rgba(255, 255, 255, 0.40)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingVertical: 236,
    paddingHorizontal: 70,
  },
  videoText: {
    ...typography.styles.title,
    fontStyle: 'italic',
    color: '#000000',
    textAlign: 'center',
    width: 169,
  },
});

export default AppExplainerScreen;
