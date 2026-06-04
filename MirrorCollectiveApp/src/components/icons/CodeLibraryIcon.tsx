import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface Props {
  size?: number;
}

/**
 * Code Library category icon for the TalkToMirror home screen.
 *
 * Figma — full card lives at node 7227:5881 (Frame 654), 100 × 160:
 *   - Circle (Ellipse 725): 100 × 100, stroke #9BAAC2 weight 0.208,
 *     fill is a vertical 5 % opacity gradient transparent → black.
 *   - Book (node 7537:2242 — mcl the you explained 1): exactly 46 × 64
 *     centred inside the circle. The gold stitched border at the book's
 *     edges is part of the source asset.
 *
 * The book ships as PNG because the Figma frame is rasterised on
 * export (no vector paths in the spec tree). The export is 228 × 282;
 * the actual book content occupies 60.5 % × 68.1 % of those bounds —
 * the rest is export padding. Rendering the Image at 94 % of the cell
 * with resizeMode="contain" lands the visible book at exactly 46 × 64,
 * matching the Figma spec.
 *
 * The circle stroke, fill, and weight are recreated in JSX so the
 * rim matches the SVGs Mirror Echo / Reflection Room / Pledge render
 * (same #9BAAC2 stroke, same hairline weight, same 5 % surface tint).
 * overflow:hidden + borderRadius clips the book corners to the circle
 * if any artwork extends past the rim.
 */
const CodeLibraryIcon: React.FC<Props> = ({ size = 100 }) => (
  <View
    style={[
      styles.circle,
      { width: size, height: size, borderRadius: size / 2 },
    ]}
  >
    <LinearGradient
      colors={['rgba(217, 217, 217, 0)', 'rgba(0, 0, 0, 0.05)']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
    <Image
      source={require('@assets/talk-to-mirror/icon-code-library.png')}
      style={{ width: size * 0.94, height: size * 0.94 }}
      resizeMode="contain"
    />
  </View>
);

export default CodeLibraryIcon;

const styles = StyleSheet.create({
  circle: {
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    StyleSheet.hairlineWidth,
    // Figma 7227:5883 Ellipse 725 stroke — same #9BAAC2 the sibling
    // home-screen icons (Mirror Echo / Reflection Room / Pledge) draw
    // into their SVGs, so all four rims read as one design system.
    borderColor:    '#9BAAC2',
    overflow:       'hidden',
  },
});
