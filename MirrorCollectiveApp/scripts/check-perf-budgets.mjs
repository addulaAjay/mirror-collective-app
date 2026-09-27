#!/usr/bin/env node
/**
 * Pre-commit performance guardrails (see docs / the "stickiness" perf audit).
 *
 * Runs against STAGED files only, so it prevents *regressions* without forcing
 * a cleanup of everything that predates it:
 *
 *   1. ASSET BUDGET (hard fail) — a newly added/modified image over
 *      MAX_IMAGE_KB blocks the commit. This is what let two ~18.7 MB PNGs sit
 *      in the bundle unnoticed; a budget makes the next one impossible to miss.
 *
 *   2. NON-VIRTUALIZED LIST (advisory, never blocks) — a staged .tsx that pairs
 *      a <ScrollView> with a `.map(` gets a heads-up to consider <FlatList>.
 *      Advisory on purpose: an AST/regex check can't tell a 3-item static list
 *      from a 200-item dynamic one, so blocking would be pure noise.
 */
import { execSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';

const MAX_IMAGE_KB = 500;
const MAX_IMAGE_BYTES = MAX_IMAGE_KB * 1024;
const IMAGE_RE = /\.(png|jpe?g|gif)$/i;

function stagedFiles() {
  // --relative → paths relative to CWD (the app dir), matching the other
  // relative paths the pre-commit hook already uses.
  const out = execSync(
    'git diff --cached --name-only --diff-filter=ACM --relative',
    { encoding: 'utf8' },
  );
  return out
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
}

const oversized = [];
const nonVirtualized = [];

for (const file of stagedFiles()) {
  if (IMAGE_RE.test(file)) {
    try {
      const { size } = statSync(file);
      if (size > MAX_IMAGE_BYTES) oversized.push({ file, size });
    } catch {
      // File staged for deletion or unreadable — nothing to budget.
    }
  } else if (file.endsWith('.tsx')) {
    try {
      const src = readFileSync(file, 'utf8');
      if (src.includes('<ScrollView') && /\.map\(/.test(src)) {
        nonVirtualized.push(file);
      }
    } catch {
      // ignore unreadable
    }
  }
}

// (2) Advisory — surfaced but never blocks.
if (nonVirtualized.length) {
  console.warn(
    '\n⚠  Possible non-virtualized list — <ScrollView> with .map() in:',
  );
  for (const f of nonVirtualized) console.warn(`     ${f}`);
  console.warn(
    '   If the mapped array is dynamic or can grow, prefer <FlatList>.',
  );
  console.warn('   (advisory — not blocking)\n');
}

// (1) Asset budget — hard fail.
if (oversized.length) {
  console.error(`\n✗  Asset budget: image(s) exceed ${MAX_IMAGE_KB} KB:`);
  for (const { file, size } of oversized) {
    console.error(`     ${(size / 1048576).toFixed(2)} MB  ${file}`);
  }
  console.error(
    '   Downscale/compress (ImageOptim, pngquant, or squoosh) or request a\n' +
      '   smaller variant before committing. Large bundled images hurt cold\n' +
      '   start, memory, and decode time.\n',
  );
  process.exit(1);
}
