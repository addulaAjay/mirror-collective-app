import { palette } from '@theme';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
} from 'react-native-svg';

export const StarSymbol = () => (
  <View style={styles.wrapper}>
    <Svg width={120} height={120} viewBox="0 0 120 120" fill="none">
      <Defs>
        {/* Circle background gradient */}
        <LinearGradient
          id="circleGradient"
          x1="120"
          y1="60"
          x2="0"
          y2="60"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={palette.neutral.inputBg} stopOpacity="0" />
          <Stop offset="1" stopColor={palette.neutral.black} stopOpacity="1" />
        </LinearGradient>

        {/* Outer star gradient */}
        <LinearGradient
          id="outerStarGradient"
          x1="60.75"
          y1="18"
          x2="60.75"
          y2="102.5"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={palette.gold.dark} />
          <Stop offset="1" stopColor={palette.navy.DEFAULT} />
        </LinearGradient>

        {/* Inner star radial gradient */}
        <RadialGradient
          id="innerStarGradient"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(60.7638 60.2639) rotate(105) scale(26.591)"
        >
          <Stop offset="0" stopColor={palette.gold.dark} />
          <Stop offset="1" stopColor={palette.navy.DEFAULT} />
        </RadialGradient>
      </Defs>

      {/* Circle background */}
      <Path
        d="M60 119.875C26.9319 119.875 0.125002 93.068 0.125005 60C0.12501 26.9319 26.932 0.124992 60 0.124995C93.0681 0.125 119.875 26.932 119.875 60C119.875 93.068 93.068 119.875 60 119.875Z"
        fill="url(#circleGradient)"
        fillOpacity="0.05"
        stroke={palette.navy.muted}
        strokeWidth="0.25"
      />

      {/* Outer star */}
      <Path
        d="M91.3922 90.5281L66.1555 68.8221L73.974 101.166L61.7206 70.2269L53.6042 102.5L57.1409 69.4112L34.9466 94.2181L53.4638 66.5628L22.2786 78.2197L51.5335 62.3334L18.5 58.1709L51.7926 57.6897L24.4766 38.6616L54.1807 53.6998L38.8418 24.165L58.1493 51.2743L58.3026 18L62.7915 50.9722L78.4003 21.5799L67.043 52.8582L94.5316 34.0826L69.9298 56.505L103 52.6446L70.7913 61.0732L101.869 73.017L69.4289 65.5184L91.3922 90.5281Z"
        fill="url(#outerStarGradient)"
      />

      {/* Inner star */}
      <Path
        d="M74.4599 83.6622L62.6537 66.3557L62.138 87.2922L59.7287 66.4872L49.5374 84.7848L57.0775 65.2454L39.5441 76.7108L55.306 62.9148L34.4489 64.9214L54.8215 60.0292L35.4176 52.1177L55.7354 57.2483L42.2289 41.2311L57.8371 55.2118L53.3232 34.7582L60.6448 54.3837L66.1582 34.1804L63.5162 54.9563L77.793 39.6305L65.7936 56.7953L85.5631 49.8589L66.9545 59.4826L87.6876 62.5226L66.7341 62.4L83.6812 74.7233L65.1818 64.8805L74.4599 83.6622Z"
        fill="url(#innerStarGradient)"
      />
    </Svg>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
