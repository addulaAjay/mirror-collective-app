import { palette } from '@theme';
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

const SpiralSymbol = () => (
  <Svg width={80} height={80} viewBox="0 0 80 80" fill="none">
    <Defs>
      <LinearGradient
        id="spiral_paint0"
        x1="39.9989"
        y1="-0.000976563"
        x2="39.9989"
        y2="79.9974"
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor={palette.gold.dark} />
        <Stop offset="1" stopColor={palette.navy.DEFAULT} />
      </LinearGradient>
      <LinearGradient
        id="spiral_paint1"
        x1="40.2688"
        y1="14.646"
        x2="40.2688"
        y2="69.9582"
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor={palette.gold.dark} />
        <Stop offset="1" stopColor={palette.navy.DEFAULT} />
      </LinearGradient>
      <LinearGradient
        id="spiral_paint2"
        x1="42.148"
        y1="22.4292"
        x2="42.148"
        y2="58.4514"
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor={palette.gold.dark} />
        <Stop offset="1" stopColor={palette.navy.DEFAULT} />
      </LinearGradient>
      <LinearGradient
        id="spiral_paint3"
        x1="41.8017"
        y1="31.625"
        x2="41.8017"
        y2="51.9819"
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor={palette.gold.dark} />
        <Stop offset="1" stopColor={palette.navy.DEFAULT} />
      </LinearGradient>
      <LinearGradient
        id="spiral_paint4"
        x1="41.0326"
        y1="35.8364"
        x2="41.0326"
        y2="46.2245"
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor={palette.gold.dark} />
        <Stop offset="1" stopColor={palette.navy.DEFAULT} />
      </LinearGradient>
      <LinearGradient
        id="spiral_paint5"
        x1="41.2911"
        y1="39.6484"
        x2="41.2911"
        y2="42.9405"
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor={palette.gold.dark} />
        <Stop offset="1" stopColor={palette.navy.DEFAULT} />
      </LinearGradient>
      <ClipPath id="spiral_clip">
        <Rect width="80" height="80" fill="white" />
      </ClipPath>
    </Defs>
    <G clipPath="url(#spiral_clip)">
      <Path
        d="M79.9407 40.5054L78.5466 33.9149C70.9429 5.24132 34.52 -4.79442 14.4717 17.9196C-4.63999 39.5746 8.35286 73.411 35.8096 79.0215L40.5047 79.9424C22.1404 80.9442 5.63361 68.1496 1.23824 50.4879C-6.06173 21.1518 20.0383 -5.56155 49.5399 1.00142C67.638 5.02834 80.9898 21.7927 79.9407 40.5035V40.5054Z"
        fill="url(#spiral_paint0)"
      />
      <Path
        d="M40.7019 14.6739L36.3223 15.7132C18.5417 20.4027 10.5831 42.464 22.8542 56.8757C37.7362 74.352 65.6662 63.91 67.7189 41.8862C68.064 41.8408 67.9043 42.3338 67.9141 42.5724C68.3578 53.4522 61.5823 63.5491 51.6795 67.7515C39.8106 72.7881 25.7312 68.9762 18.1394 58.6288C4.50963 40.0541 17.5222 13.7037 40.6999 14.6719L40.7019 14.6739Z"
        fill="url(#spiral_paint1)"
      />
      <Path
        d="M42.0822 58.4514L46.5545 57.1065C73.8003 41.7147 40.903 8.7618 25.4828 36.0332L24.1379 40.5058V37.2519C24.1379 32.8346 29.1052 26.8948 32.8104 24.8241C48.8951 15.8395 66.802 33.8876 57.6938 49.9066C55.6883 53.4346 49.7529 58.4514 45.5331 58.4514H42.0822Z"
        fill="url(#spiral_paint2)"
      />
      <Path
        d="M31.6332 41.8883L32.9781 45.1737C42.0468 57.9447 57.9482 41.7384 45.0441 32.9096L41.8871 31.6337C50.6562 31.2826 55.0338 41.6871 49.5716 48.2896C43.5948 55.5132 31.225 51.4803 31.6352 41.8863L31.6332 41.8883Z"
        fill="url(#spiral_paint3)"
      />
      <Path
        d="M46.2214 40.7028L45.0462 38.6282C40.3728 33.6547 33.6111 40.545 38.7262 45.1458L40.7021 46.2245C36.1588 46.0865 34.2185 40.476 37.4406 37.3444C40.6409 34.2345 46.0617 36.2183 46.2214 40.7048V40.7028Z"
        fill="url(#spiral_paint4)"
      />
      <Path
        d="M40.6448 39.7582C43.6382 38.8669 43.6382 43.7221 40.6448 42.8307C39.3749 42.4521 39.3749 40.1369 40.6448 39.7582Z"
        fill="url(#spiral_paint5)"
      />
    </G>
  </Svg>
);

export default SpiralSymbol;
