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
  ScrollView,
  useWindowDimensions,
  Platform,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@types';

import BackgroundWrapper from '@components/BackgroundWrapper';
import LogoHeader from '@components/LogoHeader';

type EchoLibraryNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'EchoLibrary'
>;

type EchoItem = {
  id: string;
  title: string;
  subtitle: string;
  image: any;
  recipient: string;
};

const MOCK_ECHOS: EchoItem[] = [
  {
    id: '1',
    title: 'Voice of Becoming',
    subtitle: 'Saved Feb 16th, 2025',
    recipient: 'SARAH',
  },
  {
    id: '2',
    title: 'Brother’s Passing',
    subtitle: 'Unlocks May 24th, 2025',
    recipient: 'REBECCA',
  },
  {
    id: '3',
    title: 'Message to My Son',
    subtitle: 'Unlocks Jun 16th, 2025',
    recipient: 'JAMES',
  },
  {
    id: '4',
    title: 'Aaron’s Graduation',
    subtitle: 'Unlocks Jul 9th, 2025',
    recipient: 'AARON',
  },
];

export function EchoLibraryContent() {
  const navigation = useNavigation<EchoLibraryNavigationProp>();
  const { width } = useWindowDimensions();

  const cardMaxWidth = useMemo(
    () => Math.min(width - SPACING.XL * 2, 440),
    [width],
  );

  const handleMenu = () => {
    (navigation as any)?.openDrawer?.();
  };

  const handleCreateEcho = () => {
    navigation.navigate('EchoCreate' as any);
  };

  const handleOpenItem = (id: string) => {
    navigation.navigate('EchoDetail' as any, { id });
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
          <TouchableOpacity onPress={handleMenu} style={styles.iconButton}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>

          <View style={styles.logoWrap}>
            <LogoHeader containerStyle={styles.inlineLogoHeader} />
          </View>

          <View style={styles.iconSpacer} />
        </View>

        <View style={styles.contentWrapper}>
          <Text style={styles.title}>MY ECHO LIBRARY</Text>

          <Text style={styles.subtitle}>
            Preserve echoes that hold meaning beyond{'\n'}the present moment.
          </Text>

          <View style={styles.inboxRow}>
            <View style={styles.inboxIconBox}>
              <Image
                source={require('../../assets/mail.png')}
                style={styles.inboxIconImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.inboxText}>Echo Inbox</Text>
          </View>

          <LinearGradient
            colors={['rgba(155, 170, 194, 0.01)', 'rgba(155, 170, 194, 0.18)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.gradientWrapper, { maxWidth: cardMaxWidth }]}
          >
            <View style={[styles.card, { maxWidth: cardMaxWidth }]}>
              <View style={styles.tableHeader}>
                <Text style={styles.headerLeft}>RECIPIENT</Text>
                <Text style={styles.headerRight}>CATEGORY</Text>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
              >
                {MOCK_ECHOS.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.9}
                    onPress={() => handleOpenItem(item.id)}
                    style={styles.row}
                  >
                    <View style={styles.rowLeft}>
                      <View style={styles.avatar}>
                        <Image source={require('../../assets/Group.png')} />
                      </View>
                      <View style={styles.rowTextWrap}>
                        <Text style={styles.rowTitle}>{item.title}</Text>
                        <Text style={styles.rowSub}>{item.subtitle}</Text>
                      </View>
                    </View>

                    <View style={styles.rowRight}>
                      <Text style={styles.recipientText}>{item.recipient}</Text>
                      <View style={styles.smallInfoCircle}>
                        <Text style={styles.smallInfoText}>i</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </LinearGradient>

          <TouchableOpacity
            onPress={handleCreateEcho}
            activeOpacity={0.9}
            style={styles.createButton}
          >
            <Text style={styles.createText}>CREATE AN ECHO</Text>
          </TouchableOpacity>
        </View>
      </BackgroundWrapper>
    </SafeAreaView>
  );
}

export default function MirrorEchoVaultLibraryScreen() {
  return <EchoLibraryContent />;
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
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 44,
  },

  inlineLogoHeader: {
    position: 'relative',
    top: 0,
  },

  iconSpacer: {
    width: 44,
    height: 44,
  },

  contentWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 18 : 12,
  },

  title: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 28,
    color: '#F2E2B1',
    textAlign: 'center',
    letterSpacing: 1.2,
    textShadowColor: COLORS.TEXT.TITLE,
    textShadowRadius: 8,
  },

  subtitle: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
    opacity: 0.9,
  },

  inboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
    marginBottom: 14,
  },

  inboxIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  inboxIcon: {
    color: 'rgba(242,226,177,0.9)',
    fontSize: 14,
    marginTop: -1,
  },

  inboxIconImage: {
    width: 14,
    height: 14,
    tintColor: 'rgba(242,226,177,0.9)',
  },

  inboxText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 25,
    lineHeight: 25,
    color: '#F2E2B1',
    letterSpacing: 0.6,
  },

  gradientWrapper: {
    width: '100%',
    borderRadius: SPACING.XL,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(229,214,176,0.18)',
  },

  card: {
    width: '100%',
    borderRadius: SPACING.LG,
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.LG,
    paddingBottom: SPACING.LG,
    alignSelf: 'center',
    ...SHADOWS.LIGHT,
    backgroundColor: 'rgba(12,17,31,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(229,214,176,0.12)',
    minHeight: SCREEN_DIMENSIONS.HEIGHT * 0.48,
    maxHeight: SCREEN_DIMENSIONS.HEIGHT * 0.56,
  },

  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229,214,176,0.12)',
  },

  headerLeft: {
    flex: 1,
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    letterSpacing: 1.2,
    color: '#FFFFFF',
    textAlign: 'center',
  },

  headerRight: {
    flex: 1,
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    letterSpacing: 1.2,
    color: '#FFFFFF',
    textAlign: 'center',
  },

  listContent: {
    paddingTop: 10,
    paddingBottom: 6,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229,214,176,0.12)',
  },

  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 10,
  },

  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(229,214,176,0.75)',
    backgroundColor: 'rgba(229,214,176,0.1)',
  },

  rowTextWrap: {
    flex: 1,
  },

  rowTitle: {
    fontFamily: 'CormorantGaramond-Bold',
    fontSize: 14,
    color: 'rgba(253,253,249,0.92)',
  },

  rowSub: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 14,
    color: 'rgba(253,253,249,0.55)',
    marginTop: 2,
  },

  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  recipientText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 12,
    letterSpacing: 1.2,
    color: 'rgba(242,226,177,0.7)',
  },

  smallInfoCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(229,214,176,0.55)',
    backgroundColor: 'rgba(9,14,28,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  smallInfoText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 12,
    color: 'rgba(229,214,176,0.9)',
    marginTop: -1,
  },

  createButton: {
    width: '72%',
    maxWidth: 320,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(229,214,176,0.55)',
    backgroundColor: 'rgba(12,18,32,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },

  createText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 18,
    fontWeight: '400',
    color: 'rgba(242,226,177,0.95)',
    letterSpacing: 1.6,
  },
});
