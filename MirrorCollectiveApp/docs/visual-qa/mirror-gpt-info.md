# Visual QA — MirrorGPT "Capture your reflection" info modal

**Figma:** Dev-Master-File → header/screen node `7811-2866`, modal node `7915-4583`
**Feature:** an `(i)` info button in the MirrorGPT header that opens a one-page
modal explaining the copy-to-Echo-Vault flow.

## Summary

The MirrorGPT header title row gains a gold circled-`i` button (right side,
title stays optically centered via a matching left spacer). Tapping it opens a
centered card modal:

```
CAPTURE YOUR REFLECTION
Tap the copy icon in Mirror GPT to grab the lesson, insight, or memory you
want to keep. You’ll jump straight to the Echo Vault—just create a new Echo,
and your copied content will already be there waiting for you.
            [ content_copy glyph ]
   “Learn something → copy it → save it for later.”
```

Dismisses on the top-right `×` or a backdrop tap.

## Implementation

- **`src/components/MirrorGptInfoModal.tsx`** (new): RN `Modal`
  (`transparent`, `animationType="fade"`) → dimmed scrim (`modalColors.backdrop`)
  → `GlassCard` (navy card + hairline border) with a gold glow shadow. Single
  page: close row, heading, body, centered `content_copy` SVG glyph, italic
  footer. Copy is authored verbatim from Figma node `7915-4583`.
- **`src/screens/MirrorChatScreen.tsx`**: title `<Text>` → a `titleRow`
  (`spacer | title(flex:1, centered) | (i) button`); `infoVisible` state;
  renders `<MirrorGptInfoModal>`. New inline `InfoGlyph` (circled-i) SVG.

Chose a focused component over reusing `features/reflection-room/InfoOverlay`
because that overlay is paginated and has no inline icon slot — this design is a
single page whose whole point is the centered copy glyph.

## Tokens (Figma → app)

| Figma | Value | App token |
| --- | --- | --- |
| Bg/Brand, Text/Paragraph-1 | `#f2e2b1` | `palette.gold.DEFAULT` — title, icons, footer |
| Bg/Brand Subtlest | `#fdfdf9` | `palette.gold.subtlest` — body text |
| Border/Subtle | `#a3b3cc` | `palette.navy.light` — GlassCard hairline |
| Heading S (Cormorant) | 24 / lh 28 | `fontFamily.heading`, `fontSize.xl`, `lineHeight.l` |
| Body S (Inter) | 16 / lh 24 | `fontFamily.body`, `fontSize.s`, `lineHeight.m` |
| Body XS Italic (Inter) | 14 / lh 20 | `fontFamily.bodyItalic`, `fontSize.xs`, `lineHeight.s` |
| Radius/M | 16 | `radius.m` |
| Spacing/XL | 24 | `spacing.l` (card padding) |

No token gaps.

## Notes / deviations

- **Gold glow shadow** approximates Figma's "Background Blur" effect
  (drop shadow `#F2E2B1 @ 30%`, radius 15) via RN `shadow*`/`elevation` rather
  than a real backdrop blur — consistent with `GlassCard`'s documented choice to
  avoid `BlurView` (which blurs the night-sky background and reads as
  transparent on device).
- **`content_copy` glyph** is drawn inline (no copy icon existed in the app);
  gold, 24×24, 1.6 stroke — matches the app's inline-SVG icon convention
  (`MessageBubble` SaveIcon).
- **RN screenshot capture pending**: drop the on-device render at
  `docs/visual-qa/mirror-gpt-info/mirror-gpt-info-rn.png` for the side-by-side.
  Reference Figma render: node `7915-4583`.

## Checklist

- [x] Tokens sourced from theme (no literals)
- [x] Layout matches Figma (centered card, close top-right, icon centered)
- [x] Copy verbatim from Figma
- [x] Unit + integration tests pass
- [ ] RN screenshot captured + side-by-side reviewed (manual, needs running app)
