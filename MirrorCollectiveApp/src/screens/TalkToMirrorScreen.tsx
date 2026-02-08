import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StarIcon from '@components/StarIcon';
import { useUser } from '@context/UserContext';
import type { RootStackParamList } from '@types';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TalkToMirror'>;
}

const ARCHETYPE_IMAGE = require('@assets/flamebearer-archetype.png');

const MENU_OPTIONS = [
  'CODE LIBRARY',
  'MIRROR ECHO',
  'REFLECTION ROOM',
  'ECHO MAP',
  'MIRROR PLEDGE',
];

const TalkToMirrorScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useUser();
  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Friend';

  const handleTalkPress = () => {
    navigation.navigate('MirrorChat');
  };

  const handleMenuPress = (label: string) => {
    switch (label) {
      case 'MIRROR ECHO':
        navigation.navigate('MirrorEchoVaultHome');
        break;
      case 'CODE LIBRARY':
        navigation.navigate('MirrorCodeLibrary');
        break;
      case 'REFLECTION ROOM':
        navigation.navigate('ReflectionRoom');
        break;
      case 'MIRROR PLEDGE':
        navigation.navigate('TheMirrorPledge');
        break;
      default:
        Alert.alert('Coming Soon', `${label} will be available shortly.`);
    }
  };

  return (
    <BackgroundWrapper style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />
        <LogoHeader />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          <Text style={styles.greeting}>Welcome back, {firstName}</Text>

          <View style={styles.heroWrapper}>
            <Image
              source={ARCHETYPE_IMAGE}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>

          <TouchableOpacity
            style={styles.talkButton}
            onPress={handleTalkPress}
            activeOpacity={0.85}
          >
            <StarIcon width={24} height={24} />
            <Text style={styles.talkLabel}>TALK TO MIRROR</Text>
            <StarIcon width={24} height={24} />
          </TouchableOpacity>

          <View style={styles.menuGrid}>
            {MENU_OPTIONS.map((option, index) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.menuCard,
                  index === MENU_OPTIONS.length - 1 && styles.menuCardFull,
                ]}
                activeOpacity={0.85}
                onPress={() => handleMenuPress(option)}
              >
                <Text style={styles.menuText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  safe: {
    flex: 1,
    width: '100%',
    backgroundColor: 'transparent',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(253, 253, 249, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLine: {
    width: 16,
    height: 2,
    backgroundColor: '#F8EED4',
    marginVertical: 2,
  },
  menuLineShort: {
    width: 12,
  },
  greeting: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 28,
    color: '#F4EFE4',
    textAlign: 'center',
    marginTop: 20, // Reduced from 80 for better consistency
  },
  heroWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: 280,
    height: 360,
  },
  talkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  talkLabel: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 32,
    letterSpacing: 2,
    color: '#F2E2B1',
  },
  menuGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 32,
  },
  menuCard: {
    width: '47%',
    minHeight: 88,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#A3B3CC',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(163, 179, 204, 0.08)',
  },
  menuCardFull: {
    width: '100%',
    minHeight: 80,
    paddingVertical: 20,
  },
  menuText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    letterSpacing: 1,
    color: '#F2E2B1',
    textAlign: 'center',
    lineHeight: 24,
    width: '100%',
  },
});

export default TalkToMirrorScreen;
