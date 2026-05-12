# In-App Purchase & Subscription — Current State Review

> **Date:** 2026-05-11
> **Scope:** Mirror Collective React Native app + Python (FastAPI / serverless) backend
> **Goal of this doc:** Establish a shared, accurate picture of what already exists for trial/subscription/IAP before we (a) tighten the implementation and (b) ship real in-app purchases to production.

---

## 1. Executive summary

The trial + subscription system is **~70 % built end-to-end**. A 14-day free trial path is functional (no payment captured). The IAP stack (`react-native-iap` on the client, Apple/Google receipt validation on the server, DynamoDB persistence, App Store + Play Store webhooks) is wired but **not production-ready**: receipt-signature verification is incomplete, the Checkout screen is a static stub, native capabilities/permissions are not declared, and several auth/idempotency/security gaps remain.

Recommendation: keep the existing DIY stack (do **not** introduce RevenueCat now — too much is already built). Tighten in three phases (security → wiring → store readiness) before flipping IAP on for real users.

---

## 2. Frontend — what exists

### 2.1 Screens & UI

| Path | Status | Notes |
|---|---|---|
| `src/screens/StartFreeTrialScreen.tsx` | Live | 14-day trial CTA. Calls `subscriptionApiService.startTrial()`. Pricing **hardcoded** ($15.99/mo, $139/yr) — should come from store / config. |
| `src/screens/CheckoutScreen.tsx` | **Stub** | Static UI. No purchase logic wired. This is where post-trial / direct-paid subscriptions need to be plumbed. |
| `src/components/TrialCountdown.tsx` | Live | Urgency banner at 14 / 7 / 3-day thresholds. |
| `src/components/UpgradePrompt.tsx` | Live | Modal for `quota_exceeded`, `quota_approaching`, `trial_expired`. |

### 2.2 State & hooks

| Path | Notes |
|---|---|
| `src/context/SubscriptionContext.tsx` | Single source of truth on the client. Fields: `tier`, `status`, `trialDaysRemaining`, `hasUsedTrial`, `isInTrial`, `hasActiveSubscription`, plus a features object (`echo_vault_enabled`, `quota_gb`, `used_gb`, `mirror_gpt_enabled`, `echo_map_enabled`). Hydrates from backend after auth. |
| `src/hooks/useInAppPurchase.ts` | `react-native-iap@^12.16.4`. Init connection, fetch products, `purchaseUpdatedListener` → backend verify → `finishTransaction`. Restore flow collects iOS receipts / Android purchase tokens and POSTs to backend. |
| `src/services/api/subscriptionApi.ts` | Client for all `/api/subscriptions/*` endpoints (see § 3.1). |
| `src/context/UserContext.tsx` | Auth user state. Deliberately does **not** carry plan/trial fields — those live in `SubscriptionContext`. Clean separation. |

### 2.3 Product catalog (hardcoded in `useInAppPurchase.ts`)

```
com.themirrorcollective.mirror.core.monthly
com.themirrorcollective.mirror.core.yearly
com.themirrorcollective.mirror.storage.monthly
com.themirrorcollective.mirror.storage.yearly
```

These must match App Store Connect + Play Console SKUs exactly. **Not yet centralised** with the backend.

### 2.4 Native config

- **iOS:** no In-App Purchase capability declared in `MirrorCollectiveApp.entitlements`. Must be added in Xcode before TestFlight.
- **Android:** `com.android.vending.BILLING` permission is auto-merged from `react-native-iap`'s manifest, but we still need a Play Console subscription product configured and tested with a license-test account.
- **No App Store / Play Console screenshots, descriptions, or pricing tiers** yet.

---

## 3. Backend — what exists

### 3.1 API surface (`src/app/api/subscription_routes.py`)

| Method & Path | Purpose |
|---|---|
| `POST /api/subscriptions/start-trial` | Activates 14-day free trial. Currently uses `VerifyPurchaseRequest` schema — should be its own empty/typed request (see § 4). |
| `GET /api/subscriptions/trial-status` | `trial_available`, `days_remaining`, `has_used_trial`. |
| `GET /api/subscriptions/status` | Full subscription state (tier, status, features, quota). |
| `POST /api/subscriptions/verify-purchase` | Validates IAP receipt and activates a subscription. |
| `POST /api/subscriptions/restore-purchases` | Bulk-restores from a list of iOS receipts or Android tokens. |
| `POST /api/subscriptions/cancel` | Cancels auto-renewal; access retained until `expiry_date`. |
| `GET /api/subscriptions/billing-history` | Event audit log. |
| `GET /api/subscriptions/quota-status` | Storage quota usage. |
| `POST /api/subscriptions/webhook/apple` | App Store Server Notifications v2 handler. |
| `POST /api/subscriptions/webhook/google` | Google Play RTDN (Pub/Sub) handler. |

### 3.2 Data model

- **`UserProfile`** (`src/app/models/user_profile.py`) — `subscription_tier`, `subscription_status`, `trial_started_at`, `trial_expires_at`, `trial_notifications_sent`, `echo_vault_quota_gb`, `echo_vault_used_gb`, `primary_subscription_id`, `storage_subscription_id`, `has_used_trial`.
- **`Subscription`** (`src/app/models/subscription.py`) — `subscription_id`, `product_id`, `subscription_type` (MIRROR_CORE | STORAGE_ADD_ON), `platform`, `status` (NONE/TRIAL/TRIAL_EXPIRED/ACTIVE/EXPIRED/CANCELLED/GRACE_PERIOD/REFUNDED), `billing_period`, `purchase_date`, `expiry_date`, `cancellation_date`, `trial_start_date`/`trial_end_date`, `receipt_data`, `original_transaction_id`, `latest_receipt_info`, `last_validation_date`, `validation_environment`, `auto_renew_enabled`, `is_in_trial`, `events[]`.
- **`SubscriptionEvent`** — audit log per lifecycle event.

### 3.3 Services

| File | Responsibility |
|---|---|
| `src/app/services/subscription_service.py` | Receipt validation orchestration, activation, renewal/expiry/refund webhook handling, cancellation, billing history. |
| `src/app/services/trial_management_service.py` | Start trial, status, daily expiration check, notification dispatch (7 / 3 / 1-day + expired). |
| `src/app/services/receipt_validator.py` | Apple `verifyReceipt` legacy endpoint + Google `purchases.subscriptions.get`. |

### 3.4 Infra (`serverless.yml`)

- DynamoDB: `subscriptions-{stage}` (PK `user_id` + SK `subscription_id`, GSI `subscription-id-index`), `subscription_events-{stage}` (PK `user_id` + SK `timestamp`). Billing: `PAY_PER_REQUEST`.
- Scheduled Lambda: `trialExpirationCheck` cron `0 12 * * ? *` (daily 12:00 UTC).
- Env vars: `APPLE_SHARED_SECRET`, `GOOGLE_SERVICE_ACCOUNT_KEY`, `GOOGLE_PACKAGE_NAME` (default `com.mirrorcollective.app`).
- Deps: `PyJWT 2.8.0`, `google-auth`, `google-api-python-client`.

---

## 4. Gaps & risks (prioritised)

### P0 — block production

1. **Apple receipt validation is using the deprecated `verifyReceipt` legacy endpoint and JWT signature verification is disabled** (`receipt_validator.py:79` — decodes JWS without verifying the x5c chain). Apple is sunsetting `verifyReceipt`; move to **App Store Server API** + **StoreKit 2 JWS** verification with the x5c certificate chain.
2. **`/verify-purchase` idempotency** — replaying the same `transaction_id` should be a no-op, not a re-activation. Confirm DynamoDB write uses a conditional put on `original_transaction_id`.
3. **App Store Server Notifications v2 — signed payload not verified.** Same JWS gap as #1. Anyone who knows the URL can forge a notification today.
4. **`start-trial` request schema is wrong** — declared as `VerifyPurchaseRequest`. Should be `StartTrialRequest` (no body or just device metadata) to prevent confusing clients/SDK auto-generation.
5. **Native IAP capability not enabled on iOS.** Must add the "In-App Purchase" capability in Xcode and re-run `pod install`.

### P1 — block real-user trial

6. **Pricing is hardcoded** in `StartFreeTrialScreen.tsx`. After IAP init we should display **store-supplied** localized prices (`subscription.localizedPrice`), with the backend as a fallback for users who can't reach the store.
7. **`CheckoutScreen.tsx` is a static stub.** Either delete it or wire it to `useInAppPurchase.purchaseSubscription(productId)`. Today there is no UI path to buy a subscription outside of the trial-start screen.
8. **No "purchase deferred" / "pending" handling.** Android in particular can defer purchases (parental approval, slow card). The hook treats anything that isn't success as an error.
9. **Restore flow does not finish unacknowledged Android purchases.** Google revokes purchases not acknowledged within 3 days. We need `acknowledgePurchase` on the backend or `finishTransaction` on the client for each restored entitlement.
10. **`SubscriptionContext` hydrates once on mount.** If the user purchases in another device / web / restore mid-session, the local state is stale. Add a re-hydrate on `AppState → active` and after every purchase event.

### Entitlement matrix (locked 2026-05-11)

There is **no real free tier**. Every paid feature follows the same rule.

| `tier` | `subscription_status` | MirrorGPT | Echo Map | Echo Vault writes | Echo Vault reads | Quota |
|---|---|---|---|---|---|---|
| `free` | `none` (pre-trial) | paywall | paywall | paywall | paywall | 0 |
| `trial` | `trial` | ✅ | ✅ | ✅ | ✅ | 50 GB |
| `core` | `active` | ✅ | ✅ | ✅ | ✅ | 50 GB |
| `core_plus` | `active` | ✅ | ✅ | ✅ | ✅ | 150 GB |
| any | `grace_period` *(Apple billing retry)* | ✅ | ✅ | ✅ | ✅ | last known |
| any | `trial_expired` / `expired` / `cancelled` | **🔒 LOCK** | **🔒 LOCK** | **🔒 LOCK** | **🔒 LOCK (full lock — no read either)** | 0 |

**Implication for the entitlement check:** the gate collapses to a single predicate — `status ∈ {trial, active, grace_period}`. `tier` only matters for the storage quota number. This means one `require_entitled` FastAPI dependency and one `<SubscriptionGate>` React wrapper covers MirrorGPT, Echo Map, and Echo Vault — no per-feature flags needed in code (the `features.*_enabled` booleans become a derived computed value on top of the single status check).

**Edge case still open:** Apple's `grace_period` vs. `billing_retry` — Apple distinguishes these. Grace period (opt-in, configurable 6 / 16 / 30 days, app continues to grant entitlement) is treated as entitled above. Billing retry (up to 60 days of dunning, entitlement choice is up to us) — flagging this as the one decision still needed; recommendation is to **not** entitle during billing retry, so users see a "Update payment method" prompt and Apple's machinery does the work.

### P0.5 — entitlement enforcement (frontend ✅ wired 2026-05-11, backend ⏳ pending)

**The buy flow is irrelevant if anyone can use anything regardless of subscription state.** Below is the post-fix state.

**Frontend — wired:**

- ✅ **MirrorGPT chat** — `src/hooks/useChat/useChat.ts` `sendMessage` calls `useEntitlement()` and sets `paywallReason` instead of hitting the API when locked. Chat screen shows `<UpgradePrompt>`.
- ✅ **MirrorChat screen** — wrapped in `<SubscriptionGate>` (full lock — locked users see paywall, not chat history).
- ✅ **Echo Map** — `ReflectionRoomEchoSignatureScreen` button gated via `useEntitlement`; routes to `<UpgradePrompt>` instead of `navigation.navigate('ReflectionRoomEchoMap')`.
- ✅ **Echo Map screen** — wrapped in `<SubscriptionGate>` (full lock for direct deep-link / restored navigation).
- ✅ **Echo Vault uploads** — `NewEchoVaultScreen` NEXT button calls `useEntitlement.canUpload()` and shows `<UpgradePrompt>` if not entitled or quota exceeded.
- ✅ **Echo Vault home** — wrapped in `<SubscriptionGate>` (full lock — can't view existing entries after expiry).
- ✅ **`SubscriptionContext`** — fail-closed defaults (`mirror_gpt_enabled: false`); `hasActiveSubscription` now includes `grace_period`.
- ✅ **`AppState → active`** rehydration — `SubscriptionContext` refetches when the app foregrounds.
- ✅ **`useEntitlement` hook** — single predicate (`status ∈ {trial, active, grace_period}`) used by every gate.
- ✅ **`SubscriptionGate` component** — reusable wrapper for any locked-content screen.

**Frontend — still open:**

- ⏳ Storage quota indicator on Echo Vault home (`32.1 / 50 GB` text). Data is in `useEntitlement`; just needs the UI.
- ⏳ Banner on Echo Vault home when `quotaApproaching` (>=90 %).
- ⏳ Wrap `EchoVaultLibraryScreen`, `EchoDetailScreen`, `EchoInboxScreen`, audio/video playback in `SubscriptionGate` (currently only the home gate covers them, which is enough for normal flow but not for deep links).
- ⏳ `NewEchoComposeScreen` / `NewEchoAudioScreen` / `NewEchoVideoScreen` save action — second-layer gate in case entitlement flips mid-flow.

**Backend — wired 2026-05-11:**

- ✅ **`require_entitled` FastAPI dependency** lives in `src/app/core/entitlement.py`. Single predicate (`status ∈ {trial, active, grace_period}`), 402 Payment Required with structured `{code, reason, message}` detail otherwise. Returns an `EntitledUser` dataclass so handlers don't re-fetch the profile.
- ✅ **MirrorGPT** — `/chat`, `/analyze`, `/signals`, `/moments`, `/moments/{id}/acknowledge`, `/loops`, `/insights`, `/session/greeting` are all gated. `/quiz/*`, `/profile`, `/archetypes/list`, `/health` remain open (onboarding + static refs).
- ✅ **Echo Vault** — every route in `src/app/api/echo_routes.py` (writes, reads, recipients, guardians) is gated.
- ✅ **Echo Map** — `GET /echo/snapshot` and `POST /echo/recommend` (in `echo_v1_routes.py`) are gated. `dev_seed_loop_state` kept open (dev-only).
- ✅ **Pre-flight quota check** in `POST /echoes/upload-url` — `UploadUrlRequest.file_size_bytes` is now a client-supplied hint; the handler calls `StorageQuotaService.can_upload(user_id, file_size_bytes)` before generating the S3 presigned URL. Returns 413 for `quota_exceeded`, 402 for `no_quota`.
- ✅ **Used-GB recompute on soft-delete** — `delete_echo` triggers `quota_service.update_user_quota(user_id)` after success (best-effort; failures logged, delete still returns 200). Note: soft-delete itself doesn't free S3 storage; the recompute is correct relative to the actual S3 inventory at that moment.
- ✅ **GET routes now locked on expiry** — read routes share the same gate as writes (full-lock policy from the matrix).

**Product decision (2026-05-12):** Echo Vault delete is **soft-delete by design** — returning users must be able to see history of their deleted echoes. S3 objects stay; the previously listed "hard-delete to free `used_gb`" follow-up is dropped. Reflected `used_gb` therefore continues to count soft-deleted objects, which matches S3 reality. If the designer later wants the user-facing quota number to exclude soft-deleted echoes, scope the change to `StorageQuotaService.calculate_user_storage_usage` (filter against `Echo.deleted_at`); it does not require touching S3.

**Backend — known follow-ups:**

- ✅ (Phase C, wired 2026-05-12) Per-echo `size_bytes` stored on `Echo`; `calculate_user_storage_usage` now sums it via the `user-echoes-index` GSI. Legacy rows without `size_bytes` are back-filled lazily from a single S3 HeadObject and persisted, so the first call after upgrade pays the migration cost row-by-row and every subsequent call is pure DynamoDB. Soft-deleted rows are intentionally included.
- ⏳ (Frontend plumbing, paired with quota pre-flight) Frontend should send `file_size_bytes` on `POST /echoes/upload-url` and forward `size_bytes` on `POST /echoes` / `PATCH /echoes/{id}`. Without this, the new column is still populated via the S3 backfill — but the upload-url pre-flight quota check effectively passes `0 bytes` today and only catches `no_quota`, not `quota_exceeded`. Wire both together when surfacing real-money "approaching capacity" UX.
- ⏳ (Future, designer-pending) "Deleted echoes / history" surface — the soft-delete decision implies a way for returning users to view (and possibly restore) past echoes. No UI spec yet.

**Backend — Phase A (receipt security) — wired 2026-05-11:**

- ✅ Apple App Store Server API migration — replaced deprecated `verifyReceipt` with the `app-store-server-library` SDK (`get_all_subscription_statuses` keyed on `originalTransactionId`).
- ✅ JWS x5c verification on every Apple receipt + ASSN v2 webhook payload + inner `signedTransactionInfo`. Bundled Apple Root CA - G3 at `src/app/resources/apple_root_certificates/AppleRootCA-G3.cer`.
- ✅ Google Play RTDN Pub/Sub push JWT verification (`google.oauth2.id_token.verify_oauth2_token` with audience + service-account email check). Set `GOOGLE_PUBSUB_VERIFY=false` only for local dev.
- ✅ Idempotency guard on `/verify-purchase` — DynamoDB lookup keyed on `original_transaction_id`. Duplicate calls return the existing record without re-firing `SUBSCRIPTION_PURCHASED` events.
- ✅ Product whitelist (`is_known_sku`) — forged receipts claiming non-existent SKUs are rejected. Cross-checks client-claimed product against the verified receipt's product.
- ✅ `start-trial` schema split off `VerifyPurchaseRequest` (`StartTrialRequest`); endpoint marked `deprecated=True` since the Apple/Google native intro offer replaces it.
- ✅ Webhook routes now propagate `status_code` from the service so forged ASSN v2 / RTDN payloads return **401 Unauthorized** instead of 500.

Backend (also leaky):

- **No `@requires_active_subscription` dependency exists** in `src/app/services/*` or `src/app/api/*`. Every entitlement check would have to be written by hand inside each handler, and isn't.
- **MirrorGPT routes** (`src/app/api/mirrorgpt_routes.py`) — `/chat`, `/analyze`, `/quiz/submit`, `/profile`, `/signals`, `/moments`, `/session/greeting` all check authentication only. **Product question:** is MirrorGPT intentionally free, or is the lack of gating a bug? The frontend `features` object suggests it's meant to be gated.
- **Echo Vault `POST /echoes/upload-url`** (`src/app/api/echo_routes.py:216`) — issues a presigned S3 URL **without** calling `StorageQuotaService.can_upload()`. The presigned URL is valid for hours; even if the middleware later rejects the upload, the user already has a signed URL they can retry against. Pre-flight quota check is missing.
- **`StorageQuotaService.can_upload()` exists but is dead code** — defined at `quota_middleware.py:151`, never called.
- **`QuotaEnforcementMiddleware`** only checks `quota_exceeded` *after* an upload begins — it doesn't pre-flight the presigned URL request.
- **Delete does not decrement `echo_vault_used_gb`.** Quota is recomputed from a full S3 inventory list on the next `check_quota_exceeded()` call, which is fragile and slow on large vaults.
- **No read-only mode after expiry.** `trial_management_service.handle_trial_expired()` zeroes the quota (so writes fail), but GET routes for existing echoes have no subscription check. Whether expired users should retain read access is a product policy decision that's not yet been made.
- **Quota math** — `echo_vault_quota_gb` is a single denormalised number on the user profile, recomputed at subscription state transitions. Drift between this number and the truth (S3 inventory) is reconciled lazily on the next quota check.

### P2 — quality / DX

11. **`console.log` in `useInAppPurchase.ts`** (against project ESLint/global rule). Swap for the existing logger or strip.
12. **`error: any` throughout the hook** — should be `unknown` + narrowing, per `~/.claude/rules/typescript/coding-style.md`.
13. **Product IDs duplicated** between client hook and (likely) backend constants — extract a single source (a `productCatalog.ts` + matching Python module) or fetch from `/subscriptions/catalog`.
14. **No test coverage on `useInAppPurchase.ts`** (other hooks have `.test.ts` siblings). Mock `react-native-iap` and the backend client, cover happy / failure / restore paths.
15. **`Alert.alert` for success/failure** is jarring UX for a paid flow — replace with the project's existing toast/modal components.
16. **No analytics events** on `trial_started`, `purchase_initiated`, `purchase_succeeded`, `purchase_failed`, `restore_succeeded` — needed for funnel monitoring and refund-fraud detection.
17. **No gating decorator on backend routes.** Entitlement is checked manually inside business logic. A `@requires_tier("core")` dependency would centralise this.

---

## 5. Proposed plan to tighten + ship

Three phases. Each phase ends with a shippable, testable artifact.

### Phase A — Security & correctness (P0)

- Replace legacy `verifyReceipt` with App Store Server API (`/inApps/v1/subscriptions/{originalTransactionId}`); verify JWS via Apple's x5c root certs.
- Verify App Store Server Notifications v2 payload signature.
- Verify Google Play RTDN messages via Pub/Sub push auth (JWT from `iss=accounts.google.com`).
- Add idempotency guard on `/verify-purchase` (conditional put keyed on `original_transaction_id`).
- Split `start-trial` schema out from `VerifyPurchaseRequest`.
- Add unit + integration tests for both validators (happy / sandbox / replay / forged signature).

### Phase B — Wire the real purchase flow (P1)

- Add iOS "In-App Purchase" capability + matching Apple paid-apps agreement / banking; configure four products in App Store Connect Sandbox.
- Configure four products + a license-test account in Play Console.
- Replace hardcoded pricing in `StartFreeTrialScreen` with `subscription.localizedPrice` from `useInAppPurchase`.
- Wire `CheckoutScreen` to `purchaseSubscription(productId)` and handle pending/deferred / cancelled / failed states with first-class UI.
- Add `AppState → active` re-hydrate on `SubscriptionContext` and re-hydrate after every successful purchase / restore.
- Acknowledge Android purchases server-side after successful validation.
- Add `analytics.track` calls on each lifecycle event.
- E2E (Playwright + sandbox account) smoke test for: trial → expire → resubscribe.

### Phase A.5 — Entitlement enforcement (P0.5; must ship with or before B)

**Backend**

- Add a FastAPI dependency `require_active_subscription(tiers: list[str] = ["core", "core_plus", "trial"])`. Returns 402 Payment Required if the user is not in an entitled state.
- Apply the dependency to:
  - All Echo Vault write routes (`POST /echoes`, `POST /echoes/upload-url`, `PUT /echoes/{id}`).
  - Echo Map endpoints (once they exist or once we confirm gating policy).
  - MirrorGPT routes — **pending product decision** on whether MirrorGPT is free or paid.
- Add a real pre-flight call to `StorageQuotaService.can_upload(user, declared_size_bytes)` inside `POST /echoes/upload-url`. Reject with 413 / 402 if `used + declared > quota`. Require clients to declare file size in the upload-url request.
- On echo soft-delete, kick off an async job to recompute `echo_vault_used_gb` (or eagerly decrement using the stored object size).
- Decide and implement read-only-after-expiry policy: either gate GET routes the same way, or allow GETs for a fixed grace period (e.g., 30 days) before locking.

**Frontend**

- Replace `SubscriptionContext`'s default-allow defaults — `mirror_gpt_enabled`, `echo_vault_enabled`, `echo_map_enabled` should default to `false` while loading. Build a `<SubscriptionGate>` wrapper that returns a skeleton on `loading`, a paywall on `expired`/`trial_expired`/`free`, and children otherwise.
- Wire `UpgradePrompt.tsx` into the three places it's meant to fire:
  - `quota_approaching` — banner on Echo Vault home when `used_gb / quota_gb > 0.9`.
  - `quota_exceeded` — blocks all upload screens when a fresh quota check fails.
  - `trial_expired` — full-screen overlay on next app open after status transitions.
- Add a tiny "Storage: 32.1 / 50 GB" indicator on the Echo Vault home screen (the `features` object already has the data).
- Re-hydrate `SubscriptionContext` on `AppState → active` and immediately after every successful purchase / restore / `quota_status` 402 response.
- Add subscription-aware navigation guards in `AppNavigator` for `EchoVault`, `EchoMap`, and (if gated) `MirrorChat`.

### Phase C — Polish & maintainability (P2)

- Extract single product catalog (`src/constants/products.ts` + matching backend).
- Replace `Alert.alert` with project toast components.
- Strip `console.log`, fix `error: any`.
- Backend `@requires_tier` dependency; apply to all gated routes.
- Test coverage to 80 % on `useInAppPurchase.ts` + `subscriptionApi.ts`.
- Visual-QA report at `docs/visual-qa/checkout/` per Figma workflow rule.

---

## 6. Open decisions (need product / business input)

1. **Trial gating policy** — currently a user can call `/start-trial` exactly once per account. What's the policy if a user uninstalls + reinstalls? Per device? Per Apple ID? Per email?
2. **Storage add-on UX** — sold as a separate subscription product. Should Checkout offer it alongside Core, or only inside a quota-exceeded prompt?
3. **Pricing display when offline / store unreachable** — fall back to backend-supplied prices, or block the screen with a retry?
4. **Refund policy** on Apple / Google initiated refunds — auto-revoke vs. grace period?
5. **Family Sharing** (iOS) — enable on the products? If yes, validation flow changes.
