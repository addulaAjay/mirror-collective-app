// EchoAudioPlaybackScreen.tsx
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
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  EchoAudioPlayback: {
    title?: string;
    transcript?: string;
  };
};

type Props = NativeStackScreenProps<RootStackParamList, 'EchoAudioPlayback'>;

const { width: W, height: H } = Dimensions.get('window');

const GOLD = '#D7C08A';
const OFFWHITE = 'rgba(253,253,249,0.92)';
const BORDER = 'rgba(253,253,249,0.16)';
const BORDER_SOFT = 'rgba(253,253,249,0.08)';
const SURFACE = 'rgba(7,9,14,0.36)';

const DEFAULT_TRANSCRIPT = `Today, as I watched you graduate, I felt time fold in on itself. I saw the child you once were—the small hands, the questions that never seemed to end, the way you looked to me for reassurance—and I saw the person standing before me now.`;

const EchoAudioPlaybackScreen: React.FC<Props> = ({ navigation, route }) => {
  const title = route.params?.title ?? 'Aaron’s Graduation';
  const transcript = route.params?.transcript ?? DEFAULT_TRANSCRIPT;

  const [playing, setPlaying] = useState(false);

  const contentWidth = useMemo(() => Math.min(W * 0.88, 360), []);
  const transcriptBoxH = useMemo(() => Math.min(H * 0.18, 150), []);

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
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.iconBtn}
            onPress={() => {}}
          >
            <Text style={styles.iconText}>≡</Text>
          </TouchableOpacity>

          <View style={styles.brandWrap}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoMark}>⟡</Text>
            </View>
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

        {/* Waveform */}
        <View style={styles.waveWrap}>
          <Waveform active={playing} />
        </View>

        {/* Play button */}
        <View style={styles.playWrap}>
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

        {/* Transcript preview */}
        <View
          style={[
            styles.transcriptShell,
            { width: contentWidth, height: transcriptBoxH },
          ]}
        >
          <LinearGradient
            colors={['rgba(253,253,249,0.07)', 'rgba(253,253,249,0.02)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.transcriptGradient}
          >
            <View style={styles.transcriptInnerBorder}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.transcriptPad}
              >
                <Text style={styles.transcriptText}>{transcript}</Text>
              </ScrollView>
            </View>
          </LinearGradient>
        </View>

        {/* Bottom actions */}
        <View style={[styles.actionsRow, { width: contentWidth }]}>
          <ActionIconButton label="⬇" onPress={() => {}} />
          <ActionPrimaryButton label="VAULT" onPress={() => {}} />
          <ActionIconButton label="✎" onPress={() => {}} />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default EchoAudioPlaybackScreen;

/* ---------- UI Bits ---------- */

const Waveform = ({ active }: { active: boolean }) => {
  const bars = new Array(36).fill(0).map((_, i) => {
    const base = [8, 14, 22, 30, 22, 14][i % 6];
    const bump = active ? ((i % 5) - 2) * 1.2 : 0;
    return Math.max(6, base + bump);
  });

  return (
    <View style={styles.waveRow}>
      {bars.map((h, idx) => (
        <View key={idx} style={[styles.waveBar, { height: h }]} />
      ))}
    </View>
  );
};

const ActionIconButton = ({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{ width: 64 }}
    >
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
};

const ActionPrimaryButton = ({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{ flex: 1 }}>
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
};

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#05060A' },
  root: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  },

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
  iconText: { color: OFFWHITE, fontSize: 24, opacity: 0.9 },

  brandWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(215,192,138,0.10)',
  },
  logoMark: { color: GOLD, fontSize: 16 },
  brandTextWrap: { alignItems: 'center' },
  brandTop: {
    color: 'rgba(215,192,138,0.85)',
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 1,
  },
  brandMain: {
    color: 'rgba(215,192,138,0.92)',
    fontSize: 12,
    letterSpacing: 2,
    lineHeight: 14,
  },
  headerRightSpacer: { width: 44, height: 44 },

  titleRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backIcon: { color: 'rgba(215,192,138,0.9)', fontSize: 30, marginLeft: 2 },
  screenTitle: {
    color: 'rgba(215,192,138,0.92)',
    fontSize: 26,
    letterSpacing: 1.2,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
    maxWidth: '78%',
    textAlign: 'center',
  },
  titleRightSpacer: { width: 44, height: 44 },

  waveWrap: {
    marginTop: 52,
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
  },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  waveBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(253,253,249,0.94)',
  },

  playWrap: {
    marginTop: 30,
    marginBottom: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(215,192,138,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(253,253,249,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    color: 'rgba(7,9,14,0.85)',
    fontSize: 26,
    marginLeft: 2,
  },

  transcriptShell: {
    borderRadius: 18,
    padding: 1,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    marginBottom: 18,
  },
  transcriptGradient: { flex: 1, borderRadius: 18, padding: 1 },
  transcriptInnerBorder: {
    flex: 1,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    overflow: 'hidden',
  },
  transcriptPad: { paddingHorizontal: 16, paddingVertical: 12 },
  transcriptText: {
    color: 'rgba(253,253,249,0.84)',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },

  actionsRow: {
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
  iconBtnLabel: {
    color: 'rgba(215,192,138,0.92)',
    fontSize: 20,
  },

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
    color: 'rgba(215,192,138,0.92)',
    fontSize: 18,
    letterSpacing: 1.4,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },
});
