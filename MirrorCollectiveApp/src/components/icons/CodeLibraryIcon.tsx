import { palette } from '@theme';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface Props {
  size?: number;
}

/**
 * Figma 7537:2242 — Code Library icon.
 *
 * The new design is a portrait book illustration with a gold stitched
 * border and baked typography. Figma exports it as a flattened raster
 * (no vector paths in the spec tree) so the source ships as PNG.
 *
 * The other three home-screen category icons (Mirror Echo, Reflection
 * Room, Mirror Pledge) each bake a thin navy-light (#9BAAC2) circle
 * stroke into their SVGs — the consistent "lens" framing the artwork.
 * The new Code Library PNG doesn't include that frame, so we draw it
 * here as a sibling View: borderRadius = size/2, the same 0.25 px
 * Border/Subtle stroke (palette.navy.light ~ #a3b3cc), and a barely-
 * visible 5 % fill that matches the other icons' inner gradient.
 *
 * Layout note: the book artwork sits at 60 % of the container so its
 * portrait aspect ratio fits comfortably inside the circle without
 * touching the rim. resizeMode="contain" centres it and preserves the
 * 46:64 ratio so it isn't squashed.
 */
const CodeLibraryIcon: React.FC<Props> = ({ size = 100 }) => (
  <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
    <Image
      source={require('@assets/talk-to-mirror/icon-code-library.png')}
      style={{ width: size * 0.6, height: size * 0.6 }}
      resizeMode="contain"
    />
  </View>
);

export default CodeLibraryIcon;

const styles = StyleSheet.create({
  // Matches the navy-light stroke + ~5 % surface tint the sibling icons
  // (Mirror Echo, Reflection Room, Mirror Pledge) bake into their SVGs.
  // overflow:hidden clips any glow the PNG bleeds past the circle edge.
  circle: {
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     0.25,
    borderColor:     palette.navy.light,
    backgroundColor: 'rgba(163, 179, 204, 0.05)',
    overflow:        'hidden',
  },
});
