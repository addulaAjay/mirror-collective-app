import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import type { RootStackParamList } from '@types';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AppVideo'>;
}

const AppVideoScreen: React.FC<Props> = ({ navigation }) => {
  const handleVideoPress = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'EmailConfirmation' }],
    });
  }, [navigation]);

  return (
    <BackgroundWrapper style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />

        <View style={styles.content}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.videoStage}
            onPress={handleVideoPress}
            accessibilityRole="button"
          >
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoTitle}>App explainer </Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#090E1A',
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    width: '100%',
  },
  content: {
    width: '100%',
    marginTop: 24,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 42,
  },
  videoStage: {
    width: 345,
    height: 670,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    paddingHorizontal: 70,
    paddingVertical: 236,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  videoPlaceholder: {
    width: 205,
    height: 198,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTitle: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
  },
});

export default AppVideoScreen;
