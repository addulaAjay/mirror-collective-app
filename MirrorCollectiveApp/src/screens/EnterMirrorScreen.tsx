import React from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  Dimensions,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App'; // Adjust the path if needed

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EnterMirror'>;
};

const EnterMirrorScreen: React.FC<Props> = ({ navigation }) => {
  const handlePress = () => {
    navigation.navigate('AppExplanation'); // Navigate to explanation screen
  };
  

  return (
    <ImageBackground
      source={require('../assets/dark_mode_bg_5.png')}
      style={styles.container}
      imageStyle={styles.bgImage}
    >
      {/* Header Logo + Text */}
      <View style={styles.header}>
        <Image
          source={require('../assets/Mirror_Collective_Logo_RGB.png')}
          style={styles.logo}
        />
        <Text style={styles.headerText}>
          <Text style={styles.italic}>The </Text>
          MIRROR COLLECTIVE
        </Text>
      </View>

      {/* Mirror Frame Layers */}
      <TouchableOpacity style={styles.mirrorGroup} onPress={handlePress} activeOpacity={0.8}>
        <Image
          source={require('../assets/Asset_4@2x-8.png')}
          style={styles.asset4}
        />
        <Image
          source={require('../assets/Asset_3@2x-8.png')}
          style={styles.asset3}

        />
        <View style={styles.ellipseGlow} />
        
      </TouchableOpacity>
    </ImageBackground>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    height,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: -1, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 26,
    elevation: 10,
    alignItems: 'center',
  },
  bgImage: {
    resizeMode: 'cover',
  },
  header: {
    position: 'absolute',
    top: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    left: 111,
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
  mirrorGroup: {
    position: 'absolute',
    top: 115,
    left: -36,
    width: 465,
    height: 623,
    alignItems: 'center',
    justifyContent: 'center',
  },
  asset4: {
    position: 'absolute',
    width: 465,
    height: 623,
    resizeMode: 'contain',
  },
  asset3: {
    position: 'absolute',
    top: 131, // 246 - 115
    left: 42, // 6 + 36 (offset adjust)
    width: 382,
    height: 359,
    resizeMode: 'contain',
  },
  ellipseGlow: {
    position: 'absolute',
    top: 190 - 115, // relative to mirrorGroup
    left: 87,       // 51 + 36 offset
    width: 296,
    height: 472,
    borderRadius: 148,
    backgroundColor: 'rgba(217, 217, 217, 0.01)',
    shadowColor: '#E5D6B0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.47,
    shadowRadius: 60,
    elevation: 30,
  },
  mirrorTextOverlay: {
    position: 'absolute',
    top: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mirrorText: {
    fontSize: 28,
    fontFamily: 'Cormorant Garamond',
    color: '#713F2D',
    letterSpacing: 1,
    lineHeight: 36,
  },
});

export default EnterMirrorScreen;
