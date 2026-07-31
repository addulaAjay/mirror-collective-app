# Subscription V1 — plan & tracking

Status: **in progress**
Branches: `feat/subscription-flow` (app), `feat/subscription-status-webhook` (API)

Two V1 Must-Haves + Apple IAP beta readiness.

## Confirmed decisions
- **Prices:** Mirror Core **$9.99/mo, $89/yr**.
- **No storage add-on** for now → only 2 products: `core.monthly`, `core.yearly`.
  The storage add-on screen (Figma 4928-8944) and add-on checkout (4928-8823)
  are **deferred**.
- Full flow **+ backend hardening**.

## Product IDs (must match App Store Connect exactly)
```
com.themirrorcollective.mirror.core.monthly
com.themirrorcollective.mirror.core.yearly
```
(storage.* exist in code but are unused for now.)

## Architecture
ASC subscription group (2 auto-renewable products) ⇄ react-native-iap ⇄
`POST /api/subscriptions/verify-purchase` ⇄ **backend = source of truth**
(DynamoDB + receipt validator) ⇄ `GET /api/subscriptions/status` ⇄
`SubscriptionContext` ⇄ UI. Apple **server notifications** →
`/api/subscriptions/webhook/apple` keep status fresh.

## Apple / App Store Connect status (checked 2026-07-30)
- ✅ `APPLE_SHARED_SECRET` present (legacy verifyReceipt path).
- ❌ **Missing** the App Store Server API creds the validator prefers:
  `APPLE_APP_STORE_KEY_ID`, `APPLE_APP_STORE_ISSUER_ID`,
  `APPLE_APP_STORE_BUNDLE_ID`, `APPLE_APP_STORE_PRIVATE_KEY(_PATH)`,
  `APPLE_APP_STORE_APP_APPLE_ID`.
- **Action (user + Apple):** generate an ASC API key (In-App Purchase role),
  provide Key ID / Issuer ID / `.p8` / numeric App ID → set in the prod Lambda
  env (via serverless.yml + deploy). Blocks device verification only.

## Phase 0 — App Store Connect (Apple side, parallel)
- [ ] Create subscription group + 2 auto-renewable products with the exact IDs
- [ ] Prices $9.99/mo, $89/yr; localization + review screenshot → "Ready to Submit"
- [ ] Attach products to an app version (fixes the "submit with an app version" error)
- [ ] Create sandbox tester account(s)
- [ ] Generate App Store Connect API key; provide values for backend env

## Phase 1 — Issue #1: My Subscription screen (Figma 2323-2774)
- [ ] `MySubscriptionScreen.tsx` — plan/status/trial-days/features from `useSubscription()`; prices $9.99/$89; **END SUBSCRIPTION** (deep-link to iOS Manage Subscriptions); Restore Purchase
- [ ] Register `MySubscription` route (navigation.ts + App.tsx authenticated navigator)
- [ ] Uncomment the menu item → route to `MySubscription` (NavigationMenuScreen)
- [ ] Tests + commit

## Phase 2 — Issue #2: core monthly/annual toggle (Figma 4928-8595)
- [ ] Monthly/Yearly toggle in `StartFreeTrialScreen` (add `setSelectedPeriod`); pass `CORE_MONTHLY`/`CORE_YEARLY`
- [ ] Dynamic price from IAP `products` with $9.99/$89 fallback
- [ ] Tests + commit

## Phase 3 — Backend hardening (API repo)
- [ ] Populate `core_subscription` (+ leave storage null) in `GET /status` (currently TODO)
- [ ] Real Apple webhook JWT signature verification (remove "DO NOT USE IN PRODUCTION" stub)
- [ ] Wire App Store Server API env vars in serverless.yml; document ASC Server Notifications V2 URL → `/api/subscriptions/webhook/apple`
- [ ] Tests + commit

## Phase 4 — Beta test procedure
- [ ] Unit/integration (IAP mocked) green in both repos
- [ ] TestFlight build; sandbox tester on device
- [ ] Purchase core monthly + annual → verify `/status` flips to active, features unlock
- [ ] Restore purchases; End Subscription (manage) ; sandbox renewal + `/webhook/apple`

## Deferred (explicitly out of V1-now)
- Storage add-on screen (4928-8944) + add-on checkout (4928-8823) — revisit when storage is offered.
