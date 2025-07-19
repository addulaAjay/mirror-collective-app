import { View, Image, Text, StyleSheet, Dimensions, ImageBackground } from 'react-native';
import React, { useEffect } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
type SplashProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

const SplashScreen: React.FC<SplashProps> = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('EnterMirror'); // navigates after 10 seconds
    }, 2000); // 10,000 ms = 10 seconds

    return () => clearTimeout(timer); // cleanup
  }, [navigation]);
  return (
    <ImageBackground
      source={require('../../assets/dark_mode_shimmer_bg.png')}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/Mirror_Collective_Logo_RGB.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>
          <Text style={styles.italic}>The </Text>
          MIRROR{'\n'}COLLECTIVE
        </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: -1, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 26,
    elevation: 10,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    position: 'absolute',
    top: height * 0.33,
  },
  logo: {
    width: 175,
    height: 175,
    marginBottom: 25,
    shadowColor: '#E5D6B0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.86,
    shadowRadius: 32,
    elevation: 15,
  },
  title: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 35,
    fontWeight: '300',
    lineHeight: 42,
    textAlign: 'center',
    color: '#E5D6B0',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 9,
  },
  italic: {
    fontStyle: 'italic',
  },
});

export default SplashScreen;
