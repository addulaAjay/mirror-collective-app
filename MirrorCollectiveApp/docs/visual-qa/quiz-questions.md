# Visual QA — Quiz Questions screen

**Figma:**
- Text quiz: https://www.figma.com/design/CKupz8fZOJEx3IQyUsm4ia/Design-Master-File?node-id=203-2405
- Image quiz: https://www.figma.com/design/CKupz8fZOJEx3IQyUsm4ia/Design-Master-File?node-id=203-2425
- Option button component: https://www.figma.com/design/CKupz8fZOJEx3IQyUsm4ia/Design-Master-File?node-id=248-2655

**Code:**
- `src/screens/QuizQuestionsScreen.tsx`
- `src/components/OptionsButton.tsx`
- `src/components/ImageOptionButton.tsx`

## Changes in this branch (`feat/quiz-questions-redesign`)

### 1. Next / Finish button — forced to ALL CAPS

i18n labels remain `"Next"` / `"Finish"` (locale-respectful). The screen now wraps with `.toUpperCase()`:

```tsx
title={(isLast ? t('quiz.quizQuestions.finishButton') : t('quiz.quizQuestions.nextButton')).toUpperCase()}
```

Variant left as `primary` — Figma node 248:2698 references the MC Library Button at 125:342, which is the primary-variant render.

### 2. OptionsButton — pixel-matched to Figma 248:2655

| Property | Before | After (Figma exact) |
| --- | --- | --- |
| Unselected bg | flat `palette.surface.DEFAULT` | gradient `rgba(253,253,249,0.01)→0` (Frame 247) |
| Selected bg | `glassGradient.card.start/end` | gradient `rgba(253,253,249,0.03)→0.2` (Frame 248) |
| Unselected padding | 8v / 16h | **8 all sides** |
| Selected padding | 8v / 16h | 8v / 16h ✓ |
| Unselected shadow | black `(0,0,0,0.1)` blur 19 | **none** (Figma) |
| Selected shadow | `textShadow.glow` opacity 1 | `palette.gold.glow` opacity 0.3 blur 10 (Figma rgba(240,212,168,0.3)) |
| Text shadow | `textShadow.warmGlow` (rgba(229,214,176,0.5)) | `textShadow.glow` (rgba(240,212,168,0.3)) — Figma exact |

Added `accessibilityRole="radio"` + `accessibilityState={{ selected }}`.

### 3. Text quiz layout (203:2405) — already matched

Verified against Figma node — no changes needed:

| Figma | Code |
| --- | --- |
| `padding-x: 40px` | `paddingHorizontal: scale(40)` ✓ |
| Question width 313 | `width: scale(313)` ✓ |
| Question → options gap 60px | `marginBottom: verticalScale(60)` ✓ |
| Progress bar w 345 | matches new ProgressBar (345 default) |

### 4. Image grid — 30 → 40 gap

Figma 203:2425 specifies a 280×280 grid container with **40px gap** between four 120×120 image options. Was using 30px.

```tsx
imageGrid: {
  rowGap:    verticalScale(40),  // was 30
  columnGap: scale(40),          // was 30
  width:     scale(280),         // explicit Figma frame
  alignSelf: 'center',
}
```

## Token gaps (none)

All values map cleanly to existing palette/textShadow tokens.

## Review checklist

- [x] Next/Finish renders in ALL CAPS for both en + es
- [x] OptionsButton unselected has no shadow, transparent gradient
- [x] OptionsButton selected has gold glow, more visible white gradient
- [x] OptionsButton text uses `textShadow.glow` (Figma rgba(240,212,168,0.3))
- [x] Image grid uses 40px gap, 280px container width
- [x] 22 unrelated component tests still passing
- [x] Lint clean (1 pre-existing useEffect-deps warning unrelated to these changes)
- [ ] **Manual on simulator** — verify Next/Finish caps, OptionsButton selected/unselected visual, image grid spacing
- [ ] Screenshot side-by-side at `docs/visual-qa/quiz-questions/` (text + image variants)

## Known follow-ups

- `QuizQuestionsScreen.test.tsx` is pre-existing broken (missing `GradientButton` module) — not regressed by these changes, but should be fixed.
- `OptionsButton` doesn't have a unit test yet. Worth adding now that the visual contract is locked in.
