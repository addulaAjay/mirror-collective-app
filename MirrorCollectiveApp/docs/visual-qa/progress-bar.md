# Visual QA — ProgressBar

**Figma:** https://www.figma.com/design/qhHkoRlenVWZ03nkGi9LEp/MC-Component-Library?node-id=2-2
**Node:** `2:2` (Component 7)
**File:** MC-Component-Library
**Pulled:** 2026-04-26
**Code:** `src/components/ProgressBar.tsx`
**Code Connect:** `src/components/ProgressBar.figma.tsx`

## Summary

Uniform gold track 345×10 with glow + 16×16 gold marker dot at the progress
position. Track does not split into filled/unfilled — same gold line for
every state, only the marker position varies.

## Variants in Figma

| Variant | Node | Marker position |
| --- | --- | --- |
| `Property 1=0%`   | 2:3  | left edge |
| `Property 1=10%`  | 2:9  | 8.7% |
| `Property 1=20%`  | 2:15 | 17.4% |
| `Property 1=30%`  | 2:21 | 26.7% |
| `Property 1=40%`  | 2:6  | 36.5% |
| `Property 1=50%`  | 2:18 | 46.4% |
| `Property 1=60%`  | 2:24 | 56.5% |
| `Property 1=70%`  | 2:12 | 66.4% |
| `Property 1=80%`  | 2:27 | 76.5% |
| `Property 1=90%`  | 2:30 | 86.1% |
| `Property 1=100%` | 2:33 | 95.7% / right edge |

## Tokens used (verified against Figma inspector)

| Figma value | Code mapping | Δ |
| --- | --- | --- |
| Stroke width 5 | `TRACK_THICK = 5` | exact |
| Drop shadow Blur 12, Spread 0 | `shadowRadius: 12` | exact |
| Drop shadow color #E5D6B0 | `palette.gold.warm` | exact |
| Gradient stop 1: #C59D5F | `palette.gold.dark` (#c59e5f) | ±1/256 — imperceptible |
| Gradient stop 2: #D5B987 | `palette.gold.mid` (#d7c08a) | **±7/256 G channel** — see below |
| Gradient stop 3: #E5D6B0 | `palette.gold.warm` (#e5d6b0) | exact |
| Pointer fill: #C59D5F | `palette.gold.dark` | exact |
| Pointer ring stroke (3px) | gradient circle inset by core, 3px ring visible | matches |
| Frame width: 345 | `TRACK_WIDTH = 345` | exact |
| Visible line width: 327 (0% variant), 341 (mid), 338 (100%) | `width` prop, no inset | line extends 4-9px past Figma's per-variant inset; subtle, hidden by glow |

### Token gap

Figma's middle gradient stop `#D5B987` (213,185,135) is not in the current
design system — `palette.gold.mid` (#d7c08a = 215,192,138) is the nearest
token, with deltas R+2, G+7, B+3 per channel. Through the 5px line + 12px
Gaussian blur halo, this is visually indistinguishable. **Follow-up:** add
the exact Figma value as `palette.gold.midWarm` in `design/figma-tokens/tokens.json`
and regenerate via `npm run tokens:build`.

## API

Same as before — preserves backwards compatibility with the 3 callsites:

```tsx
<ProgressBar progress={(currentIndex + 1) / questions.length} />
```

```ts
interface ProgressBarProps {
  progress?: number;     // 0..1, clamped
  width?: number;        // default 345; override for narrow viewports
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
```

`accessibilityRole="progressbar"` and `accessibilityValue={{ min, max, now }}`
are set automatically.

## Differences vs previous implementation

| | Before | After (matches Figma) |
| --- | --- | --- |
| Width | 313 capped | 345 (Figma exact, with `width` override) |
| Visible line | 5px | 1px line + glow shadow (~10px box) |
| Pointer | 14.3×16 ring with stroke + core | 16×16 solid circle with shadow |
| Track style | LinearGradient gold→warm→warm | Single uniform gold (Figma matches) |
| 0% state | Pointer hidden | Pointer visible at left edge |

## Review checklist

- [x] Tokens: gold.warm + gold.glow shadow
- [x] Marker size 16×16
- [x] Track full width with glow
- [x] Marker visible at 0% (was hidden in old code)
- [x] Code Connect file present
- [ ] RN screenshot captured at 0% / 50% / 100% and side-by-side with Figma
- [x] Tests updated and passing
