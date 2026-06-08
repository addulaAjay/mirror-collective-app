/**
 * Global OS-font-scaling guard.
 *
 * Why this exists
 * ---------------
 * React Native's <Text>/<TextInput> multiply the `fontSize` you set by the
 * device's OS font-size setting (Dynamic Type on iOS, "Font size" on Android).
 * Our layout helpers (`scale`/`verticalScale`/`moderateScale` in
 * ./responsive.ts) only scale by SCREEN size — they're blind to that font
 * multiplier. So a user who cranks their phone to the largest text setting
 * gets ~1.5–2× larger copy inside containers sized for 1× text, and the copy
 * bleeds outside its boundaries (e.g. the "Add to your Echo" cards).
 *
 * How this is usually handled
 * ---------------------------
 * Cap the multiplier app-wide rather than disabling scaling outright
 * (`allowFontScaling={false}` would hurt accessibility). A cap keeps the app
 * legible for low-vision users up to a point, while protecting fixed layouts
 * from shattering. RN reads `maxFontSizeMultiplier` off the component
 * defaults, so setting it once at startup covers every <Text>/<TextInput>
 * that doesn't opt out with its own value.
 *
 * Pair this with flexible containers (minHeight + flex, not fixed height) so
 * text that still grows reflows instead of clipping.
 */
import { Text, TextInput } from 'react-native';

/**
 * Largest OS font multiplier we honor. 1.3 ≈ iOS "Large" / one notch into the
 * accessibility sizes — enough of an a11y bump to matter, small enough that
 * the design's fixed rows (3-across cards, single-line labels) stay intact.
 */
export const MAX_FONT_SIZE_MULTIPLIER = 1.3;

/** Apply the global cap. Call once, before the app renders. */
export function installFontScaleGuard(): void {
  const TextAny = Text as unknown as { defaultProps?: Record<string, unknown> };
  TextAny.defaultProps = TextAny.defaultProps || {};
  if (TextAny.defaultProps.maxFontSizeMultiplier === undefined) {
    TextAny.defaultProps.maxFontSizeMultiplier = MAX_FONT_SIZE_MULTIPLIER;
  }

  const InputAny = TextInput as unknown as {
    defaultProps?: Record<string, unknown>;
  };
  InputAny.defaultProps = InputAny.defaultProps || {};
  if (InputAny.defaultProps.maxFontSizeMultiplier === undefined) {
    InputAny.defaultProps.maxFontSizeMultiplier = MAX_FONT_SIZE_MULTIPLIER;
  }
}
