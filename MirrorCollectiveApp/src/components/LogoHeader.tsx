import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { typography } from '../styles/typography';

const LogoHeader = () => (
  <View style={styles.container}>
    <Image
      source={require('../../assets/Mirror_Collective_Logo_RGB.png')}
      style={styles.logo}
    />
    <Text style={styles.text}>The MIRROR COLLECTIVE</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    width: 167,
    height: 46,
    position: 'absolute',
    top: 48,
    alignSelf: 'center',
    zIndex: 10,
  },
  logo: {
    width: 46,
    height: 46,
  },
  text: {
    ...typography.styles.logoText,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 9,
    textTransform: 'none',
  },
});

export default LogoHeader;
