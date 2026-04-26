import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

// SVG file imports — kept under their original filenames so the assets dir
// stays stable. The files were originally exported from Figma with shifted
// contents (each filename held the wrong icon — verified against iOS render
// 2026-04-26). The runtime mapping below remaps imports by the icon's
// ACTUAL content, regardless of filename.
//
// Filename → actual content (verified):
//   women-cancer-icon.svg     → ribbon                ✓ correct cause
//   animal-welfare-icon.svg   → paw                   ✓ correct cause
//   mental-health-icon.svg    → brain                 ✓ correct cause
//   environment-icon.svg      → BOOK                  ❌ shifted: belongs to Education
//   education-icon.svg        → PARENT+CHILD          ❌ shifted: belongs to Women + Children
//   women-children-icon.svg   → RAISED FIST           ❌ shifted: belongs to Human Rights
//   human-rights-icon.svg     → FACE/PROFILE          ❌ Mirror logo? not any cause
//
// TODO: environment cause has NO matching leaf SVG anywhere in the bundle —
//       re-export "planet / environment" from Figma into
//       src/assets/pledge/svg/leaf-icon.svg and update this mapping.
//       Until then we render the face SVG as a placeholder so the row is
//       visible, but it's the wrong art.
import AnimalWelfareSvg from '@assets/pledge/svg/animal-welfare-icon.svg';
import BookSvg from '@assets/pledge/svg/environment-icon.svg';
import FaceSvg from '@assets/pledge/svg/human-rights-icon.svg';
import FistSvg from '@assets/pledge/svg/women-children-icon.svg';
import MentalHealthSvg from '@assets/pledge/svg/mental-health-icon.svg';
import ParentChildSvg from '@assets/pledge/svg/education-icon.svg';
import WomenCancerSvg from '@assets/pledge/svg/women-cancer-icon.svg';

export type CauseIconType =
  | 'women-cancer'
  | 'animal-welfare'
  | 'mental-health'
  | 'environment'
  | 'women-children'
  | 'education'
  | 'human-rights';

interface CauseIconProps {
  type: CauseIconType;
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// Each cause id maps to the SVG that ACTUALLY contains the right artwork.
// `environment` falls back to the face SVG until a real leaf icon ships
// (see TODO above).
const ICON_COMPONENT_MAP: Record<CauseIconType, React.FC<any>> = {
  'women-cancer': WomenCancerSvg,
  'animal-welfare': AnimalWelfareSvg,
  'mental-health': MentalHealthSvg,
  'environment': FaceSvg, // TEMP placeholder — replace with leaf SVG
  'women-children': ParentChildSvg,
  'education': BookSvg,
  'human-rights': FistSvg,
};

/**
 * CauseIcon - Renders SVG icons for the 7 Mirror Pledge causes
 * 
 * @param type - The cause icon to display
 * @param size - Icon size in pixels (default: 60)
 * @param style - Additional styles
 * @param testID - Test identifier
 * 
 * @example
 * <CauseIcon type="women-cancer" size={80} />
 * <CauseIcon type="education" size={60} />
 */
const CauseIcon: React.FC<CauseIconProps> = ({ 
  type, 
  size = 60,
  style,
  testID 
}) => {
  const IconComponent = ICON_COMPONENT_MAP[type];
  
  if (!IconComponent) {
    console.warn(`CauseIcon: Unknown icon type "${type}"`);
    return null;
  }

  return (
    <IconComponent
      width={size}
      height={size}
      style={style}
      testID={testID}
    />
  );
};

export default CauseIcon;
