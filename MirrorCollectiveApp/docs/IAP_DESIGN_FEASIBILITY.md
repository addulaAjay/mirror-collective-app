# Purchase & Add-on Designs — IAP Feasibility Review

> **Date:** 2026-05-11
> **Scope:** Feasibility of four Figma frames (`4928-8595`, `4928-8699`, `4928-8944`, `4928-8823`) when shipped through native In-App Purchase (Apple StoreKit + Google Play Billing).
> **Companion doc:** [`IAP_SUBSCRIPTION_REVIEW.md`](./IAP_SUBSCRIPTION_REVIEW.md) covers the existing code inventory.

---

## 0. Decisions locked (2026-05-11)

1. **Trial mechanism — Option α (Apple/Google native intro offer).** Card captured up front via the platform's native intro-offer mechanism. 14-day free, auto-renews to paid on day 15. The current backend `/api/subscriptions/start-trial` endpoint becomes vestigial — trial state is owned by Apple/Google and surfaces to us through receipt validation + S2S notifications.
2. **Checkout model — Contextual (no cart).** Screens 2 (`4928-8699`) and 4 (`4928-8823`) will **not** ship as cart-style checkouts. Their visual treatment is repurposed as a read-only **"Your subscription"** screen with deep-links to Apple/Google subscription management and an "Add Echo Vault" CTA that routes to Screen 3 (`4928-8944`).
3. **Add-on price** — still open (Screen 3 shows `$4.99/mo`, Screens 2/4 show `$3.99/mo`). Moot for implementation since the runtime price comes from the store, but App Store Connect needs a single source of truth.

---

## 1. Designs reviewed

| # | Figma node | Working title | Purpose |
|---|---|---|---|
| 1 | `4928-8595` | **Start your 14 Day free trial** | Trial / paywall entry for Mirror Core ($15.99/mo or $139/yr). |
| 2 | `4928-8699` | **Checkout (Core + Storage add-on)** | Cart-style review screen with both products and a `$18.99` total. |
| 3 | `4928-8944` | **Optional Add On — Echo Vault Storage** | Standalone storage upsell (+100 GB, $4.99/mo or $49/yr) with ADD / Not now toggle. |
| 4 | `4928-8823` | **Checkout (Core only, add-on chip)** | Same as #2 but with the add-on collapsed into a "+" chip. |

---

## 2. The native-IAP rules that shape feasibility

Two platform constraints govern everything below.

### 2.1 Apple and Google own the payment moment

You cannot show a custom "PROCEED TO PAYMENT" button that submits an arbitrary basket. The moment you call `requestSubscription(sku)`, the OS takes over and shows its **own native sheet** with Face ID / Touch ID / password confirmation. There is no API for "open my custom card form" and there is no API for "buy these two SKUs in one transaction." Each SKU is one transaction.

Consequence: a unified cart with a manually computed total works only if it represents a **single bundled SKU**, or if "Proceed" fires **multiple native sheets sequentially**.

### 2.2 Prices must come from the store at runtime

App Store Review (3.1.1) and Play Console policy require displayed prices to originate from `StoreKit` / `BillingClient`, not from hardcoded strings — so that local currency, regional pricing, tax, and promo offers reflect correctly. The numbers in the Figma frames are placeholders; the implementation must read `subscription.localizedPrice` at runtime.

---

## 3. Feasibility per screen

### Screen 1 — `4928-8595` "Start your 14 Day free trial" ✅ Feasible

| Element | Implementation |
|---|---|
| Mirror Core card with bullets | Static layout. ✅ |
| `$15.99/month or $139/year` | **Must** be replaced with `subscriptions[CORE_MONTHLY].localizedPrice` / `…[CORE_YEARLY].localizedPrice` at runtime. ⚠️ |
| `START FREE TRIAL` CTA | See § 4 — **two options**: capture payment up-front via Apple/Google intro offer (recommended), or keep current "no payment" backend trial. |
| `Cancel anytime.` | OK copy. ✅ |
| `Terms • Privacy • Restore Purchase` | Restore wires to `useInAppPurchase.restorePurchases()` which already exists. ✅ |

**Gotcha:** if we go with Apple/Google intro offer, the disclosure copy must match Apple's required pattern: "14-day free trial, then $15.99/month. Cancel anytime." Just "Start your 14 Day free trial" alone will be flagged by App Review.

### Screen 3 — `4928-8944` "Optional Add On — Echo Vault Storage" ✅ Feasible

| Element | Implementation |
|---|---|
| `+100 GB Storage` | Pull from `subscriptions[STORAGE_MONTHLY].title` / `description`. ✅ |
| `$4.99/month or $49/year` | From `…localizedPrice`. ⚠️ |
| `ADD` / `Not now` toggle | Local state. ADD does not buy immediately — it stages intent. ✅ |
| `CONTINUE` button | If ADD was selected → call `requestSubscription(STORAGE_MONTHLY)`. If "Not now" → navigate forward without storage. ✅ |
| `You can change this anytime.` | True — user can buy storage later from settings. ✅ |
| `Restore Purchase` footer | Same as Screen 1. ✅ |

**Note:** the design lists `$4.99/mo` here but `$3.99/mo` on Screens 2/4. These need to be reconciled in the design (or, more precisely, both numbers go away and we display whatever the store returns).

### Screens 2 & 4 — Checkout with totals ⚠️ Conditionally feasible — needs redesign or constrained flow

This is where native IAP and the design diverge most.

**What's shown:**
- A cart with "Mirror Basic $15.99" and (optionally) "Echo Vault Storage $3.99"
- A manually computed `Total: $18.99`
- An `Edit` / `Delete` action per line
- A single `PROCEED TO PAYMENT` CTA

**Why this is hard under native IAP:**

1. **One CTA cannot buy two products in one transaction.** Apple/Google show one native sheet per SKU. We have four options for what "PROCEED TO PAYMENT" actually does:

   | Option | Behavior | UX | Trade-off |
   |---|---|---|---|
   | **A** Sequential native sheets | Tap → buy Core (sheet 1) → on success → buy Storage (sheet 2) | Two confirmation sheets back-to-back | Familiar to users; either purchase can fail/cancel independently — need to handle "Core succeeded but Storage cancelled." |
   | **B** Bundle SKU | Create a single product `mirror.core_plus_storage.monthly` ($18.99) | One sheet, one transaction | Cleanest UX, but every Core / Storage combination needs its own SKU in App Store Connect (4 products → potentially 8+). Loses flexibility — user can't cancel storage independently without cancelling Core. |
   | **C** Sequential staged | Replace the cart with a 2-step wizard: "Step 1/2 Subscribe to Mirror Core" → "Step 2/2 Add Echo Vault?" — each step has its own native sheet | One product per step, with progress | Easier to recover from partial failure, but loses the "see the total" moment users like. |
   | **D** Skip the unified checkout | After trial-start, sell add-ons only from in-context upsell screens (Screen 3 pattern) — never show a cart with two items | One purchase, one sheet, always | The simplest path — but kills Screen 2 / Screen 4 entirely. |

2. **The `Total: $18.99` calculation is fiction unless we sum store-supplied prices.** If the user is in the EU, prices are localized — the total must add `subscriptions[CORE_MONTHLY].priceAmountMicros + subscriptions[STORAGE_MONTHLY].priceAmountMicros` and display in `priceCurrencyCode`. Hardcoded `$18.99` will be wrong for most users and rejected by App Review.

3. **`Edit` per line** — fine if it means "switch monthly ↔ yearly" (local state change) or "remove from cart" before purchase. After purchase, "edit" is impossible client-side; user must go to App Store / Play subscription settings.

4. **`Delete` per line** — fine pre-purchase. Post-purchase = deep link to `https://apps.apple.com/account/subscriptions` or `https://play.google.com/store/account/subscriptions`. **No in-app one-tap cancel exists.**

5. **`CANCEL ANYTIME` trust pillar at the bottom is OK** as a marketing claim — the actual cancel happens off-app via the store. The icon needs a deep-link target.

**Recommendation:** if we keep the "Checkout with total" mental model, **Option A (sequential sheets)** is the most honest. The simpler path is **Option D** — drop the cart and treat each subscription as its own moment. Most subscription apps (Spotify, Apple Music, Calm, Headspace) use D.

---

## 4. The big architectural decision — how does the trial actually work?

The four designs presuppose a flow. We have to pick which one before we wire any of these screens.

### Option 4-α — "Apple/Google native intro offer" (industry standard)

User taps `START FREE TRIAL` → Apple/Google native sheet → user enters/confirms payment method → 14-day free → auto-renews to paid on day 15.

- **Pros:** 50–70 % paid conversion (industry benchmark). Apple/Google manage the entire lifecycle (renewal, dunning, refunds, family sharing). The existing `Subscription` table just stores what they tell us via S2S notifications.
- **Cons:** Higher friction on the *trial* signup (user must add a card). The current `/api/subscriptions/start-trial` endpoint becomes vestigial — trial state is owned by Apple/Google.
- **Backend impact:** `start-trial` endpoint is deleted or repurposed; trial activation happens inside `/verify-purchase` when we see `is_trial_period: true` / `paymentState: 2`.

### Option 4-β — "Free trial as an entitlement flag" (current backend behavior)

User taps `START FREE TRIAL` → backend marks them trial → 14-day countdown starts immediately, no payment captured → on day 15 the user must come back, tap Subscribe, and go through the native sheet **then**.

- **Pros:** Lower friction on signup; the user actually experiences the product before being asked for money. Aligns with the current backend code.
- **Cons:** Lower paid conversion (typically 5–10 %). Two distinct screens needed: trial-start (no IAP) **and** post-trial paywall (IAP). Users churn at the conversion step.
- **Backend impact:** Keep `/start-trial` as-is. Add a separate "Subscribe at end of trial" flow that uses IAP.

### Option 4-γ — "Hybrid"

Trial via Apple/Google intro offer **for the storefront-driven flow** (Screen 1), but also keep the no-card trial as an **alternative path** (e.g., behind a "Try without card" link, or for users acquired through marketing campaigns).

- **Pros:** Best of both worlds; supports A/B testing on conversion.
- **Cons:** Double the code paths to test and maintain.

**Recommendation:** Option 4-α for v1. The conversion math is overwhelmingly in its favor for a $15.99/mo product, and it gets us out of the business of managing trial lifecycle (Apple/Google do it for free). Revisit 4-γ later if data warrants.

---

## 5. What's feasible end-to-end (concrete proposal)

If we adopt 4-α and Option D on Checkout, the four designs become:

| Figma frame | Ship as | Changes from design |
|---|---|---|
| **Screen 1** (`4928-8595`) Start free trial | Mirror Core paywall with Apple/Google intro offer | Prices dynamic. Disclosure copy updated to "14-day free trial, then \$15.99/mo. Cancel anytime." CTA fires `requestSubscription(CORE_MONTHLY)`. |
| **Screen 3** (`4928-8944`) Optional add-on | Echo Vault Storage upsell (Screen 3 verbatim) | Prices dynamic. Shown either inside onboarding (after Screen 1 success) or from settings later. ADD fires `requestSubscription(STORAGE_MONTHLY)`. |
| **Screen 2** (`4928-8699`) Checkout with total | **Drop** as a checkout screen | Repurpose as a **post-purchase confirmation / "Your subscription"** screen (read-only, prices from store, Edit deep-links to App Store Subscriptions). |
| **Screen 4** (`4928-8823`) Checkout with add-on chip | **Drop** as a checkout screen | Same — repurpose as the "Your subscription" screen with an "Add Echo Vault" CTA that takes the user to Screen 3. |

If we instead keep the cart-style Checkout (because that mental model is important), we use **Option A (sequential sheets)** and accept the dual-sheet UX. That's the highest-fidelity rendering of the designs but introduces partial-failure complexity.

---

## 6. Implementation effort (rough)

Assumes the existing IAP plumbing from `IAP_SUBSCRIPTION_REVIEW.md`.

| Work item | Days |
|---|---|
| Build Screen 1 paywall against `useInAppPurchase` with live prices + intro offer | 1–2 |
| Build Screen 3 add-on upsell with live prices | 1 |
| If keeping cart-Checkout (Screen 2/4): sequential-sheet flow + partial-failure recovery | 3–4 |
| If dropping cart-Checkout: build "Your subscription" management screen | 1–2 |
| Backend tightening (Phase A from review doc — JWS, idempotency, ASSN v2) | 3–4 |
| App Store Connect + Play Console product setup + sandbox testing | 1–2 |
| Visual-QA + analytics + tests | 2 |

**Total:** roughly **2 weeks** if we drop the cart-Checkout; **3 weeks** if we keep it.

---

## 7. Open questions for product/design

1. **Trial mechanism — 4-α or 4-β?** (Biggest decision; gates everything else.)
2. **Checkout model — cart (Screens 2/4) or contextual upsell (Screen 3 only)?**
3. **Reconcile add-on price** — design shows `$4.99` on Screen 3 vs `$3.99` on Screens 2/4. Which is correct? (Or: drop both, use store price.)
4. **What does `Edit` mean** on the Checkout line items — billing period swap, or quantity, or both?
5. **What does `Delete` mean** post-purchase — deep link to store cancel, or grace-period cancel via our `/cancel` endpoint?
6. **Storage tier choice** — Screen 3 advertises "+100 GB" but the backend has `STORAGE_MONTHLY`/`STORAGE_YEARLY` as single SKUs. Is +100 GB one tier or multiple (50 GB, 100 GB, 250 GB)?
7. **Annual pricing copy** — `$139/year` is currently hardcoded. Confirm the actual yearly price tier in App Store Connect.
