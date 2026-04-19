# Mirror Collective — Design System

## Overview

The design system is a single source of truth for all visual tokens (colors, typography, spacing, radius, shadows) shared between Figma and the React Native codebase.

```
Figma Variables
     │
     ▼
design/figma-tokens/tokens.json   ← exported via Luckino plugin
     │
     ▼  npm run tokens:build
src/theme/generated/tokens.ts    ← generated TypeScript (do not edit)
     │
     ▼
src/theme/tokens.ts              ← primitive palette (references generated)
src/theme/semantic.ts            ← semantic aliases (text.primary, bg.brand…)
src/theme/index.ts               ← public API  →  import { theme, useTheme }
```

---

## Designer Workflow — Updating Tokens

**When design tokens change in Figma:**

1. Open your Figma file
2. Run the **Luckino - Variables Import/Export JSON & CSS** plugin
3. Go to the **Export** tab with these settings:
   - Format: **W3C Design Tokens**
   - Output structure: **Single file**
   - All checkboxes enabled except `$extensions metadata`
   - Prettify output: **on**
4. Click **Export** and download the JSON file
5. Replace `design/figma-tokens/tokens.json` with the downloaded file
6. Run `npm run tokens:build` from the app root
7. Review the diff in `src/theme/generated/tokens.ts`
8. Commit **both** files (`tokens.json` + `generated/tokens.ts`) in one PR

---

## Developer Workflow — Using the Theme

### In components (preferred)
```tsx
import { useTheme } from '@theme';

const MyComponent = () => {
  const theme = useTheme();
  return <Text style={{ color: theme.colors.text.primary }} />;
};
```

### Available theme keys
```ts
theme.colors.text.*          // text.primary, text.heading, text.accent…
theme.colors.background.*    // background.brand, background.surface…
theme.colors.border.*        // border.brand, border.subtle…
theme.colors.button.*        // button.primary, button.disabled
theme.colors.icon.*          // icon.brand, icon.error…
theme.colors.status.*        // status.error, status.success…
theme.spacing.*              // spacing.xxs (4) → spacing.xxxl (40)
theme.borderRadius.*         // borderRadius.xs (8) → borderRadius.full (100)
theme.shadows.*              // shadows.LIGHT, MEDIUM, HEAVY, CONTAINER, GLOW
theme.typography.styles.*    // headline, title, body, button, link, caption…
```

### Migrating off deprecated constants
See [migration-guide.md](./migration-guide.md) for full before/after examples.

---

## Files in this directory

| File | Purpose |
|------|---------|
| `figma-tokens/tokens.json` | Figma export — source of truth for all token values (mobile-first, single values) |
| `style-dictionary.config.mjs` | Pipeline config — transforms tokens.json → TypeScript |
| `token-audit.md` | Conflict resolution log + code-defined tokens needing Figma addition |
| `MOBILE_SCALING_GUIDE.md` | **Mobile-first scaling guide** — responsive functions, device coverage, best practices |
| `DESIGN_SYSTEM_PLAN.md` | Design system roadmap and implementation phases |
| `migration-guide.md` | Component migration examples (using theme vs deprecated constants) |

---

## Mobile-First Responsive Design

**All tokens scale at runtime** for iOS (320px → 428px) and Android devices.

Quick reference for responsive scaling:

```tsx
import { scale, moderateScale, scaleCap, scaleMin } from '@theme';

// Typography — use moderateScale (prevents oversizing)
fontSize: moderateScale(18, 0.5)

// Spacing — use scale
padding: scale(16)

// Touch targets — use scaleMin (accessibility)
minHeight: scaleMin(44, 44)  // iOS: 44×44 minimum

// Max widths — use scaleCap
maxWidth: scaleCap(350, 400)
```

**📖 Full guide:** [MOBILE_SCALING_GUIDE.md](./MOBILE_SCALING_GUIDE.md)

---
| `migration-guide.md` | How to migrate components from `@constants` to `useTheme` |
| `DESIGN_SYSTEM_PLAN.md` | Full phased implementation plan |

---

## npm Scripts

| Script | What it does |
|--------|-------------|
| `npm run tokens:build` | Regenerate `src/theme/generated/tokens.ts` from `tokens.json` |
| `npm run tokens:verify` | Build + fail if generated file is out of sync (used in CI) |

---

## Token Assumptions (pending Figma confirmation)

The following line-height values were assumed — **Figma should be updated to match:**

| Token | Font Size | Assumed Value |
|-------|-----------|---------------|
| `line-height / XS` | 14 | 18 |
| `line-height / 2XL` | 28 | 36 |
| `line-height / 3XL` | 32 | 40 |
| `line-height / 4XL` | 36 | 44 |
| `line-height / 5XL` | 48 | 56 |

## Code-Defined Tokens (not yet in Figma)

These values exist in code but have no Figma variable yet. Designer action needed:

| Token | Value | Used For |
|-------|-------|----------|
| `text.secondary` | `#E5E5E5` | Secondary body text |
| `text.muted` | `rgba(240,240,240,0.5)` | Dimmed/disabled text |
| `text.placeholder` | `#A0A0A0` | Input placeholders |
| `text.caption` | `#C0C0C0` | Caption text |
| `border.primary` | `#F0F0F0` | General borders |
| `border.input` | `#F0F0F0` | Input borders |
| `background.input` | `rgba(217,217,217,0.01)` | Input backgrounds |
| All shadows | Various | Drop shadows — see Phase 8 |
