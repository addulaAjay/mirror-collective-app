import React from 'react';
import { TextInput, StyleSheet, View } from 'react-native';

interface Props {
  placeholder: string;
  secureTextEntry?: boolean;
}

const TextInputField = ({ placeholder, secureTextEntry = false }: Props) => (
  <View style={styles.container}>
    <TextInput
      placeholder={placeholder}
      placeholderTextColor="#E8F1F2"
      secureTextEntry={secureTextEntry}
      style={styles.input}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    width: 313,
    height: 48,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#FDFDF9',
    backgroundColor: 'rgba(217, 217, 217, 0.01)',
    paddingHorizontal: 40,
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  input: {
    fontFamily: 'Cormorant Garamond',
    fontStyle: 'italic',
    fontSize: 20,
    textAlign: 'center',
    color: '#E8F1F2',
  },
});

export default TextInputField;
