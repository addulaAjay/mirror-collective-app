/**
 * Responsive-scaling guard for the Reflection Room entry screens.
 *
 * The design baseline is 393x852 (src/theme/responsive.ts). A sized style
 * value written as a raw number or a raw token is therefore correct on
 * exactly one device: at 430pt (15 Pro Max) every such value is ~9% too
 * small with gaps to match, and at 375pt (SE) ~5% too large.
 *
 * The rest of the app wraps these in scale()/verticalScale()/moderateScale().
 * Reflection Room largely did not, which is what produced the layout drift
 * reported on device. This guard keeps the entry screens converted.
 *
 * Scoped deliberately to the three entry screens — the rest of Reflection
 * Room is still being converted, and a guard that fails for known-pending
 * work teaches people to ignore it.
 */

import fs from 'fs';
import path from 'path';

const SCREENS_DIR = path.resolve(__dirname, '..', '..', '..', 'screens', 'reflectionRoom');

const GUARDED = [
  'ReflectionRoomLandingScreen.tsx',
  'ReflectionRoomWelcomeScreen.tsx',
  'ReflectionRoomQuizEntryScreen.tsx',
];

/** Style props whose value is a device-relative length. */
const SIZED_PROPS = [
  'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
  'paddingVertical', 'paddingHorizontal',
  'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
  'marginVertical', 'marginHorizontal',
  'gap', 'rowGap', 'columnGap',
  'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
  'borderRadius', 'fontSize', 'lineHeight',
  'top', 'bottom', 'left', 'right',
];

const SCALE_FNS = /\b(scale|verticalScale|moderateScale|scaleMin|scaleCap)\s*\(/;

/** A value that needs no scaling: zero, a percentage/auto string, or a computed const. */
const EXEMPT = /^(0|'[^']*'|"[^"]*"|`[^`]*`|undefined|null)$/;

const findUnscaled = (src: string): string[] => {
  const offenders: string[] = [];
  const re = new RegExp(`\\b(${SIZED_PROPS.join('|')})\\s*:\\s*([^,\\n}]+)`, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const [, prop, rawValue] = m;
    const value = rawValue.trim().replace(/;$/, '');
    if (EXEMPT.test(value)) continue;
    if (SCALE_FNS.test(value)) continue;
    // Raw number, or a bare token like spacing.m / fontSize.xl / radius.s
    // Tokens appear in both forms: `fontSize.xl` and `fontSize['2xl']`.
    // Missing the bracket form is how two values slipped the first pass.
    if (
      /^-?\d/.test(value) ||
      /^(spacing|radius|fontSize|lineHeight|borderWidth)\s*[.[]/.test(value)
    ) {
      offenders.push(`${prop}: ${value}`);
    }
  }
  return offenders;
};

describe('Reflection Room entry screens are responsively scaled', () => {
  it.each(GUARDED)('%s wraps every sized value in a scale helper', file => {
    const src = fs.readFileSync(path.join(SCREENS_DIR, file), 'utf8');

    const offenders = findUnscaled(src);

    expect(offenders).toEqual([]);
  });
});
