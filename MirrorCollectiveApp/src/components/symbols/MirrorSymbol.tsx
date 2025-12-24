import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const mirrorSource = require('../../assets/oval-mirror-golden-frame.png');

const MirrorSymbol = () => (
  <View style={styles.container}>
    <Image source={mirrorSource} style={styles.image} resizeMode="contain" />
  </View>
);

export default MirrorSymbol;

const styles = StyleSheet.create({
  container: {
    width: 50.121,
    height: 77.209,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    transform: [],
  },
});
