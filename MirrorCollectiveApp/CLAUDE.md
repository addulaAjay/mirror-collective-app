# Project rules — MirrorCollectiveApp

> Loaded into every Claude Code session. Keep tight; link out for detail.

## Figma → React Native workflow (REQUIRED)

For any work driven by a Figma design, **follow the 7-step checklist** in [`docs/FIGMA_WORKFLOW.md`](./docs/FIGMA_WORKFLOW.md). The non-negotiables:

### Asset rule

**Vector before raster.** When a Figma asset is shaped (icon, badge, mirror rim, ring, illustration), ask for the SVG export first. Drop to PNG only when the asset is genuinely raster — photos, complex gradient textures, baked shadows. Vector assets imported via `react-native-svg-transformer` (already configured in `metro.config.js`) render at any scale without bundle bloat or detail loss, and self-contained "full-circle" SVGs (ring + content baked in) eliminate the need for a wrapping border View entirely.

The Figma Dev Mode MCP exports image assets with hash-named filenames (`c8d28672776d9b14ace323f6fefe0e65784a7b6c.png`). **Never check those names into a screen's source code.** As soon as MCP returns asset paths:

1. Create `src/assets/<screen-or-feature-slug>/` if it doesn't exist.
2. **Run `file <hash>.png` on each export to get the dimensions.** Match each PNG to its render role by aspect ratio against the Figma frame, not by import order. A 3981×1691 panorama is not the fill for a 183×275 portrait — getting this wrong produces a solid-color render at runtime.
3. **Move and rename** every hash-named PNG/SVG into that folder with a meaningful name (`user-avatar.png`, `oval-mirror-fill.png`, `icon-mirror-echo.png`).
4. Reference the renamed assets in code via `require('@assets/<slug>/<name>.png')`.
5. The hash-named originals must not remain in `src/assets/pledge/` (or anywhere else) after the import — they're either renamed or deleted.

If the target asset directory isn't on Figma Dev Mode's allowlist, MCP will refuse to write. In that case, use an allowlisted directory (e.g. `src/assets/pledge/`) for the initial export, then move + rename per the rule above. Document the allowlist gap in the screen's `docs/visual-qa/<slug>.md`.

### Bordered ring rule

When a Figma design has a circular gold-bordered icon container, **default to no `backgroundColor`** on the ring — let the parent's starfield/background show through. Only set a background if the design clearly fills the inside with a different color. Defaulting to `palette.navy.deep` blocks the starfield and visibly mismatches the design.

### Token rule

`src/theme/generated/tokens.ts` is generated. Never hand-edit it. Sources flow:

```
Figma Variables → design/figma-tokens/tokens.json → npm run tokens:build → src/theme/generated/tokens.ts
```

The pre-commit hook and CI rejects drift. If a Figma variable doesn't exist as a code token, add it to `tokens.json` rather than hard-coding the value. Document any unavoidable hard-codes in the screen's `visual-qa` report under "Token gap".

### Component rule

Every component sourced from a Figma node should have a `<Component>.figma.tsx` Code Connect file alongside it (see existing `Button.figma.tsx`). When MCP returns a node that maps to one of these, the agent uses the linked code shape — no guessing.

### MCP rule

Use **only** the official Figma Dev Mode MCP at `http://127.0.0.1:3845/mcp` (configured at user level via the Figma desktop app). Do not add a project-level `.mcp.json` — it's gitignored. The third-party `figma-developer-mcp` is deprecated for this repo.

### Visual-QA rule

Every Figma-driven change writes a `docs/visual-qa/<slug>.md` report and stores the Figma reference render at `docs/visual-qa/<slug>/<slug>-figma.png`. Use `npm run figma:check -- <node-url> --name=<slug>` to bootstrap the report (requires `FIGMA_ACCESS_TOKEN`).

## Stack quick-reference

- **Framework:** React Native 0.80, React 19, TypeScript 5
- **Navigation:** React Navigation native-stack
- **Styling:** Theme tokens at `src/theme/`, scale helpers (`scale`, `verticalScale`, `moderateScale`)
- **Path aliases:** `@theme`, `@components`, `@context`, `@services`, `@types`, `@assets`
- **SVG:** `react-native-svg`. Components live in `src/components/icons/` or co-located.
- **Testing:** Jest + `@testing-library/react-native`. Mocks in `src/__tests__/jest.setup.js`.

## Useful commands

```bash
npm run tokens:build       # rebuild tokens.ts from figma-tokens/tokens.json
npm run tokens:verify      # rebuild and fail if generated file drifted
npm run figma:check -- <node-url> --name=<slug>   # spec-sheet from Figma
npx figma connect parse    # validate Code Connect mappings
npx figma connect publish  # publish mappings to Figma (requires token)
npm test                   # jest
npx tsc --noEmit           # typecheck
```
