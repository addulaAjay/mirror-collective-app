# IAP Store Setup — External Work Checklist

> **Owner:** product/founder (requires Apple Developer + Google Play Console + Xcode access).
> **Status:** TODO — gates real-money flow.
> **Companion docs:** [`IAP_SUBSCRIPTION_REVIEW.md`](./IAP_SUBSCRIPTION_REVIEW.md), [`IAP_SANDBOX_QA.md`](./IAP_SANDBOX_QA.md) (run after this), [`IAP_DESIGN_FEASIBILITY.md`](./IAP_DESIGN_FEASIBILITY.md).
> **Prices locked to pricing spec 2026-05-12:** $9.99/mo Basic, $89/yr Basic, $4.99/mo Storage, $49/yr Storage.

This is everything that has to happen outside the codebase before the app can actually charge real money. The code is ready for these — once they're done and an env var or two are set, purchases work end-to-end.

---

## A. Apple — App Store Connect

### A1. Paid-apps agreement + banking + tax (one-time, account level)

- [ ] Sign **Paid Applications Agreement** in App Store Connect → Agreements, Tax, and Banking.
- [ ] Add a **bank account** for payouts.
- [ ] Submit **tax forms** (W-9 for US, W-8 for non-US individuals/entities).
- [ ] Wait for "Active" status on all three before any subscription becomes purchasable.

### A2. Subscription group + four products

Subscriptions live inside a **Subscription Group**. Products in the same group are upgrade/downgrade options for the user; products in different groups can be held concurrently. We want Mirror Core monthly+yearly in one group (mutually exclusive) and Storage monthly+yearly in another (separately purchasable).

- [ ] Create group **"Mirror Basic"** (Subscription Group)
  - [ ] `com.themirrorcollective.mirror.core.monthly` — Auto-renewable, Monthly
    - Price tier: **$9.99 USD**
    - Reference name: "Mirror Basic Monthly"
    - Display name + description (App Store-visible). User-visible name: **Mirror Basic**.
    - **Introductory offer**: Free trial, 14 days, eligibility: **New Subscribers only**.
  - [ ] `com.themirrorcollective.mirror.core.yearly` — Auto-renewable, Yearly
    - Price tier: **$89 USD**
    - Same display copy.
    - **Introductory offer**: Free trial, 14 days, New Subscribers only.
  - **Note on SKU strings:** the IDs still contain `core` (legacy from before the "Mirror Core" → "Mirror Basic" rename). They appear in receipts and are registered with Apple; renaming to `.basic.*` is a separate store-side migration. Internal code already uses `BASIC_*` constants pointing at these strings.

- [ ] Create group **"Echo Vault Storage"** (Subscription Group)
  - [ ] `com.themirrorcollective.mirror.storage.monthly` — Monthly, **$4.99 USD**
  - [ ] `com.themirrorcollective.mirror.storage.yearly` — Yearly, **$49 USD**
  - **No** introductory offer (add-ons don't offer trials per spec).

Display copy / promotional images for each product (see App Store Connect minimums).

### A3. App Store Server Notifications v2

- [ ] In App Store Connect → App Information → **App Store Server Notifications**, set **Version 2** URL to the backend webhook:
  - Production: `https://api.themirrorcollective.com/api/subscriptions/webhook/apple`
  - Sandbox: `https://api-sandbox.themirrorcollective.com/api/subscriptions/webhook/apple`
- [ ] Apple **JWS signing**: no setup needed on our side beyond verifying the x5c chain. Backend verification is already wired (App Store Server SDK + bundled Apple Root CA - G3 at `src/app/resources/apple_root_certificates/AppleRootCA-G3.cer`). Forged payloads return **401 Unauthorized**; see `IAP_SANDBOX_QA.md` S11 for the cross-cutting check.

### A4. App Store Server API credentials (for receipt validation v2)

- [ ] Users and Access → **Keys** → **In-App Purchase** → Generate a new key.
- [ ] Note the **Key ID** and **Issuer ID**.
- [ ] Download the `.p8` private key file (you only get this once — save it securely).
- [ ] Add to the backend's secrets:
  - `APPLE_ISSUER_ID`
  - `APPLE_KEY_ID`
  - `APPLE_PRIVATE_KEY` (PEM contents of the `.p8`)
  - `APPLE_BUNDLE_ID` = `com.themirrorcollective.mirror`

### A5. Sandbox testers

- [ ] Users and Access → **Sandbox** → **Testers** → add 2–3 test accounts (each requires a unique email NOT already used as an Apple ID).
- [ ] Reset the Apple ID on a test device → sign out → sign back in with the sandbox tester at first purchase prompt.

### A6. Xcode capability (one-time, project)

- [ ] Open `ios/MirrorCollectiveApp.xcworkspace` in Xcode.
- [ ] Target: `MirrorCollectiveApp` → Signing & Capabilities → **+ Capability** → **In-App Purchase**.
- [ ] Verify `MirrorCollectiveApp.entitlements` shows the capability.
- [ ] `cd ios && pod install`.
- [ ] Commit the changed `.entitlements` and (likely) `project.pbxproj`.

---

## B. Google — Play Console

### B1. Billing setup (one-time, account level)

- [ ] **Payments profile**: Play Console → Setup → Payments profile → create.
- [ ] Tax info, bank account, sign distribution agreement.
- [ ] Wait until "Active" before any subscription product is purchasable.

### B2. Subscriptions

Google's model: each "subscription" can have multiple **base plans**, each with optional **offers** (trials, promos).

- [ ] Create subscription **`com.themirrorcollective.mirror.core`** (yes, the parent product uses a slightly different ID layout than iOS — but the CLIENT-side SKU is per base plan, so we match by base-plan ID below).
  - [ ] Base plan **monthly** (id: `monthly`) → price **$9.99/mo**, auto-renewing.
    - [ ] Offer: **Free trial**, 14 days, eligibility "New subscriber".
  - [ ] Base plan **yearly** (id: `yearly`) → **$89/yr**.
    - [ ] Offer: **Free trial**, 14 days, eligibility "New subscriber".

- [ ] Create subscription **`com.themirrorcollective.mirror.storage`**
  - [ ] Base plan `monthly` → **$4.99/mo**.
  - [ ] Base plan `yearly` → **$49/yr**.

**The client-side SKU is `productId:basePlanId`** in some library versions. `react-native-iap` 12.x abstracts this — confirm the actual SKU shape by logging `getSubscriptions()` result in a sandbox run before relying on the catalog (`src/constants/products.ts`).

If the SKU shape differs from iOS, we'll need a platform-specific entry in the catalog (the file already uses `Platform.select`, so it's a one-line change per product).

### B3. Real-time Developer Notifications (RTDN)

- [ ] Cloud Console → enable **Pub/Sub** in the same GCP project as the Play Console linkage.
- [ ] Create topic `play-rtdn-mirror-collective`.
- [ ] Grant `google-play-developer-notifications@system.gserviceaccount.com` the **Pub/Sub Publisher** role on the topic.
- [ ] Create a **push subscription** with endpoint `https://api.themirrorcollective.com/api/subscriptions/webhook/google` and the OIDC token audience set so the backend can verify the JWT (the audience usually equals the endpoint URL).
- [ ] In Play Console → Monetization setup → enter the **full topic name** `projects/{gcp-project-id}/topics/play-rtdn-mirror-collective`.

### B4. Service account for Google Play Developer API (receipt validation)

- [ ] Cloud Console → IAM & Admin → Service Accounts → create `mirror-iap-validator`.
- [ ] Keys → create JSON key, download.
- [ ] Play Console → Users and Permissions → invite the service account email → grant **View financial data**, **Manage orders and subscriptions**.
- [ ] Add to backend secrets:
  - `GOOGLE_SERVICE_ACCOUNT_KEY` — full JSON contents
  - `GOOGLE_PACKAGE_NAME` — `com.themirrorcollective.mirror`

### B5. License-test accounts

- [ ] Play Console → Setup → License testing → add tester Google accounts.
- [ ] Testers also need to **join the closed/internal testing track** of the app.

---

## C. Verify end-to-end (sandbox)

After A1–A6 and B1–B5 are complete, run the full QA matrix.

> **See [`IAP_SANDBOX_QA.md`](./IAP_SANDBOX_QA.md)** — comprehensive 12-scenario runbook covering pricing spec §9: trial start/conversion/cancellation, monthly/annual purchase, restore, storage add-on attach/remove, billing failure, device swap, webhook entitlement updates, future feature-flag readiness, plus cross-cutting checks (lock-screen safety, `/docs` disabled in production, log payload hygiene, SKU whitelist enforcement).

Each scenario lists steps → expected → verification points (CloudWatch log lines, DynamoDB row shapes, telemetry events) so the QA team has a deterministic pass/fail per scenario.

---

## D. What I (Claude/codebase) already have ready

For reference — these are done in code and won't need a second pass when you finish the external setup above:

- ✅ `src/constants/products.ts` — single catalog of the 4 SKUs.
- ✅ `useInAppPurchase` hook — `initConnection`, fetch products, purchase listener, restore, `findProduct`, `formatLocalizedPrice`, `hasIntroductoryOffer`.
- ✅ `StartFreeTrialScreen` — live store-localized prices, monthly/yearly toggle, IAP-driven (no more backend `/start-trial`), Apple-compliant disclosure, working Restore link.
- ✅ `EchoVaultUpsellScreen` (Figma `4928-8944`) — ADD/Not now, monthly/yearly toggle, requestSubscription on continue.
- ✅ `YourSubscriptionScreen` (Figma `4928-8699` visual repurposed) — read-only management, deep link to App Store / Play subscription settings, "Add Echo Vault" CTA when not held.
- ✅ Navigation: `EchoVaultUpsell`, `YourSubscription` registered in `RootStackParamList` and `App.tsx`.
- ✅ `UpgradePrompt` routes `quota_exceeded` / `quota_approaching` to `EchoVaultUpsell` and `trial_expired` to `StartFreeTrial`.
- ✅ Backend `require_entitled` gates every paid route. Pre-flight quota check on `POST /echoes/upload-url`.
- ✅ Product catalog mirrored at `mirror_collective_python_api/src/app/constants/products.py`.

---

## E. Resolved / open product decisions

### Resolved by pricing spec 2026-05-12

1. ✅ **Storage add-on price** — $4.99/mo, $49/yr (spec §2).
2. ✅ **Basic price** — $9.99/mo, $89/yr (spec §1).
3. ✅ **Trial length and eligibility** — 14 days, first-time subscribers only (spec §5).
4. ✅ **Storage add-on in Basic group?** — no, separate subscription group so users can hold both concurrently (spec §4).

### Still open

1. **Family Sharing on Basic** — enable in App Store Connect? Affects validation flow (shared subscriptions report as `purchaserId != originalTransactionId.appAccountToken`). Default recommendation: **off** for v1 to keep the entitlement model simple; revisit when consumer feedback comes in.
2. **Refund handling** — Apple/Google initiated refunds: auto-revoke entitlement immediately, or honor through expiry_date? Current code (`SubscriptionService._handle_refund`) sets `status=refunded` and revokes immediately. Confirm this matches business policy.
3. **Promotional offers** (post-launch retention) — discount codes, win-back offers. Out of scope for v1 but Apple's offer code redemption sheet needs an entry point if used.
4. **SKU rename** — should `com.themirrorcollective.mirror.core.*` migrate to `.basic.*` to match the spec naming? Deferred — store-side migration with receipt implications. Internal code is already using `BASIC_*` keys; only the wire string lags. Re-evaluate after launch.
