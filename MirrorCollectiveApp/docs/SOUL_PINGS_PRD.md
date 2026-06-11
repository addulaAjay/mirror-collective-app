# Soul Pings — Product & Engineering Plan (PRD)

> **Status:** Draft for review · **Owner:** TBD · **Last updated:** 2026-06-10
> **Design:** Figma _Dev-Master-File_ → `Soul Pings` section, node [`1687:915`](https://www.figma.com/design/xn6MdQV0gGGeedaFtHWWCo/Dev-Master-File?node-id=1687-915&m=dev)
> **Repos:** `MirrorCollectiveApp` (RN frontend) · `mirror_collective_python_api` (FastAPI/serverless backend)

---

## 1. Summary

**Soul Pings** are Mirror Collective's proactive, conversation-aware notification system. They are MC-branded nudges delivered on two surfaces:

1. **Push banner** (lock screen / OS notification): gold MC logo + title (e.g. _"Just checking in…"_) + body (the ping message).
2. **In-app presentation**: the gold "echo-map ring" with the ping message centered, plus a notifications feed/center inside the app.

Pings come in **6 categories**, each with a distinct intent:

| Category (Figma) | Enum | Intent | Example copy |
|---|---|---|---|
| Emotional Soul Ping | `emotional` | Check on emotional state | "How are you doing today? Did you feel energized from our talk last week?" |
| Action-oriented Soul Ping | `action` | Prompt a concrete action | "Let's complete a quick grounding exercise." |
| Insight Soul Ping | `insight` | Surface a reflection/insight | "Your focus dipped. How about a quick 1-minute grounding technique?" |
| Goal Pings | `goal` | Reflection / goal start | "Would you like to start your reflection for the day?" |
| Progress Pings | `progress` | Reinforce momentum | "Let's keep your momentum going." |
| Systemic Pings | `systemic` | Pattern across sessions / system | "You've discussed stress 3 times this week. Let's practice a 1-minute grounding technique." / "You have unsynced reflections. Get the latest update today." |

The defining characteristic is that pings are **proactive and content-driven** (derived from a user's recent conversations/reflections), not transactional alerts like echo delivery or trial expiry.

### Non-goals (v1)
- A full ML insight engine. v1 uses **rules/templates** over existing signals; the richer insight layer is a fast-follow.
- Rich notification actions (inline reply, snooze) beyond a single tap-to-open.
- Web/desktop delivery.

---

## 2. Current state (as-built, with evidence)

### Built ✅ — transport & registration
- **FCM on device** via `@react-native-firebase/messaging` v21 — token fetch/cache/refresh. `src/services/PushNotificationService.ts:54-92`.
- **Device registration**: token → `POST /api/register-device` → backend creates an **AWS SNS platform endpoint** (APNs/FCM) and stores `user_id`+`device_token`+`endpoint_arn` in DynamoDB. Backend `src/app/api/routes.py:194-288`, `src/app/models/device_token.py`.
- **Logout** de-identifies (keeps SNS endpoint for re-engagement) instead of deleting. Backend `dynamodb_service.deidentify_device_token`.
- **Init** is automatic once `user.id` resolves. `src/context/UserContext.tsx:116-122`.

### Missing / broken ⚠️
**Backend**
- **No per-user send anywhere** — only `publish_to_topic` (broadcast) is called (`routes.py:185`, `scheduler.py:22`). `publish_to_endpoint` exists but has **zero callers**.
- **Trial push is a no-op** — `trial_management_service` calls `self.push_service.send_notification`, but `push_service` is **never injected** (`None`).
- **No Soul Ping concept** — payload is title+body only (`src/app/api/models.py`); no category enum, no persistence, no content source.
- **No proactive scheduler** — only `trialExpirationCheck` (daily) and `echoReleaseScheduler` (hourly, **email**) exist.
- **Platform App ARNs are env-only** (`SNS_*_APP_ARN`), not in CloudFormation — must be verified to exist in AWS.

**Frontend**
- **Foreground only** — `messaging().onMessage` → a raw `Alert.alert` (`PushNotificationService.ts:157`). No background handler, no tap/deep-link (`onNotificationOpenedApp`/`getInitialNotification`), no Android channel.
- **No in-app UI** — no notifications screen, feed, bell, badge, or the gold-ring presentation. The entire in-app half of the design is unbuilt.

---

## 3. Architecture

```
                       ┌─────────────────────────────────────────────┐
                       │  Soul Ping generation (scheduled, backend)  │
                       │  rules/templates over recent signals →      │
                       │  {category, title, body, deep_link}         │
                       └───────────────┬─────────────────────────────┘
                                       │ per-user
                   ┌───────────────────▼───────────────────┐
   persist ◀───────┤  SoulPingService.send_soul_ping(...)   ├──────▶ SNS publish_to_endpoint
   (Notifications  │  - look up user device endpoints       │        (APNs / FCM, category in payload)
    table)         └───────────────────┬────────────────────┘
                                       │
                          ┌────────────▼────────────┐
                          │  Device (RN)            │
                          │  background/tap handler │──▶ deep-link route
                          │  in-app feed + gold-ring│◀── GET /api/notifications
                          └─────────────────────────┘
```

### 3.1 Notification payload contract (FE ⇄ BE interface — lock this first)

Sent via SNS in the `data`/custom section so it survives foreground + background + tap:

```jsonc
{
  "notification": { "title": "Just checking in…", "body": "<ping copy>" },
  "data": {
    "type": "soul_ping",
    "ping_id": "<uuid>",            // for mark-read + dedupe
    "category": "emotional",        // one of the 6 enums
    "deep_link": "SoulPing",        // RN route to open on tap
    "deep_link_params": "{\"pingId\":\"<uuid>\"}",
    "created_at": "2026-06-10T10:00:00Z"
  }
}
```

> All `data` values are **strings** (FCM/APNs require string maps). Parse `deep_link_params` as JSON on device.

### 3.2 Data model — `Notifications` (new DynamoDB table)
- PK `user_id` (HASH), SK `ping_id` (RANGE, sortable by time — use a ULID or `created_at#uuid`).
- Attrs: `category`, `title`, `body`, `deep_link`, `deep_link_params`, `created_at`, `read_at` (nullable), `source` (`scheduled`|`manual`|`system`).
- Enables the in-app feed/history and unread badge. TTL optional (e.g. 90 days).

---

## 4. Phased plan

Each phase is independently shippable/demoable. **Phase 0 is a prerequisite decision gate.**

### Phase 0 — Decisions & infra verification (no code)
- [ ] Confirm SNS **platform application ARNs** exist in AWS for APNs (prod + sandbox) and FCM; capture ARNs for `SNS_IOS_APP_ARN` / `SNS_ANDROID_APP_ARN`.
- [ ] Decide **content source for v1** (rules/templates over which signals — see §6 Open Questions).
- [ ] Decide **cadence** (e.g. 1×/day max, quiet hours) and **default-on categories**.
- [ ] Lock the **payload contract** (§3.1) and **route name** (`SoulPing`).

**Acceptance:** ARNs verified by a successful manual `publish_to_endpoint` to a test device; contract signed off.

---

### Phase 1 — Real per-user push + delivery polish (small)
_Goal: a backend call can deliver a styled, tappable push to one user._

**Backend (`mirror_collective_python_api`)**
- [ ] `src/app/services/sns_service.py` — extend `publish_to_endpoint` to accept `category` + `deep_link*` and emit the §3.1 payload for both GCM and APNS blocks.
- [ ] `src/app/services/soul_ping_service.py` _(new)_ — `send_soul_ping(user_id, category, title, body, deep_link, params)`: look up `dynamodb_service.get_user_device_tokens(user_id)` → `publish_to_endpoint` per active endpoint; tolerate `EndpointDisabled` (mark inactive).
- [ ] `src/app/api/routes.py` — add `POST /api/soul-pings/test` (auth, dev-gated) to send a ping to the caller for end-to-end testing.
- [ ] `src/app/services/trial_management_service.py` + `src/app/jobs/trial_expiration_job.py` — inject a real `push_service` so the existing trial path actually sends (quick win, proves the wiring).

**Frontend (`MirrorCollectiveApp`)**
- [ ] `src/services/PushNotificationService.ts` —
  - [ ] add `setBackgroundMessageHandler` (registered in `index.js` per FCM requirement, outside React).
  - [ ] add `onNotificationOpenedApp` + `getInitialNotification` (cold-start) → route via a `handleDeepLink(data)` helper.
  - [ ] Android: `createChannel` (Notifee or messaging) so 8+ displays reliably; set channel on send.
  - [ ] replace the foreground `Alert.alert` with a styled in-app toast/banner (interim, full UI in Phase 3).
- [ ] `index.js` — register the background handler before `AppRegistry`.
- [ ] `src/types/navigation.ts` — add `SoulPing: { pingId?: string }` (and `NotificationCenter`) routes.
- [ ] `App.tsx` — wire deep-link routing from `handleDeepLink` to the navigator (guard until auth ready).

**Acceptance:** `POST /api/soul-pings/test` shows a gold-logo banner on a real device; tapping it (foreground, background, killed) opens the app to the target route on both iOS + Android.

---

### Phase 2 — Soul Ping model, persistence & feed API (medium)
_Goal: pings are categorized, stored, listable, and markable-read._

**Backend**
- [ ] `src/app/models/soul_ping.py` _(new)_ — `SoulPingCategory` enum (6 values) + `SoulPing` record model (§3.2).
- [ ] `serverless.yml` — add `NotificationsTable` (DynamoDB) + env `DYNAMODB_NOTIFICATIONS_TABLE` + IAM (Query/PutItem/UpdateItem).
- [ ] `src/app/services/dynamodb_service.py` — `save_soul_ping`, `list_soul_pings(user_id, limit, cursor)`, `mark_soul_ping_read(user_id, ping_id)`, `count_unread(user_id)`.
- [ ] `src/app/services/soul_ping_service.py` — persist on send (write-through) so the feed has history.
- [ ] `src/app/api/routes.py` + `src/app/api/models.py` — `GET /api/notifications` (paginated), `POST /api/notifications/{ping_id}/read`, `GET /api/notifications/unread-count`.

**Frontend**
- [ ] `src/services/api/notifications/notifications.ts` _(new)_ + endpoint consts in `src/constants/config/config.ts` — list / mark-read / unread-count.
- [ ] `src/context/SoulPingContext.tsx` _(new)_ — holds feed, unread count; refresh on foreground + on push receipt; optimistic mark-read.

**Acceptance:** a sent ping appears in `GET /api/notifications`; marking read decrements unread count; survives app restart.

---

### Phase 3 — In-app presentation per design (medium)
_Goal: the Figma surfaces exist in-app._

**Frontend**
- [ ] `src/components/soulPing/SoulPingCard.tsx` _(new)_ — the gold echo-map-ring presentation (reuse the reflection-room ring asset) with category styling + message. Match node `1687:915` left frame.
- [ ] `src/screens/SoulPingScreen.tsx` _(new)_ — full-screen ping view opened by deep link (`SoulPing` route); marks read on view.
- [ ] `src/screens/NotificationCenterScreen.tsx` _(new)_ — the feed/list of pings (grouped by category/day), pull-to-refresh, tap → `SoulPingScreen`.
- [ ] `src/components/NotificationBell.tsx` _(new)_ — bell + unread badge; place in `src/components/LogoHeader.tsx` (right side) → opens `NotificationCenter`.
- [ ] `src/types/navigation.ts` + `App.tsx` — register `NotificationCenter`.
- [ ] Follow `docs/FIGMA_WORKFLOW.md` (assets via MCP, tokens, visual-QA report at `docs/visual-qa/soul-pings/`).
- [ ] Respect the global `maxFontSizeMultiplier` cap — use `minHeight`/flex on ping cards (see `src/theme/fontScaling.ts`).

**Acceptance:** bell shows unread count; tapping a push or bell opens the design-matching gold-ring ping and feed; visual-QA report committed.

---

### Phase 4 — Proactive generation (large — the core value)
_Goal: pings generate themselves from user signals on a schedule._

**Backend**
- [ ] `src/app/services/soul_ping_rules.py` _(new)_ — v1 rules/templates mapping signals → `{category, title, body}` (e.g. "discussed stress N× this week" → systemic; "no reflection today" → goal; "unsynced reflections" → systemic).
- [ ] `src/app/jobs/soul_ping_job.py` _(new)_ — scheduled Lambda: for each eligible user, read recent signals (Conversations / MirrorMoments / reflection state), pick **at most one** ping respecting prefs + quiet hours + dedupe (don't repeat same category within window), call `soul_ping_service.send_soul_ping`.
- [ ] `serverless.yml` — EventBridge schedule (e.g. daily, region-tz aware) + Lambda + IAM to read the signal tables.
- [ ] Signal access helpers in `dynamodb_service.py` as needed (recent message themes, last reflection timestamp, unsynced count).

**Acceptance:** with a seeded signal, the daily job sends exactly one correctly-categorized ping per eligible user, throttled and deduped; logs what was sent/skipped (no silent caps).

---

### Phase 5 — Preferences & safety (medium — gate before wide rollout)
_Goal: users control frequency/categories; we never spam._

**Backend**
- [ ] `src/app/models/user_profile.py` — add `soul_ping_categories_enabled` (list/flags), `soul_ping_frequency` (off/daily/weekly), `quiet_hours` (`start`,`end`,`tz`).
- [ ] `PATCH /api/auth/me` (`routes.py`) — accept + persist the prefs.
- [ ] `soul_ping_job.py` — enforce prefs + quiet hours + a hard per-user daily cap before sending.

**Frontend**
- [ ] Notification settings UI (extend `src/screens/ProfileScreen.tsx` or a new `NotificationSettingsScreen.tsx`) — per-category toggles, frequency, quiet hours; persist via `PATCH /api/auth/me`.
- [ ] Surface OS permission state; deep-link to system settings if denied.

**Acceptance:** disabling a category or setting quiet hours measurably suppresses sends in the job; OS-permission-denied handled gracefully.

---

## 5. File-level task index (quick reference)

**Backend — new**
`src/app/services/soul_ping_service.py` · `src/app/services/soul_ping_rules.py` · `src/app/models/soul_ping.py` · `src/app/jobs/soul_ping_job.py`

**Backend — edit**
`src/app/services/sns_service.py` · `src/app/services/dynamodb_service.py` · `src/app/services/trial_management_service.py` · `src/app/jobs/trial_expiration_job.py` · `src/app/api/routes.py` · `src/app/api/models.py` · `src/app/models/user_profile.py` · `serverless.yml`

**Frontend — new**
`src/context/SoulPingContext.tsx` · `src/services/api/notifications/notifications.ts` · `src/components/soulPing/SoulPingCard.tsx` · `src/components/NotificationBell.tsx` · `src/screens/SoulPingScreen.tsx` · `src/screens/NotificationCenterScreen.tsx` · (opt) `src/screens/NotificationSettingsScreen.tsx`

**Frontend — edit**
`src/services/PushNotificationService.ts` · `index.js` · `App.tsx` · `src/types/navigation.ts` · `src/constants/config/config.ts` · `src/components/LogoHeader.tsx` · `src/screens/ProfileScreen.tsx`

---

## 6. Open questions / decisions needed

1. **Content source for v1** — which signals are actually available to drive copy? (recent conversation themes, reflection completion, unsynced count). Determines how much of Phase 4 is rules vs. needs new analysis.
2. **Cadence & caps** — max pings/day, default categories on/off, quiet-hours default.
3. **Library** — stick with bare `@react-native-firebase/messaging` for display, or add **Notifee** for richer/branded notifications + reliable Android channels? (Recommend Notifee for the design fidelity.)
4. **APNs environment** — confirm sandbox vs prod platform apps and cert/key rotation owner.
5. **In-app vs push parity** — does every push also persist as an in-app ping? (Recommend yes — single source for the feed.)
6. **Deep-link target per category** — e.g. Goal/Action pings open Reflection Room; Emotional/Insight open Talk to Mirror. Define the mapping.

---

## 7. Risks
- **Insight quality**: weak/irrelevant pings erode trust fast. Start conservative (few, clearly useful templates) and expand.
- **Notification fatigue**: ship Phase 5 (prefs + caps) before any wide rollout.
- **Platform setup**: APNs/FCM + SNS platform apps are the classic silent-failure point — Phase 0 verification is mandatory.
- **iOS background data messages** are throttled; keep the visible `notification` block populated, don't rely on data-only.

---

## 8. Suggested first milestone (demoable)
**Phase 1 + a hardcoded Phase 4 template on a daily cron + Phase 3 SoulPingCard** → real, categorized, tappable pings that open the design's gold-ring card. Persistence/feed (Phase 2), full insight rules, and preferences (Phase 5) follow.
