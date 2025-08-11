import React from 'react';
import { View, Image, Text, StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const LogoHeader = () => (
  <View style={styles.container}>
    <Image
      source={require('../../assets/Mirror_Collective_Logo_RGB.png')}
      style={styles.logo}
      resizeMode="contain"
    />
    <View style={styles.textContainer}>
      <Text style={styles.text}>The MIRROR</Text>
      <Text style={styles.text}>COLLECTIVE</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Math.max(8, screenWidth * 0.02),
    alignItems: 'center',
    position: 'absolute',
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
  text: {
    fontFamily: 'CormorantGaramond-Light', // Match splash screen
    fontWeight: '300', // Match splash screen
    fontSize: Math.min(Math.max(screenWidth * 0.04, 14), 16), // Smaller than splash screen
    lineHeight: Math.min(Math.max(screenWidth * 0.045, 16), 18), // Consistent line height
    textAlign: 'left', // Left align for two-line layout
    color: '#E5D6B0', // Match splash screen color
    textShadowOffset: { width: 0, height: 4 }, // Match splash screen shadow
    textShadowRadius: 9, // Match splash screen shadow
    textShadowColor: 'rgba(0, 0, 0, 0.25)', // Match splash screen shadow
    textTransform: 'none', // Match splash screen
  },
});

export default LogoHeader;
