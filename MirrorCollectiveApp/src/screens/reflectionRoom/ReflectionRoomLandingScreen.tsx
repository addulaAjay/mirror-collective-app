import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@types';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ReflectionRoomLandingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [ambientOn, setAmbientOn] = useState(false);

  return (
    <BackgroundWrapper style={styles.bg} imageStyle={styles.bgImage}>
      <SafeAreaView style={styles.safe}>
        <LogoHeader />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          

          {/* Frame 600: 345x84, HORIZONTAL, pa=CENTER, ca=CENTER
              No back button. Title centered with info icon absolutely pinned right. */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>REFLECTION ROOM</Text>
            {/* Frame 612: 24x84, vertically centered info icon */}
            <View style={styles.infoWrapper}>
              <Image
                source={require('@assets/rr-info-icon.png')}
                style={styles.infoIcon}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Frame 486: 317x300 archway illustration */}
          <View style={styles.imageContainer}>
            <Image
              source={require('@assets/reflection-room-arch-1.png')}
              style={styles.archLayer1}
              resizeMode="contain"
            />
            <Image
              source={require('@assets/reflection-room-arch-2.png')}
              style={styles.archLayer2}
              resizeMode="contain"
            />
            <Image
              source={require('@assets/reflection-room-stairs.png')}
              style={styles.stairsImage}
              resizeMode="contain"
            />
            <Image
              source={require('@assets/reflection-room-arch-3.png')}
              style={styles.archLayer3}
              resizeMode="contain"
            />
          </View>

          {/* Description: Inter 16 #fdfdf9, 317w, centered */}
          <Text style={styles.description}>
            {'Where awareness turns into real change.\nSmall moments. Real change. Over time.\nA quick reflection unlocks the room \nyou need right now.'}
          </Text>

          {/* START: Component 2 — 104x55, r=12, border=#a3b3cc 0.5 */}
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate('ReflectionRoomQuiz' as never)}
            activeOpacity={0.8}
          >
            <Text style={styles.startText}>START</Text>
          </TouchableOpacity>

          {/* Frame 95: 345x32, HORIZONTAL, gap=20, pa=CENTER — centered together */}
          <View style={styles.ambientRow}>
            <Text style={styles.ambientLabel}>Ambient Sounds</Text>
            {/* Custom toggle: 60x32, bg=#a3b3cc, r=16, border=#808fb2 1px */}
            <TouchableOpacity
              style={[styles.toggle, ambientOn && styles.toggleOn]}
              onPress={() => setAmbientOn(v => !v)}
              activeOpacity={0.9}
            >
              <View style={[styles.thumb, ambientOn && styles.thumbOn]} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </BackgroundWrapper>
  );
};

export default ReflectionRoomLandingScreen;

const CONTENT_WIDTH = Math.min(screenWidth - 40, 345);

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#0B0F1C',
  },
  bgImage: {
    resizeMode: 'cover',
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  // Frame 527: VERTICAL, gap=40, pa=SPACE_BETWEEN, ca=CENTER
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: Math.max(20, screenWidth * 0.051),
    paddingBottom: Math.max(40, screenHeight * 0.05),
    gap: 40,
  },

  // Frame 600: 345x84, title centered, info icon absolute right
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: CONTENT_WIDTH,
    height: 84,
  },
  // Title: Figma 217x84 — fixed width forces 2-line wrap, centered in row
  title: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 32,
    fontWeight: '400',
    color: '#F2E2B1',
    textAlign: 'center',
    lineHeight: 38,
    width: 217,
  },
  // Frame 612: 24x84, absolute top-right — separate from title text
  infoWrapper: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 24,
    height: 84,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIcon: {
    width: 24,
    height: 24,
  },

  // Frame 486: 317x300
  imageContainer: {
    width: 317,
    height: 300,
    position: 'relative',
  },
  archLayer1: {
    position: 'absolute',
    width: 263,
    height: 300,
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -131.5 }],
  },
  archLayer2: {
    position: 'absolute',
    width: 238,
    height: 282,
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -119 }],
  },
  archLayer3: {
    position: 'absolute',
    width: 213,
    height: 265,
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -106.5 }],
  },
  stairsImage: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -76.5 }],
    width: 183,
    height: 172,
  },

  // Description: Inter 16 #fdfdf9, 317w, centered
  description: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400',
    color: '#FDFDF9',
    textAlign: 'center',
    lineHeight: 24,
    width: 317,
  },

  // START: 104x55, r=12, border=#a3b3cc 0.5
  startButton: {
    width: 104,
    height: 55,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#a3b3cc',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 24,
    fontWeight: '400',
    color: '#F2E2B1',
    letterSpacing: 1,
  },

  // Frame 95: 345x32, HORIZONTAL, gap=20, pa=CENTER (items centered together)
  ambientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    gap: 20,
  },
  ambientLabel: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    fontWeight: '400',
    color: '#E5D6B0',
  },

  // Custom toggle: 60x32, bg=#a3b3cc, r=16, border=#808fb2 1px, padding=4
  toggle: {
    width: 60,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#a3b3cc',
    borderWidth: 1,
    borderColor: '#808fb2',
    padding: 4,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: '#c59d5f',
    borderColor: '#c59d5f',
  },
  // Thumb: Ellipse 1 — 24x24, #fdfdf9
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FDFDF9',
    alignSelf: 'flex-start',
  },
  thumbOn: {
    alignSelf: 'flex-end',
  },
});
