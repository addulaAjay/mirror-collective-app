# User feedback roundup — November 2026

Four requests came in. Two are already built; two are not. This records the
evidence for each verdict, then plans the pending work.

| # | Request | Status |
|---|---------|--------|
| 1 | Camera roll + microphone in MirrorGPT | **Done** — 1.1.0 (37), awaiting App Store submission |
| 2 | Copy/paste Mirror chats and responses | **Not started** |
| 3 | Send echoes in-app, vault to vault | **Built but switched off** — unreachable in the app |
| 4 | Send one echo to multiple recipients | **Not started** |

---

## 1. Camera roll + microphone in MirrorGPT — DONE

Shipped on `main`, built as 1.1.0 (37), not yet submitted.

- Photo attachment: camera roll **and** camera capture
  (`useChat.ts` → `ensureCameraPermission`), client-side compression at
  1536px max edge, inline base64 to the API, OpenAI vision content-parts.
- Voice input: `useAudioRecorder` with a 120s cap and speech-tuned 16kHz mono
  capture, transcribed by Whisper via `POST /mirrorgpt/transcribe`.
- Both behind `CHAT_PHOTO_ENABLED` / `CHAT_VOICE_ENABLED`, which currently
  default **on** — see the flag caveat in §Known issues.

**Remaining before release:** App Privacy answers and the privacy policy must
declare that photos and voice recordings are sent to a third party (OpenAI).
Neither lives in this repo. The permission strings were reworded in build 37
and now name MirrorGPT explicitly, which makes the privacy-policy gap more
visible to a reviewer, not less.

**Not yet validated against a real model.** Every test to date runs against
mocks. First live exercise is on-device.

---

## 2. Copy/paste chats and responses — NOT STARTED

### What exists, and why it is not this

`MessageBubble` already shows a `content_copy` glyph — two overlapping sheets,
the universal copy icon — but it is not a clipboard copy. It calls
`MirrorChatScreen.handleSaveToEcho`, which navigates to `NewEchoScreen` with
`prefillContent`, i.e. **save this reply into an Echo**.

Its `accessibilityLabel` is already correct (`"Save to Echo Vault"`), so screen
readers are fine. The problem is purely visual: a copy icon that does not copy.
This request may be partly *caused* by that button — someone taps what looks
like copy, lands in Echo creation, and reports that copy does not work.

Also note the icon renders on **assistant messages only**, in an action row
beside the text-to-speech button. User messages have no actions at all.

"Paste" is already solved: `ChatInput` is a plain multiline `TextInput`, so
pasting *into* the chat works natively. The ask is copying text *out*.

Evidence copy is genuinely absent:

- no clipboard package in `package.json`
- no `Clipboard` / `setString` usage anywhere in `src/`
- no `selectable` on the bubble text, so it cannot even be highlighted

### Shape: selection mode, not a second icon

Copy and "save several messages to one Echo" want the same mechanism, so they
should be built together. Retrofitting multi-select onto a single-message copy
later means unpicking the interaction.

- **Long-press** a bubble enters selection mode and selects it
- **Tap** toggles any other message
- A contextual bar replaces the input: **Copy** · **Save to Echo** · **Cancel**,
  with a running count
- Works on user *and* assistant bubbles, which the current action row does not

**Decided:** selection is **arbitrary** (any messages, not just a contiguous
run) and the joined output is ordered **chronologically**, regardless of the
order they were tapped.

Add `selectable` to the bubble text as well — one prop, and it covers the
"copy half a sentence" case that no button handles.

### Why this is cheap below the chat screen

`prefillContent` is a single `string`, threaded
`NewEchoScreen → ChooseRecipientScreen → CreateEchoScreen` as `initialContent`.
Multi-select joins the selected text and passes the result. **No changes are
needed below `MirrorChatScreen`** — the Echo compose flow is untouched.

### Plan

1. **Add the dependency.** `@react-native-clipboard/clipboard`. Native module,
   so it needs `pod install` and a rebuild; it cannot ship JS-only.
2. **Selection state** in `MirrorChatScreen`: a `Set` of message ids, plus
   enter/exit. Long-press enters, Cancel or empty selection exits.
3. **Selected styling** on `MessageBubble`, and a tap handler that only
   toggles while selection mode is active.
4. **Contextual action bar** replacing the composer while selecting.
5. **The join function** — the part worth testing hardest. Chronological
   order, attribution (below), photo messages, single selection, empty
   selection.
6. **Toast on copy.** The in-house toast component already exists; without
   confirmation people tap repeatedly.
7. **`selectable`** on bubble text.

**Tests:** copies assistant text; copies user text; join is chronological
regardless of tap order; arbitrary non-contiguous selection joins correctly;
photo message contributes text only; single-select still works; Save to Echo
receives the joined string; existing single-message Save to Echo unaffected;
selection mode exits cleanly.

### Open decisions

- **Attribution in the joined text.** Labelled (`Me:` / `Mirror:`) or plain?
  Recommend labelled — an Echo is *received* by someone else, and an
  unlabelled wall of text gives the recipient no way to tell who said what.
  Should probably match how the Echo renders for the recipient.
- **The save glyph.** Long-press fixes the missing feature, but the icon still
  looks like copy and will keep misleading people. Swapping it for a bookmark
  or archive glyph is a Figma change and needs design input. Left as-is for
  now; expect continued "the copy button doesn't copy" reports until it
  changes.

**Risk:** low-moderate. No API surface, no data migration. The interaction is
the design work, not the code.

---

## 3. Send echoes in-app, vault to vault — BUILT, BUT SWITCHED OFF

The whole feature exists and works. Users cannot reach it.

`EchoVaultLibraryScreen.tsx:608` wraps the Echo Inbox entry point in a literal
`{false && (...)}`:

> *Echo Inbox link — temporarily hidden. Feature is on hold pending
> design/product discussion. Keep the JSX intact (with styles below) so we can
> restore by flipping the flag below to `true`.*

It is not a feature flag — it is a hard-coded `false` compiled out of the
bundle. And `EchoVaultLibraryScreen:611` is the **only** navigation path to
`EchoInboxScreen` anywhere in the app, so the screen is completely
unreachable. Disabled in `e1568f9`.

Everything behind it is real and working:

- `Recipient.recipient_user_id` holds the recipient's Cognito sub when they
  have an account, populated automatically at recipient creation by email
  lookup (`echo_service.py` ~2957).
- `get_echoes_received` queries the `recipient-user-id-index` GSI.
- `EchoInboxScreen` exists and is registered in `App.tsx`.
- Delivery email adapts via `is_registered` — "open it in the app" vs
  "create an account".

So users receiving echoes are being told by email to open something in an app
that gives them no way to open it.

### Plan

The code work is one line. The decision is not.

1. **Resolve the product hold.** The comment says "on hold pending
   design/product discussion". That discussion is the actual blocker — find
   out what it was and whether it still applies. Do not just flip it.
2. **Replace `{false &&` with a real gate.** Given the flag caveat below,
   build-time env flags do not work in this app. Use the server-driven
   pattern Reflection Room now uses: add `echo_inbox_enabled` to the
   `features` payload in `GET /api/subscriptions/status`, gate the entry
   point on it, and roll out to testers first.
3. **Verify the inbox against real received echoes** before exposing it.
   It has presumably not been exercised since it was hidden.
4. **Then consider the push notification** — there is still no push when an
   echo is released to you, only email. With the inbox reachable, that becomes
   the natural follow-up.

**This is likely the most valuable of the four.** It is the only one where the
engineering is already paid for and the user-visible gap is a single
compiled-out condition.

---

## 4. One echo to multiple recipients — NOT STARTED

The largest of the four.

`Echo.recipient_id: Optional[str]` is singular throughout the model, the API
request/response shapes, the release path, and the inbox query. There is no
many-recipient concept anywhere.

### Two designs

**A — fan-out at creation (recommended).** One `Echo` row per recipient,
sharing a `group_id` and the same S3 media URLs.

- Every downstream path keeps working unchanged: release scheduling,
  per-recipient inbox, per-recipient read state, delivery email.
- **Storage quota is unaffected**: `calculate_user_storage_usage` sums S3
  objects under a prefix, not echo rows, and the copies share media. Verified.
- Per-recipient state comes free — one person opening it does not mark it
  read for everyone.
- Cost: edit and delete must fan out across the group. Vault list must collapse
  the group into one card or it shows N duplicates.

**B — join table.** `echo_recipients`, one Echo row.

- Cleanest model, no duplication.
- Touches every read path: inbox query, vault listing, release job, delivery.
  Materially larger and riskier.

Recommend **A**. It is mostly additive; B is a migration of live data.

### Plan (design A)

**Backend**
1. `group_id: Optional[str]` on `Echo`, set for multi-recipient sends.
2. `POST /echoes` accepts `recipient_ids: List[str]` alongside the existing
   singular field — additive, so current clients keep working.
3. Fan out inside `create_echo`: one row per recipient, shared `group_id` and
   media. Single quota check against the shared media, not N.
4. Edit/delete operate on the whole group when `group_id` is set.
5. Vault listing collapses by `group_id`, returning one entry carrying the
   recipient list.

**Frontend**
6. Recipient picker becomes multi-select. The current flow assumes exactly
   one — this is the bulk of the UI work.
7. Vault card shows "To: 3 recipients" with an expandable list.
8. Per-recipient delivery state visible when expanded (sent / opened).

**Tests:** fan-out creates N rows sharing one `group_id`; quota charged once;
each recipient's inbox shows exactly their copy; read state is independent;
group delete removes all; group edit updates all; single-recipient path
unchanged.

### Open questions

- **Cap on recipients?** Unbounded fan-out is a denial-of-service shape. The
  inbox code already mentions a 50-recipient case, suggesting 50 is a known
  ceiling somewhere. Propose a cap and surface it in the UI.
- **Partial failure.** If 3 of 5 rows write and then it fails, what does the
  user see? Proposal: create all rows in one transaction, or mark the group
  incomplete and retry.
- **Guardians.** `allowed_recipient_ids` already exists for guardian scope.
  Confirm group echoes respect it.

---

## Sequencing

1. **Ship 1.1.0 first.** Everything below lands on top of it; do not stack
   more unreleased work on an unreleased release.
2. **#3 Echo Inbox** — highest value per unit of work. The feature is built;
   it needs a product decision and a real gate, not development. Resolve the
   hold first.
3. **#2 copy/paste** — small, self-contained, needs a build anyway for the
   native module. Natural companion to whatever ships with #3.
4. **Received-echo push** — small, and far more useful once the inbox is
   actually reachable.
5. **#4 multi-recipient** — its own release. Backend fan-out first behind a
   server flag, then the multi-select UI.

---

## Known issues that affect this work

**Build-time feature flags do not work.** `react-native-dotenv` is in
`package.json` but was never added to `babel.config.js`, so `process.env.*` is
never substituted. Every flag documented "Override via env" — including
`CHAT_PHOTO_ENABLED` and `CHAT_VOICE_ENABLED` — silently uses its default and
ignores the env var. Any flag added for the work above must either be
server-driven (as Reflection Room now is, via
`features.reflection_room_enabled`) or wait for the babel wiring to be fixed.

**The app repo has no CI.** No `.github/workflows/` at all. 105 test files have
never run on a pull request. Worth fixing before adding more surface area.
