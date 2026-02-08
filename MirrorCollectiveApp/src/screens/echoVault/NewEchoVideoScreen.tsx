import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import BackgroundWrapper from '@components/BackgroundWrapper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@types';
import LogoHeader from '@components/LogoHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'NewEchoVideoScreen'>;

const { width } = Dimensions.get('window');

const GOLD = '#D7C08A';
const OFFWHITE = 'rgba(253,253,249,0.92)';

const NewEchoVideoScreen: React.FC<Props> = ({ navigation }) => {
  const contentWidth = Math.min(width * 0.88, 360);

  return (
    <BackgroundWrapper style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />

        {/* Header */}
        <LogoHeader navigation={navigation} />

        {/* Title Row */}
        <View style={[styles.titleRow, { width: contentWidth }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={styles.title}>For Alia</Text>

          <View style={{ width: 24 }} />
        </View>

        {/* Video Box */}
        <View style={[styles.videoOuter, { width: contentWidth }]}>
          <View style={styles.videoInner}>
            <View style={styles.videoButtonGlow}>
              <View style={styles.videoButton}>
                <Text style={styles.videoIcon}>📹</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Save */}
        <TouchableOpacity style={styles.saveWrap}>
          <View style={styles.saveButton}>
            <Text style={styles.saveText}>SAVE</Text>
          </View>
        </TouchableOpacity>
      </SafeAreaView>
    </BackgroundWrapper>
  );
}

export default NewEchoVideoScreen;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  root: {
    flex: 1,
    alignItems: 'center',
  },

  /* Header */
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  iconText: {
    color: OFFWHITE,
    fontSize: 22,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GOLD,
  },
  brandSmall: {
    color: GOLD,
    fontSize: 10,
    letterSpacing: 1,
  },
  brandText: {
    color: GOLD,
    fontSize: 12,
    letterSpacing: 2,
    lineHeight: 14,
  },

  /* Title */
  titleRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backArrow: {
    fontSize: 22,
    color: GOLD,
  },
  title: {
    fontSize: 26,
    color: GOLD,
    letterSpacing: 1.5,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },

  /* Video box */
  videoOuter: {
    marginTop: 24,
    borderRadius: 22,
    padding: 1,
    borderWidth: 1,
    borderColor: 'rgba(253,253,249,0.12)',
  },
  videoInner: {
    height: 420,
    borderRadius: 21,
    backgroundColor: 'rgba(7,9,14,0.45)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },

  /* Video button */
  videoButtonGlow: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(215,192,138,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(7,9,14,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoIcon: {
    fontSize: 22,
    color: GOLD,
  },

  /* Save */
  saveWrap: {
    marginTop: 18,
  },
  saveButton: {
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.4)',
    backgroundColor: 'rgba(7,9,14,0.4)',
  },
  saveText: {
    color: GOLD,
    fontSize: 18,
    letterSpacing: 1.5,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },
});
