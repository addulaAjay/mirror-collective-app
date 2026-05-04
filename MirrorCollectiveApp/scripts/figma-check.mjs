#!/usr/bin/env node
/**
 * figma-check — pull a node's spec sheet from Figma so you can diff it
 * against the rendered RN screen.
 *
 * Usage:
 *   FIGMA_ACCESS_TOKEN=... npm run figma:check -- <figma-node-url> [--name=<slug>]
 *
 * What it does:
 *   1. Resolves the file key + node id from the Figma URL.
 *   2. Calls Figma REST API for the node's metadata (dimensions, fills,
 *      strokes, effects, type styles, child component instances).
 *   3. Calls Figma REST API for a 3x PNG render of the node.
 *   4. Writes:
 *        docs/visual-qa/<slug>/<slug>-figma.png       (reference image)
 *        docs/visual-qa/<slug>/<slug>-spec.json       (full node spec)
 *        docs/visual-qa/<slug>.md                     (review checklist)
 *
 * The actual pixel diff against the rendered RN screen requires running
 * the app and capturing a screenshot — see docs/FIGMA_WORKFLOW.md for the
 * end-to-end loop. This command handles the Figma side, which is what
 * drifts most often.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// --------------------------------------------------------------------------
// Args
// --------------------------------------------------------------------------
const args = process.argv.slice(2);
const url = args.find((a) => a.startsWith('http')) ?? '';
const nameFlag = args.find((a) => a.startsWith('--name='));
const explicitName = nameFlag?.split('=')[1];

if (!url) {
  console.error('Usage: npm run figma:check -- <figma-node-url> [--name=<slug>]');
  process.exit(2);
}

const token = process.env.FIGMA_ACCESS_TOKEN;
if (!token) {
  console.error('Missing FIGMA_ACCESS_TOKEN env var.');
  console.error('Get one at https://www.figma.com/developers/api#access-tokens');
  console.error('Then: export FIGMA_ACCESS_TOKEN=figd_...');
  process.exit(2);
}

// --------------------------------------------------------------------------
// Parse URL
// --------------------------------------------------------------------------
const fileKeyMatch = url.match(/\/(file|design)\/([A-Za-z0-9]+)\//);
const nodeIdMatch = url.match(/[?&]node-id=([0-9-]+)/);
if (!fileKeyMatch || !nodeIdMatch) {
  console.error('Could not parse Figma URL — expected /design/<key>/...?node-id=<id>');
  process.exit(2);
}
const fileKey = fileKeyMatch[2];
const nodeId = nodeIdMatch[1].replace('-', ':');
const nodeSlug = explicitName ?? `node-${nodeId.replace(':', '-')}`;

// --------------------------------------------------------------------------
// Paths
// --------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const outDir = join(repoRoot, 'docs', 'visual-qa', nodeSlug);
const reportPath = join(repoRoot, 'docs', 'visual-qa', `${nodeSlug}.md`);
mkdirSync(outDir, { recursive: true });

// --------------------------------------------------------------------------
// Fetch helpers
// --------------------------------------------------------------------------
const headers = { 'X-Figma-Token': token };

async function figmaJson(path) {
  const res = await fetch(`https://api.figma.com${path}`, { headers });
  if (!res.ok) {
    throw new Error(`Figma API ${res.status}: ${path}\n${await res.text()}`);
  }
  return res.json();
}

async function fetchBinary(href) {
  const res = await fetch(href);
  if (!res.ok) throw new Error(`Image fetch ${res.status}: ${href}`);
  return Buffer.from(await res.arrayBuffer());
}

// --------------------------------------------------------------------------
// Pull data
// --------------------------------------------------------------------------
console.log(`fetching node ${nodeId} from file ${fileKey}...`);

const [nodeRes, imageRes] = await Promise.all([
  figmaJson(`/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}&geometry=paths`),
  figmaJson(`/v1/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&scale=3&format=png`),
]);

const nodeData = nodeRes.nodes[nodeId];
if (!nodeData) {
  console.error(`Node ${nodeId} not found in file ${fileKey}.`);
  process.exit(1);
}

const node = nodeData.document;
const componentSets = nodeData.componentSets ?? {};
const components = nodeData.components ?? {};
const imageHref = imageRes.images[nodeId];
if (!imageHref) {
  console.error('No image rendered — node may be empty.');
  process.exit(1);
}

const imageBuffer = await fetchBinary(imageHref);

// --------------------------------------------------------------------------
// Extract spec
// --------------------------------------------------------------------------
function summarize(n, depth = 0) {
  if (depth > 4) return null;
  return {
    name: n.name,
    type: n.type,
    id: n.id,
    bounds: n.absoluteBoundingBox
      ? {
          width: Math.round(n.absoluteBoundingBox.width),
          height: Math.round(n.absoluteBoundingBox.height),
        }
      : undefined,
    layout: n.layoutMode
      ? {
          mode: n.layoutMode,
          gap: n.itemSpacing,
          paddingTop: n.paddingTop,
          paddingRight: n.paddingRight,
          paddingBottom: n.paddingBottom,
          paddingLeft: n.paddingLeft,
        }
      : undefined,
    fills: n.fills?.filter((f) => f.visible !== false).map((f) => ({
      type: f.type,
      color: f.color,
      gradient: f.gradientStops,
      opacity: f.opacity,
    })),
    strokes: n.strokes?.length
      ? { color: n.strokes[0]?.color, weight: n.strokeWeight }
      : undefined,
    cornerRadius: n.cornerRadius ?? n.rectangleCornerRadii,
    typography: n.style
      ? {
          family: n.style.fontFamily,
          weight: n.style.fontWeight,
          size: n.style.fontSize,
          lineHeight: n.style.lineHeightPx,
          letterSpacing: n.style.letterSpacing,
        }
      : undefined,
    text: n.characters,
    componentId: n.componentId,
    children: n.children?.map((c) => summarize(c, depth + 1)).filter(Boolean),
  };
}

const spec = {
  fileKey,
  nodeId,
  url,
  fetchedAt: new Date().toISOString(),
  componentInstances: Object.keys(components),
  componentSets: Object.keys(componentSets),
  tree: summarize(node),
};

// --------------------------------------------------------------------------
// Write outputs
// --------------------------------------------------------------------------
writeFileSync(join(outDir, `${nodeSlug}-figma.png`), imageBuffer);
writeFileSync(join(outDir, `${nodeSlug}-spec.json`), JSON.stringify(spec, null, 2));

const componentList = Object.values(components)
  .map((c) => `- \`${c.name}\` (${c.key})`)
  .join('\n') || '_(no published components in this node)_';

const md = `# Visual QA — ${node.name}

**Figma:** ${url}
**File:** \`${fileKey}\`
**Node:** \`${nodeId}\`
**Pulled:** ${new Date().toISOString()}

## Reference

![Figma render](./${nodeSlug}/${nodeSlug}-figma.png)

## Component instances in this node

${componentList}

## Top-level dimensions

- Width: ${spec.tree.bounds?.width ?? '—'}
- Height: ${spec.tree.bounds?.height ?? '—'}
- Layout: ${spec.tree.layout?.mode ?? 'static'}

## Review checklist

- [ ] Tokens match (colors, type, spacing) — diff against \`src/theme/generated/tokens.ts\`
- [ ] Component instances above all have a \`.figma.tsx\` Code Connect file
- [ ] Layout mode and padding match the layout container in code
- [ ] Corner radii match \`figmaSpacingRadius\` tokens
- [ ] Text content matches (copy review)
- [ ] Side-by-side screenshot of the rendered RN screen attached below

## Rendered (RN)

_Capture the rendered screen and save as \`./${nodeSlug}/${nodeSlug}-rn.png\` then reference it below:_

<!-- ![RN render](./${nodeSlug}/${nodeSlug}-rn.png) -->

## Notes

_Add diff observations here._
`;

writeFileSync(reportPath, md);

console.log(`✓ wrote ${reportPath}`);
console.log(`  → image: ${join(outDir, `${nodeSlug}-figma.png`)}`);
console.log(`  → spec:  ${join(outDir, `${nodeSlug}-spec.json`)}`);
