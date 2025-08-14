// components/ProgressBar.tsx
import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  ImageBackground,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface ProgressBarProps {
  progress?: number; // 0..1
  style?: any;
}

export default function ProgressBar({ progress = 0, style }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(progress, 1)) * 100;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.track}>
        {/* glow behind the beam */}
        {pct > 0 && (
          <View style={[styles.glowWrap, { width: `100%` }]}>
            <View style={styles.glow} />
          </View>
        )}

        {/* core beam + right tip */}
        {pct > 0 && (
          <View style={[styles.fillWrap, { width: `${pct}%` }]}>
            <View style={styles.fill} />
            <ImageBackground
              style={styles.tipGlow}
              source={require('../../assets/golden_ray.png')}
            />
          </View>
        )}

        {/* left starburst */}
        {/* <View pointerEvents="none" style={styles.starburst}>
          <View style={styles.starCore} />
          <View style={[styles.ray]} />
          <View style={[styles.ray, { transform: [{ rotate: '90deg' }] }]} />
          <View
            style={[styles.rayThin, { transform: [{ rotate: '45deg' }] }]}
          />
          <View
            style={[styles.rayThin, { transform: [{ rotate: '-45deg' }] }]}
          />
        </View> */}
      </View>
    </View>
  );
}

const TRACK_W = Math.min(screenWidth * 0.796, 313);
const TRACK_H = 9;
const BEAM_H = 6;
const TIP_SIZE = 100; // adjust for your asset
const TIP_OVERHANG = TIP_SIZE * 0.5;
const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },

  // transparent track so only the light beam shows
  track: {
    width: TRACK_W,
    height: TRACK_H,
    backgroundColor: 'transparent',
    position: 'relative',
    overflow: 'visible', // let glow/starburst bleed out
  },

  /* --- glow (fake drop-shadow) --- */
  glowWrap: {
    position: 'absolute',
    left: 0,
    height: BEAM_H,
    top: (TRACK_H - BEAM_H) / 2,
    borderRadius: 999,
  },
  glow: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: '#C59D5F',
    ...Platform.select({
      ios: {
        shadowColor: '#dcae3bff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 12,
      },
      android: {
        // elevation would be dark; keep transparent fill above to simulate bloom
      },
    }),
  },

  /* --- core beam --- */
  fillWrap: {
    position: 'absolute',
    left: 0,
    height: BEAM_H,
    top: (TRACK_H - BEAM_H) / 2,
    borderRadius: 999,
  },
  fill: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: '#C59D5F', // warm gold stroke (matches the reference)
  },

  /* --- bright rounded tip on the right --- */
  tipGlow: {
    position: 'absolute',
    right: -TIP_OVERHANG, // slight overhang beyond the beam end
    top: -(TIP_SIZE - BEAM_H) / 2, // vertically center around beam
    width: TIP_SIZE,
    height: TIP_SIZE,
    borderRadius: TIP_SIZE / 2,
    resizeMode: 'contain', // keep the sprite crisp
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#FFE9B5',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
      },
    }),
  },

  /* --- left starburst --- */
  starburst: {
    position: 'absolute',
    left: -10,
    top: (TRACK_H - 28) / 2,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF7D6',
    ...Platform.select({
      ios: {
        shadowColor: '#FFE5A8',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 14,
      },
      android: {
        borderWidth: 8,
        borderColor: 'rgba(255,236,183,0.25)', // fake halo
      },
    }),
  },
  ray: {
    position: 'absolute',
    width: 56,
    height: 3,
    borderRadius: 3,
    backgroundColor: 'rgba(255,236,183,0.55)',
  },
  rayThin: {
    position: 'absolute',
    width: 46,
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(255,236,183,0.35)',
  },
});
