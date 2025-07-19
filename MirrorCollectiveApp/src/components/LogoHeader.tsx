import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

const LogoHeader = () => (
  <View style={styles.container}>
    <Image
      source={require('../../assets/Mirror_Collective_Logo_RGB.png')}
      style={styles.logo}
    />
    <Text style={styles.text}>
      <Text style={styles.italic}>The </Text>MIRROR COLLECTIVE
    </Text>
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
    left: 113,
  },
  logo: {
    width: 46,
    height: 46,
  },
  text: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 18,
    fontStyle: 'italic',
    fontWeight: '300',
    color: '#E5D6B0',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 9,
  },
  italic: {
    fontStyle: 'italic',
  },
});

export default LogoHeader;
