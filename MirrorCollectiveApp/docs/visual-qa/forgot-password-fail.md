# Visual QA — Forgot Password (Fail state)

- **Figma node:** `4928:7982` ([Dev Master File](https://www.figma.com/design/xn6MdQV0gGGeedaFtHWWCo/Dev-Master-File?node-id=4928-7982))
- **Frame name:** `Forgot Password -  Fail`
- **Frame size:** 393×852 (iPhone)
- **Source:** `src/screens/ForgotPasswordScreen.tsx`

## Tokens applied

| Element | Token / value |
|---|---|
| Title `FORGOT PASSWORD?` | Heading M — Cormorant Regular 28/32, `palette.gold.DEFAULT` (#f2e1b0), Glow Drop Shadow |
| Subtitle | Heading XS — Cormorant Regular 20/24, `palette.gold.subtlest` (#fdfdf9) |
| Email input | Existing `TextInputField` with size="M" — gradient bg + 0.5px subtle border, radius 16 |
| Error icon | 20×20 SVG, `palette.status.error` (#f83b3d) |
| Error text | Body XS — Inter Regular 14/20, `palette.status.error` |
| SEND LINK button bg | LinearGradient `rgba(253,253,249,0.01)` → `rgba(253,253,249,0)` |
| SEND LINK button border | 0.5px solid `palette.navy.light` (#a3b3cc) |
| SEND LINK button radius | top-right `radius.m` (16), other three `radius.s` (12) — asymmetric per Figma |
| SEND LINK button label | Cormorant Regular 24/28, gold, warmGlow shadow @ 15px |
| Back to Login link | Cormorant Regular 24/28, gold, underlined |

## Token gaps

None — all visual properties map to existing theme tokens.

## Layout

| Spec | Figma | Implementation |
|---|---|---|
| Content column width | 345 | `width: '100%'` inside `paddingHorizontal: scale(24)` on a 393pt frame ≈ 345 |
| Top offset | 212 from page top | `paddingTop: verticalScale(72)` after `LogoHeader` (~140 tall) |
| Section gap | 40 | `gap: verticalScale(40)` |
| Header row | flex row, justify-between | matches |
| Email + error gap | 8 | `gap: verticalScale(8)` |

## Behavior

- **Back arrow** in the header navigates to `Login` (matches "Back to Login" semantics).
- **Decorative right-side icon** in Figma (`Component 2`, mirrored arrow_back) is rendered as an invisible `headerSpacer` so the title stays centered.
- **SEND LINK** dispatches `forgotPassword(email)`, dims to `opacity: 0.6` while in flight.
- **Error row** appears below the input only when `state.error` is set.
- **Success state** (post-submit) reuses the same SEND LINK button styling for `Continue` to keep the visual language consistent across both states.

## Out of scope

- The Figma frame includes Android status bar + nav bar mockups (`4928:8059`, `4928:8051`) — handled by RN's `SafeAreaView` + the system's actual chrome at runtime; not pixel-replicated.
- The `imgForgotPasswordFail` PNG asset referenced in the Figma export (the dark starfield background) is **not** imported into the screen — `BackgroundWrapper` already provides the project-wide starfield.

## QA checklist

- [ ] Header arrow navigates to Login when tapped.
- [ ] Title renders with glow shadow and stays centered with arrow on left.
- [ ] Email input matches the gradient + subtle border pattern.
- [ ] Error row only appears after a failed submission and uses the red token.
- [ ] SEND LINK button shows the asymmetric top-right corner (16) vs the others (12).
- [ ] Loading state dims the button.
- [ ] "Back to Login" underlined link navigates to Login.
- [ ] Verified on iPhone 16 Pro simulator + at least one smaller device (iPhone SE) for `moderateScale` proportions.
