/**
 * ProgressBar — MC Component Library
 * Figma: MC-Component-Library → Component 7 (node 2:2)
 *
 * Verified against the SVG exports of the Figma source:
 *
 *   Track (Line 20 etc):
 *     stroke-width: 5
 *     stroke: linear-gradient(#C59D5F → #D5BA88 → #E5D6B0)  (gold.dark → gold.mid → gold.warm)
 *     drop-shadow: stdDeviation 6, colour #E5D6B0 (gold.warm)
 *
 *   Pointer (Ellipse 736 etc):
 *     outer fill circle: r=7.88, colour #C59D5F (gold.dark)
 *     inner ring stroke: r=6.38, stroke-width 3, gradient (#E5D6B0 → #D5BA88 → #C59D5F)
 *     drop-shadow: stdDeviation 6, colour #E5D6B0
 *
 * Implemented with react-native-linear-gradient + native shadow/elevation.
 */

import { palette } from '@theme';
import React from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';


// ---------------------------------------------------------------------------
// Constants (match Figma Component 7)
// ---------------------------------------------------------------------------

const TRACK_WIDTH    = 345;   // Figma frame width
const TRACK_THICK    = 5;     // Figma stroke-width
const POINTER_SIZE   = 16;    // Figma 16×16 (radius 7.88×2)
const POINTER_RING   = 3;     // Figma inner ring stroke-width
const GLOW_BOX       = 29;    // Figma viewBox height for line+glow

// Figma palette stops — verified exact hex from the Figma inspector.
// Note: Figma's middle stop is `#D5B987` but no exact token exists yet —
// `palette.gold.mid` (#d7c08a) is within ±7 RGB per channel and visually
// indistinguishable through the strong glow halo. See visual-qa report.
const TRACK_GRADIENT   = [palette.gold.dark, palette.gold.mid, palette.gold.warm];
const POINTER_GRADIENT = [palette.gold.warm, palette.gold.mid, palette.gold.dark];
const GLOW_COLOR       = palette.gold.warm;  // #E5D6B0 — Figma drop-shadow colour

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ProgressBarProps {
  /** 0..1 — values outside this range are clamped. */
  progress?: number;
  /** Override the 345px Figma default width. */
  width?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress = 0,
  width = TRACK_WIDTH,
  style,
  testID,
}) => {
  const clamped = Math.max(0, Math.min(progress, 1));
  const pointerLeft = Math.min(
    Math.max(clamped * width - POINTER_SIZE / 2, 0),
    width - POINTER_SIZE,
  );

  return (
    <View
      style={[styles.container, { width, height: GLOW_BOX }, style]}
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      {/* Glow halo — RN shadow */}
      <View style={[styles.trackGlow, { width }]} pointerEvents="none">
        {/* The actual gradient line */}
        <LinearGradient
          colors={TRACK_GRADIENT}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.trackLine}
          pointerEvents="none"
        />
      </View>

      {/* Pointer — dark-gold core with light-to-dark gradient ring + glow */}
      <View
        style={[styles.pointerGlow, { left: pointerLeft }]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={POINTER_GRADIENT}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.pointerRing}
        >
          <View style={styles.pointerCore} />
        </LinearGradient>
      </View>
    </View>
  );
};

export default ProgressBar;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    alignItems:    'center',
    justifyContent:'center',
  },

  // Glow wrapper — shadow expands beyond bounds.
  // backgroundColor required for iOS CALayer shadow to render.
  trackGlow: {
    height:        TRACK_THICK,
    borderRadius:  TRACK_THICK / 2,
    shadowColor:   GLOW_COLOR,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius:  12,            // 2× Figma Gaussian stdDeviation 6
    elevation:     10,
  },
  trackLine: {
    width:        '100%',
    height:       TRACK_THICK,
    borderRadius: TRACK_THICK / 2,
  },

  // Pointer wrapper — extra glow beyond the 16×16.
  pointerGlow: {
    position:        'absolute',
    top:             (GLOW_BOX - POINTER_SIZE) / 2,
    width:           POINTER_SIZE,
    height:          POINTER_SIZE,
    borderRadius:    POINTER_SIZE / 2,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     GLOW_COLOR,
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   1,
    shadowRadius:    12,           // 2× Figma stdDeviation 6
    elevation:       12,
  },
  // Outer ring — gradient stroke, achieved as a gradient circle with the
  // dark core inset (POINTER_RING px of "stroke" visible around the core).
  pointerRing: {
    width:           POINTER_SIZE,
    height:          POINTER_SIZE,
    borderRadius:    POINTER_SIZE / 2,
    alignItems:      'center',
    justifyContent:  'center',
  },
  // Inner solid core — the dark gold #C59D5F (Figma fill colour).
  pointerCore: {
    width:           POINTER_SIZE - POINTER_RING * 2,
    height:          POINTER_SIZE - POINTER_RING * 2,
    borderRadius:    (POINTER_SIZE - POINTER_RING * 2) / 2,
    backgroundColor: palette.gold.dark,
  },
});
