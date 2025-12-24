import React from 'react';
import Svg, {
  G,
  Path,
  Defs,
  LinearGradient,
  Stop,
  ClipPath,
  Rect,
} from 'react-native-svg';

const BrickSymbol = () => (
  <Svg width={80} height={69} viewBox="0 0 80 69" fill="none">
    <G clipPath="url(#clip0_349_1399)">
      <Path
        d="M54.2974 0L80 52.5227L60.5464 59.5714L32.0286 0H54.2974Z"
        fill="#A65E5B"
      />
      <Path
        d="M30.79 0.841309L59.092 60.2627L48.3164 68.8554L21.3684 13.891L30.79 0.841309Z"
        fill="url(#paint0_linear_349_1399)"
      />
      <Path
        d="M0 40.5303L24.13 47.8173C24.3142 54.8646 23.8524 61.9399 23.917 68.9998L0 60.0242V40.5303Z"
        fill="#7B3F45"
      />
      <Path
        d="M42.7466 61.2808L25.4319 68.8596L25.7687 47.8174L34.7779 44.7993L42.7466 61.2808Z"
        fill="url(#paint1_linear_349_1399)"
      />
      <Path
        d="M29.1281 33.1074L34.0904 43.334L25.1623 46.3591C17.5084 44.3185 9.97689 41.7955 2.33813 39.6877L29.1294 33.1074H29.1281Z"
        fill="#A65E5B"
      />
    </G>
    <Defs>
      <LinearGradient
        id="paint0_linear_349_1399"
        x1="40.2302"
        y1="0.841309"
        x2="40.2302"
        y2="68.8554"
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor="#150A0B" />
        <Stop offset="1" stopColor="#331A1D" />
      </LinearGradient>
      <LinearGradient
        id="paint1_linear_349_1399"
        x1="40.6155"
        y1="56.6782"
        x2="15.3846"
        y2="57.9076"
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor="#331A1D" />
        <Stop offset="0.5" stopColor="#66343A" />
      </LinearGradient>
      <ClipPath id="clip0_349_1399">
        <Rect width="80" height="69" fill="white" />
      </ClipPath>
    </Defs>
  </Svg>
);

export default BrickSymbol;
