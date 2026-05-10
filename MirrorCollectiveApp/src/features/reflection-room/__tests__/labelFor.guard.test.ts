/**
 * §6.2 hard-prohibition guard.
 *
 * Per UI handoff §6.2: "grep your code for hardcoded strings like
 * 'Ease Pressure' and confirm they're in the matrix function only."
 *
 * The intent is to catch a screen rendering a hardcoded label. The
 * guard scans all screen files (i.e., the surfaces that paint buttons)
 * and fails if any matrix label appears as a string literal.
 *
 * Why we don't scan everywhere: a few non-screen files legitimately
 * contain the same strings — `08_FIGMA_ALIGNMENT_DELTA.md` §6.5 ships
 * "Ease Pressure" / "Ease Overwhelm" / "Soften Grief" as Figma-confirmed
 * practice TITLES, and the mock catalog reflects that. They're not
 * button labels and don't violate §6.2.
 */

import fs from 'fs';
import path from 'path';

import { labelFor } from '../utils/labelFor';
import { LOOP_IDS, TONE_STATES } from '../types/ids';

const SCREENS_DIR = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'screens',
  'reflectionRoom',
);
const COMPONENTS_DIR = path.resolve(__dirname, '..', 'components');
const SCAN_DIRS = [SCREENS_DIR, COMPONENTS_DIR];

function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip generated / vendor / build trees.
      if (
        entry.name === 'node_modules' ||
        entry.name === 'generated' ||
        entry.name === '__snapshots__' ||
        entry.name === 'coverage'
      ) {
        continue;
      }
      out.push(...listFiles(p));
    } else if (
      entry.name.endsWith('.ts') ||
      entry.name.endsWith('.tsx')
    ) {
      out.push(p);
    }
  }
  return out;
}

const MATRIX_LABELS: string[] = [];
for (const loop of LOOP_IDS) {
  for (const tone of TONE_STATES) {
    MATRIX_LABELS.push(labelFor(loop, tone));
  }
}

describe('§6.2 hard-prohibition guard — no hardcoded matrix labels in screens', () => {
  const screenFiles = SCAN_DIRS.flatMap(d => listFiles(d));

  it.each(MATRIX_LABELS)(
    '"%s" never appears as a string literal in a screen/component',
    matrixLabel => {
      const offenders: string[] = [];
      for (const file of screenFiles) {
        const contents = fs.readFileSync(file, 'utf8');
        if (
          contents.includes(`"${matrixLabel}"`) ||
          contents.includes(`'${matrixLabel}'`) ||
          contents.includes(`\`${matrixLabel}\``)
        ) {
          offenders.push(path.basename(file));
        }
      }
      expect(offenders).toEqual([]);
    },
  );
});
