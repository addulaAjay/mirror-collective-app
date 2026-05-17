# Sandbox QA Runbook — IAP / Subscription

> **Owner:** QA + product. Run against sandbox before TestFlight / closed-testing.
> **Companion:** [`IAP_STORE_SETUP.md`](./IAP_STORE_SETUP.md) (must be done first), [`IAP_SUBSCRIPTION_REVIEW.md`](./IAP_SUBSCRIPTION_REVIEW.md) (current state).
> **Scope:** all 10 scenarios from pricing spec §9 + intro-offer eligibility + lock-screen safety.

---

## 0. Prerequisites — must be true before running any scenario

| | Check |
|---|---|
| **A** | All of `IAP_STORE_SETUP.md` sections A1–A6 complete (ASC paid agreement Active; 4 products created with **$9.99 / $89 / $4.99 / $49**; 14-day intro offer on the two Basic SKUs, **eligibility = New Subscribers only**; sandbox testers added; Xcode "In-App Purchase" capability enabled). |
| **B** | All of `IAP_STORE_SETUP.md` sections B1–B5 complete (Play Console payments profile Active; products mirrored; RTDN topic + push subscription pointed at backend; service account JSON loaded; license testers in internal testing track). |
| **C** | Backend deployed to a sandbox env reachable from the test device. Required env vars: `APPLE_ISSUER_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `APPLE_BUNDLE_ID`, `GOOGLE_SERVICE_ACCOUNT_KEY`, `GOOGLE_PACKAGE_NAME`, `GOOGLE_PUBSUB_VERIFY=true`, `SNS_IOS_APP_ARN`, `SNS_ANDROID_APP_ARN`, `ENVIRONMENT=sandbox` (NOT `production` — that disables `/docs` + enforces strict checks). |
| **D** | DynamoDB tables exist in the sandbox env: `subscriptions`, `subscription_events`, `user_device_tokens`, plus their GSIs (see `serverless.yml`). |
| **E** | Two physical devices available (one iOS, one Android). Sim/emulator works for most flows except APNs (S5, S8). |
| **F** | CloudWatch / log tail access for the backend so log lines and DynamoDB rows can be inspected per scenario. |

---

## 1. Verification toolkit

For each scenario, "Verify" steps reference one of these inspection points. Have them ready:

### 1a. CloudWatch log filters

```
# Subscription lifecycle events
fields @timestamp, @message
| filter @message like /SUBSCRIPTION_PURCHASED|renewed|renewal_failed|expired|SUBSCRIPTION_CANCELLED|refunded/
| sort @timestamp desc

# Trial telemetry events (JSON-line emitter)
fields @timestamp, @message
| filter @message like /paywall_view|start_trial|trial_convert|trial_cancel|trial_expire/
| sort @timestamp desc

# Webhook signature failures (forged payloads → 401)
fields @timestamp, @message
| filter @message like /JWS|signature|verify_signed/
| sort @timestamp desc
```

### 1b. DynamoDB inspection (AWS CLI)

```bash
USER_ID=<cognito sub>
TXN=<original_transaction_id>

# User profile snapshot
aws dynamodb get-item \
  --table-name user_profiles \
  --key "{\"user_id\":{\"S\":\"$USER_ID\"}}" \
  --query 'Item.{tier:subscription_tier.S,status:subscription_status.S,quota:echo_vault_quota_gb.N,addon:storage_add_on_active.BOOL,primary:primary_subscription_id.S,storage:storage_subscription_id.S}'

# Subscription rows (both Basic + Storage)
aws dynamodb query \
  --table-name subscriptions \
  --key-condition-expression "user_id = :uid" \
  --expression-attribute-values "{\":uid\":{\"S\":\"$USER_ID\"}}" \
  --query 'Items[*].{id:subscription_id.S,product:product_id.S,type:subscription_type.S,status:status.S,autorenew:auto_renew_enabled.BOOL,expiry:expiry_date.S}'

# Audit trail
aws dynamodb query \
  --table-name subscription_events \
  --key-condition-expression "user_id = :uid" \
  --expression-attribute-values "{\":uid\":{\"S\":\"$USER_ID\"}}" \
  --query 'Items[*].{event:event_type.S,ts:timestamp.S,sub:subscription_id.S}' \
  | head -20
```

### 1c. Apple StoreKit sandbox time acceleration

Sandbox subscriptions renew on an accelerated schedule:
- Monthly → renews every **5 minutes** (max 6 renewals)
- Yearly → renews every **1 hour** (max 6 renewals)
- 14-day trial → ends after **3 minutes**

This lets you exercise trial conversion / expiration in a single session.

### 1d. Google Play Billing test rules

License testers see test card "Test card, always approves" and "Test card, always declines" prompts. Configure in **Play Console → Setup → License testing**.

---

## 2. Test scenarios

Each scenario lists: **Steps → Expected → Verify**. Backend log lines reference the relevant file:line so you can grep production logs against current code.

### S1. Free trial start  *(spec §9 #1)*

**Steps:**
1. Fresh sandbox tester signs into the app.
2. Reach `StartFreeTrialScreen`.
3. Confirm visible copy includes "14-day free trial, then $9.99/month" (or $89/year on Yearly toggle).
4. Tap **Start Free Trial**.
5. Native sheet appears showing the 14-day intro offer.
6. Confirm purchase with sandbox tester credentials.

**Expected:**
- Native sheet dismisses; app receives `purchaseUpdatedListener` event.
- Hook calls `POST /api/subscriptions/verify-purchase`.
- `SubscriptionContext.status` flips to `'trial'`, `tier` to `'trial'`.
- Echo Vault entry now accessible (no `<SubscriptionGate>` paywall).

**Verify:**
- Backend log: `Subscription activated user=… product=…core.monthly trial=True` (subscription_service.py ~line 248).
- DynamoDB `subscriptions` row: `status=trial`, `subscription_type=basic`, `auto_renew_enabled=true`.
- DynamoDB `user_profiles` row: `subscription_status=trial`, `subscription_tier=trial`, `echo_vault_quota_gb=50`.
- DynamoDB `subscription_events` row: `event_type=SUBSCRIPTION_PURCHASED`, metadata `is_trial=true`.
- Telemetry log: JSON line with `"event":"paywall_view","surface":"start_trial"` (fired on screen mount).
- Telemetry log: JSON line with `"event":"start_trial"` (fired by backend after activation).

**Failure modes to spot:**
- Subscription row stuck in `none` → check Apple Server API credentials; check JWS verification failure in logs.
- `subscription_tier=basic` instead of `trial` → P-H1 regression (commit `c1e1778`); only happens if you're running an older backend.

---

### S2. Free trial conversion  *(spec §9 #2)*

**Steps:**
1. With an active trial subscription (from S1), wait the StoreKit sandbox 3-minute trial window.
2. Background the app; foreground after the trial ends; verify ASSN v2 webhook delivered.
3. Continue using the app — verify status changed.

**Expected:**
- Apple delivers `DID_RENEW` ASSN v2 notification to `/api/subscriptions/webhook/apple`.
- Backend processes it via `_handle_subscription_renewal`.
- DynamoDB: `status` transitions `trial → active`, `tier` transitions `trial → basic`, `expiry_date` extended by one billing period.
- Telemetry event `trial_convert` emitted.

**Verify:**
- Backend log: `Handling subscription renewal: txn=<txn-id>` (subscription_service.py:1128 — note: txn only, not full payload, per S-M3).
- DynamoDB `subscriptions`: `status=active`.
- DynamoDB `user_profiles`: `subscription_tier=basic` (no longer `trial`).
- DynamoDB `subscription_events`: new row with `event_type=renewed`.
- Telemetry log: `"event":"trial_convert"` JSON line.

**Failure modes:**
- Webhook 401 → signature verification failing; check Apple Root CA bundle is loaded (`src/app/resources/apple_root_certificates/AppleRootCA-G3.cer`).
- Webhook 500 → Apple retries up to 5x over 5 days; check CloudWatch for re-raised exceptions in `_handle_subscription_renewal`.

---

### S3. Free trial cancellation  *(spec §9 #3)*

**Steps:**
1. With an active trial (from S1, before the 3-min window expires), open Settings → Apple ID → Subscriptions.
2. Find Mirror Collective → **Cancel Subscription**.
3. Confirm cancellation in iOS dialog.
4. Return to the app, foreground it.

**Expected:**
- App reflects status change on `AppState → active` rehydrate (`SubscriptionContext` refetches).
- User retains entitlement until trial expiry (currently active trial, auto-renew off).
- After trial expiry, status flips to `trial_expired` and locks features.

**Verify:**
- DynamoDB `subscriptions`: `auto_renew_enabled=false`.
- Backend log: `Cancelled subscription <id> for user <user>`.
- DynamoDB `subscription_events`: `event_type=SUBSCRIPTION_CANCELLED`.
- Telemetry log: `"event":"trial_cancel"` JSON line (fired because the row status was still `trial` at cancel time, per S-M3 trim).
- After 3-min sandbox trial window expires: `EXPIRED` webhook fires → `subscription_status=trial_expired` on profile, `subscription_tier=free`, `echo_vault_quota_gb=0`.
- Telemetry log after expiry: `"event":"trial_expire"`.

---

### S4. Monthly purchase  *(spec §9 #4)*

**Steps:**
1. Sandbox tester who has previously used a trial (so they're NOT eligible for another intro offer).
2. Open `StartFreeTrialScreen`.
3. CTA copy should now read **"Subscribe"** (no "14-day free trial").
4. Tap → native sheet shows `$9.99/month`, **no intro offer**.
5. Confirm purchase.

**Expected:**
- `verify-purchase` activates a paid (non-trial) subscription immediately.
- `subscription_status=active`, `tier=basic` (NOT `trial`) from activation.

**Verify:**
- DynamoDB `subscriptions`: `status=active`, `is_in_trial=false`.
- DynamoDB `user_profiles`: `subscription_tier=basic` immediately (no trial-then-flip).
- DynamoDB `subscription_events`: `SUBSCRIPTION_PURCHASED` with metadata `is_trial=false`.
- Telemetry log: `paywall_view` only — **no `start_trial`** event (this is a paid purchase, not a trial activation).
- Frontend `isTrialMode` evaluates false, button text reads "SUBSCRIBE".

---

### S5. Annual purchase  *(spec §9 #4)*

Same as S4 but toggle to Yearly. Expected price `$89/year`. Expected DynamoDB `billing_period=yearly`. Otherwise identical to S4.

---

### S6. Restore purchase  *(spec §9 #5)*

**Steps:**
1. Tester with an active Basic subscription installed in S1/S2/S4.
2. Sign out of the app (clears local AsyncStorage / Cognito session).
3. Reinstall OR clear app data.
4. Sign in again.
5. Open `StartFreeTrialScreen`.
6. Tap **Restore Purchase** link in the footer.

**Expected:**
- Hook collects all available purchases from the store.
- POSTs to `/api/subscriptions/restore-purchases` with iOS receipts / Android purchase tokens.
- Backend validates each via the same path as `/verify-purchase` (uses `put_item_if_not_exists` so a live row isn't clobbered, per S-M4).
- App reflects the restored entitlement immediately.

**Verify:**
- Backend log: `Restore skipped existing row for user <user> subscription <id>` if the row was already there (confirms the put-if-not-exists guard fired).
- Toast: `"<n> subscriptions restored."`.
- `SubscriptionContext.status` populated correctly.

**Edge cases to spot:**
- iOS restore today sends `transactionReceipt` blobs; if S-L8 from the security review hits, the backend will silently skip those because the App Store Server API needs `originalTransactionIdentifierIOS`. Symptom: app says "0 subscriptions restored" but the user actually has one. If you see this, capture the failed log line for the next dev cycle.

---

### S7. Storage add-on attach  *(spec §9 #6)*

**Steps:**
1. Tester on active Basic (from S4 or S2).
2. Two paths to test:
   - **(a) From paywall toggle**: Sign up fresh; on `StartFreeTrialScreen` toggle "+ Add 100 GB storage" ON, then tap Start. Should present Basic sheet then Storage sheet sequentially.
   - **(b) From contextual upsell**: Use the app, hit quota or tap "Add Echo Vault Storage" from `YourSubscriptionScreen`; lands on `EchoVaultUpsellScreen`. Tap Continue with ADD selected.

**Expected:**
- Two native sheets dismiss successfully → both transactions activate via `/verify-purchase`.
- Quota expands to **150 GB** (50 base + 100 add-on).
- Both rows persist; toggling tier value remains the user's primary tier (`basic` or `trial` — NOT promoted to `core_plus`).

**Verify:**
- DynamoDB `subscriptions`: TWO rows for this user — one `subscription_type=basic`, one `subscription_type=storage`.
- DynamoDB `user_profiles`: `storage_add_on_active=true`, `echo_vault_quota_gb=150`, `storage_subscription_id` populated, `subscription_tier=basic` (or `trial` if mid-trial).
- DynamoDB `subscription_events`: TWO `SUBSCRIPTION_PURCHASED` rows.
- Telemetry log: For path (a), `paywall_view surface=start_trial`. For path (b), `paywall_view surface=echo_vault_upsell`.

**Edge case for path (a):**
- If the storage product hasn't loaded yet when the user taps Start, the chain skips the second sheet and shows an info toast ("…add it anytime from Echo Vault"). Verify the toast text appears and Basic still activates.

---

### S8. Storage add-on remove  *(spec §9 #6)*

**Steps:**
1. Tester with storage add-on attached (from S7).
2. Open `YourSubscriptionScreen`.
3. Tap **"Manage or remove"** on the Storage row (the link added per D in this session's punch list).
4. Land on App Store Subscriptions (iOS) or specifically the storage SKU's management page (Android, via `?sku=…&package=…`).
5. Cancel the storage SKU only.
6. Return to the app, foreground it.

**Expected:**
- Apple/Google delivers a webhook for the storage SKU's expiry at the end of the period (or immediately on cancel + auto-renew off).
- Backend processes via `_handle_subscription_expired`.
- Quota drops back to 50 GB after expiry (during the remaining billing window the user keeps the add-on — Apple/Google policy).

**Verify:**
- DynamoDB `subscriptions` for the storage row: `auto_renew_enabled=false` immediately on cancel.
- DynamoDB `subscription_events`: `event_type=SUBSCRIPTION_CANCELLED` for the storage subscription_id.
- After expiry webhook fires (sandbox: 5 min for monthly): the storage row's `status=expired`; `user_profiles.storage_add_on_active=false`; `echo_vault_quota_gb=50`.
- The Basic subscription is **untouched** — `_handle_subscription_expired` correctly scopes to the cancelled SKU only.

---

### S9. Billing failure  *(spec §9 #7)*

**Steps:**
1. Tester on active Basic (from S4 or S2 post-conversion).
2. Switch Apple ID's payment method to a sandbox **"declined"** card OR use Apple's Sandbox → Subscription Renewal options → **"Mark billing as failed"**.
3. Wait for next renewal cycle (5 min for monthly).

**Expected:**
- ASSN v2 `DID_FAIL_TO_RENEW` arrives at `/webhook/apple`.
- `_handle_renewal_failure` transitions the subscription to `grace_period`.
- `_send_payment_failure_notification` dispatches push to all registered devices.
- Device receives a notification:
  - **Lock screen**: title `"Mirror Collective"`, body `"Tap to open Mirror Collective"` — **does NOT mention payment, subscription, renewal, card, failure**.
  - **After unlock and tap**: in-app alert title `"Payment couldn't be processed"`, body `"We couldn't renew your Mirror Collective subscription. Update your payment method to keep your subscription."` with **Later** and **Update Payment** buttons.

**Verify:**
- Backend log: `Handling renewal failure: txn=<txn-id>` (subscription_service.py:1218 — txn only, no full payload).
- DynamoDB `subscriptions`: `status=grace_period`.
- DynamoDB `user_profiles`: status field reflects grace_period; user is still **entitled** during this window (per ENTITLED_STATUSES matrix).
- DynamoDB `subscription_events`: `event_type=renewal_failed`.
- CloudWatch metric: `Dispatched payment-failure push for user <user> subscription <id> to <n>/<n> device(s).`
- **Visual on-device check**: lock-screen banner has generic title/body. Photograph + attach to the QA report.

**Edge cases:**
- If `get_user_device_tokens` returns 0 devices: log shows `No registered devices for user <user>; skipping payment-failure push.` — this is correct fail-soft behavior, no error.
- Tap "Update Payment" → app deep-links to `YourSubscriptionScreen` via `navigationRef.safeNavigate`. Verify on iOS (cold start, background, foreground) and Android.

---

### S10. Device swap  *(spec §9 #8)*

**Steps:**
1. Activate a subscription on Device A (S1 or S4).
2. Sign out on Device A.
3. Sign in on Device B (different physical device, same Apple/Google account, same Mirror Collective Cognito user).
4. On Device B, allow notifications.

**Expected:**
- Device B's FCM token registers with backend via `POST /api/devices/register`.
- DynamoDB `user_device_tokens` now has two rows for this user (Device A's old token may still be there until it stales out).
- The subscription state from the backend reflects on Device B immediately (via `/subscription/status` on UserContext load).
- A simulated billing failure (S9) reaches Device B's notification.

**Verify:**
- DynamoDB `user_device_tokens`: two rows or more.
- Trigger S9 and confirm Device B gets the notification.
- Sign out on Device A: `unregisterDevice` removes Device A's token row.

---

### S11. Entitlement updates via webhooks  *(spec §9 #9)*

This is implicitly covered by S2, S3, S8, S9. Confirm in aggregate:
- Renewal (`DID_RENEW`) → status flips to `active`, telemetry `trial_convert` (if from trial).
- Cancel (`DID_CHANGE_RENEWAL_STATUS`) → `auto_renew_enabled=false`.
- Expire (`EXPIRED`) → `status=expired`, `tier=free`, quota=0. Trial → `trial_expired`. Telemetry `trial_expire` if from trial.
- Refund (`REFUND`) → `status=refunded`, immediate revoke.
- Billing retry (`DID_FAIL_TO_RENEW`) → `status=grace_period`, push fires.

For each, the corresponding row appears in `subscription_events` within seconds of the webhook hitting `/webhook/apple` or `/webhook/google`.

**Specifically test:** **Forged webhook payload** — POST a hand-crafted JSON to `/webhook/apple` without a valid x5c chain. Must return **401 Unauthorized**, not 500. Same for `/webhook/google` without a valid OIDC JWT.

---

### S12. Future feature entitlements can be toggled independently  *(spec §9 final)*

The architecture supports this without code changes — verify by inspection:

1. Open `src/app/core/features.py`. Confirm:
   - `Feature.PLUS_ACCESS`, `Feature.REFLECTION_ROOM_ACCESS`, `Feature.ECHO_SIGNATURE_ACCESS`, etc. all exist as enum entries.
   - `FEATURE_TIER_MAP` has each mapped to `frozenset({"plus"})` (or `{"trial", "basic", "plus"}` for `ECHO_MAP_ACCESS` per spec §10 exception).
2. To validate the gate works without re-running QA: write a one-off test that constructs a `UserProfile(subscription_tier="plus", subscription_status="active")` and confirms `require_feature(Feature.REFLECTION_ROOM_ACCESS)` returns an `EntitledUser` rather than 402-ing. Existing `tests/test_feature_flags.py::TestPlusFeatureGate::test_plus_user_passes` already covers this.
3. Conversely, a basic-tier user hitting a route gated on `require_feature(Feature.PLUS_ACCESS)` should get **402 with `reason=plus_access`** (not `trial_expired` or `expired`).

**No production gate needs to be flipped on at launch** — Plus tier doesn't exist yet. Architecture readiness is the deliverable.

---

## 3. Cross-cutting checks (run after S1–S12)

### 3a. /docs disabled in production env

```bash
curl -i https://api.themirrorcollective.com/docs
# expected: 404 Not Found
```

### 3b. Backend log doesn't leak transaction payloads

Grep CloudWatch for `transactionId` and confirm log lines look like:
```
Handling subscription renewal: txn=<id>
```
NOT:
```
Handling subscription renewal: {full dict with appAccountToken, etc.}
```

### 3c. Receipt validation rejects unknown SKUs

POST to `/verify-purchase` with `product_id="com.attacker.fake.sku"` + a valid receipt → expect **400** with error `Unknown product_id`.

### 3d. iOS payment-failure push has `mutable-content=1`

This is set in `sns_service._generate_payload` and enables a future Notification Service Extension to mutate copy. Today's payload is already lock-screen safe (generic visible copy); the flag is forward-prep. Confirm by inspecting an APNs payload via Apple's [push notification console](https://developer.apple.com/notifications/push-notifications-console/) during S9.

---

## 4. QA sign-off

Each scenario above writes a row in `subscription_events`. After running all 12:

```bash
aws dynamodb scan --table-name subscription_events \
  --filter-expression "user_id = :uid" \
  --expression-attribute-values "{\":uid\":{\"S\":\"$QA_USER_ID\"}}" \
  --query 'Items[*].event_type.S' \
  | jq -r '.[]' | sort | uniq -c
```

A clean run should show:
```
   4 SUBSCRIPTION_PURCHASED
   2 SUBSCRIPTION_CANCELLED
   2 expired
   1 renewal_failed
   1 renewed
```

Plus telemetry JSON lines:
- `paywall_view` (>=4)
- `start_trial` (>=1)
- `trial_convert` (1, from S2)
- `trial_cancel` (1, from S3)
- `trial_expire` (>=1)

If any expected event is missing, that scenario didn't actually exercise the lifecycle handler — re-run and inspect logs.

---

## 5. Known limitations

- Sandbox does NOT exercise real billing — Apple/Google issue test receipts. Real-money behavior (price tier display, regional VAT, payment instrument rejection by issuer) only validates in production.
- Notification Service Extension is **not** shipped — lock-screen rich copy via NSE is a future enhancement, not part of v1 QA.
- Plus tier features (Reflection Room etc.) are architecturally gated but have no UI yet — full Plus-tier QA awaits V2 spec.
