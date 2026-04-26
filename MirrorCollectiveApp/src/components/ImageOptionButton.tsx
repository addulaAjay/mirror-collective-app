// ImageOptionButton.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { MOTIF_SVG } from '@assets/motifs-icons/MotifIconAssets';
import { palette, scale } from '@theme';

export type ImageOptionSymbol = 'star' | 'brick' | 'spiral' | 'mirror';

const SYMBOL_MOTIF_MAP: Record<ImageOptionSymbol, string> = {
  star: 'radiant-burst',
  brick: 'blocks',
  spiral: 'waves',
  mirror: 'mirror',
};

interface Props {
  symbolType: ImageOptionSymbol;
  selected: boolean;
  onPress: () => void;
}

// Figma 203:2425 — 120×120 circle. Use scale() so on smaller devices the
// circle shrinks proportionally and the 2×2 grid still fits inside the
// scaled grid container (otherwise items wrap into a single column).
const SIZE = scale(120);

const renderSymbol = (symbolType: ImageOptionSymbol) => {
  const motifKey = SYMBOL_MOTIF_MAP[symbolType];
  const svg = MOTIF_SVG[motifKey];
  if (!svg) return null;
  return <SvgXml xml={svg} width="80%" height="80%" />;
};

const ImageOptionButton = ({ symbolType, selected, onPress }: Props) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.9}
    style={styles.touchable}
  >
    <View style={[styles.container, selected && styles.selected]}>
      <View style={[styles.background, selected && styles.selectedBackground]} />
      <View style={styles.symbolWrapper}>{renderSymbol(symbolType)}</View>
    </View>
  </TouchableOpacity>
);

export default ImageOptionButton;

const styles = StyleSheet.create({
  touchable: {
    width:  SIZE,
    height: SIZE,
  },
  container: {
    width:          SIZE,
    height:         SIZE,
    alignItems:     'center',
    justifyContent: 'center',
    position:       'relative',
  },
  symbolWrapper: {
    width:          '100%',
    height:         '100%',
    alignItems:     'center',
    justifyContent: 'center',
    zIndex:         1,
  },
  background: {
    position:        'absolute',
    width:           SIZE,
    height:          SIZE,
    borderRadius:    SIZE / 2,
    backgroundColor: 'transparent',
    borderWidth:     0.5,                       // bumped from 0.25 for retina visibility
    borderColor:     palette.navy.muted,
    shadowColor:     'rgba(0, 0, 0, 0.29)',
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   1,
    shadowRadius:    20,
    elevation:       5,
  },
  selectedBackground: {
    borderRadius:  SIZE / 2,
    // Figma dual shadow: drop + warm glow
    shadowColor:   palette.neutral.black,
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius:  19,
    elevation:     0,
    boxShadow:     '0 0 24px 4px rgba(242, 226, 177, 0.50)',
  },
  selected: {
    // Selected state styling slot — currently using selectedBackground
    // for the visible halo. Reserved for future highlight effects.
  },
});
