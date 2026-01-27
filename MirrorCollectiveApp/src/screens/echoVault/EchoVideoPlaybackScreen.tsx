import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  EchoVideoPlayback: {
    title?: string;
  };
};

type Props = NativeStackScreenProps<RootStackParamList, 'EchoVideoPlayback'>;

const { width: W, height: H } = Dimensions.get('window');

const GOLD = '#D7C08A';
const OFFWHITE = 'rgba(253,253,249,0.92)';
const BORDER = 'rgba(253,253,249,0.16)';
const BORDER_SOFT = 'rgba(253,253,249,0.08)';
const SURFACE = 'rgba(7,9,14,0.40)';

const EchoVideoPlaybackScreen: React.FC<Props> = ({ navigation, route }) => {
  const title = route.params?.title ?? 'Brother’s Passing';
  const [playing, setPlaying] = useState(false);

  const contentWidth = useMemo(() => Math.min(W * 0.88, 360), []);
  const videoHeight = useMemo(() => Math.min(H * 0.55, 460), []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <View style={styles.root}>
        {/* Background */}
        <LinearGradient
          colors={['#05060A', '#070915', '#0B0F1A']}
          style={StyleSheet.absoluteFill}
        />

        {/* Header */}
        <View style={[styles.headerRow, { width: contentWidth }]}>
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={styles.iconText}>≡</Text>
          </TouchableOpacity>

          <View style={styles.brandWrap}>
            <View style={styles.logoCircle} />
            <View style={styles.brandTextWrap}>
              <Text style={styles.brandTop}>The</Text>
              <Text style={styles.brandMain}>MIRROR</Text>
              <Text style={styles.brandMain}>COLLECTIVE</Text>
            </View>
          </View>

          <View style={styles.headerRightSpacer} />
        </View>

        {/* Back + Title */}
        <View style={[styles.titleRow, { width: contentWidth }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle} numberOfLines={1}>
            {title}
          </Text>

          <View style={styles.titleRightSpacer} />
        </View>

        {/* Video container */}
        <View
          style={[
            styles.videoShell,
            { width: contentWidth, height: videoHeight },
          ]}
        >
          <LinearGradient
            colors={['rgba(253,253,249,0.06)', 'rgba(253,253,249,0.02)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.videoGradient}
          >
            <View style={styles.videoInnerBorder}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setPlaying(v => !v)}
              >
                <View style={styles.playOuter}>
                  <View style={styles.playInner}>
                    <Text style={styles.playIcon}>{playing ? '❚❚' : '▶'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Bottom actions */}
        <View style={[styles.actionsRow, { width: contentWidth }]}>
          <ActionIconButton label="⬇" />
          <ActionPrimaryButton label="VAULT" />
          <ActionIconButton label="✎" />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default EchoVideoPlaybackScreen;

/* ---------- Action Buttons ---------- */

const ActionIconButton = ({ label }: { label: string }) => (
  <TouchableOpacity activeOpacity={0.9} style={{ width: 64 }}>
    <LinearGradient
      colors={['rgba(253,253,249,0.10)', 'rgba(253,253,249,0.03)']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.iconBtnShell}
    >
      <View style={styles.iconBtnInner}>
        <Text style={styles.iconBtnLabel}>{label}</Text>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

const ActionPrimaryButton = ({ label }: { label: string }) => (
  <TouchableOpacity activeOpacity={0.9} style={{ flex: 1 }}>
    <LinearGradient
      colors={['rgba(253,253,249,0.10)', 'rgba(253,253,249,0.03)']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.primaryBtnShell}
    >
      <View style={styles.primaryBtnInner}>
        <Text style={styles.primaryBtnText}>{label}</Text>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#05060A' },
  root: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  },

  /* Header */
  headerRow: {
    marginTop: 10,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { color: OFFWHITE, fontSize: 24 },

  brandWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: GOLD,
  },
  brandTextWrap: { alignItems: 'center' },
  brandTop: { color: GOLD, fontSize: 10, letterSpacing: 1 },
  brandMain: { color: GOLD, fontSize: 12, letterSpacing: 2, lineHeight: 14 },
  headerRightSpacer: { width: 44 },

  /* Title */
  titleRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  backIcon: { color: GOLD, fontSize: 30 },
  screenTitle: {
    color: GOLD,
    fontSize: 26,
    letterSpacing: 1.2,
    textAlign: 'center',
    maxWidth: '78%',
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },
  titleRightSpacer: { width: 44 },

  /* Video */
  videoShell: {
    marginTop: 20,
    borderRadius: 18,
    padding: 1,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
  },
  videoGradient: { flex: 1, borderRadius: 18, padding: 1 },
  videoInnerBorder: {
    flex: 1,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  playOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(215,192,138,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    color: 'rgba(7,9,14,0.9)',
    fontSize: 28,
    marginLeft: 2,
  },

  /* Actions */
  actionsRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'space-between',
    paddingBottom: 18,
  },
  iconBtnShell: {
    width: 64,
    height: 52,
    borderRadius: 14,
    padding: 1,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.22)',
  },
  iconBtnInner: {
    flex: 1,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    backgroundColor: 'rgba(7,9,14,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnLabel: { color: GOLD, fontSize: 20 },

  primaryBtnShell: {
    height: 52,
    borderRadius: 14,
    padding: 1,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.28)',
  },
  primaryBtnInner: {
    flex: 1,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    backgroundColor: 'rgba(7,9,14,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: GOLD,
    fontSize: 18,
    letterSpacing: 1.4,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },
});
