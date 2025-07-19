import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ImageBackground,
} from 'react-native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App'; // Adjust the path if needed
import LogoHeader from '../components/LogoHeader';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AppExplanation'>;
};
const AppExplainerScreen: React.FC<Props> = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login'); // navigates after 10 seconds
    }, 2000); // 10,000 ms = 10 seconds

    return () => clearTimeout(timer); // cleanup
  }, [navigation]);
  return (
    <ImageBackground
      source={require('../assets/dark_mode_shimmer_bg.png')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <LogoHeader />

      {/* Video Section */}
      <View style={styles.videoFrame}>
        <Text style={styles.videoText}>App explainer video</Text>
      </View>
    </ImageBackground>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    height,
    paddingTop: 48,
    paddingHorizontal: 42,
    gap: 40,
    backgroundColor: '#0B0E1C',
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: -1, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 26,
    elevation: 10,
  },
  backgroundImage: {
    resizeMode: 'cover',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 8,
    width: 167,
    height: 46,
  },
  logo: {
    width: 46,
    height: 46,
  },
  headerText: {
    width: 113,
    height: 44,
    fontFamily: 'Cormorant Garamond',
    fontStyle: 'italic',
    fontWeight: '300',
    fontSize: 18,
    lineHeight: 22,
    textAlign: 'center',
    color: '#E5D6B0',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 9,
  },
  italic: {
    fontStyle: 'italic',
  },
  videoFrame: {
    width: 309,
    height: 600,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    paddingVertical: 236,
    paddingHorizontal: 70,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    marginTop: 90,
  },
  videoText: {
    width: 169,
    height: 29,
    fontFamily: 'Cormorant Garamond',
    fontStyle: 'italic',
    fontWeight: '500',
    fontSize: 24,
    lineHeight: 29,
    textAlign: 'center',
    color: '#000000',
  },
});

export default AppExplainerScreen;
