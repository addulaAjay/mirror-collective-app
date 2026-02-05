// NewEchoAudioScreen.tsx
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
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@types';

type Props = NativeStackScreenProps<RootStackParamList, 'NewEchoAudioScreen'>;

const { width: W, height: H } = Dimensions.get('window');

const GOLD = '#D7C08A';
const OFFWHITE = 'rgba(253, 253, 249, 0.92)';

const SURFACE_BORDER = 'rgba(253, 253, 249, 0.18)';
const SURFACE_BORDER_2 = 'rgba(253, 253, 249, 0.08)';

const NewEchoAudioScreen: React.FC<Props> = ({ navigation }) => {
  const [isRecording, setIsRecording] = useState(false);

  const contentWidth = useMemo(() => Math.min(W * 0.88, 360), []);

  const onMicPress = () => setIsRecording(v => !v);
  const onUpload = () => {
    // TODO: open picker
  };
  const onSave = () => {
    // TODO: save recording
  };

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

        {/* Header: hamburger + centered brand */}
        <View style={[styles.headerRow, { width: contentWidth }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.iconBtn}
            onPress={() => {}}
          >
            <Text style={styles.iconText}>≡</Text>
          </TouchableOpacity>

          <View style={styles.brandWrap}>
            {/* Replace with your actual logo */}
            <View style={styles.logoCircle}>
              <Text style={styles.logoMark}>⟡</Text>
            </View>

            <View style={styles.brandTextWrap}>
              <Text style={styles.brandTop}>The</Text>
              <Text style={styles.brandMain}>MIRROR</Text>
              <Text style={styles.brandMain}>COLLECTIVE</Text>
            </View>
          </View>

          {/* spacer keeps logo centered */}
          <View style={styles.headerRightSpacer} />
        </View>

        {/* Back + title */}
        <View style={[styles.titleRow, { width: contentWidth }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>NEW ECHO</Text>

          <View style={styles.titleRightSpacer} />
        </View>

        {/* Main content */}
        <View style={[styles.content, { width: contentWidth }]}>
          {/* Waveform (centered) */}
          <View style={styles.waveWrap}>
            <Waveform active={isRecording} />
          </View>

          {/* Mic button (glow + ring) */}
          <View style={styles.micWrap}>
            <Pressable
              onPress={onMicPress}
              style={({ pressed }) => [pressed && { opacity: 0.9 }]}
            >
              <View
                style={[styles.micGlow, isRecording && styles.micGlowActive]}
              >
                <View style={styles.micOuter}>
                  <View style={styles.micInner}>
                    <Text style={styles.micIcon}>🎙️</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          </View>

          {/* Bottom buttons */}
          <View style={styles.bottomRow}>
            <PillButton label="Upload File" onPress={onUpload} />
            <PillButton label="SAVE" onPress={onSave} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

/* ---------- UI Bits ---------- */

const PillButton = ({
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
        style={styles.pillShell}
      >
        <View style={styles.pillInner}>
          <Text style={styles.pillText}>{label}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const Waveform = ({ active }: { active: boolean }) => {
  // Looks like the design’s mid-screen bars.
  // If recording, slightly "varies" heights.
  const bars = new Array(34).fill(0).map((_, i) => {
    const base = [8, 14, 22, 30, 22, 14][i % 6];
    const bump = active ? ((i % 5) - 2) * 1.5 : 0;
    return Math.max(6, base + bump);
  });

  return (
    <View style={styles.waveRow}>
      {bars.map((h, idx) => (
        <View
          key={idx}
          style={[
            styles.waveBar,
            { height: h, opacity: idx % 7 === 0 ? 0.75 : 0.95 },
          ]}
        />
      ))}
    </View>
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
  backIcon: {
    color: 'rgba(215,192,138,0.9)',
    fontSize: 30,
    marginLeft: 2,
  },
  screenTitle: {
    color: 'rgba(215,192,138,0.92)',
    fontSize: 30,
    letterSpacing: 2,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },
  titleRightSpacer: { width: 44, height: 44 },

  content: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 26,
  },

  waveWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(253,253,249,0.94)',
  },

  micWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  // Glow container (soft halo like design)
  micGlow: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(215,192,138,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.18)',
  },
  micGlowActive: {
    backgroundColor: 'rgba(215,192,138,0.10)',
    borderColor: 'rgba(215,192,138,0.28)',
  },

  // Outer ring
  micOuter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 1,
    borderColor: 'rgba(253,253,249,0.16)',
    backgroundColor: 'rgba(7,9,14,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Inner solid
  micInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: 'rgba(253,253,249,0.10)',
    backgroundColor: 'rgba(7,9,14,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIcon: { fontSize: 22 },

  bottomRow: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  pillShell: {
    borderRadius: 14,
    padding: 1,
    borderWidth: 1,
    borderColor: 'rgba(215,192,138,0.25)',
  },
  pillInner: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: SURFACE_BORDER_2,
    backgroundColor: 'rgba(7,9,14,0.28)',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    color: 'rgba(215,192,138,0.92)',
    fontSize: 16,
    letterSpacing: 1.2,
    fontFamily: Platform.select({
      ios: 'CormorantGaramond-Regular',
      android: 'serif',
    }),
  },
});

export default NewEchoAudioScreen;
