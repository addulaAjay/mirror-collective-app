# Visual QA — Expired subscription surfacing on Home

**Feature:** proactively tell a returning user their trial/subscription lapsed,
instead of only revealing it via My Subscription or a 403 wall.

## Summary

On the Home screen (`TalkToMirror`), driven by `useSubscription()`:

- **Active trial** → the existing `TrialCountdown` banner renders under the
  header ("N days left in trial — Tap to subscribe"). It self-gates (returns
  `null` unless `isInTrial && trialDaysRemaining > 0`).
- **Expired** (`status === 'trial_expired' || 'expired'`) → the existing
  `UpgradePrompt` modal (`reason="trial_expired"`) appears on landing:
  *"Trial Expired — Your 14-day trial has ended. Subscribe to continue…"* with
  **UPGRADE NOW** (→ `StartFreeTrial`) and **Not Now**.

## Behaviour

- The prompt shows **once per mount** via a `useRef` latch. Home stays mounted
  at the root of the stack, so this is effectively once per login session and
  resets on the next login — it does **not** re-nag when navigating back to Home.
- It waits for `loading` to clear before deciding, so it never flashes during
  the initial status fetch.

## Tests

`TalkToMirrorScreen.test.tsx`: prompt shows for `trial_expired`/`expired`, is
hidden for `active`/`trial`/`none`, and is suppressed while `loading`. Existing
render/nav tests still pass (added a `SubscriptionContext` mock).

## Notes

- Both `trial_expired` and paid-`expired` reuse the `trial_expired` copy; the
  CTA (subscribe) is correct for both. A dedicated paid-expired message can be
  added if/when the Apple webhook drives that state.
- Components were pre-built but previously rendered nowhere — this wires them in.
- RN screenshot pending: capture `expired-login-prompt-rn.png` on device.
