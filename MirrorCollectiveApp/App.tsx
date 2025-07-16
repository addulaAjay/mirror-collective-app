/**
 * Mirror Collective App
 * Cross-platform React Native Mobile Application
 *
 * @format
 */

import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
} from 'react-native';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
    flex: 1,
  };

  const textStyle = {
    color: isDarkMode ? '#FFFFFF' : '#000000',
  };

  const handleGetStarted = () => {
    Alert.alert(
      'Welcome!',
      'This is your new React Native app running on both iOS and Android!',
      [{ text: 'OK', style: 'default' }],
    );
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={[styles.title, textStyle]}>🚀 Mirror Collective</Text>
            <Text style={[styles.subtitle, textStyle]}>
              Cross-Platform Mobile App
            </Text>
          </View>

          <View style={styles.content}>
            <View
              style={[
                styles.card,
                isDarkMode ? styles.cardDark : styles.cardLight,
              ]}
            >
              <Text style={[styles.cardTitle, textStyle]}>✨ Features</Text>
              <Text style={[styles.cardText, textStyle]}>
                • Native iOS & Android Support{'\n'}• TypeScript Integration
                {'\n'}• Modern React Hooks{'\n'}• Dark & Light Mode{'\n'}• Hot
                Reload Development
              </Text>
            </View>

            <View
              style={[
                styles.card,
                isDarkMode ? styles.cardDark : styles.cardLight,
              ]}
            >
              <Text style={[styles.cardTitle, textStyle]}>🛠 Development</Text>
              <Text style={[styles.cardText, textStyle]}>
                Ready for development with all the tools you need to build
                amazing mobile experiences.
              </Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, textStyle]}>
              Built with React Native {'\n'}
              Supporting iOS & Android
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    opacity: 0.7,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardLight: {
    backgroundColor: '#F5F5F5',
  },
  cardDark: {
    backgroundColor: '#1E1E1E',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.6,
  },
});

export default App;
