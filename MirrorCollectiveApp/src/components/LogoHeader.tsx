import React from 'react';
import { View, Image, Text, StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const LogoHeader = () => (
  <View style={styles.container}>
    <Image
      source={require('@assets/Mirror_Collective_Logo_RGB.png')}
      style={styles.logo}
      resizeMode="contain"
    />
    <View style={styles.textContainer}>
      <Text style={textStyles.textItalic}>The <Text style={textStyles.textNormal}>MIRROR</Text></Text>
      <Text style={textStyles.textNormal}>COLLECTIVE</Text>
    </View>
  </View>
);


const fs = Math.min(Math.max(screenWidth * 0.04, 16), 18);
const lhItalic = Math.min(Math.max(screenWidth * 0.048, 20), 24);
const lhNormal = Math.min(Math.max(screenWidth * 0.045, 16), 18);

const baseText = {
  fontSize: fs,
  textAlign: 'center',        // matches your screenshot
  color: '#E5D6B0',
  textShadowOffset: { width: 0, height: 4 },
  textShadowRadius: 9,
  textShadowColor: 'rgba(0,0,0,0.25)',
  textTransform: 'none',
} as const;

export const textStyles = StyleSheet.create({
  textItalic: {
    ...baseText,
    fontFamily: 'CormorantGaramond-Italic',
    lineHeight: lhItalic,
  },
  textNormal: {
    ...baseText,
    fontFamily: 'CormorantGaramond-Regular',
    lineHeight: lhNormal,
  },
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Math.max(8, screenWidth * 0.02),
    alignItems: 'center',
    position: 'relative',
    top: Math.max(48, screenHeight * 0.056),
    alignSelf: 'center',
    zIndex: 10,
  },
  logo: {
    width: Math.min(Math.max(screenWidth * 0.117, 36), 46),
    height: Math.min(Math.max(screenWidth * 0.117, 36), 46),
  },
  textContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
});

export default LogoHeader;
