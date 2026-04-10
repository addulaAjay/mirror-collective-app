// ImageOptionButton.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { MOTIF_SVG } from '@assets/motifs-icons/MotifIconAssets';

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
    width: 120,
    height: 120,
  },
  container: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  symbolWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  background: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'transparent',
    borderWidth: 0.25,
    borderColor: '#9BAAC2',
    shadowColor: 'rgba(0, 0, 0, 0.29)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 5,
  },
  selectedBackground: {
    borderRadius: 60,
    // Exact dual shadow from Figma: 0px 4px 19px 4px rgba(0, 0, 0, 0.1), 1px 4px 38px 2px rgba(229, 214, 176, 0.17)
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 19,
    elevation: 0,
    boxShadow: '0 0 24px 4px rgba(242, 226, 177, 0.50)',
  },
  selected: {
    // Additional selected state styling if needed
  },
});
