# Echo Library — visual QA

**Figma source:** Design-Master-File → Echo Vault Library, node `211:1449`
**Implementation:** `src/screens/echoVault/EchoVaultLibraryScreen.tsx`
**Branch:** `feat/echo-library-figma-match`

## Scope

Bring `EchoVaultLibraryScreen` in line with Figma node 211:1449 and ensure
the layout adapts cleanly across phone widths (320pt – 430pt).

## Visual deltas closed

| # | Element | Before | After |
|---|---------|--------|-------|
| 1 | Header row | Centered `ECHO LIBRARY` only | Back-arrow + centered title + invisible spacer (mirrors ForgotPassword/ResetPassword header pattern) |
| 2 | Delivered echo row | Single row, no status indicator | Row + centered `✓ Echo Sent` pill rendered below for any echo with no `scheduled_at` |
| 3 | Title in row | Single-line w/ ellipsis | Up to 2 lines (`numberOfLines={2}`) so long titles wrap before truncating |
| 4 | Recipient label | No truncation policy | `numberOfLines={1}` + `flexShrink: 1`; ellipsizes before pushing the lock icon off-screen |

## Responsiveness work

| Issue | Fix |
|-------|-----|
| `rowLeft` had `maxWidth: scale(200)` — clipped titles on narrow phones and wasted space on wide phones | Removed; replaced with `flex:1` + `minWidth: 0` so the column adapts to the actual viewport |
| `rowRight` had no shrink/grow policy — could collapse or overflow with long recipient names | Added `flexShrink: 0` + `maxWidth: '40%'` to guarantee lock icon stays visible while allowing the label to truncate |
| Row had no horizontal gap | Added `gap: scale(spacing.s)` (12px) so `rowLeft` and `rowRight` keep breathing room |
| Title used fixed `width: '100%'` (worked, but only by accident inside flex parent) | Now uses `flex: 1` so it truly fills the space between back button and spacer regardless of screen width |

All sizing helpers use `scale()` / `verticalScale()` / `moderateScale()` from
`@theme`, so dimensions scale proportionally to the 393pt design baseline.

## Tested viewport widths (mental model)

- **320pt** (iPhone SE 1st gen): `scale(24)` gutter ≈ 19.5px; `scale(271)`
  CTA ≈ 221px — both CTAs fit with comfortable margin.
- **393pt** (Figma baseline): everything renders at 1:1.
- **430pt** (iPhone 15 Pro Max): scales up proportionally; row content
  has even more room, no overflow.

## Token gap

None. The Echo Sent pill uses approximated values:

- Border: `palette.navy.medium` (#60739f, `Border/Inverse-1`)
- Background: `rgba(96, 115, 159, 0.18)` — translucent navy, since Figma
  references a `Transparent White Gradient` token that has no concrete
  value exported. If the design system later resolves that variable to a
  concrete fill, swap it here.
- Check icon fill: `palette.navy.medium` — matches border for monochrome
  cohesion.

## Follow-ups (not in this PR)

- The Figma also shows a slightly different avatar treatment (no inner
  ring glow) in one row. Current implementation keeps the glow for all
  rows — confirm with design before changing.
- `Echo Sent` derivation is currently `!scheduled_at`. If the API later
  adds an explicit `delivered_at` or `status` field, swap to that for
  accuracy.
