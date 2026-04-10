/**
 * Style Dictionary config — transforms Figma tokens into TypeScript.
 *
 * Input:  design/figma-tokens/tokens.json  (W3C DTCG format, exported from Luckino)
 * Output: src/theme/generated/tokens.ts
 *
 * Run:  npm run tokens:build
 */

import StyleDictionary from 'style-dictionary';
import { register } from '@tokens-studio/sd-transforms';

// Register Tokens Studio transforms (handles multi-mode values like Mobile/Desktop)
register(StyleDictionary, { excludeParentKeys: false });

// ---------------------------------------------------------------------------
// Custom transform: extract Mobile value from multi-mode tokens
// e.g. { Mobile: 16, Desktop: 15 } → 16
// ---------------------------------------------------------------------------
StyleDictionary.registerTransform({
  name: 'mc/mobile-value',
  type: 'value',
  filter: token => typeof token.$value === 'object' && token.$value !== null && 'Mobile' in token.$value,
  transform: token => token.$value.Mobile,
});

// ---------------------------------------------------------------------------
// Custom transform: strip px suffix for React Native (numbers only)
// Style Dictionary adds 'px' to spacing/dimension values — RN needs raw numbers
// ---------------------------------------------------------------------------
StyleDictionary.registerTransform({
  name: 'mc/strip-px',
  type: 'value',
  filter: token => ['spacing', 'borderRadius', 'dimension'].includes(token.$type ?? token.type ?? ''),
  transform: token => {
    const v = token.$value ?? token.value;
    if (typeof v === 'string' && v.endsWith('px')) return parseFloat(v);
    return v;
  },
});

// ---------------------------------------------------------------------------
// Custom format: TypeScript const export
// ---------------------------------------------------------------------------
StyleDictionary.registerFormat({
  name: 'mc/typescript',
  format: ({ dictionary }) => {
    const tokens = dictionary.allTokens;

    const groups = {};
    for (const token of tokens) {
      // path = ['Typography', 'font', 'size', 'S'] → group = 'Typography'
      const [collection, ...rest] = token.path;
      if (!groups[collection]) groups[collection] = [];
      groups[collection].push({ path: rest, value: token.$value ?? token.value, type: token.$type ?? token.type });
    }

    const lines = [
      '/**',
      ' * GENERATED — do not edit by hand.',
      ' * Run `npm run tokens:build` to regenerate from Figma tokens.',
      ' * Source: design/figma-tokens/tokens.json',
      ' */',
      '',
    ];

    // Typography
    const typo = groups['Typography'] ?? [];
    lines.push('export const figmaTypography = {');
    for (const { path, value } of typo) {
      const key = path.join('.');
      const v = typeof value === 'string' ? `'${value}'` : value;
      lines.push(`  '${key}': ${v},`);
    }
    lines.push('} as const;', '');

    // Radius and Spacing
    const rs = groups['Radius and Spacing'] ?? [];
    lines.push('export const figmaSpacingRadius = {');
    for (const { path, value } of rs) {
      const key = path.join('.');
      const v = typeof value === 'number' ? value : (typeof value === 'string' && !isNaN(Number(value)) ? Number(value) : value);
      lines.push(`  '${key}': ${v},`);
    }
    lines.push('} as const;', '');

    // Colour
    const colours = groups['Colour'] ?? [];
    lines.push('export const figmaColour = {');
    for (const { path, value } of colours) {
      const key = path.join('.');
      lines.push(`  '${key}': '${value}',`);
    }
    lines.push('} as const;', '');

    return lines.join('\n');
  },
});

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const sd = new StyleDictionary({
  source: ['design/figma-tokens/tokens.json'],

  preprocessors: ['tokens-studio'],

  platforms: {
    typescript: {
      transformGroup: 'tokens-studio',
      transforms: ['mc/mobile-value', 'mc/strip-px'],
      buildPath: 'src/theme/generated/',
      files: [
        {
          destination: 'tokens.ts',
          format: 'mc/typescript',
        },
      ],
    },
  },
});

await sd.buildAllPlatforms();
console.log('\n✓ Tokens built → src/theme/generated/tokens.ts');
