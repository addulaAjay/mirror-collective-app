/**
 * Mirror Pledge category icon — full-circle SVG (100×100) matching the
 * style of the Figma-exported category icons (translucent fill + navy.light
 * ring stroke, gold pledge motif inside).
 *
 * NOTE: The Figma source vector for this icon (4326:2384 / imgGroup14) was
 * not exported to disk because src/assets/talk-to-mirror isn't on the
 * Dev Mode MCP allowlist, and the node renders blank in isolation due to its
 * clip-path structure. Hand-rolled approximation in the same visual style as
 * the other category icons. Replace with the exported asset once available.
 */
import React from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { palette } from '@theme';

interface Props {
  size?: number;
  /** Icon stroke colour. Defaults to gold. */
  color?: string;
}

const MirrorPledgeIcon: React.FC<Props> = ({
  size = 100,
  color = palette.gold.DEFAULT,
}) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <Defs>
      <LinearGradient id="mp-bg" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor={palette.gold.subtlest} stopOpacity={0.05} />
        <Stop offset="1" stopColor={palette.gold.subtlest} stopOpacity={0} />
      </LinearGradient>
    </Defs>

    {/* Ring — same translucent fill + navy.light stroke as other category SVGs */}
    <Circle
      cx={50}
      cy={50}
      r={49.9}
      fill="url(#mp-bg)"
      stroke={palette.navy.light}
      strokeWidth={0.21}
    />

    {/* Light/star above hand */}
    <Circle cx={50} cy={32} r={4.5} fill={color} opacity={0.9} />
    <Path
      d="M 50 22 L 50 42 M 40 32 L 60 32 M 43 25 L 57 39 M 57 25 L 43 39"
      stroke={color}
      strokeWidth={0.7}
      opacity={0.45}
    />

    {/* Open palm — stylized */}
    <Path
      d="M 35 75
         L 35 50
         Q 35 46 38.5 46
         Q 42 46 42 50
         L 42 44
         Q 42 40 45.5 40
         Q 49 40 49 44
         L 49 41
         Q 49 37 52.5 37
         Q 56 37 56 41
         L 56 44
         Q 56 40 59.5 40
         Q 63 40 63 44
         L 63 50
         Q 63 46 66.5 46
         Q 70 46 70 50
         L 70 65
         Q 70 75 60 75
         Z"
      fill={color}
      opacity={0.85}
    />

    {/* Wrist */}
    <Path d="M 38 75 L 67 75 L 65 82 L 40 82 Z" fill={color} opacity={0.55} />
  </Svg>
);

export default MirrorPledgeIcon;
