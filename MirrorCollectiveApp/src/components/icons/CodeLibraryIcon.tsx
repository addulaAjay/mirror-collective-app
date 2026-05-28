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
 * Layout note: the Mirror Echo / Reflection Room / Pledge SVGs render
 * their inner art at ~97 % of the cell and clip it to an 83 % rect so
 * the visible content fills ~83 % of the circle's diameter. We match
 * that visual weight by overscanning the book PNG to 120 % of the cell
 * — the Figma export wraps the book in ~20 % padding/glow, so a 1.2×
 * Image bounding box renders the actual book at roughly 57 × 78 px
 * inside a 100 × 100 cell, on a par with the sibling icons. The book's
 * top corner sits ~50 px from the cell centre (essentially on the
 * circle boundary) so the gold stitched border at the corners is
 * preserved — anything beyond is sub-pixel and lost in the rim.
 * resizeMode="contain" preserves the 46 : 64 portrait ratio.
 */
const CodeLibraryIcon: React.FC<Props> = ({ size = 100 }) => (
  <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
    <Image
      source={require('@assets/talk-to-mirror/icon-code-library.png')}
      style={{ width: size * 1.2, height: size * 1.2 }}
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
