# In-App Purchase & Subscription — State of Implementation

> **Date:** 2026-05-12 (refresh after the pricing spec landed)
> **Scope:** Mirror Collective React Native app + Python (FastAPI / serverless) backend
> **Status:** Code complete against pricing spec **"MIRROR PRICING & PACKAGING — DEV HANDOFF 5.12.16"** (launch 2026-06-15). Remaining work is external store/AWS setup + manual sandbox QA.

---

## 1. Executive summary

The trial + subscription + storage add-on stack is **~95% built end-to-end** and aligned to the canonical pricing spec. All P0/P1 items from the 2026-05-11 review are closed; the architecture is ready for the future Mirror Plus tier without rewrites.

Backend PR open at [addulaAjay/mirror-collective-python-api#47](https://github.com/addulaAjay/mirror-collective-python-api/pull/47) — 16 commits, +5288 / −508 across 35 files, full suite 665 passed / 2 skipped.

Recommendation: hold the DIY stack (react-native-iap + custom validators + DynamoDB). Next step is external setup (App Store Connect, Play Console, SNS, AWS env config) followed by sandbox QA per spec §9.

---

## 2. Pricing-spec coverage

| Spec § | Item | Status |
|---|---|---|
| §1 | Mirror Basic plan ($9.99/mo, $89/yr, 14-day trial, MirrorGPT + Echo Vault + 50 GB) | ✅ Shipped |
| §2 | Echo Vault Storage add-on (+100 GB, $4.99/mo, $49/yr) | ✅ Shipped |
| §3 | Future Plus tier reserved | ✅ Architecture ready (feature flags + tier enum); UI is V2 work |
| §4 | Subscription groups (mirror_basic, vault_storage, mirror_plus future) | ⏸ ASC / Play Console product setup |
| §5 | 14-day trial rules + 5 trial events (`paywall_view`, `start_trial`, `trial_convert`, `trial_cancel`, `trial_expire`) | ✅ All wired |
| §6 | Entitlements (basic_access + 9 reserved Plus features) | ✅ Shipped via `Feature` enum + `require_feature` factory |
| §7 | Server tasks (receipt validation, S2S, trial state, billing failure, storage attach/remove, Plus-ready arch) | ✅ All wired |
| §8 | Client tasks (paywall toggle, 14-day display, +100 GB toggle, restore, manage sub, manage add-on, Plus-ready, lock-screen-safe push) | ✅ All wired |
| §9 | QA scenarios | ⏸ Manual sandbox testing once §4 setup is done |
| §10 | Launch product scope (Basic only) | ✅ Code aligned |
| §11–§12 | Core product rule + feature-flag architecture | ✅ Followed throughout |

---

## 3. What's shipped

### 3.1 Frontend

| Surface | File | What it does |
|---|---|---|
| Paywall | `src/screens/StartFreeTrialScreen.tsx` | Monthly/Yearly toggle. Optional **+100 GB storage toggle** that fires a second native sheet sequentially on submit (pricing spec §8). Live store prices, fail-closed defaults, restore-purchases button, tappable Terms/Privacy. Fires `paywall_view` (`surface=start_trial`) on mount. |
| Contextual storage upsell | `src/screens/EchoVaultUpsellScreen.tsx` | Reached from quota-exceeded UpgradePrompt or "Add Echo Vault Storage" on YourSubscription. Fires `paywall_view` (`surface=echo_vault_upsell`) on mount. |
| Subscription management | `src/screens/YourSubscriptionScreen.tsx` | Plan + storage rows. "Manage in App Store / Play Store" deep link for Basic; per-SKU "Manage or remove" link for storage. |
| Sequential-sheets helper | `src/hooks/useInAppPurchase.chain.ts` | Pure-ish `purchaseBasicWithOptionalStorage` function that owns the Basic → optional storage sequencing; 6 unit tests pin every `storageOutcome` path. |
| IAP hook | `src/hooks/useInAppPurchase.ts` | `react-native-iap@^12.16.4`. `purchaseSubscription` returns `Promise<boolean>` so callers can branch on Basic outcome. Restore collects iOS receipts / Android tokens → backend. |
| Subscription context | `src/context/SubscriptionContext.tsx` | Single source of truth on the client. Fail-closed defaults. `AppState → active` rehydrate. Tier values: `free` &#124; `trial` &#124; `basic` (future: `plus`). Storage signalled by `storage_add_on_active` separately. |
| Entitlement hook | `src/hooks/useEntitlement.ts` | Single predicate (`status ∈ {trial, active, grace_period}`) + storage quota numbers. Used by every UI gate. |
| Gate wrapper | `src/components/SubscriptionGate.tsx` | Reusable wrapper; full-lock paywall when not entitled. |
| Upgrade prompt | `src/components/UpgradePrompt.tsx` | Modal for `quota_exceeded`, `quota_approaching`, `trial_expired`. Routes to right paywall surface. |
| Toast | `src/components/Toast/*` | In-house transient feedback (replaced Alert.alert across the IAP + Echo Vault flows). Three tones. |
| Push notifications | `src/services/PushNotificationService.ts` | FCM init + token registration with backend. Foreground/background/cold-start handlers. Branches on `data.type === 'payment_failed'` and deep-links to YourSubscription. Reads `data.in_app_*` first (lock-screen-safe two-tier copy). |
| Navigation ref | `src/services/navigationRef.ts` | Module-level nav ref for deep-linking from non-React modules (push handlers). |
| Telemetry beacon | `src/services/api/telemetry.ts` | `firePaywallView(surface?)` — fire-and-forget, error-swallowed. |

### 3.2 Backend

| Component | File | What it does |
|---|---|---|
| Entitlement gate | `src/app/core/entitlement.py` | `require_feature(Feature.X)` async dependency factory. Composes status gate (`{trial, active, grace_period}`) with tier gate. Status precedence: a Plus user whose card expired sees `trial_expired`/`expired`, not the feature lock. `require_entitled` kept as back-compat alias for `require_feature(BASIC_ACCESS)`. |
| Feature catalog | `src/app/core/features.py` | `Feature` enum (BASIC_ACCESS live + 9 reserved Plus features). `FEATURE_TIER_MAP` — single source for tier→feature grants. `tier_grants()` pure predicate. ECHO_MAP_ACCESS is Basic at launch (spec §10) and flips to `{plus}` in V2 by editing one line. |
| Subscription service | `src/app/services/subscription_service.py` | Receipt verification orchestration, activation, renewal/expiry/cancel/refund webhook handling. Idempotency via conditional DynamoDB put. Auto-renew status tracking. Trial-event emission. Payment-failure push dispatch. |
| Apple client | `src/app/services/apple_app_store_client.py` | App Store Server API SDK wrapper (replaced deprecated `verifyReceipt`). JWS x5c verification with bundled Apple Root CA - G3. |
| Google client | `src/app/services/google_pubsub_client.py` | RTDN Pub/Sub OIDC JWT verification + base64 decoding. |
| Receipt validator | `src/app/services/receipt_validator.py` | Cross-platform validation glue. |
| Storage quota | `src/app/services/storage_quota_service.py` | Quota math = `50 GB` (basic/trial) + `100 GB` if `storage_add_on_active`. Per-echo size sums via `user-echoes-index` GSI (no more per-call S3 inventory). |
| Push dispatch | `src/app/services/sns_service.py` | SNS endpoint creation + `publish_to_endpoint` with cross-platform APNS/GCM payload. |
| Telemetry | `src/app/services/telemetry/subscription_events.py` | 5 trial events. PII-filtered StructuredLogEmitter. Swappable to Mixpanel/Segment in one place. |
| Routes | `src/app/api/subscription_routes.py` | `/start-trial` (deprecated, kept for backwards compat), `/trial-status`, `/status`, `/verify-purchase`, `/restore-purchases`, `/cancel`, `/billing-history`, `/quota-status`, `/webhook/apple`, `/webhook/google`. |
| Telemetry routes | `src/app/api/telemetry_routes.py` | `/telemetry/paywall-view` and 3 Reflection Room beacons. |
| Echo routes | `src/app/api/echo_routes.py` | Every route gated via `require_entitled`. Pre-flight quota check on upload-url. Per-echo `size_bytes` stored at create/update; backend HeadObjects to verify client-claimed size (defence against tampered clients). |

### 3.3 Data model

- **`UserProfile.subscription_tier`** ∈ `{free, trial, basic}` (future: `plus`). Storage signalled separately by `storage_add_on_active`. No `core_plus` legacy value.
- **`Subscription.subscription_type`** = `SubscriptionType.MIRROR_BASIC` &#124; `STORAGE_ADD_ON` (wire values `"basic"` / `"storage"`).
- **`Subscription.status`** = 8-value enum (`NONE`, `TRIAL`, `TRIAL_EXPIRED`, `ACTIVE`, `EXPIRED`, `CANCELLED`, `GRACE_PERIOD`, `REFUNDED`). Idempotency keyed on `subscription_id` (= `original_transaction_id`).
- **`SubscriptionEvent`** = audit row per lifecycle transition.
- **`Echo.size_bytes`** = persisted at create/update; backend HeadObjects to verify; quota service sums these instead of S3-scanning.
- **`device_tokens`** (DynamoDB) = FCM/APNs tokens per user + SNS endpoint ARN.

### 3.4 Telemetry

- **`paywall_view`** (FE → `POST /api/telemetry/paywall-view`, surface ∈ `start_trial` / `echo_vault_upsell`)
- **`start_trial`** (BE, on successful trial activation)
- **`trial_convert`** (BE, on first successful renewal after `TRIAL` status)
- **`trial_cancel`** (BE, on user-initiated cancel while status is `trial`)
- **`trial_expire`** (BE, on `TRIAL → EXPIRED` transition)

Plus lifecycle audit events (`SUBSCRIPTION_PURCHASED`, `renewed`, `renewal_failed`, `expired`, `refunded`, `SUBSCRIPTION_CANCELLED`, `auto_renew_status_changed`) persisted to the `subscription_events` table.

### 3.5 Push notifications

- **Lock-screen-safe two-tier copy**: visible APNS `aps.alert` always generic (`"Mirror Collective"` / `"Tap to open Mirror Collective"`); detailed copy lives in `data.in_app_title` / `data.in_app_body` for the in-app alert. `mutable-content=1` already set for a future Notification Service Extension.
- **Payment-failure dispatch**: triggered from `_handle_renewal_failure`. Fans out to every registered device via `SNSService.publish_to_endpoint`. Best-effort; never bubbles. Cross-platform payload (APNS + GCM rendered by `_generate_payload`).
- **Client routing**: foreground → action-bearing alert with "Update Payment" CTA; background tap + cold-start → deep-link to `YourSubscriptionScreen` via the `navigationRef` singleton.

---

## 4. Entitlement matrix (locked 2026-05-11, refreshed 2026-05-12)

Two-axis gate. **Status precedence:** an entitled tier with an expired status still gets 402; conversely a live status with the wrong tier gets 402 with a feature-locked reason.

### 4.1 Status axis

| `subscription_status` | Entitled? | 402 reason |
|---|---|---|
| `trial` | ✅ | — |
| `active` | ✅ | — |
| `grace_period` | ✅ (Apple billing retry; user can still use the app while Apple retries the charge) | — |
| `none` | ❌ | `"free"` |
| `trial_expired` | ❌ | `"trial_expired"` |
| `expired` | ❌ | `"expired"` |
| `cancelled` | ❌ | `"expired"` |

### 4.2 Tier axis (`FEATURE_TIER_MAP`)

| Feature | Tier set | Notes |
|---|---|---|
| `BASIC_ACCESS` | `{trial, basic, plus}` | MirrorGPT, Echo Vault — live at launch |
| `ECHO_MAP_ACCESS` | `{trial, basic, plus}` | Spec §10 exception — ships with Basic; flips to `{plus}` in V2 |
| `PLUS_ACCESS` | `{plus}` | Reserved; gate-on for any future Plus-only route |
| `REFLECTION_ROOM_ACCESS` | `{plus}` | Reserved (V2) |
| `ECHO_SIGNATURE_ACCESS` | `{plus}` | Reserved (V2) |
| `MIRROR_MOMENT_ACCESS` | `{plus}` | Reserved (V2) |
| `MIRROR_PLEDGE_ACCESS` | `{plus}` | Reserved (V2) |
| `CODE_LIBRARY_ACCESS` | `{plus}` | Reserved (V3) |
| `MEMORY_TIMELINE_ACCESS` | `{plus}` | Reserved (V4) |
| `ROLE_PATTERN_TIMELINE_ACCESS` | `{plus}` | Reserved (V3) |

### 4.3 Storage quota

Decoupled from tier. Quota = `50 GB` (when tier ∈ `{trial, basic, plus}`) + `100 GB` (when `storage_add_on_active = True`). Buying the add-on does **not** promote the tier value — preserves orthogonality with the future `plus` tier.

---

## 5. Locked architectural decisions

See `~/.claude/projects/.../memory/project_iap_decisions.md` for full details.

1. **Trial mechanism: native intro offer (Option α).** 14-day, card up-front, owned by Apple/Google. Legacy `/start-trial` deprecated.
2. **Checkout UX: contextual / no cart.** Validated 2026-05-12 against the new spec — "toggle on paywall + sequential native sheets" is the IAP-native ceiling for cart-like UX. Apple/Google forbid real subscription carts.
3. **DIY stack** (`react-native-iap` + custom validators + DynamoDB). Not switching to RevenueCat.
4. **Tier decoupled from storage add-on.** `subscription_tier ∈ {free, trial, basic, plus}`; storage signalled by `storage_add_on_active`.
5. **Echo Vault delete is soft-delete by design.** Users may come back and need to see history. `used_gb` includes soft-deleted objects (S3 reality).
6. **Lock-screen safety.** Generic copy in `aps.alert`, rich copy in `data.in_app_*`.

---

## 6. Open items

### 6.1 Engineering (small, can land soon)

- **Open frontend PR** — 12 IAP commits + 5 pre-IAP `mirror-chat` commits on `fix/mirror-chat-scroll-keyboard`. No hard rule but worth doing before more stacks on top.
- **Screen-level rendering tests** for `StartFreeTrialScreen`, `EchoVaultUpsellScreen`, `YourSubscriptionScreen`. The new chain logic is tested via the extracted helper; screen-level integration coverage is the gap. ~150 lines per screen.
- **`subscription_service.py` size refactor** — 1297 lines, over the 800-line guideline. Could split into core CRUD / webhooks / telemetry helpers. Pure refactor; deferred.

### 6.2 External setup (blocks launch — not engineering work)

See `docs/IAP_STORE_SETUP.md` for the full checklist.

- Apple paid-apps agreement + banking/tax in App Store Connect.
- Create 4 products in ASC: `com.themirrorcollective.mirror.{core.monthly,core.yearly,storage.monthly,storage.yearly}` at $9.99 / $89 / $4.99 / $49. 14-day intro offer on the two Basic SKUs, first-time subscribers only. **Note:** the SKU strings still contain `core` (legacy); renaming to `.basic.` is a store-side migration deferred post-launch.
- Mirror products in Play Console.
- Enable "In-App Purchase" capability in Xcode project.
- SNS Platform Application ARNs (APNS + FCM); set `SNS_IOS_APP_ARN`, `SNS_ANDROID_APP_ARN`.
- DynamoDB tables in target env: `subscriptions`, `subscription_events`, `user_device_tokens` + indexes.
- Env vars: Apple `.p8` key + key ID + issuer ID, Google service account JSON, `GOOGLE_PUBSUB_VERIFY=true` in prod.
- Sandbox accounts + run spec §9 QA scenarios (free trial start/convert/cancel, monthly/annual purchase, restore, storage add-on attach/remove, billing failure, device swap, webhook entitlement updates).

### 6.3 Future / V2 (deferred by design)

- **Plus-tier UI** (paywall, upgrade entry point, plan indicators). Backend architecture ready; awaits V2 product spec.
- **iOS Notification Service Extension** to let the lock screen show rich copy on unlocked phones. Today's payload sends generic copy that's safe everywhere; the extension is a future polish.
- **"Approaching capacity" quota UX.** `StorageMeter.tsx` component built but hidden per product decision; designer to spec.
- **"Deleted echoes / history" surface.** Implied by the soft-delete decision; no UI spec yet.
- **SKU rename** `com.themirrorcollective.mirror.core.*` → `com.themirrorcollective.mirror.basic.*`. Store-side migration with receipt implications; deferred indefinitely.

---

## 7. Reference

- Memory: `project_iap_decisions.md` — locked architectural decisions, validated 2026-05-12
- `docs/IAP_DESIGN_FEASIBILITY.md` — Figma → IAP feasibility mapping
- `docs/IAP_STORE_SETUP.md` — external setup checklist
- Backend PR: [addulaAjay/mirror-collective-python-api#47](https://github.com/addulaAjay/mirror-collective-python-api/pull/47)
- Pricing spec: "MIRROR PRICING & PACKAGING — DEV HANDOFF 5.12.16", launch 2026-06-15
