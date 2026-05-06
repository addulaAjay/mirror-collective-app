import React from 'react';
import { View } from 'react-native';

import IconCodeLibrary from '@assets/talk-to-mirror/icon-code-library.svg';

interface Props {
  size?: number;
}

/**
 * Figma 4326:2362 — Code Library icon.
 * The SVG circle + book content is rendered at `size×size`.
 * Node 4326:2380 adds a centred gold-bordered rectangle with two-layer glow
 * (directional + radial) around the book illustration — replicated here as an
 * absolute View overlay since it is a separate Figma layer, not baked into the
 * embedded raster.
 *
 * Figma specs at 100px circle:
 *   rect  47.973×66.658px, centred, border 0.133px #f4cf7d
 *   shadow1: 1.333 -1.333 6.667px 0.667px rgba(229,214,176,0.2)
 *   shadow2: 0 0 23.333px 5.333px rgba(244,207,125,0.2)
 */
const CodeLibraryIcon: React.FC<Props> = ({ size = 100 }) => {
  const s = size / 100;
  const glowW  = 47.973 * s;
  const glowH  = 66.658 * s;

  return (
    <View style={{ width: size, height: size }}>
      <IconCodeLibrary width={size} height={size} />

      {/* Gold glow overlay — Figma node 4326:2380 */}
      <View
        pointerEvents="none"
        style={{
          position:    'absolute',
          width:       glowW,
          height:      glowH,
          top:         (size - glowH) / 2,
          left:        (size - glowW) / 2,
          borderWidth:  0.133 * s,
          borderColor:  '#f4cf7d',
          // iOS — primary radial glow (shadow2)
          shadowColor:   'rgba(244,207,125,1)',
          shadowOffset:  { width: 1.333 * s, height: -1.333 * s },
          shadowOpacity: 0.2,
          shadowRadius:  23.333 * s,
          elevation:     6,
          // Android — both shadows via boxShadow
          boxShadow: `${1.333 * s}px ${-1.333 * s}px ${6.667 * s}px ${0.667 * s}px rgba(229,214,176,0.2), 0px 0px ${23.333 * s}px ${5.333 * s}px rgba(244,207,125,0.2)`,
        }}
      />
    </View>
  );
};

export default CodeLibraryIcon;
