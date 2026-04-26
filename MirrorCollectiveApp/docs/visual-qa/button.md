# Button — visual QA checklist

Snapshot tests cover structural contract (`src/components/Button/Button.test.tsx`). They cannot validate visuals. Use this checklist for every Button-touching PR.

## Setup

1. Wire `src/screens/_dev/ButtonShowcase.tsx` into the navigator (instructions in the file's JSDoc).
2. Run on a real iOS device — simulator over-blurs and is misleading.
3. Open the showcase screen.

## Reference

- Figma file: MC Component Library
- Node: `125:440`
- URL: <https://www.figma.com/design/qhHkoRlenVWZ03nkGi9LEp/MC-Component-Library?node-id=125-440>

## Checklist

### Typography

- [ ] Label is **Cormorant Garamond Regular**, not Inter.
- [ ] Size L renders ~24px label height; size S renders ~20px label height.
- [ ] Gold label colour matches Figma `Bg/Brand` (`#f2e1b0`).
- [ ] Subtle warm glow on the text — visible against the dark background.

### Surface (primary + secondary)

- [ ] Border is hairline (~0.5px) in `Border/Subtle` (`#a3b3cc`).
- [ ] Corner radius matches Figma `Radius/M` (16px).
- [ ] Frosted-glass effect visible — content behind the button (the night-sky shimmer in `BackgroundWrapper`) is blurred and shows through faintly.
- [ ] Primary tint reads slightly darker / less translucent than Secondary tint (4%→1% vs 8%→2% white over blur).

### Active state

- [ ] Gold drop-shadow glow visible **outside** the button border (does not get clipped by `overflow:'hidden'`).
- [ ] Glow colour matches Figma `Glow Drop Shadow` (`#F0D4A8` at 30%).
- [ ] Glow is the **only** visual difference between default and active — blur and gradient should look identical between the two states.

### Disabled state

- [ ] Whole button at ~50% opacity.
- [ ] Press feedback suppressed (no opacity dip, no `onPress` fires).

### Link variant

- [ ] No background, no border, no blur — text only.
- [ ] Same Cormorant typography and gold colour as primary/secondary labels.
- [ ] Tappable area meets target size (≥40px tall).

### Auth variant (star + Cormorant + star)

- [ ] Two `StarIcon`s flank the label, 16px gap on each side.
- [ ] Default star size is 20×20; `ResetPasswordScreen` uses 24×24 via `iconSize={24}`.
- [ ] Label is Cormorant Garamond Regular, 24px / 28 line-height (no uppercase transform).
- [ ] `textShadow.warmGlow` (blur 4) on the label.
- [ ] No background, border, or blur — purely decorative icons + text.
- [ ] Disabled state: 50% opacity on the whole row, both stars + text dimmed together.

### Gradient variant (legacy)

- [ ] Cormorant 24px gold uppercase label with warm glow.
- [ ] Custom `gradientColors` flow correctly (top→bottom).
- [ ] No regression on `AppExplainerScreen`, `StartFreeTrialScreen`, `EchoVaultHomeScreen`.
- [ ] *Not in MC Component Library Figma node 125:440* — this is a separate, older design pattern.

### Reduced Transparency (iOS)

1. Settings → Accessibility → Display & Text Size → **Reduce Transparency** → ON.
2. Reload the showcase.

- [ ] Buttons fall back to a solid navy tint (`palette.navy.card`) instead of disappearing or going pure white.
- [ ] Modal backdrop (`MotifSelectionModal`) falls back to a dim semi-opaque navy.
- [ ] Labels still legible.

### Blur tuning (only when re-tuning)

- [ ] On the showcase screen, scroll to the "Blur tuning" row.
- [ ] Compare each cell (15/20/25/30/35) against the Figma reference's `BACKGROUND_BLUR radius:60`.
- [ ] Pick the closest match. Update `effects.backgroundBlur.amount` in `src/theme/tokens.ts`.
- [ ] Re-run snapshots: `npx jest src/components/Button -u`.

### Cross-screen smoke pass

After any Button change, walk through every caller and eyeball them once:

**Primary (8 screens)**

- `QuizWelcomeScreen` — primary L active "BEGIN"
- `QuizQuestionsScreen` — primary L "NEXT" / "FINISH"
- `VerifyEmailScreen` — primary L (verify + resend buttons)
- `MirrorPledgeIntroScreen` — primary L "SEE HOW IT WORKS"
- `EchoLedgerScreen` — primary L active "PLEDGE SUPPORT"
- `CausesCarouselScreen` — primary L active "PLEDGE"
- `PledgeThankYouScreen` — primary L active "HOMEPAGE"

**Secondary (1 screen)**

- `TermsAndConditionsScreen` — secondary L "CONTINUE"

**Auth (5 screens — star + Cormorant + star pattern)**

- `LoginScreen` — auth "ENTER" / "ENTERING…"
- `SignUpScreen` — auth "CONTINUE"
- `ForgotPasswordScreen` — auth "SEND LINK" + auth "CONTINUE" (success state)
- `ResetPasswordScreen` — auth "RESET PASSWORD" (24px stars)
- `EnterMirrorScreen` — auth "ENTER" (post-auth landing)

**Link (1 screen)**

- `ArchetypeScreen` — link L "CONTINUE" (replaced previous tap-anywhere pattern)

**Gradient (3 screens — legacy variant, separate code path)**

- `AppExplainerScreen` — gradient "NEXT"
- `StartFreeTrialScreen` — gradient CTA (subscription)
- `EchoVaultHomeScreen` — gradient "START ECHO" + "VIEW VAULT"

**Not migrated (intentional — out of scope)**

- `CheckoutScreen` — screen not fully done; revisit when checkout flow is complete.

## Known platform notes

- **iOS simulator** over-blurs vs real hardware. Always tune on a real device.
- **iOS Reduce Transparency** disables `BlurView` and shows the fallback colour instead. Verify both states.
- **Android** — currently out of scope for this design pass. `BlurView` Android perf is unreliable on low-end devices; we'll revisit with a platform-specific path if/when Android becomes a target.
