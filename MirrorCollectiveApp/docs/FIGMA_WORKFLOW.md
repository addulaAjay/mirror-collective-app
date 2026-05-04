# Figma → React Native: the accuracy workflow

Goal: every change driven by a Figma design lands in code with no visual drift.

This doc describes the four-pillar setup — **MCP**, **tokens**, **Code Connect**, **visual diff** — and the checklist to run before any visual change.

## The setup at a glance

```
Figma (design source of truth)
   │
   ├── Variables ───────────────► design/figma-tokens/tokens.json
   │                                     │
   │                                     ▼  npm run tokens:build
   │                              src/theme/generated/tokens.ts
   │                                     ▲
   │                                     └── enforced by .husky/pre-commit
   │                                         and .github/workflows/figma-tokens.yml
   │
   ├── Components ──────────────► src/components/**/*.figma.tsx
   │                              (Figma Code Connect — links Figma node →
   │                               your RN component, so MCP returns YOUR
   │                               code instead of guesses)
   │
   └── Dev Mode MCP ────────────► used by Claude Code at edit time
       (http://127.0.0.1:3845/mcp,    to fetch node spec, screenshot,
        no token, runs locally)       and component instances
```

Visual-diff command (`npm run figma:check`) sits beside this and pulls a node's full spec + 3× PNG to `docs/visual-qa/` for human/agent review.

## Pillar 1 — Figma Code Connect

**What it does:** annotates each RN component with its Figma node URL. When the MCP returns a Figma node, it returns *your component's exact code shape* — props, variants, types — not a generic guess.

**Files:** `src/components/**/*.figma.tsx` (one per component, alongside the source).

**Status:**
| Component | Figma node | File |
| --- | --- | --- |
| Button | 125:440 | `src/components/Button/Button.figma.tsx` |
| TextInputField | 147:967 | `src/components/TextInputField.figma.tsx` |
| GlassCard | TODO | `src/components/_internal/GlassCard.figma.tsx` |
| OptionsButton | TODO | `src/components/OptionsButton.figma.tsx` |
| CauseIcon | TODO | `src/components/CauseIcon/CauseIcon.figma.tsx` |

**To fill in TODOs:** open the component in Figma → Dev Mode → "Copy link to selection" → paste into the `.figma.tsx` file's `NODE_URL`.

**To validate locally:**
```bash
npx figma connect parse        # parses files, prints what would publish
```

**To publish to Figma (publishes the mappings so MCP returns your code):**
```bash
export FIGMA_ACCESS_TOKEN=figd_...
npx figma connect publish
```

## Pillar 2 — Token round-trip (locked)

**Source of truth:** `design/figma-tokens/tokens.json` (DTCG format, exported from Figma Variables).

**Build:** `npm run tokens:build` → writes `src/theme/generated/tokens.ts`.

**Enforcement (already wired):**
- `.husky/pre-commit` rejects hand-edits to `src/theme/generated/tokens.ts` and verifies round-trip when source changes.
- `.github/workflows/figma-tokens.yml` re-runs the build in CI and fails the PR if the generated file would drift.

**To update tokens:** export the latest Figma Variables → drop the JSON into `design/figma-tokens/tokens.json` → `npm run tokens:build` → commit both files together.

## Pillar 3 — Single Figma MCP

**Use only:** the official Figma Dev Mode MCP (HTTP server at `http://127.0.0.1:3845/mcp`, started by the Figma desktop app's Dev Mode).

**Setup once:** Figma desktop → Preferences → "Enable Dev Mode MCP Server".

**No project-level `.mcp.json` is needed or wanted.** It's gitignored. If you must add one (e.g. CI agent), use `.mcp.json.example` as a template and reference `${FIGMA_ACCESS_TOKEN}` from env — never inline a token.

## Pillar 4 — Visual diff command

```bash
export FIGMA_ACCESS_TOKEN=figd_...
npm run figma:check -- "https://www.figma.com/design/CKupz8fZOJEx3IQyUsm4ia/Design-Master-File?node-id=2169-3346" --name=echo-ledger
```

**Output:**
- `docs/visual-qa/<name>/<name>-figma.png` — 3× rendered reference
- `docs/visual-qa/<name>/<name>-spec.json` — full node spec (dimensions, fills, type, layout, child instances)
- `docs/visual-qa/<name>.md` — review checklist; drop a captured RN screenshot at `<name>-rn.png` and link it below the Figma image to do the side-by-side

## The "before any visual change" checklist

When working on a screen or component sourced from Figma, run through this in order. Claude Code: follow it as a hard sequence.

1. **Pull the node spec** — `npm run figma:check -- <node-url> --name=<slug>` (or use the Dev Mode MCP `get_design_context` tool). Read `docs/visual-qa/<slug>.md`.
2. **Rename + relocate assets** — MCP writes assets with hash-named filenames (`c8d28672776d9b14ace323f6fefe0e65784a7b6c.png`). Move them into `src/assets/<slug>/` with meaningful names (`user-avatar.png`, `oval-mirror-fill.png`). **No hash-named filenames in source code, ever.** If MCP refused to write to your target directory, use an allowlisted directory for the initial export and move them yourself.
3. **Inventory tokens** — every color/size/radius/font in the spec must come from `src/theme/tokens.ts` (or the generated bundle). If a value isn't a token, it's wrong: either the design needs a token or the screen is using a literal. Document any unavoidable hard-codes under "Token gap" in the visual-qa report.
4. **Inventory components** — every component instance listed in the spec must already have a `.figma.tsx` Code Connect file. Missing? Add one before continuing.
5. **Check layout** — Figma's `layoutMode`, `gap`, padding values must match the RN container. Auto Layout → Flex.
6. **Edit the screen.**
7. **Capture RN render** — drop a screenshot at `docs/visual-qa/<slug>/<slug>-rn.png`. Side-by-side with `<slug>-figma.png` is the visual diff.
8. **Tick the checklist boxes** in `docs/visual-qa/<slug>.md`. Commit the report along with the code change.

## Realistic accuracy ceiling

| Layer | Achievable | How |
| --- | --- | --- |
| Tokens | 100% | Pillar 2 round-trip |
| Component shape (props, variants) | ~95% | Pillar 1 Code Connect |
| Layout / spacing / typography | ~90% | Pillar 4 visual diff loop |
| Cross-platform pixel parity | not achievable | iOS/Android render text and shadows differently — accept ~3% drift |

True 100% pixel parity isn't real. What this setup gives you is *no surprise drift*: tokens can't desync from Figma, components can't fork from their Figma counterparts unnoticed, and every visual change carries a paired Figma+RN screenshot for review.

## Troubleshooting

- **`tokens:verify` fails on commit** — run `npm run tokens:build`, stage the result, commit both the source and generated file together.
- **`figma connect parse` errors on a `.figma.tsx`** — check the imports point at the right file; Code Connect imports must match `tsconfig.json` paths.
- **MCP returns generic React code instead of my component** — the `.figma.tsx` for that node hasn't been published. Run `npx figma connect publish`.
- **`figma:check` returns 404 on the node** — the URL was for a personal copy or you don't have access; use the share URL from Dev Mode.
