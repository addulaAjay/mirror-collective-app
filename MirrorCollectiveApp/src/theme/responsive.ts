import { useWindowDimensions, Dimensions } from 'react-native';

/**
 * Base design frame dimensions — matches the Figma artboard (iPhone 14 Pro).
 * All scale() calls are relative to this frame.
 */
const DESIGN_WIDTH = 393;
const DESIGN_HEIGHT = 852;

// Static snapshot for use outside of React (StyleSheet.create, module-level consts)
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Static scale functions — safe for use outside components
// Use these in StyleSheet.create() blocks
// ---------------------------------------------------------------------------

/**
 * Scale a horizontal/width value relative to the design frame width.
 * @example scale(24) → 24 on a 393-wide screen, proportionally adjusted on others
 */
export const scale = (size: number): number =>
  (size * SCREEN_WIDTH) / DESIGN_WIDTH;

/**
 * Scale a vertical/height value relative to the design frame height.
 * @example verticalScale(53) → 53 on an 852-tall screen
 */
export const verticalScale = (size: number): number =>
  (size * SCREEN_HEIGHT) / DESIGN_HEIGHT;

/**
 * Scale with a dampening factor — useful for font sizes and padding
 * where full scaling feels too aggressive.
 * factor=0 → no scaling, factor=1 → full scale(), default=0.5
 * @example moderateScale(18) → between 18 and scale(18)
 */
export const moderateScale = (size: number, factor = 0.5): number =>
  size + (scale(size) - size) * factor;

/**
 * Scale with a minimum floor — prevents values getting too small on tiny screens.
 * @example scaleMin(24, 20) → at least 20, scales up on larger screens
 */
export const scaleMin = (size: number, min: number): number =>
  Math.max(min, scale(size));

/**
 * Scale with a maximum cap — prevents values getting too large on big screens.
 * @example scaleCap(size, max) replaces Math.min(screenWidth * ratio, max)
 */
export const scaleCap = (size: number, max: number): number =>
  Math.min(max, scale(size));

// ---------------------------------------------------------------------------
// useResponsive hook — for components that need rotation-aware values
// Returns the same functions but recalculates on orientation change
// ---------------------------------------------------------------------------

export interface ResponsiveUtils {
  width: number;
  height: number;
  scale: (size: number) => number;
  verticalScale: (size: number) => number;
  moderateScale: (size: number, factor?: number) => number;
  scaleMin: (size: number, min: number) => number;
  scaleCap: (size: number, max: number) => number;
  isSmallScreen: boolean;  // width < 375
  isLargeScreen: boolean;  // width > 414
}

/**
 * useResponsive — returns scale utilities that update on orientation change.
 * Use this in components with layout-sensitive values.
 *
 * @example
 * const { scale, verticalScale } = useResponsive();
 * <View style={{ padding: scale(24) }} />
 */
export const useResponsive = (): ResponsiveUtils => {
  const { width, height } = useWindowDimensions();

  const _scale = (size: number) => (size * width) / DESIGN_WIDTH;
  const _vScale = (size: number) => (size * height) / DESIGN_HEIGHT;

  return {
    width,
    height,
    scale: _scale,
    verticalScale: _vScale,
    moderateScale: (size: number, factor = 0.5) =>
      size + (_scale(size) - size) * factor,
    scaleMin: (size: number, min: number) => Math.max(min, _scale(size)),
    scaleCap: (size: number, max: number) => Math.min(max, _scale(size)),
    isSmallScreen: width < 375,
    isLargeScreen: width > 414,
  };
};
