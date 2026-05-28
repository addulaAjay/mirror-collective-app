import React from 'react';
import { Image, View } from 'react-native';

interface Props {
  size?: number;
}

/**
 * Figma 7537:2242 — Code Library icon.
 *
 * The current source is a portrait book illustration with a gold
 * stitched border and baked typography. Figma exports it as a
 * flattened raster (no vector paths in the spec tree) so we render
 * it as a PNG. Native frame is 46×64; `resizeMode="contain"`
 * letterboxes it inside the `size`×`size` slot so the home-screen
 * category row layout — which expects each icon to occupy the same
 * square cell — stays untouched.
 *
 * Replaces the previous circular-badge design (node 4326:2362). The
 * old gold-glow rectangle overlay + circular clip wrapper used to
 * contain it are no longer needed — the new asset bakes any glow
 * into the PNG and the artwork isn't circular anymore.
 */
const CodeLibraryIcon: React.FC<Props> = ({ size = 100 }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Image
      source={require('@assets/talk-to-mirror/icon-code-library.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  </View>
);

export default CodeLibraryIcon;
