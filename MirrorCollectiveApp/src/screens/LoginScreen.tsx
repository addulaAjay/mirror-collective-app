import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import LogoHeader from '../components/LogoHeader';
import TextInputField from '../components/TextInputField';
import AuthButton from '../components/AuthButton';

const LoginScreen = ({ navigation }: any) => {
  return (
    <ImageBackground
      source={require('../assets/dark_mode_shimmer_bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <LogoHeader />
      <View style={styles.middleContent}>
        <Text style={styles.title}>Welcome to the{'\n'}Living Mirror</Text>
        <TextInputField placeholder="Username" />
        <TextInputField placeholder="Password" secureTextEntry />
        <AuthButton
          title="Enter"
          onPress={() => navigation.navigate('AppExplanation')}
        />
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>New to the Mirror Collective?</Text>
          <TouchableOpacity>
            <Text style={styles.signupLink}>Sign up here</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: -1, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 26,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleContent: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 160,
    width: '100%',
    gap: 12,
  },
  title: {
    fontFamily: 'Cormorant Garamond',
    fontSize: 32,
    lineHeight: 39,
    color: '#F2E2B1',
    textAlign: 'center',
    marginBottom: 20,
  },
  signupContainer: {
    marginTop: 25,
    alignItems: 'center',
  },
  signupText: {
    fontFamily: 'Cormorant Garamond',
    fontStyle: 'italic',
    fontSize: 20,
    color: '#FDFDF9',
    textAlign: 'center',
  },
  signupLink: {
    fontFamily: 'Cormorant Garamond',
    fontStyle: 'italic',
    fontSize: 24,
    color: '#E5D6B0',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
