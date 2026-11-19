import { render } from '@testing-library/react-native';
import { readFileSync } from 'fs';
import { join } from 'path';
import React from 'react';
import { Text } from 'react-native';

import { palette } from '@theme';

import BackgroundWrapper from './BackgroundWrapper';

/**
 * Merge a style prop down to one object.
 *
 * Not `StyleSheet.flatten` — jest.setup.js stubs it to the identity function,
 * so it hands an array straight back and every property reads as undefined.
 */
const flattenStyle = (style: unknown): Record<string, unknown> =>
  Array.isArray(style)
    ? Object.assign({}, ...style.map(flattenStyle))
    : ((style ?? {}) as Record<string, unknown>);

/** Flattened style of the outermost rendered View. */
const rootStyle = (tree: unknown): Record<string, unknown> =>
  flattenStyle((tree as { props?: { style?: unknown } })?.props?.style);

const renderWrapper = (style?: object) =>
  render(
    <BackgroundWrapper style={style}>
      <Text>Test Content</Text>
    </BackgroundWrapper>,
  );

describe('BackgroundWrapper', () => {
  it('renders children correctly', () => {
    const { getByText } = renderWrapper();
    expect(getByText('Test Content')).toBeTruthy();
  });

  // The whole point of the flat background: one solid colour, so anything
  // revealed behind or beside a screen matches it exactly.
  it('paints the flat app background colour', () => {
    const { toJSON } = renderWrapper();

    expect(rootStyle(toJSON()).backgroundColor).toBe(palette.navy.screen);
  });

  it('renders no background image or gradient', () => {
    // A gradient or starfield Image creeping back would reintroduce the
    // mismatched-edge problem the flat fill exists to remove.
    const { toJSON } = renderWrapper();

    const types: string[] = [];
    const walk = (node: unknown): void => {
      if (!node || typeof node !== 'object') return;
      const n = node as { type?: unknown; children?: unknown[] };
      if (n.type) types.push(String(n.type));
      (n.children ?? []).forEach(walk);
    };
    walk(toJSON());

    expect(types).not.toContain('Image');
    expect(types.filter(t => /Gradient/i.test(t))).toHaveLength(0);
  });

  it('lets a caller override the background colour', () => {
    // `style` must land after styles.container, or screens can no longer opt
    // out of the default fill.
    const { toJSON } = renderWrapper({ backgroundColor: 'red' });

    expect(rootStyle(toJSON()).backgroundColor).toBe('red');
  });

  // The colour revealed behind a screen must equal the colour screens paint.
  // These paint sites sit outside the component tree — the JS nav container and
  // the native UIWindow — so no render test can reach them, and they silently
  // kept the old gradient's top stop when the flat fill landed.
  it('nav container and native window use the same colour as the wrapper', () => {
    const hex = palette.navy.screen.replace('#', '');
    const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));

    // All three JS paint sites: NavigationContainer theme background + card,
    // and the native-stack scene's contentStyle.
    const appSrc = readFileSync(join(__dirname, '../../App.tsx'), 'utf8');
    expect(appSrc).toMatch(/background: palette\.navy\.screen,/);
    expect(appSrc).toMatch(/card: palette\.navy\.screen,/);
    expect(appSrc).toMatch(
      /contentStyle: \{ backgroundColor: palette\.navy\.screen \}/,
    );

    const delegate = readFileSync(
      join(__dirname, '../../ios/MirrorCollectiveApp/AppDelegate.swift'),
      'utf8',
    );
    expect(delegate).toContain(`red: ${r}.0 / 255.0`);
    expect(delegate).toContain(`green: ${g}.0 / 255.0`);
    expect(delegate).toContain(`blue: ${b}.0 / 255.0`);
  });
});
