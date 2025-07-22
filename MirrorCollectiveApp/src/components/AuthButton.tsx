import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

interface Props {
  onPress: () => void;
  title: string;
}

const AuthButton = ({ onPress, title }: Props) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.container}
    activeOpacity={0.8}
  >
    <View style={styles.dot} />
    <Text style={styles.text}>{title}</Text>
    <View style={styles.dot} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
    marginVertical: 30,
  },
  text: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 28,
    textTransform: 'uppercase',
    color: '#E5D6B0',
    textShadowColor: 'rgba(229, 214, 176, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E5D6B0',
    shadowColor: '#E5D6B0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default AuthButton;
