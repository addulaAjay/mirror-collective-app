import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  G,
  Path,
  Defs,
  ClipPath,
  Rect,
  RadialGradient,
  Stop,
} from 'react-native-svg';

const OuterStar = () => (
  <Svg width={88} height={88} viewBox="0 0 88 88" fill="none">
    <Defs>
      <ClipPath id="outerClip">
        <Rect x={4} y={4} width={80} height={80} fill="white" />
      </ClipPath>
      <RadialGradient
        id="outerGradient"
        cx="0"
        cy="0"
        r="1"
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(44.001 43.999) scale(40.0112 39.9867)"
      >
        <Stop offset="0" stopColor="#E5D6B0" />
        <Stop offset="0.37" stopColor="#F2E1B0" />
        <Stop offset="0.54" stopColor="#E0C791" />
        <Stop offset="0.72" stopColor="#D1B075" />
        <Stop offset="0.88" stopColor="#C8A164" />
        <Stop offset="1" stopColor="#C59D5F" />
      </RadialGradient>
    </Defs>
    <G clipPath="url(#outerClip)">
      <Path
        d="M73.0103 72.6657L49.1177 52.1156L56.5197 82.7375L44.9189 53.4456L37.2347 84L40.5831 52.6734L19.5707 76.1591L37.1018 49.9767L7.57736 61.0127L35.2743 45.9725L4 42.0316L35.5196 41.576L9.65836 23.5613L37.7805 37.7986L23.2585 9.83672L41.5378 35.5023L41.6829 4L45.9328 35.2163L60.7104 7.38926L49.9578 37.0019L75.9826 19.2261L52.6909 40.4545L84 36.7996L53.5066 44.7794L82.9288 56.0871L52.2167 48.9879L73.0103 72.6657Z"
        fill="url(#outerGradient)"
      />
    </G>
  </Svg>
);

const InnerStar = () => (
  <Svg width={62} height={62} viewBox="0 0 62 62" fill="none">
    <Defs>
      <ClipPath id="innerClip">
        <Rect
          width={50.3497}
          height={50.3497}
          fill="white"
          transform="translate(13.0315) rotate(15)"
        />
      </ClipPath>
      <RadialGradient
        id="innerGradient"
        cx="0"
        cy="0"
        r="1"
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(30.8336 30.8323) rotate(15) scale(25.1819 25.1665)"
      >
        <Stop offset="0" stopColor="#E5D6B0" />
        <Stop offset="0.37" stopColor="#F2E1B0" />
        <Stop offset="0.54" stopColor="#E0C791" />
        <Stop offset="0.72" stopColor="#D1B075" />
        <Stop offset="0.88" stopColor="#C8A164" />
        <Stop offset="1" stopColor="#C59D5F" />
      </RadialGradient>
    </Defs>
    <G clipPath="url(#innerClip)">
      <Path
        d="M43.7995 52.985L32.622 36.6001L32.1338 56.4217L29.8528 36.7247L20.2043 54.0478L27.3428 35.549L10.7431 46.4038L25.6657 33.3425L5.91927 35.2423L25.2069 30.6106L6.83639 23.1204L26.0722 27.9778L13.285 12.8135L28.062 26.0497L23.7885 6.68537L30.7202 25.2658L35.9399 6.1383L33.4386 25.8078L46.9551 11.2982L35.5947 27.5489L54.3114 20.9819L36.6938 30.0931L56.3228 32.9712L36.4852 32.8552L52.5298 44.5221L35.0155 35.2035L43.7995 52.985Z"
        fill="url(#innerGradient)"
      />
    </G>
  </Svg>
);

const CoreStar = () => (
  <Svg width={51} height={51} viewBox="0 0 51 51" fill="none">
    <Defs>
      <RadialGradient
        id="coreGradient"
        cx="0"
        cy="0"
        r="1"
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(24.9144 24.6942) rotate(15) scale(25.1819 25.1665)"
      >
        <Stop offset="0" stopColor="#E5D6B0" />
        <Stop offset="0.37" stopColor="#F2E1B0" />
        <Stop offset="0.54" stopColor="#E0C791" />
        <Stop offset="0.72" stopColor="#D1B075" />
        <Stop offset="0.88" stopColor="#C8A164" />
        <Stop offset="1" stopColor="#C59D5F" />
      </RadialGradient>
    </Defs>
    <Path
      d="M37.8803 46.8468L26.7028 30.462L26.2146 50.2835L23.9336 30.5865L14.2851 47.9096L21.4236 29.4108L4.82391 40.2656L19.7465 27.2043L0.0000845704 29.1041L19.2877 24.4724L0.917205 16.9822L20.153 21.8396L7.36577 6.67534L22.1428 19.9115L17.8693 0.547188L24.801 19.1276L30.0207 0.00011141L27.5194 19.6696L41.0359 5.15998L29.6755 21.4108L48.3922 14.8437L30.7746 23.9549L50.4036 26.833L30.566 26.717L46.6106 38.384L29.0963 29.0653L37.8803 46.8468Z"
      fill="url(#coreGradient)"
    />
  </Svg>
);

export const StarSymbol = () => (
  <View style={styles.wrapper}>
    <View style={styles.outerLayer}>
      <OuterStar />
    </View>
    <View style={styles.innerLayer}>
      <InnerStar />
    </View>
    <View style={styles.coreLayer}>
      <CoreStar />
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(229,214,176,0.5)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 9,
    elevation: 9,
  },
  innerLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coreLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
