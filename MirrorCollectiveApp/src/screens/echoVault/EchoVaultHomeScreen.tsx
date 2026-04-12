import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { palette, spacing, shadows } from '@theme';
import type { RootStackParamList } from '@types';
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';

type MirrorEchoNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MirrorEchoVaultHome'
>;

const COPY =
  'Become the architect of your own story.\n' +
  'Save what you’ve learned, loved, and lived \n' +
  '— in a private vault that’s yours.';

export function MirrorEchoContent() {
  const navigation = useNavigation<MirrorEchoNavigationProp>();
  const { width } = useWindowDimensions();
  const [showInfoOverlay, setShowInfoOverlay] = React.useState(false);

  const scale = useMemo(() => {
    const baseW = 390;
    const s = width / baseW;
    return Math.max(0.9, Math.min(1.12, s));
  }, [width]);

  const cardMaxWidth = useMemo(
    () => Math.min(width - spacing.l * 2, 440),
    [width],
  );

  const buttonHeight = useMemo(() => {
    const h = 52 * scale;
    return Math.max(48, Math.min(58, h));
  }, [scale]);

  const buttonWidth = useMemo(() => {
    const w = cardMaxWidth * 0.78;
    return Math.max(220, Math.min(320, w));
  }, [cardMaxWidth]);

  const handleInfo = () => {
    setShowInfoOverlay(true);
  };

  const handleStartEcho = () => {
    navigation.navigate('NewEchoScreen');
  };

  const handleViewVault = () => {
    navigation.navigate('MirrorEchoVaultLibrary');
  };

  return (
    <BackgroundWrapper style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        />

        <LogoHeader navigation={navigation} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces
        >
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
        </ScrollView>

        {/* Info Overlay Modal */}
        <Modal
          visible={showInfoOverlay}
          transparent
          animationType="fade"
          onRequestClose={() => setShowInfoOverlay(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Text style={styles.infoTitle}>MIRROR ECHO</Text>
                <TouchableOpacity
                  onPress={() => setShowInfoOverlay(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.infoScroll}
                contentContainerStyle={styles.infoScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.infoSectionTitle}>What is Mirror Echo?</Text>
                <Text style={styles.infoText}>
                  Mirror Echo is a secure digital vault where you can preserve your most meaningful memories,
                  reflections, and messages for the future. Create echoes in text, audio, or video format.
                </Text>

                <Text style={styles.infoSectionTitle}>Key Features</Text>
                <Text style={styles.infoText}>
                  • <Text style={styles.infoBold}>Personal Vault:</Text> Keep echoes private for your own reflection{'\n'}
                  • <Text style={styles.infoBold}>Recipients:</Text> Designate trusted people to receive your echoes{'\n'}
                  • <Text style={styles.infoBold}>Guardians:</Text> Assign someone to manage when echoes are released{'\n'}
                  • <Text style={styles.infoBold}>Lock Dates:</Text> Schedule echoes to unlock at specific times{'\n'}
                  • <Text style={styles.infoBold}>Legacy Mode:</Text> Preserve messages to be delivered after you pass
                </Text>

                <Text style={styles.infoSectionTitle}>Privacy & Security</Text>
                <Text style={styles.infoText}>
                  All echoes are encrypted and stored securely. Only you and your designated recipients
                  can access the content. Guardians can manage release timing but cannot view echo content
                  unless they are also listed as recipients.
                </Text>

                <Text style={styles.infoSectionTitle}>Getting Started</Text>
                <Text style={styles.infoText}>
                  1. Click "START ECHO" to create your first echo{'\n'}
                  2. Choose a category and type (text, audio, or video){'\n'}
                  3. Optionally select a recipient and guardian{'\n'}
                  4. Compose your echo and save it to your vault
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </BackgroundWrapper>
  );
}

export default function MirrorEchoScreen() {
  return <MirrorEchoContent />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },

  background: {
    flex: 1,
    justifyContent: 'flex-start',
  },

  scroll: {
    flex: 1,
    width: '100%',
    paddingHorizontal: spacing.l,
  },

  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 24 : 18,
  },

  card: {
    width: '100%',
    borderRadius: spacing.m,
    paddingHorizontal: spacing.l,
    paddingTop: 10,
    paddingBottom: spacing.l,
    alignSelf: 'center',
    ...shadows.LIGHT,
  },

  titleRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 10,
    marginTop: 30, // Consistent with other title rows
  },

  title: {
    color: palette.gold.DEFAULT,
    letterSpacing: 0.3,
    fontFamily: 'CormorantGaramond-Regular',
    fontWeight: '400',
    textAlign: 'center',
    textShadowColor: palette.gold.warm,
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
    shadowColor: palette.gold.warm,
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
    fontFamily: 'Inter-Light',
    fontWeight: '300',
    color: palette.gold.subtlest,
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
    ...Platform.select({
      ios: {
        shadowColor: palette.neutral.black,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
        elevation: 6,
      },
      android: {
        boxShadow: '2px 2px 32px 0px rgba(242, 226, 177, 0.20)',
      },
    }),
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
    fontSize: 24,
    fontStyle: 'normal',
    fontWeight: '400',
    color: palette.gold.DEFAULT,
    textAlign: 'center',
    lineHeight: 31.2,
    textShadowColor: 'rgba(229, 214, 176, 0.50)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 9,
    includeFontPadding: false,
  },

  /* Info Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 28, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
  },

  infoCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    backgroundColor: 'rgba(21, 28, 47, 0.95)',
    borderRadius: spacing.m,
    borderWidth: 1,
    borderColor: 'rgba(229, 214, 176, 0.25)',
    padding: spacing.l,
    ...shadows.LIGHT,
  },

  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
    paddingBottom: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 214, 176, 0.15)',
  },

  infoTitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 24,
    color: palette.gold.DEFAULT,
    letterSpacing: 1.2,
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(253, 253, 249, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(229, 214, 176, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  closeButtonText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 20,
    color: 'rgba(242, 226, 177, 0.85)',
    lineHeight: 22,
  },

  infoScroll: {
    flex: 1,
  },

  infoScrollContent: {
    paddingBottom: spacing.s,
  },

  infoSectionTitle: {
    fontFamily: 'CormorantGaramond-Medium',
    fontSize: 18,
    color: palette.gold.mid,
    letterSpacing: 0.8,
    marginTop: spacing.m,
    marginBottom: spacing.xs,
  },

  infoText: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: 15,
    color: 'rgba(253, 253, 249, 0.85)',
    lineHeight: 22,
    marginBottom: spacing.xs,
  },

  infoBold: {
    fontFamily: 'CormorantGaramond-Medium',
    color: palette.gold.mid,
  },
});
