# Mirror Pledge flow — visual QA checklist

5 screens. All driven from Figma `Design-Master-File` section `2169:1119`. Walk through them in order on iOS device — simulator over-blurs and under-renders Cormorant kerning.

## Reference

- Figma file: Design-Master-File (`CKupz8fZOJEx3IQyUsm4ia`)
- Section: `2169:1119`
- Screens (in nav order): MirrorPledgeIntro → EchoLedger → ViewAllCauses → CausesCarousel → PledgeThankYou

## Common contract

Across every pledge screen:

- [ ] Title is **Cormorant Garamond Regular**, not Inter.
- [ ] Title color is `palette.gold.DEFAULT` (`#f2e1b0`), with `Glow Drop Shadow`.
- [ ] Body text is **Inter Regular** at `font/size/S` (16px) / `font/line-height/M` (24px).
- [ ] Glass cards use the `<GlassCard>` component (frosted blur + 8%→2% white tint + Border/Subtle hairline + Radius/S 12).
- [ ] No legacy `palette.gold.warm` used anywhere (Figma callouts are `gold.DEFAULT`).
- [ ] All buttons render via `<Button>` from `@components/Button`.

## Screen 1 — MirrorPledgeIntro (`2477:1378`)

- [ ] Title "THE MIRROR PLEDGE" — Heading L (Cormorant 32px / 40 lh).
- [ ] Hand-heart SVG illustration, ~280×280, centered.
- [ ] Body copy: "2% of your subscription supports causes that matter. Each quarter, the community votes. You see exactly where the impact goes." in Inter 16/24, gold.subtlest.
- [ ] No card / border around the body text.
- [ ] Button: Primary L "SEE HOW IT WORKS" — navigates to EchoLedger.

## Screen 2 — EchoLedger (`2169:3346`)

- [ ] Title "ECHO LEDGER" — Heading M (Cormorant 28px / 32 lh).
- [ ] Gold circular ring (~280px diameter, 2px gold border, soft gold glow shadow).
- [ ] Inside ring: "$88K" in large Cormorant cream/white text, plus italic subline "across causes supported by the Mirror community" in Inverse Paragraph-2 `#a3b3cc`.
- [ ] Below ring: plain Body S paragraph (no card surround) — "This is what collective reflection can do. Small acts. Shared intention. Real-world impact. Updated live. Accountable always."
- [ ] Button: Primary L active "PLEDGE SUPPORT" — navigates to ViewAllCauses.

## Screen 3 — ViewAllCauses (`2169:3153`)

- [ ] Title "VIEW ALL CAUSES" — Heading L (Cormorant 32px / 40 lh).
- [ ] **7 full-width row cards** (NOT a 2-column grid). Each row:
  - Glass card (Radius/S 12, Border/Subtle, frosted blur).
  - Icon on left (~32px gold) + label on right (Cormorant Heading S 24px gold).
  - 12-16px gap between rows.
- [ ] Cause order: WOMEN'S CANCER · ANIMAL WELFARE · MENTAL HEALTH · ENVIRONMENT · WOMEN + CHILDREN · EDUCATION · HUMAN RIGHTS.
- [ ] Verify "WOMEN + CHILDREN" uses `+`, not `&` or "AND".
- [ ] Tapping a row navigates to CausesCarousel and starts on that cause (no swipe needed).
- [ ] No auto-navigation timer (the 2.5s autonav was removed — staying on screen indefinitely is correct).

## Screen 4 — CausesCarousel (`2169:1120` and 6 sibling variants)

- [ ] Small "CAUSES" header — Heading XS Bold (Cormorant Medium 20px).
- [ ] Glass card per cause: Heading M title (uppercase), large icon (~96px) centered, Body S description.
- [ ] **7 pagination dots** below the card. Active dot is gold (`palette.gold.DEFAULT`), inactive dots are dimmed navy.
- [ ] Bottom row: back-arrow button (square 48×48, hairline border) on the left, **PLEDGE** Primary L button center, spacer matching back-button width on the right (keeps PLEDGE centered).
- [ ] Swipe horizontally cycles between the 7 causes; pagination dot tracks the active page.
- [ ] If arrived from ViewAllCauses with `initialCauseId`, carousel starts on that cause (verify Women + Children → tap row → carousel opens at index 4, dots show position 5/7).
- [ ] Back arrow goes back to ViewAllCauses (not navigates explicitly — uses `goBack()`).
- [ ] PLEDGE button → navigates to PledgeThankYou.

## Screen 5 — PledgeThankYou (`2185:3605`)

- [ ] Glass card centered on screen.
- [ ] "THANK YOU!" — Heading M (Cormorant 28px / 32 lh, gold).
- [ ] "Your echo has been counted." — Cormorant **Italic** Heading S size.
- [ ] "Together, we decide where to make a difference." — Inter **Italic** 16px (Body S Italic).
- [ ] Gold star icon at the bottom of the card (using `<StarIcon>`).
- [ ] Button (below card): Primary L "HOMEPAGE" — calls `updatePledgeAcceptance()` then resets nav to `MirrorChat`.
- [ ] If the API call fails, the navigation should still happen (don't block on a network error).

## Reduced Transparency (iOS)

1. Settings → Accessibility → Display & Text Size → **Reduce Transparency** → ON.
2. Reload the app.

- [ ] Glass cards on all 5 screens fall back to a solid `palette.navy.card` tint instead of vanishing.
- [ ] Echo Ledger gold ring still renders (it's just a `View` border, not a blur surface).
- [ ] All text remains legible.

## Cross-screen smoke pass

End-to-end nav flow:

1. Launch → MirrorPledgeIntro
2. Tap "SEE HOW IT WORKS" → EchoLedger
3. Tap "PLEDGE SUPPORT" → ViewAllCauses
4. Tap a cause row → CausesCarousel (correct initial cause)
5. Swipe carousel → pagination dot tracks
6. Tap "PLEDGE" → PledgeThankYou
7. Tap "HOMEPAGE" → reset to MirrorChat

If any step fails or visuals don't match Figma, file a follow-up; don't merge.
