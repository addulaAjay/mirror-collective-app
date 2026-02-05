import {
  COLORS,
  SHADOWS,
  SPACING,
  SCREEN_DIMENSIONS,
  PLATFORM_SPECIFIC,
} from '@constants';
import { theme } from '@theme';
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  Platform,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@types';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';

type MirrorEchoNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MirrorEchoVaultHome'
>;

const COPY =
  'Preserve your legacy in the Echo Vault —\n' +
  'a secure space to create and save your most\n' +
  'meaningful memories, reflections, and\n' +
  'moments that matter. A living record, kept\n' +
  'for yourself or gifted to someone you love';

export function MirrorEchoContent() {
  const navigation = useNavigation<MirrorEchoNavigationProp>();
  const { width, height } = useWindowDimensions();

  const scale = useMemo(() => {
    const baseW = 390;
    const s = width / baseW;
    return Math.max(0.9, Math.min(1.12, s));
  }, [width]);

  const cardMaxWidth = useMemo(
    () => Math.min(width - SPACING.XL * 2, 440),
    [width],
  );

  const titleFontSize = useMemo(() => {
    const size = 36 * scale;
    return Math.max(30, Math.min(44, size));
  }, [scale]);

  const copyFontSize = useMemo(() => {
    const size = 18 * scale;
    return Math.max(16, Math.min(20, size));
  }, [scale]);

  const buttonHeight = useMemo(() => {
    const h = 52 * scale;
    return Math.max(48, Math.min(58, h));
  }, [scale]);

  const buttonWidth = useMemo(() => {
    const w = cardMaxWidth * 0.78;
    return Math.max(220, Math.min(320, w));
  }, [cardMaxWidth]);

  const imageHeight = useMemo(() => {
    const h = height * 0.46;
    return Math.max(260, Math.min(520, h));
  }, [height]);

  const handleMenu = () => {
    (navigation as any)?.openDrawer?.();
  };

  const handleInfo = () => {
    // navigation.navigate('MirrorEchoInfo' as any); // TODO: Add Info Screen
  };

  const handleStartEcho = () => {
    navigation.navigate('NewEchoScreen');
  };

  const handleViewVault = () => {
    navigation.navigate('MirrorEchoVaultLibrary');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <BackgroundWrapper style={styles.background}>
        <View style={styles.topRow}>
          <TouchableOpacity
            onPress={handleMenu}
            activeOpacity={0.85}
            style={styles.iconButton}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>

          <View style={styles.logoWrap}>
            <LogoHeader />
          </View>

          <View style={styles.iconSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces
        >
          {/* <LinearGradient
            colors={['rgba(155, 170, 194, 0.01)', 'rgba(155, 170, 194, 0.18)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.gradientWrapper, { maxWidth: cardMaxWidth }]}
          > */}
          <View style={[styles.card]}>
            <View style={styles.titleRow}>
              <Text style={[styles.title]}>MIRROR ECHO</Text>

              <TouchableOpacity
                onPress={handleInfo}
                activeOpacity={0.85}
                style={styles.infoButton}
              >
                <Text style={styles.infoIcon}>i</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.imageContainer}>
              <Image
                testID="mirror-echo-image"
                source={require('../../assets/mirror_echo_map.png')}
                style={[styles.echoImage]}
                resizeMode="contain"
              />
            </View>

            <View style={styles.copyWrap}>
              <Text style={[styles.copyText]}>{COPY}</Text>
            </View>

            <View style={styles.ctaWrap}>
              <TouchableOpacity
                onPress={handleStartEcho}
                activeOpacity={0.9}
                style={[
                  styles.primaryButton,
                  { width: buttonWidth, height: buttonHeight },
                ]}
              >
                <Text style={styles.ctaText}>START ECHO</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleViewVault}
                activeOpacity={0.9}
                style={[
                  styles.secondaryButton,
                  { width: buttonWidth, height: buttonHeight },
                ]}
              >
                <Text style={styles.ctaText}>VIEW VAULT</Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* </LinearGradient> */}
        </ScrollView>
      </BackgroundWrapper>
    </SafeAreaView>
  );
}

export default function MirrorEchoScreen() {
  return <MirrorEchoContent />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.PRIMARY,
    paddingTop: PLATFORM_SPECIFIC.STATUS_BAR_HEIGHT,
  },

  background: {
    flex: 1,
    paddingHorizontal: SPACING.XL,
    justifyContent: 'flex-start',
  },

  topRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
  },

  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuIcon: {
    color: 'rgba(253,253,249,0.92)',
    fontSize: 22,
    marginTop: -1,
  },

  logoWrap: {
    flex: 1,
    alignItems: 'center',
  },

  iconSpacer: {
    width: 44,
    height: 44,
  },

  scroll: {
    flex: 1,
    width: '100%',
    marginTop: 14,
  },

  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 24 : 18,
  },

  gradientWrapper: {
    width: '100%',
    borderRadius: SPACING.XL,
    alignSelf: 'center',
  },

  card: {
    width: '100%',
    borderRadius: SPACING.LG,
    paddingHorizontal: SPACING.XL,
    paddingTop: 80,
    paddingBottom: SPACING.XL,
    alignSelf: 'center',
    ...SHADOWS.LIGHT,
  },

  titleRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 10,
  },

  title: {
    color: '#F5E6B8',
    letterSpacing: 0.3,
    fontFamily: 'CormorantGaramond-Regular',
    fontWeight: '400',
    textAlign: 'center',
    textShadowColor: '#E5D6B0',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    paddingRight: 38,
    lineHeight: 28,
    fontSize: 28,
  },

  infoButton: {
    position: 'absolute',
    right: 0,
    top: 10,
    width: 18,
    height: 18,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(229,214,176,0.65)',
    backgroundColor: 'rgba(11,15,28,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoIcon: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 12,
    color: 'rgba(229,214,176,0.95)',
    lineHeight: 20,
    marginTop: -1,
  },

  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
  },

  echoImage: {
    alignSelf: 'center',
    maxWidth: 300,
    shadowColor: '#E5D6B0',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 40,
  },

  copyWrap: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 16,
  },

  copyText: {
    fontFamily: 'CormorantGaramond-Light',
    fontWeight: '300',
    color: '#FDFDF9',
    textAlign: 'center',
    fontSize: 16,
  },

  ctaWrap: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
    paddingTop: 6,
  },

  primaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(229,214,176,0.7)',
    backgroundColor: 'rgba(253,253,249,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },

  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(229,214,176,0.45)',
    backgroundColor: 'rgba(253,253,249,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  ctaText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    fontWeight: '400',
    color: 'rgba(242,226,177,0.95)',
    letterSpacing: 1.6,
  },
});
