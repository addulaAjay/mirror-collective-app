# Token Audit — Conflict Resolution

## Decision: Figma tokens.json is the single source of truth

All semantic color values must trace back to a Figma token.
Where no Figma token exists, values are marked as **code-defined** and flagged for designer review.

---

## Color Conflict Resolution

| Semantic Role | Old Code Value | Figma Token | Figma Value | **Canonical** | Visual Change |
|---------------|---------------|-------------|-------------|---------------|---------------|
| `text.primary` | `#F0F0F0` | `Colour.Text.Paragraph-2` | `#fdfdf9` | **`#fdfdf9`** | Minimal — slightly warmer white |
| `text.accent` | `#F5E6B8` | `Colour.Text.Paragraph-1` | `#f2e2b1` | **`#f2e2b1`** | Minimal — same warm gold, slightly deeper |
| `text.headline` | `#F5E6B8` | `Colour.Text.Paragraph-1` | `#f2e2b1` | **`#f2e2b1`** | Minimal |
| `text.link` | `#F5E6B8` | `Colour.Text.Paragraph-1` | `#f2e2b1` | **`#f2e2b1`** | Minimal |
| `text.heading` (style) | `#F5E6B8` | `Colour.Text.Heading` | `#c59e5f` | **`#c59e5f`** | Notable — darker gold |
| `button.primary` | `#F5E6B8` | `Colour.Bg.Brand` | `#f2e2b1` | **`#f2e2b1`** | Minimal |
| `background.brand` | `#f2e2b1` | `Colour.Bg.Brand` | `#f2e2b1` | **`#f2e2b1`** | No change ✓ |
| `border.brand` | `#f2e2b1` | `Colour.Border.Brand` | `#f2e2b1` | **`#f2e2b1`** | No change ✓ |

---

## Code-Defined Values (no Figma token — needs designer review)

| Token | Value | Used For | Action |
|-------|-------|----------|--------|
| `text.secondary` | `#E5E5E5` | Secondary body text | Add to Figma as `Text/Secondary` |
| `text.muted` | `rgba(240,240,240,0.5)` | Dimmed/disabled text | Add to Figma |
| `text.placeholder` | `#A0A0A0` | Input placeholders | Add to Figma |
| `text.caption` | `#C0C0C0` | Caption text | Add to Figma |
| `border.primary` | `#F0F0F0` | General borders | Map to `Colour.Border.Subtlest` or add to Figma |
| `border.input` | `#F0F0F0` | Input borders | Map to `Colour.Border.Subtlest` or add to Figma |
| `background.input` | `rgba(217,217,217,0.01)` | Input backgrounds | Add to Figma |
| `inputPlaceholder.color` | `#E8F1F2` | Input placeholder | Add to Figma |
| All shadows | Various | Drop shadows | Add Shadows collection to Figma (Phase 8) |

---

## constants/ conflict (now resolved)

`constants/colors.ts` TEXT.PRIMARY (`#1a2238`) was a leftover light-mode value.
It is now correctly mapped to `palette.navy.DEFAULT` — the inverse text color — not the primary text color.
All `constants/` files are deprecated and re-export from `@theme`.
