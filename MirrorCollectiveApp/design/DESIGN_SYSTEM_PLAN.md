# Mirror Collective — Design System Plan

## Status: Phase 6 complete — working on Phase 6b (hex cleanup)

---

## Guiding Principles

- **Single source of truth** — one token file, everything else re-exports from it
- **Figma-driven** — code tokens mirror Figma token names 1:1 so regeneration is lossless
- **Incremental** — each phase is independently mergeable; no big-bang rewrite

---

## Token Assumptions (needs Figma confirmation)

The following line-height values were assumed based on the existing code theme and the ratio pattern from defined Figma values. **Figma should be updated to match these.**

| Token | Font Size | Assumed Line Height | Ratio | Basis |
|-------|-----------|---------------------|-------|-------|
| `line-height.XS` | 14 | **18** | 1.29x | Consistent with XXS (1.33x), matches existing code |
| `line-height.2XL` | 28 | **36** | 1.29x | Matches existing code `3xl: 36` |
| `line-height.3XL` | 32 | **40** | 1.25x | Matches Figma L line-height, close to code `4xl: 42` |
| `line-height.4XL` | 36 | **44** | 1.22x | Consistent downward trend for display sizes |
| `line-height.5XL` | 48 | **56** | 1.17x | Standard for large display text |

**Action for designer:** Verify these values in Figma and update the line-height variable collection to include all 10 steps matching the font size scale.

---

## Completed Phases

| Phase | Description | Completed |
|-------|-------------|-----------|
| 0 | Figma Token Intake (Luckino export → `design/figma-tokens/tokens.json`) | ✅ |
| 1 | Token Consolidation — `tokens.ts` + `semantic.ts`, deprecated constants with re-exports | ✅ |
| 2 | ThemeProvider + `useTheme()` hook, wrapped App.tsx | ✅ |
| 3 | Style Dictionary pipeline — `npm run tokens:build` → `src/theme/generated/tokens.ts` | ✅ |
| 4 | Responsive utility — `scale`, `verticalScale`, `moderateScale`, `scaleCap`, `scaleMin` | ✅ |
| 5 | Button unification — `Button` with `variant: 'gradient' \| 'auth'`; old buttons deprecated | ✅ |
| 6 | Screen/component migration off deprecated constants; deleted `colors.ts`, `dimensions.ts`, `shadows.ts` | ✅ |

---

## Phase 6b: Hex Literal Cleanup *(next)*

**Priority:** HIGH | **Depends on:** Phase 6 complete  
**Current state:** ~418 hardcoded hex values remain in screens, ~88 in components

### Goal
Replace hardcoded hex strings with `palette.*`, `theme.colors.*`, or `theme.typography.*` references. Any value not yet in the token system gets added to `tokens.ts` first.

### Steps

1. **Add ESLint rule** (`no-restricted-syntax` or custom) that warns on hex literals outside `src/theme/`
   - Start as **warning** — escalate to **error** after cleanup is complete
   - Config in `.eslintrc.js` or `eslint.config.js`

2. **Audit remaining hex values** → group into:
   - Already in palette (just needs the reference swapped)
   - Close but not exact (needs token added or designer confirmation)
   - One-off values (decide: add token or accept inline)

3. **Migrate screens in order** (highest hex count first):
   - `QuizQuestionsScreen.tsx`
   - `QuizWelcomeScreen.tsx`
   - `MirrorChatScreen.tsx`
   - `EchoVaultHomeScreen.tsx` / `EchoVaultLibraryScreen.tsx`
   - Remaining screens

4. **Migrate components** (highest hex count first):
   - `OptionsButton.tsx`
   - `ImageOptionButton.tsx`
   - `BackgroundWrapper.tsx`
   - Remaining components

5. **Escalate lint rule to error** once all violations resolved

**Success criteria:** Zero ESLint warnings for hex literals outside `src/theme/`. All colors traceable to a named token.

---

## Phase 7: Font Integration

**Priority:** HIGH (confirmed intentional additions) | **Depends on:** Phase 1 complete  
**Current state:** Cormorant Garamond installed; Playfair Display + Inter referenced in Figma but not in app

| Family | Usage | Status |
|--------|-------|--------|
| Cormorant Garamond | Headings | Already installed ✅ |
| Playfair Display | Titles | **Not in app — needs adding** |
| Inter | Body text | **Not in app — needs adding** |

### Steps

1. **Download font files**
   - `Playfair Display`: Regular, Medium, SemiBold, Bold, Italic variants
   - `Inter`: Regular, Light, Medium, SemiBold, Bold variants
   - Add `.ttf` files to `src/assets/fonts/`

2. **Register fonts**
   - Add to `react-native.config.js` under `assets`
   - Run `npx react-native-asset` to link

3. **Update `src/theme/tokens.ts`**
   - Uncomment and fill `fontFamily.title` and `fontFamily.body` entries
   - Map all weights: `fontFamily.titleRegular`, `fontFamily.bodyRegular`, etc.

4. **Update semantic typography**
   - Wire `title` / `titleLarge` styles → `Playfair Display`
   - Wire `body` / `bodySmall` / `caption` / `input` styles → `Inter`
   - Keep Cormorant Garamond for `heading*` styles

5. **QA audit** — find every screen using CormorantGaramond for body copy; flag for visual review

**Success criteria:** All 3 families load on device. `theme.typography.styles.*` uses correct family per Figma spec. No missing-font fallback warnings in dev.

---

## Phase 8: Shadow Tokens

**Priority:** MEDIUM | **Depends on:** Phase 1 complete  
**Current state:** Shadows are code-defined in `tokens.ts` (`LIGHT`, `MEDIUM`, `HEAVY`, `CONTAINER`, `GLOW`). Not in Figma.

### Decision needed from designer
- **Option A:** Add shadow variables to Figma Shadows collection → re-export via Luckino → include in pipeline (keeps Figma as single source of truth)
- **Option B:** Keep shadows code-defined in `src/theme/tokens.ts` (acceptable since shadows rarely change)

### Steps (after decision)
- **If Option A:** Designer adds Shadows collection; developer updates `style-dictionary.config.mjs` to handle shadow tokens; regenerate
- **If Option B:** Document in `design/token-audit.md` as intentional code-defined tokens; no further action

**Success criteria:** Decision documented. If Option A, shadows flow through the pipeline same as color/spacing tokens.

---

## Phase 9: Theme Tests

**Priority:** MEDIUM | **Depends on:** Phases 1–3 complete  
**Current state:** `src/__tests__/` exists with `jest.setup.js` but no theme-specific tests

### Steps

1. **Unit tests for `tokens.ts`** — verify all palette values are valid hex/rgba, spacing values are numeric, no undefined entries

2. **Unit tests for `semantic.ts`** — verify all semantic keys resolve to non-empty strings, all references point to existing palette keys

3. **Unit tests for `responsive.ts`** — verify `scale`, `verticalScale`, `moderateScale`, `scaleCap`, `scaleMin` return numeric output within expected bounds at common screen sizes (375, 390, 414, 428)

4. **Snapshot test for `theme` export** — locks the full shape of the theme object so regressions are immediately visible

5. **Test for generated tokens** — verify `src/theme/generated/tokens.ts` shape matches `design/figma-tokens/tokens.json` structure (catch pipeline breaks early)

**Success criteria:** 80%+ coverage on `src/theme/`. All tests pass in CI.

---

## Phase 10: Dark Mode *(optional — low priority)*

**Priority:** LOW | **Depends on:** Figma dark theme variant + Phase 7

- Designer creates dark variant in Figma with separate variable modes
- Export dark tokens via Luckino (second export with dark mode active)
- Add `src/theme/themes/dark.ts`
- `ThemeProvider` reads `useColorScheme()` from React Native
- User preference override stored in async storage

---

## Suggested PR Sequence (updated)

| PR | Content |
|----|---------|
| 1–6 | ✅ Phases 1–6 complete |
| 7 | Phase 6b — ESLint hex rule + screen hex cleanup |
| 8 | Phase 7 — Font integration (Playfair Display + Inter) |
| 9 | Phase 8 — Shadow token decision + implementation |
| 10 | Phase 9 — Theme tests (80% coverage) |
| Optional | Phase 10 — Dark mode |

---

## Open Designer Actions

| Item | Priority | Notes |
|------|----------|-------|
| Confirm/update 5 assumed line-height values | HIGH | See Token Assumptions table above |
| Add 9 code-defined tokens to Figma | MEDIUM | Secondary text, muted, placeholder, borders, input bg, shadows — listed in `design/token-audit.md` |
| Shadow tokens decision (Option A or B) | MEDIUM | Phase 8 blocked until decided |
| Confirm Playfair Display + Inter usage scope | HIGH | Phase 7 needs exact font weights used per component in Figma |

---

## Success Criteria

- [x] Single source of truth for all design tokens
- [x] Zero token value conflicts between files
- [x] Figma `tokens.json` drives code tokens via `npm run tokens:build`
- [x] `useTheme()` hook available and documented
- [x] Zero imports from deprecated `src/constants/` design constants
- [x] One unified `Button` component with variant API
- [x] Responsive utility replaces all inline `screenWidth / DESIGN_WIDTH` math
- [ ] ESLint rule prevents hex literal regression *(Phase 6b)*
- [ ] Zero hardcoded hex values in `src/screens/` and `src/components/` *(Phase 6b)*
- [ ] CI job verifies generated tokens match committed `tokens.json` *(Phase 6b)*
- [ ] Playfair Display and Inter fonts installed and wired *(Phase 7)*
- [ ] Shadow tokens decision made and implemented *(Phase 8)*
- [ ] 80%+ test coverage on theme module *(Phase 9)*
- [ ] Visual regression baseline established *(Phase 9)*
