import React from 'react';
import { View, Image, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS, SPACING } from '../styles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const LogoHeader = () => (
  <View style={styles.container}>
    <Image
      source={require('../../assets/Mirror_Collective_Logo_RGB.png')}
      style={styles.logo}
      resizeMode="contain"
    />
    <View style={styles.textContainer}>
      <Text style={textStyles.textItalic}>
        The <Text style={textStyles.textNormal}>MIRROR</Text>
      </Text>
      <Text style={textStyles.textNormal}>COLLECTIVE</Text>
    </View>
  </View>
);

// Font scaling closer to Figma spec
const fs = Math.min(Math.max(screenWidth * 0.05, 14), 16);
const lhItalic = fs * 1.4;
const lhNormal = fs * 1.2;

const baseText = {
  fontSize: fs,
  textAlign: 'center',
  color: COLORS.PRIMARY.GOLD_LIGHT,
  textShadowColor: 'rgba(0,0,0,0.25)',
  textShadowOffset: { width: 0, height: 4 },
  textShadowRadius: 6, // Softer shadow
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
    letterSpacing: 0.5, // subtle spacing like Figma
  },
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: SPACING.S,
    alignItems: 'center',
    position: 'absolute', // Use absolute to pin to top
    top: Math.max(32, screenHeight * 0.06), // More top margin like Figma
    alignSelf: 'center',
    zIndex: 10,
  },
  logo: {
    width: Math.min(Math.max(screenWidth * 0.1, 28), 40),
    height: Math.min(Math.max(screenWidth * 0.1, 28), 40),
  },
  textContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
});

export default LogoHeader;
