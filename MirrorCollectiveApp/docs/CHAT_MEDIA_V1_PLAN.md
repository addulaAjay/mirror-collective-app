# MirrorGPT chat media — photos + voice input

> **Status:** Phases 0-4 built (photos work end to end; the voice *backend*
> works but has no client yet). Phases 5-6 remain. Covers two user-requested
> capabilities on the MirrorGPT chat surface: (1) attach a photo from the
> camera roll or camera, (2) speak to the Mirror instead of typing.
>
> **Read §11 (Implementation log) before trusting a phase body.** Seven
> decisions changed during implementation, and the phase bodies below were
> written beforehand.
>
> **Spans two repos:** `mirror_collective_app` (RN client) and
> `mirror_collective_python_api` (FastAPI/Lambda backend). Backend work is
> required for both features — neither can ship client-only.
>
> **Revision 2 — the S3 upload path was removed from this plan.** The first
> draft routed both photos and voice notes through Echo Vault's presigned-S3
> transport. That was reflex, not reasoning: it is the right machinery for
> 100MB video and the wrong machinery for a 300KB chat attachment. See D7 for
> why it's gone and what replaced it. The recon in §3 is unchanged and still
> accurate.

## Table of contents

1. [Summary](#1-summary)
2. [Confirmed decisions](#2-confirmed-decisions)
3. [Current state (as-built, with evidence)](#3-current-state-as-built-with-evidence)
4. [Architecture](#4-architecture)
5. [Phase plan](#5-phase-plan)
6. [File-level task index](#6-file-level-task-index)
7. [Cost model](#7-cost-model)
8. [Risks and pre-existing issues this work touches](#8-risks-and-pre-existing-issues-this-work-touches)
9. [Open questions](#9-open-questions)
10. [First demoable milestone](#10-first-demoable-milestone)
11. [Implementation log — what changed while building](#11-implementation-log--what-changed-while-building)

---

## 1. Summary

Users have repeatedly asked to be able to **show** the Mirror something (a
photo) and to **speak** to it rather than type. Both are additive to the
existing chat loop, and the device-side half of the problem is already solved:
capture, HEIC normalisation, compression and permissions were all built for
Echo Vault and only need wiring to chat.

The *transport* half, by contrast, is deliberately **not** reused — see D7.
Echo Vault's presigned-S3 pipeline exists for 100MB video; a chat attachment
is 300KB and goes inline.

What this plan delivers:

- **V1 — Photos.** The "+" button in the chat input opens an attachment sheet
  (Photo Library / Camera / File). The chosen image is HEIC-normalised and
  compressed on device, then carried inline on the next
  `/api/mirrorgpt/chat` call. The backend hands it to a vision-capable model,
  the Mirror responds to what it sees, and only a one-line text description is
  persisted. **The image itself is never stored.**
- **V2 — Voice input.** A mic button records speech-tuned audio and posts it
  inline to a new `/api/mirrorgpt/transcribe` endpoint, which returns text.
  The transcript lands in the chat input for the user to read and edit, then
  sends as a normal text message. **The recording is never stored** — it is
  transcribed in-request and discarded.

Both features share one feature flag, one permissions utility, one size/MIME
validator, and the same "inline bytes, persist text" shape. V2 is deliberately
sequenced behind V1 so the attachment contract is proven before recording UX
is layered on.

**Nothing in this feature writes to a database or a bucket.** No new table, no
new S3 prefix, no migration, no retention window, no deletion endpoint. That
is the single biggest thing to understand about this design, and it falls out
of D7 below.

**No new native dependencies are required.** `react-native-image-picker`,
`react-native-audio-recorder-player`, `react-native-vision-camera`,
`react-native-compressor` and `react-native-blob-util` are already installed,
autolinked and pod-installed — and adding a pod to this project is genuinely
awkward (`use_frameworks! :linkage => :static` for Firebase, plus a bespoke
`codegen:ios` step), so "reuse, don't add" is a hard constraint, not a
preference.

All required permissions are already declared: iOS has
`NSCameraUsageDescription`, `NSMicrophoneUsageDescription` and
`NSPhotoLibraryUsageDescription`; Android has `CAMERA`, `RECORD_AUDIO` and
`READ_MEDIA_IMAGES`/`VIDEO`/`AUDIO`. Nothing new is needed because we never
write back to the camera roll (so no `NSPhotoLibraryAddUsageDescription`) and
transcription is server-side (so no `NSSpeechRecognitionUsageDescription`).

**One copy fix is needed, though:** the existing strings describe Echo Vault
only — e.g. *"Mirror Collective needs access to your photo library to save or
upload echoes"* and *"…your microphone to record audio echoes."* Once these
permissions are also used for chat, those sentences no longer describe what
the app does with the data, which is exactly what App Review checks. Reword
both to cover chat as well (Phase 6).

---

## 2. Confirmed decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | **Voice = transcribe-to-text, then normal chat.** Not voice-to-voice, not raw audio to the model. | Cheapest, reuses the entire existing chat pipeline unchanged, and the user sees what the Mirror "heard" before sending. The transcript becomes the stored message, so conversation history, continuity summaries and the 5-signal archetype analysis all keep working with zero changes. |
| D2 | **Chat media is never stored, and so cannot touch the storage quota.** *(Superseded by D7 — originally "ephemeral, 30-day S3 expiry, outside the quota". The intent held; the mechanism was deleted.)* | Photos sent to the Mirror are conversational, not archival. The original worry — that billing them against the Echo Vault GB allowance would let a chatty free user hit a `402` and be blocked from *chatting* by a *storage* limit — is now structurally impossible rather than merely avoided. |
| D3 | **Photos ship first (V1), voice second (V2).** | Smaller surface — picker + compress + one vision call, with no new recording UX and no new endpoint. Gets a user-visible win out sooner and proves the inline-attachment contract before the recorder lands on top of it. |
| D4 | **Vision runs once per image; a text description is persisted.** The image is never replayed into subsequent turns. | `mirror_orchestrator._get_conversation_history` replays the last 10 turns into every prompt. Re-sending image bytes each turn would multiply cost and blow the token budget, and `archetype_engine.analyze_message` is pure text regex — it needs words, not pixels. |
| D5 | **Transcription gets its own endpoint, not an inline step in `/chat`.** | The api Lambda inherits `timeout: 30` (`serverless.yml:16`) and API Gateway HTTP API caps integration at 30s. `/chat` already runs 6–35s p50–p95. Chaining a transcription in front of it would push past the ceiling and return a 504. |
| D6 | **Media rides inline in the request body as base64, not as `multipart/form-data`.** | Avoids adding `python-multipart` (currently absent) entirely, so there is no new dependency in the Lambda bundle. It also keeps `/api/mirrorgpt/chat` a plain JSON endpoint — switching it to multipart would change the shape of a contract five client call sites already depend on. The 33% base64 inflation is irrelevant at these sizes (300KB → 400KB against a 6MB ceiling). Revisit only if payloads grow past ~2MB, where multipart's streaming starts to matter. |
| D7 | **No S3, no stored bytes, for either feature.** Media is sent inline, used in-request, and discarded. Only D4's text description is persisted. | This reverses the first draft. Three reasons were offered for S3; two were wrong and one didn't survive contact with the product. (1) *"OpenAI needs a signed URL because the bucket blocks public access"* — **false**: the vision API accepts a base64 data URL, so OpenAI never reaches our infrastructure. (2) *"The payload is too big to send inline"* — **false at these sizes**: a 1536px q.85 photo is 200-500KB and a speech-tuned 120s recording ~480KB, against a 6MB Lambda ceiling. (3) *"DynamoDB's 400KB item cap forces object storage if photos persist"* — **true but inapplicable**: the client has no history rendering at all (§3.7), so there is nothing for stored photos to persist into, and none is planned. What remained — hiding upload latency and avoiding byte re-sends on retry — does not justify a new S3 namespace, tenancy-prefix validation, HEAD verification, a lifecycle rule and expired-media UX. For voice it was worse than neutral: under D1 the audio is transient, so storing it would have added cost and privacy exposure for zero product value. |

---

## 3. Current state (as-built, with evidence)

### 3.1 The chat loop today is text-only, end to end

| Layer | File | Fact |
|---|---|---|
| Screen | `src/screens/MirrorChatScreen.tsx:204-210` | Renders `<ChatInput value={draft} onChangeText={setDraft} onSend={sendMessage} disabled={loading} />`. |
| Hook | `src/hooks/useChat/useChat.ts:102-192` | `sendMessage()` takes **no arguments** — it reads `draft` off hook state. |
| Message type | `src/types/chat.ts` (whole file) | `interface Message { id; text; sender; timestamp? }`. Four fields, all text. |
| Request type | `src/types/api.ts:139-145` | `ChatRequest { message; session_id; conversation_id?; include_archetype_analysis?; use_enhanced_response? }`. No media field. |
| Transport | `src/services/api/chat/chat.ts` | `POST /api/mirrorgpt/chat`, per-route `MIRROR_CHAT_TIMEOUT_MS = 60_000`. |
| Backend schema | `api/models.py:183-188` | `MirrorGPTChatRequest.message: str = Field(min_length=1, max_length=5000)`. No media field, and **non-empty text is mandatory** — an image-only turn is rejected today. |
| Backend handler | `api/mirrorgpt_routes.py:398-558` | → `orchestrator.process_mirror_chat` → `ResponseGenerator.generate_enhanced_response` (`mirror_orchestrator.py:165-198`) → `openai_service.send_async` (`openai_service.py:349-396`). |
| Model | `services/openai_service.py:154` | `OPENAI_MODEL` default `gpt-4o-mini` — **already vision-capable**. No model migration needed for images. |
| **Vision blocker** | `services/openai_service.py:45-62` | `ChatMessage.__init__(role, content: str)` and `to_dict() -> Dict[str, str]`. The OpenAI content-parts array cannot be expressed. This single class is the one hard blocker for images, and it is used by the orchestrator, summarizer, soul pings and greeting. |
| Persistence | `models/conversation.py:13-49` | `ConversationMessage.content: str`, plus a free-form `metadata: Optional[Dict[str, Any]]` at `:22`. DynamoDB → **attachment refs need no migration**. |
| Validation | `services/conversation_service.py:669-678` | `_validate_message_inputs` requires non-empty `content`. |
| Analysis | `services/archetype_engine.py:26` | `analyze_message(message: str)` is pure regex/keyword over text. Images and audio produce no 5-signal analysis unless given a transcript or description. |

### 3.2 The upload transport already exists and is hardened — but is NOT used here

> **Read this section as recon, not as plan.** Everything below is accurate and
> was the basis of the first draft. D7 removed it from the design: this is the
> right machinery for Echo Vault's 100MB video and the wrong machinery for a
> 300KB chat attachment. It is documented because (a) it is what you'd reach
> for by default, so the reasons *not* to are worth recording, and (b) if chat
> ever grows large attachments, this is the path to adopt.

Client, `src/services/api/echo.ts`:

```
getUploadUrl(fileType, echoId?, uploadType: 'echo' | 'profile' = 'echo')   // :565
uploadMedia(uploadUrl, fileUri, contentType, onProgress?)                   // :583
finalizeMedia(echoId, key, contentType?)                                    // :653
```

`uploadMedia` streams natively via `ReactNativeBlobUtil.wrap(localPath)` —
the comment at `:589-596` records why (the old `fetch(uri).blob()` copied
base64 across the bridge twice and OOM'd on video). Note the lib's `.d.ts`
lies about progress-callback types; `Number(sent)` coercion at `:616-618`.

`MULTIPART_THRESHOLD = 50MB` (`src/services/api/multipart.ts:40`). **Every
chat photo and voice note is far below this**, so V1/V2 use the single-PUT
path only — multipart, resume and `pendingUploads` are out of scope.

Backend, `POST /api/echoes/upload-url` → `echo_service.generate_upload_url`
(`:1449`). Presign pre-commits `Content-Type`, `Cache-Control`, S3 `Tagging`
and `Metadata`. Allowed `upload_type` is `{echo, profile, user_profile}`,
enforced at both route and service layer (`:1504-1508`).

`ALLOWED_UPLOAD_MIME_TYPES` (`echo_service.py:48-64`) already contains
`image/jpeg`, `image/png`, `image/webp`, `image/heic`, `audio/m4a`,
`audio/mp4`, `audio/aac`, `audio/mpeg`. **No allowlist change is needed for
either feature.**

The only existing shape for uploading media *not* attached to an echo is
`src/screens/ProfileScreen.tsx:112-118` — `getUploadUrl('image/jpeg',
undefined, 'profile')` → `uploadMedia(...)` → use `media_url`, no finalize.
That is the closest precedent for chat, which has no echo id.

### 3.3 Media capture exists but is copy-pasted per screen

`src/utils/media/compress.ts` is the one clean shared util:

```
ensureWebSafePhoto(uri, mime?)       // :52-72   HEIC/HEIF → JPEG @2048², q.85. Mandatory on iOS.
compressImageIfNeeded(uri)           // :117-140 skips <1MB; caps 1024×1024, q.85, out jpg
compressVideoIfNeeded(uri, onProg?)  // :82-110
createPosterThumbnail(videoUri)      // :186-196
unlinkQuietly(uri)                   // :164-171
```

Everything else is duplicated:

- **Permissions — no central util exists.** Four screens roll their own:
  `NewEchoAudioScreen.tsx:110-150` (the most complete: Android
  `PermissionsAndroid` + iOS via vision-camera's `useMicrophonePermission`,
  with an explicit comment at `:134-137` that audio-recorder-player v4 does
  **not** auto-prompt on iOS and App Review caught this on a fresh install),
  `NewEchoVideoScreen.tsx:119-136`, `CreateEchoScreen.tsx:539-540`,
  `NewEchoComposeScreen.tsx:205-229`. `react-native-permissions` is **not** a
  dependency; vision-camera's hooks are the de-facto cross-platform shim.
- **Photo library permission is never requested explicitly** —
  `launchImageLibrary` triggers the OS prompt implicitly. This works; keep it.
- **Recorder lifecycle** — `NewEchoAudioScreen.tsx:163-235` is canonical.
  Note `startRecorder(undefined, audioSet, false)` (metering **off**, so the
  waveform at `:451-484` is fake: 34 static bars), the 300ms audio-session
  pre-delay at `:184` (required so vision-camera/react-native-video release
  `AVAudioSession`), `addRecordBackListener` for the timer, and cleanup
  guarded by a **synchronous** `isRecordingRef` because `stopRecorder()` on an
  idle recorder can throw on iOS. **No max-duration cap exists anywhere.**
- **Picker options** — `CreateEchoScreen.tsx:642-647` is the closest to what
  chat needs: `launchImageLibrary({ mediaType: 'mixed', selectionLimit: 1,
  assetRepresentationMode: 'current', includeExtra: false })`.

### 3.4 The chat input already has an attach affordance

`src/components/ui/ChatInput/ChatInput.tsx` is a single `LinearGradient` row
with three children: a **circled-plus button** (`:73-95`), the multiline
`TextInput` (`:105-114`), and the send button (`:115-137`, `testID="send-button"`).

The plus button currently calls `handlePickDocument` (`:41-64`), which does
`DocumentPicker.pickSingle` and then **`fetch(uri).then(r => r.text())` and
dumps the document's text into the draft**. So "attach" today means "paste the
file's text". There is no attachment model in chat at all.

There is a dead `styles.iconImage` at `:189-193` (28×28, tinted) — a leftover
icon slot, useful as the mic-button style baseline. `mic.png` and `mic2.png`
exist in `src/assets/` and are used only by Echo Vault screens.

Also note `APP_CONFIG.CHAT.MAX_MESSAGE_LENGTH = 1000`
(`src/constants/config/config.ts:88`) is **not currently enforced** by `ChatInput`.

### 3.5 Infrastructure facts that constrain the design

| Fact | Evidence | Consequence |
|---|---|---|
| api Lambda timeout 30s; API GW HTTP API caps integration at 30s | `serverless.yml:16`, no per-function override | Transcription must be its own request (D5). The client's 60s chat timeout is **larger than the server can ever take** — anything over 30s is a gateway 504, not a slow success. |
| OpenAI clients pinned `timeout=20.0, max_retries=1` | `openai_service.py:141,147` | A long voice note can exceed 20s on Whisper. The transcribe path needs its own client timeout. |
| Authenticated catch-all route | `serverless.yml:403-409` (`method: '*' path: '*'` behind `cognitoJwtAuthorizer`) | **New authenticated routes need no `serverless.yml` change.** Only public routes do. |
| Quota middleware covers only `/api/echoes` POST/PUT, and fails open | `core/quota_middleware.py:64-97` | `/api/mirrorgpt/*` is already outside quota enforcement — D2 needs no code change, just an explicit comment so nobody "fixes" it later. |
| No per-user rate limiting anywhere | in-memory limiter deliberately deleted, `handler.py:104-110`; only global API GW throttle 1000rps/5000burst, `serverless.yml:482-487` | **Per-user daily caps must be added** for vision and transcription, or cost is unbounded per account. |
| **No server-side byte-size cap on any upload** | grep for `max_file_size`/`MAX_UPLOAD`/`content_length` → nothing | Must add an explicit decoded-size cap for chat media (Phase 1). Chat is the first place in the codebase that enforces one. |
| **No virus or content scanning on any upload** | no ClamAV, no GuardDuty S3 malware, no Rekognition moderation | Pre-existing gap; chat images widen the exposure because they go to a third party (OpenAI). See §8. |
| `storage_quota_service.can_upload()` exists but is never called | `storage_quota_service.py:175-215` | Dead code, and irrelevant here — D7 stores nothing. |
| S3 bucket lifecycle has only `AbortIncompleteMultipartUpload` (7d) | `serverless.yml:896-945` | No change needed. Revision 1 wanted a prefix-scoped expiry rule; D7 removed the prefix, so `serverless.yml` is untouched by this feature. |
| Lambda `/tmp` persists across warm invocations on the same container | AWS execution-model behaviour | The transcribe route writes audio to `/tmp`, so it **must** unlink in a `finally` — otherwise one user's recording can outlive their request on a container that later serves someone else (Phase 4.3). |
| CI runs **only** a Figma-token drift check | `.github/workflows/figma-tokens.yml` is the sole workflow, and it is path-filtered | No lint/test/typecheck/build in client CI. Quality gates are the husky pre-commit hook: `lint-staged` (eslint + prettier + **`tsc --noEmit`**) then `check-perf-budgets.mjs` (hard-fails a new image >500KB). Backend CI is separate and does run tests. |
| No Sentry / APM anywhere in the backend | grep `sentry|datadog|opentelemetry|put_metric` → zero | Observability = structured JSON logs + CloudWatch Logs Insights. Follow `services/telemetry/upload_events.py` and the `POST /api/telemetry/echo-upload` beacon (`telemetry_routes.py:179`) as the instrumentation template. |

### 3.6 There is no visible chat history — this is load-bearing for D7

The client renders **model memory, not conversation history**, and the
distinction drives the whole storage design.

| Evidence | Fact |
|---|---|
| `useChat.ts:74`, `:82`, `:92` | `setMessages` is only ever called with a single-element `[greetingMessage]` / `[fallbackMessage]` array. |
| `useChat.ts:108` onward | Every other `setMessages` call *appends* to the current in-memory list. |
| `grep getMessages\|fetchHistory\|loadHistory\|/messages` over `src/services` + `src/hooks` | **No hits.** The client has no endpoint call that retrieves past messages. |
| `useChat.ts:42` (`greetingRequestedRef`), `:34` (`greetingLoaded`) | Both are local hook state, so they reset on unmount — the list restarts from the greeting on every *screen visit*, not merely every launch. |
| `sessionManager.ts:11-18` | `generateNewSession()` deliberately does **not** clear the durable `conversation_id`, so server-side recall survives. The comment is explicit that wiping it "would break cross-session recall". |
| `mirror_orchestrator._get_conversation_history` (`:474-512`) | The backend replays the last 10 turns into the prompt. |

So: every turn is durably stored server-side with full archetype signals, and
the Mirror genuinely remembers earlier conversations — but the user never
*sees* a prior message. Re-entering MirrorGPT shows a fresh greeting and an
empty list.

**Consequence.** There is no history surface for a stored photo to appear in,
and (confirmed as a product decision) none is planned. That removes the only
sound argument for persisting chat media. If visible history is ever built,
photos sent before it lands will render as text-only via D4's description —
that is the accepted trade, recorded here so it is not a surprise later.

### 3.7 Nothing for this feature exists yet

- **Speech-to-text: zero.** Case-insensitive grep across both repos for
  `whisper|transcrib|stt|recognition|voice.input|dictat` returns no production
  hits. No `@react-native-voice/voice`, no `expo-speech`, no `transcribe:*`
  IAM. The `openai` SDK (`>=1.12.0`) is already a dependency, so
  `audio.transcriptions.create` is reachable with **no new dependency**.
- **Vision: zero.** No `image_url`, no content-parts arrays anywhere.
- **No existing plan doc** for chat attachments, voice, camera or multimodal.
  `docs/FUTURE_TTS_OPENAI_VOICE.md` is TTS **output** only and says nothing
  about input — but it establishes the house pattern this plan follows
  (proxy OpenAI through Lambda, S3 cache, quota tied to subscription tier) and
  already contemplates an `/api/tts/*` namespace.
- Closest prior art for the UI: `docs/visual-qa/create-echo.md` — the
  multi-attachment compose screen spec. `:81-83` notes the Figma
  `add_photo_alternate` / `mic` / `camera` exports are still pending
  allowlisting.

---

## 4. Architecture

### 4.1 Photo attachment (V1)

```
RN client                                      Backend (Lambda)                 OpenAI
─────────                                      ────────────────                 ──────
tap "+" → attachment sheet
  │
  ├─ Photo Library  launchImageLibrary
  ├─ Camera         launchCamera
  └─ File           DocumentPicker (existing behaviour, preserved)
  │
  ├─→ ensureWebSafePhoto()   HEIC → JPEG        ┐ Phase 0, already landed
  ├─→ compressChatPhoto()    1536px, q.85       ┘ → 200-500 KB
  │
  │   [thumbnail shown in the composer; user types an optional caption]
  │
  └─→ POST /api/mirrorgpt/chat   (ONE request, ~400 KB)
        { message, session_id, conversation_id,
          attachments: [{ kind:'image',
                          mime_type:'image/jpeg',
                          data_base64: '...' }] }
                                     │
                                     ├─ validate: count ≤1, mime on allowlist,
                                     │  decoded size ≤ MAX_CHAT_IMAGE_BYTES
                                     │
                                     ├─→ ChatMessage(role='user', content=[
                                     │     {type:'text', text: message},
                                     │     {type:'image_url', image_url:{
                                     │        url:'data:image/jpeg;base64,...',
                                     │        detail:'low'}}
                                     │   ])  + JSON mode           ──────→ gpt-4o-mini
                                     │   ← ONE call returns BOTH   ←────── { reply,
                                     │     reply and description           image_description }
                                     │
                                     ├─ persist user turn:
                                     │    content  = message + "\n[shared a photo: <desc>]"
                                     │    metadata = { attachments:[{kind, mime_type}] }
                                     │  ← NO bytes, NO key, NO url. D4 + D7.
                                     │
                                     └─ archetype_engine.analyze_message(content)
                                        sees words, so 5-signal analysis still works
```

**One request, no round-trips before it.** The client holds the compressed
bytes in memory from pick until send. Nothing is uploaded, so there is no
presign, no PUT, no HEAD verification, no tenancy-prefix check, no S3 key for
the client to forge and the server to validate — that entire class of
authorization problem does not exist here, because the bytes arrive inside an
already-authenticated request and are never addressable afterwards.

**Why a base64 data URL to OpenAI.** The vision API accepts
`image_url.url = "data:image/jpeg;base64,…"` directly. The first draft of this
plan claimed a signed S3 GET was required because the bucket blocks public
access; that was simply wrong. OpenAI never needs to reach our infrastructure.

**Why `detail: 'low'`.** It fixes the image at a flat token cost regardless of
dimensions. The Mirror responds to the *emotional and symbolic* content of a
photo, not fine detail, so `low` is the right fidelity for the product — and
it means the 1536px client cap is about upload time, not model cost.

**What the user loses.** Nothing today: there is no history surface to lose it
from (§3.6). Within a single screen visit the sent photo renders from the
in-memory message object. Leave the screen and the whole conversation list
resets anyway — photo or no photo.

### 4.2 Voice input (V2)

```
RN client                                      Backend (Lambda)                 OpenAI
─────────                                      ────────────────                 ──────
tap mic → ensureMicPermission()   ← Phase 0, already landed
  │
  ├─→ startRecorder(path, SPEECH_AUDIO_SET, true)
  │     16 kHz mono  → ~32 kbps  → 120 s ≈ 480 KB
  │     timer via addRecordBackListener
  │     120 s auto-stop  (NEW — no cap exists anywhere today)
  ├─→ stopRecorder()  → returns the saved path
  │
  ├─→ read file → base64
  │
  └─→ POST /api/mirrorgpt/transcribe   (~640 KB)
        { mime_type:'audio/m4a',        │
          data_base64: '...' }          ├─ validate: mime, decoded size,
                                        │  per-user daily cap
                                        ├─ write to /tmp (512 MB available)
                                        ├─→ audio.transcriptions.create(   ──→ whisper-1
                                        │     file, model, language='en')  ←── text
                                        └─ unlink /tmp file; return
                                   ←──── { text, duration_ms }
  │
  └─ transcript → setDraft(text)   ← user READS and EDITS before sending (D1)
       │
       └─→ normal sendMessage()  → POST /api/mirrorgpt/chat   (unchanged path)
```

The transcript is the message. Nothing downstream of `/chat` changes for
voice — history, continuity summaries, archetype analysis, Life Anchors and
Soul Pings all keep working because they only ever see text.

**The recording is never stored anywhere.** It exists in the device cache, in
one request body, and in `/tmp` for the duration of one Lambda invocation.
Under D1 the audio has no life after transcription, so storing it would have
been pure cost and privacy exposure. "We do not keep your voice recordings" is
both true and a materially better answer than "we keep them for 30 days."

**Record for Whisper, not for Echo Vault.** Do **not** copy
`NewEchoAudioScreen`'s `audioSet` (44.1 kHz, `AVEncoderAudioQualityKeyIOS: 96`)
— that is tuned for archival audio quality. Whisper resamples to 16 kHz
internally, so a 16 kHz mono recording is both ~4× smaller *and* no less
accurate. Define a separate `SPEECH_AUDIO_SET` constant and comment why the
two differ, so nobody "fixes" the inconsistency later.

**Still its own endpoint** (D5). `/chat` already runs p95 25-35s against a 30s
gateway ceiling; chaining transcription in front of it would produce 504s.
Give the transcribe route its own OpenAI client timeout rather than the shared
`timeout=20.0` (`openai_service.py:141`), while staying under 30s total.

### 4.3 Storage, retention and quota (D7)

There is nothing to write up here, and that is the point:

| Concern | Status |
|---|---|
| New S3 prefix | None |
| S3 lifecycle / expiry rule | None |
| New DynamoDB table or field | None — D4's description goes in `content`, and attachment *kind* metadata in the existing free-form `ConversationMessage.metadata` (`conversation.py:22`) |
| Migration | None |
| Storage-quota interaction | None — nothing is stored, so `QuotaEnforcementMiddleware` and `storage_quota_service` are untouched and irrelevant |
| Retention policy / deletion endpoint | None required for media. The persisted text description is covered by whatever already governs chat messages. |
| Expired-media placeholder UX | Not needed |

The only thing that persists from a photo is a sentence of model-written text
inside the user turn's `content`. That is subject to the same handling as any
other chat message — no new data-subject-access or deletion surface.

**One real consequence to accept:** there is no server-side record of what the
user actually sent. If someone reports "the Mirror misread my photo", there is
no image to inspect — only the stored description. That is a deliberate
support-debuggability cost in exchange for storing nothing, and it is the
correct trade for this product. Log the description, the decoded byte size and
the MIME type so a report is at least partially diagnosable.

### 4.4 Feature flagging

Follow the `TTS_FEATURE_ENABLED` pattern
(`src/services/speech/featureFlag.ts` — a build-time const consumed at three
call sites). There is no remote config in this app.

```ts
// src/features/chat-media/featureFlag.ts
export const CHAT_PHOTO_ENABLED = String(process.env.CHAT_PHOTO_ENABLED ?? 'false').toLowerCase() === 'true';
export const CHAT_VOICE_ENABLED = String(process.env.CHAT_VOICE_ENABLED ?? 'false').toLowerCase() === 'true';
```

Env-var-with-default matches `REFLECTION_ROOM_ENABLED`
(`src/constants/config/config.ts:66-67`) and lets the flags flip per build
without a code change. Default **off** so the branch can merge to `develop`
before the backend is deployed. Mirror with a server-side kill switch
(`CHAT_MEDIA_ENABLED` env on the Lambda) so a cost surprise can be stopped
without an app release — the client must handle a `403 feature_disabled` by
hiding the affordance.

---

## 5. Phase plan

Per `rules/common/testing.md` and `development-workflow.md`: tests first (RED),
minimal implementation (GREEN), refactor, 80%+ coverage. Each phase below is
independently mergeable and leaves `main` shippable.

### Phase 0 — Shared foundations (no user-visible change) ✅ DONE

> Landed on `feat/chat-media-phase0`. Pure refactor + extraction; no behaviour
> change to any existing screen. 41 new tests; `permissions/media.ts` and
> `mime.ts` at 100% coverage.

1. **`src/utils/permissions/media.ts`** (new) — `ensureMicPermission()` and
   `ensureCameraPermission()`, carrying over the Alert → `Linking.openSettings()`
   copy and the "audio-recorder-player v4 does not auto-prompt on iOS" note
   from `NewEchoAudioScreen.tsx:110-150`.

   **Implementation note — this diverged from the plan, for the better.**
   The plan called for branching on `Build.VERSION.SDK_INT >= 33` to fix the
   inherited Android storage bug. That turned out to be the wrong fix for
   *this* module, because Vision Camera exposes **static** permission methods
   (`Camera.getMicrophonePermissionStatus()` / `requestMicrophonePermission()`,
   confirmed in `Camera.d.ts:253-292`) that are cross-platform and wrap the
   correct native API per platform. Using them uniformly removes the
   Android/iOS branching that *caused* the bug class, rather than adding a
   corrected branch. It also means the helpers are plain async functions, not
   hooks — so they can be called straight from a "user tapped the mic button"
   handler instead of forcing the caller to be a component, which the hook
   form (`useMicrophonePermission()`) would have required.

   **Related correction to this plan's §8:** chat does **not** inherit the
   Android 13+ storage bug at all, because it never requests storage
   permissions. `launchImageLibrary` goes through the system picker, which
   carries its own implicit grant on both platforms. So there is deliberately
   no `ensurePhotoLibraryPermission()`. The bug remains real but is confined
   to the two Echo Vault call sites (`NewEchoAudioScreen.tsx:113`,
   `NewEchoComposeScreen.tsx:213-221`) — still worth its own PR, but it is not
   a blocker for or a dependency of this feature.
2. **`src/utils/media/mime.ts`** (new) — move `normalizeMime`,
   `MIME_ALIASES`, `EXT_CONTENT_TYPE`, `resolveFileContentType` and
   `formatDuration` out of `CreateEchoScreen.tsx:124-188`.
   Resolve the existing inconsistency: `NewEchoAudioScreen` uses `audio/m4a`,
   `CreateEchoScreen.tsx:821-823` uses `audio/mp4` for the same recorder
   output. Pick `audio/m4a` (both are allowlisted; `_MIME_ALIASES` maps
   `audio/x-m4a` → `audio/m4a`) and document it.
3. **`compressChatPhoto(uri)`** in `src/utils/media/compress.ts` — a 1536px /
   q.85 variant. Do **not** reuse `compressImageIfNeeded`; its 1024² cap is
   tuned for avatars and its 1MB skip threshold would pass a large photo
   through untouched.
4. **Jest mocks** — add `react-native-image-picker`,
   `react-native-audio-recorder-player` (default export must be an **object**,
   not a function — see `NewEchoComposeScreen.test.tsx:34`),
   `react-native-vision-camera`, and `PermissionsAndroid` to
   `src/__tests__/jest.setup.js`. Prefer mocking our own wrapper modules in
   feature tests, per the `pickProfilePhoto` precedent
   (`AddNewProfileScreen.test.tsx:21`).

**Exit criteria:** `npx tsc --noEmit` clean, new utils at 100% unit coverage,
all four Echo Vault screens still green.

### Phase 1 — Backend: the inline attachment contract ✅ DONE

> **✅ DONE.** See §11 — item 1 (attachment metadata dropped) and item 7 (the base64-in-422 hazard was narrower than described).

> Phase 1 was originally "chat upload namespace (`upload_type: 'chat'`)" and
> was the largest backend phase. D7 deleted almost all of it: no `'chat'`
> upload type, no `chat/` prefix, no lifecycle rule, no HEAD verification, no
> tenancy-prefix check, no quota comment. What remains is the validation that
> would have been needed anyway, and it is small enough to merge with Phase 2
> if you'd rather.

1. **`ChatAttachment` pydantic model** in `api/models.py`:
   `{ kind: Literal['image']; mime_type: str; data_base64: str }`.
2. **`MirrorGPTChatRequest.attachments: Optional[List[ChatAttachment]] = None`**
   (`api/models.py:183`), capped at **1** for V1. Relax `message` to allow
   empty text **only when attachments are present**, via a pydantic model
   validator, so an image with no caption is a valid turn.
3. **`services/chat_attachment_service.py`** (new, small) —
   `decode_and_validate(attachments) -> List[DecodedAttachment]`:
   - MIME on an explicit chat allowlist (`image/jpeg`, `image/png`,
     `image/webp`) — note this is a *separate, narrower* list than Echo
     Vault's `ALLOWED_UPLOAD_MIME_TYPES`, because chat needs neither video,
     PDF nor HEIC (the client converts HEIC before sending);
   - strict base64 decode, rejecting malformed input with a typed 400;
   - **decoded** size ≤ `MAX_CHAT_IMAGE_BYTES` (propose 1.5 MB). Check the
     decoded length, not the base64 length, and check it *before* doing
     anything else with the bytes;
   - sniff the magic bytes and confirm they match the claimed `mime_type`, so
     a caller can't label a payload `image/jpeg` and send something else.
4. **Redact the blob from validation errors.** FastAPI's default 422 body
   echoes the offending input, so a bad `data_base64` would dump the entire
   base64 string into the response *and* the CloudWatch log line. Add a
   `RequestValidationError` handler (or `repr`-limiting on the field) that
   replaces any `data_base64` value with `<redacted N bytes>`. **Do this in
   the same PR as the field** — it is the one genuinely new security-ish
   concern that inlining introduces, and it is easy to forget.
5. **Request-size guard.** API Gateway caps the body at 10 MB and Lambda at
   6 MB, but neither produces a friendly error. Reject oversized bodies early
   with a typed response the client can render.

**Exit criteria:** pytest covers a valid image, a malformed base64 string, an
oversized payload, a MIME/magic-byte mismatch, a disallowed MIME, two
attachments, and an image-only turn. A 422 on the attachment field must not
contain base64 in either the response body or the captured log output —
assert on that explicitly.

### Phase 2 — Backend: vision on `/chat` ✅ DONE

> **✅ DONE.** See §11 — item 2 (validator relaxation proved unnecessary) and item 3 (`VisionResponse.degraded` added).

1. **Widen `ChatMessage`** (`openai_service.py:45-62`) to
   `content: Union[str, List[Dict[str, Any]]]`, with `to_dict()` returning the
   content unchanged. This is the one invasive change in the whole plan: the
   class is used by the orchestrator, summarizer, soul pings and greeting, so
   keep `str` the default and add tests pinning that every existing caller is
   unaffected.
2. `mirror_orchestrator.ResponseGenerator.generate_enhanced_response` — when
   decoded attachments are present, build the user `ChatMessage` with content
   parts, embedding the image as a `data:` URL, and route through
   `send_with_overrides_async` (`openai_service.py:200`) with an explicit
   vision model override.
3. **D4 persistence.** Ask for the reply **and** a one-sentence image
   description in a **single completion** via JSON mode —
   `send_with_overrides_async` already supports `response_format`. A second
   call would re-send the image and re-pay the full image cost (§7), and would
   add a round-trip to a path already pressed against the 30s ceiling. Persist
   the user turn as `content = message + "\n[shared a photo: <desc>]"` and
   `metadata = {"attachments": [{"kind": ..., "mime_type": ...}]}` — **kind and
   MIME only, no bytes and no reference**, since there is nothing to reference.
   Relax `conversation_service._validate_message_inputs` (`:669-678`) to accept
   empty text when `metadata.attachments` is non-empty.
4. **Never log or echo the bytes.** Beyond the Phase 1 validation-error
   redaction: make sure the decoded attachment is not swept into any log line,
   exception message or the `mirrorgpt_analysis` blob written to DynamoDB. Log
   `{kind, mime_type, decoded_bytes}` and nothing else. A 400 KB base64 string
   in a CloudWatch log line is both a cost and a privacy problem.
5. **Per-user daily cap** on vision turns (new; see §3.5). Return a typed
   error the client can render, not a bare 429.
6. Telemetry: emit a `chat_media` structured event following
   `services/telemetry/upload_events.py` — `{kind, mime_type, decoded_bytes,
   model, duration_ms, status}`.

**Exit criteria:** pytest covers image-only turns, the daily cap, a vision
call that fails (reply must still degrade gracefully), and — most
importantly — that **history replay after an image turn contains no image
parts** (the D4 guarantee; assert the replayed messages are all `str`
content). Also assert no log record emitted during an attachment turn contains
a base64-looking string. Manual: a photo in staging produces a reply that
demonstrably refers to the image, and the stored turn reads sensibly as text.

### Phase 3 — Client: photo attachment UX ✅ DONE

> **✅ DONE.** See §11 — item 6 (chat timeout corrected to 30s). Note `docs/visual-qa/chat-photo-attachment.md` is still outstanding.

1. **`Message` type** (`src/types/chat.ts`) — add
   `attachments?: ChatAttachment[]` where a chat attachment is
   `{ kind: 'image'; mimeType: string; localUri: string }`. **Do not** reuse
   Echo Vault's `Attachment` (`echo.ts:100-110`): that type is built around
   `media_url` / `thumb_url` / `attachment_id`, none of which exist here. A
   chat attachment is a local file plus a MIME type, and nothing else.
2. **`ChatInput` prop surface** — add `attachments`, `onPickPhoto`,
   `onRemoveAttachment`, `preparing`. Repurpose the existing circled-plus
   button (`:73-95`) to open an attachment sheet; **keep the File →
   document-text behaviour** as one sheet option so nothing regresses. Render
   a small thumbnail strip with a remove affordance above the input row when
   an attachment is staged. Add the missing `testID`s while here (the plus
   button has none).
3. **iOS picker race — must replicate.** A picker launched while a `<Modal>` is
   dismissing fails on iOS. `CreateEchoScreen.tsx:543-636` solves it with a
   `pendingPicker` state launched in `onDismiss` (iOS) or
   `setTimeout(…, 300)` (Android, because RN `Modal` never fires `onDismiss`).
   If the attachment sheet is a modal, this is mandatory.
4. **Compress on pick, encode on send.** On pick: `ensureWebSafePhoto` →
   `compressChatPhoto` (both Phase 0, already landed), then stage the
   resulting local URI and show the thumbnail. Doing the expensive CPU work at
   pick time is what keeps send responsive now that there is no upload to
   front-load. On send: read the file to base64 (`ReactNativeBlobUtil.fs.readFile(path, 'base64')`)
   and attach it to the request.
5. **`useChat`** — hoist attachment state into the hook. `sendMessage()`
   currently takes no arguments and reads `draft`; keep that signature and have
   it read staged attachments from the same state. Clear staged attachments on
   successful send; **keep them on failure** so a retry doesn't lose the photo.
   `unlinkQuietly` the compressed temp file once the send succeeds.
6. **Raise the chat request timeout deliberately.** The request now carries
   ~400 KB, so on poor cellular it is slower than a text-only send. Keep the
   per-route timeout under the 30s gateway ceiling (see §8 — the current
   60_000 is already wrong and should be corrected to ~30s regardless).
7. **Render in bubbles** — `MessageBubble` gets an image case rendering from
   `localUri`. Use `EchoAttachments.tsx` as reference, including its
   `pointerEvents="none"` trick so vertical drags still reach the parent
   ScrollView. No expired-media placeholder is needed (D7) — but note the
   image only renders within the current screen visit, which is already true
   of the entire conversation (§3.6).
8. **Copy** — `ChatInput`/`MessageBubble` currently hard-code English and only
   10 files in the app use `useTranslation`. Follow the local convention
   (hard-code) or i18n the whole chat surface deliberately — **do not mix**.

**Exit criteria:** RTL tests for pick → stage → send → render, remove,
send failure leaving the attachment staged, permission denial, oversized photo
rejected client-side before the request, and feature-flag-off (no affordance
rendered). `docs/visual-qa/chat-photo-attachment.md` written per the CLAUDE.md
Visual-QA rule if the design comes from Figma.

### Phase 4 — Backend: `/api/mirrorgpt/transcribe` ✅ DONE

> **✅ DONE.** See §11 — items 4 (audio cap re-derived), 5 (duration enforcement), and 8 (`language="en"` pinned).

1. New route on the existing `mirrorgpt` router (authenticated automatically
   via the catch-all — **no `serverless.yml` change**).
   Request `{ mime_type, data_base64 }`, response `{ text, duration_ms }`.
2. Validate via the same `chat_attachment_service` decoder as Phase 1, with an
   audio allowlist (`audio/m4a`, `audio/mp4`, `audio/aac`) and its own
   `MAX_CHAT_AUDIO_BYTES` (propose 3 MB — generous for a speech-tuned 120s
   clip, tight enough to bound abuse). The same
   `data_base64`-redaction rule applies to this route's validation errors.
3. Write the decoded bytes to `/tmp` (512 MB ephemeral available), call
   `audio.transcriptions.create`, then **unlink in a `finally`** so nothing
   survives the invocation. Lambda `/tmp` persists across warm invocations on
   the same container, so leaving the file there would mean one user's
   recording sitting on a container that later serves another user — unlink is
   a correctness requirement, not tidiness.
4. Use a **dedicated OpenAI client** with a longer timeout than the shared
   `timeout=20.0` (`openai_service.py:141`), while keeping total request time
   under the 30s gateway ceiling.
5. Model choice: `whisper-1` is the cost floor; `gpt-4o-transcribe` is more
   accurate on the reflective, emotionally-loaded speech this product invites.
   Make it an env var (`MIRRORGPT_STT_MODEL`) and start on `whisper-1`.
6. Enforce a max duration (reject >120s server-side even though the client
   caps too) and a per-user daily transcription cap — this is the single
   largest cost lever in the feature (§7).
7. **Log no audio and no transcript.** The transcript is the user's words
   about something personal; it is already persisted as a chat message via the
   normal `/chat` path, so logging it here duplicates sensitive content into
   CloudWatch for no benefit. Log `{decoded_bytes, duration_ms, model,
   status}` only.

**Exit criteria:** pytest covers a valid clip, malformed base64, oversized
payload, over-long duration, a disallowed MIME, an OpenAI failure, and the
daily cap. Assert the `/tmp` file is removed even when transcription raises,
and that neither audio nor transcript text appears in captured logs. Manual:
a 30s staging recording returns accurate text in under ~8s.

### Phase 5 — Client: voice input UX ⬜ NOT STARTED

> The voice backend is complete and tested, but **unreachable from the app**:
> there is no recorder, no mic button, no `transcribe.ts` and no
> `ENDPOINTS.MIRRORGPT.TRANSCRIBE` constant.

1. **`useAudioRecorder()` hook** (new) wrapping the singleton + refs +
   cleanup, lifted from `NewEchoAudioScreen.tsx:163-235`. Must carry over:
   the 300ms audio-session pre-delay, `removeRecordBackListener()` before
   re-adding, the synchronous `isRecordingRef` guard, both cleanup layers
   (unmount `useEffect` **and** `useFocusEffect`), and the error-substring →
   user-copy mapping at `:194-219` ("enable in Settings" / "disconnect AirPods").
   **Add the 120s auto-stop that does not exist anywhere today.**
2. **`SPEECH_AUDIO_SET`** — a new, separate audio config: 16 kHz mono, modest
   bitrate. Do **not** reuse `NewEchoAudioScreen`'s 44.1 kHz /
   `AVEncoderAudioQualityKeyIOS: 96` set — Whisper resamples to 16 kHz
   internally, so the archival config is ~4× larger for no accuracy gain.
   Comment why the two differ so nobody unifies them later.
3. **Mic button** in `ChatInput` — the row is already tight at `MAX_LINES`, so
   the mic replaces the send button while the draft is empty (the iMessage
   pattern) rather than adding a fourth child. `styles.iconImage` (`:189-193`)
   is the style baseline.
4. **Recording state UI** — timer `m:ss` (use Phase 0's `formatDuration`),
   cancel, stop. The existing Echo Vault waveform is fake (metering is off).
   Since `SPEECH_AUDIO_SET` can pass `meteringEnabled: true`, a real waveform
   is now cheap — but still a nice-to-have, not a blocker.
5. **Transcribing state** — encode + transcribe is a visible wait. Show it on
   the input, and on success `setDraft(text)` so the user reads and edits
   before sending (D1). On failure, **keep the recording file** and offer
   retry rather than discarding what the user just said. Delete the local file
   once a transcript is accepted.
6. Mic permission via the Phase 0 `ensureMicPermission()`. Deny → Alert →
   `openSettings()`, already implemented and tested.

**Exit criteria:** RTL tests for permission grant/deny, record → stop →
transcribe → draft populated, the 120s auto-stop, transcription failure
keeping the recording for retry, cancel mid-recording, and
unmount-while-recording cleanup. `docs/visual-qa/chat-voice-input.md` if
design-driven.

### Phase 6 — Rollout ⬜ NOT STARTED

> Contains two **release blockers** (the Info.plist copy reword and the App
> Privacy / privacy-policy update).

1. Deploy backend to staging; flip client flags on in a dev build only.
2. Internal dogfood via Firebase App Distribution (`npm run distribute:ios` /
   `distribute:android` — note release is **manual**, there is no CI pipeline).
3. Watch the CloudWatch Logs Insights queries for `chat_media` cost/latency and
   error rate for a week.
4. Deploy backend to production with both server kill switches **off**.
5. Ship the app update with flags on, server switches flipped last — so the
   feature can be disabled server-side without an App Store release.
6. **Reword the two iOS usage-description strings** in
   `ios/MirrorCollectiveApp/Info.plist` so they describe chat as well as
   echoes (see §1). Purely a copy change, but it is an App Review surface.
7. **App Store / Play privacy disclosures** must be updated before submission
   even though no new permission strings are needed: photo and audio data are
   now sent to a third-party processor (OpenAI). Update the App Privacy
   questionnaire and the privacy policy at
   `https://www.themirrorcollective.com/privacy` (linked from
   `config.ts:81-84`). This is a **release blocker**, not a nice-to-have.

---

## 6. File-level task index

### Client — `mirror_collective_app/MirrorCollectiveApp`

| Phase | File | Change |
|---|---|---|
| 0 ✅ | `src/utils/permissions/media.ts` | **new** — `ensureMicPermission`, `ensureCameraPermission` via Vision Camera statics |
| 0 ✅ | `src/utils/media/mime.ts` | **new** — extracted from `CreateEchoScreen.tsx:124-188` |
| 0 ✅ | `src/utils/media/compress.ts` | `compressChatPhoto` + `CHAT_PHOTO_MAX_EDGE` (1536/q.85) |
| 0 ✅ | `src/__tests__/jest.setup.js` | mocks for image-picker, audio-recorder-player, vision-camera, `PermissionsAndroid`, `Linking.openSettings`, `DocumentPicker.types` |
| 3 | `src/features/chat-media/featureFlag.ts` | **new** — `CHAT_PHOTO_ENABLED`, `CHAT_VOICE_ENABLED` |
| 3 | `src/types/chat.ts` | `Message.attachments?: { kind; mimeType; localUri }[]` |
| 3 | `src/types/api.ts:139-145` | `ChatRequest.attachments?: { kind; mime_type; data_base64 }[]` |
| 3 | `src/services/api/chat/chat.ts` | pass attachments through; correct the 60s timeout to ~30s |
| 3 | `src/components/ui/ChatInput/ChatInput.tsx` | attachment sheet, thumbnail strip, testIDs, (P5) mic button |
| 3 | `src/components/ui/MessageBubble/MessageBubble.tsx` | image case rendering from `localUri` |
| 3 | `src/hooks/useChat/useChat.ts` | attachment state, compress-on-pick, base64-on-send, retain on failure |
| 3 | `src/screens/MirrorChatScreen.tsx:204-210` | wire new `ChatInput` props |
| 5 | `src/hooks/useAudioRecorder/` | **new** — recorder lifecycle, `SPEECH_AUDIO_SET`, 120s cap |
| 5 | `src/services/api/chat/transcribe.ts` | **new** — `POST /api/mirrorgpt/transcribe` |
| 5 | `src/constants/config/config.ts:19` | `ENDPOINTS.MIRRORGPT.TRANSCRIBE` |
| 3/5 | `docs/visual-qa/chat-photo-attachment.md`, `chat-voice-input.md` | **new**, per CLAUDE.md |

**Not touched** (was in revision 1, removed by D7): `src/services/api/echo.ts`,
`multipart.ts`, `pendingUploads.ts`, `uploadLifecycle.ts`,
`UploadProgressOverlay.tsx`. Chat does not enter the upload pipeline at all.

### Backend — `mirror_collective_python_api`

| Phase | File | Change |
|---|---|---|
| 1 | `src/app/api/models.py:183` | `ChatAttachment` model; `MirrorGPTChatRequest.attachments`; conditional empty-message validator |
| 1 | `src/app/services/chat_attachment_service.py` | **new** — decode, MIME allowlist, magic-byte check, decoded-size cap |
| 1 | `src/app/core/error_handlers.py` | redact `data_base64` from `RequestValidationError` responses **and** logs |
| 2 | `src/app/services/openai_service.py:45-62` | `ChatMessage.content: Union[str, List[Dict]]` — the one invasive change |
| 2 | `src/app/services/mirror_orchestrator.py:165-198` | content-parts path with a `data:` URL, vision model override, JSON-mode reply+description |
| 2 | `src/app/services/conversation_service.py:669-678` | allow empty text when attachments present |
| 2 | `src/app/models/conversation.py:51,57` | `to/from_dynamodb_item` carry `metadata.attachments` (kind + MIME only) |
| 2 | `src/app/services/telemetry/` | `chat_media` event |
| 4 | `src/app/api/mirrorgpt_routes.py` | `POST /mirrorgpt/transcribe` |
| 4 | `src/app/services/transcription_service.py` | **new** — `/tmp` write + guaranteed unlink, own client timeout |
| 2/4 | `src/app/core/` | per-user daily caps for vision + transcription |
| — | `src/app/services/storage_quota_service.py:56` | **separate ticket, unrelated to this feature** — the `users/` prefix matches no objects, so the Echo Vault quota is inert (§8) |

**Not touched** (was in revision 1, removed by D7): `echo_service.py`,
`echo_routes.py`, `serverless.yml`, `quota_middleware.py`. **No
`serverless.yml` change is needed at all** — the authenticated catch-all route
(`:403-409`) already routes any new path, and there is no bucket, lifecycle
rule or IAM grant to add.

---

## 7. Cost model

> **Verify these against current OpenAI list prices before quoting them to
> anyone.** The ratios and the conclusion are what matter here; the absolute
> figures are from memory and move.

Per-event, using the existing `gpt-4o-mini` default:

| Event | Unit cost | Note |
|---|---|---|
| Image in a chat turn, `detail: 'low'` | ~**$0.0004** | `gpt-4o-mini` does **not** bill a low-detail image at `gpt-4o`'s flat 85 tokens — it applies a ~33× token multiplier (~2,833 input tokens), which at the mini input rate lands in the same dollar ballpark as `gpt-4o`. Still flat regardless of dimensions, which is the reason to use `low`. |
| Image description pass (D4) | **$0.0004 or $0** | $0 **if the description is requested in the same completion as the reply** (JSON mode, two fields). A second call re-sends the image and therefore re-pays the full image cost — so fold it into the first call. |
| Transcription, `whisper-1` | **$0.006 / minute** | A 30s note ≈ $0.003 |
| Transcription, `gpt-4o-transcribe` | same order | Better on reflective speech; benchmark before switching |
| Storage | **$0** | Nothing is stored (D7). No S3 objects, no extra DynamoDB bytes beyond one sentence of description text. |
| Data transfer | negligible | ~400KB inbound per photo turn, ~640KB per voice note. Inbound to API Gateway is not separately billed at this volume. |

At 50 DAU with 2 photos and 3 voice notes each per day:

- Vision: 100 images/day × ~$0.0004 ≈ **$1.20/month** (description folded into
  the same call); roughly **$2.40/month** if it is a second call
- Transcription: 150 notes/day × 30s × $0.006/min ≈ **$13.50/month**

**Transcription still dominates, by ~10×.** Three consequences:

1. The per-user daily cap matters far more on voice than on photos.
2. The 120s recording cap is a cost control, not just a UX nicety.
3. **Ask for the reply and the image description in one completion** (Phase 2.3)
   — it halves image cost and removes a round-trip from a path that is already
   pressed against the 30s gateway ceiling.

D7 also removed the only recurring non-OpenAI cost this feature would have
had. There is no storage line, no lifecycle-transition line, and no
`ListObjectsV2` traffic from quota recalculation.

All of it is small next to the ~$19/month the provisioned-concurrency instance
already costs (`serverless.yml:334`) — this feature is not a budget risk at
current scale, provided the per-user caps exist so one account cannot run away.

---

## 8. Risks and pre-existing issues this work touches

| Risk | Severity | Mitigation |
|---|---|---|
| **No content moderation on images sent to OpenAI.** There is no content scanning anywhere in the codebase today. | High | OpenAI's own moderation refuses clearly violating content, but the request still leaves our system. At minimum: log refusals distinctly and add a typed client-facing error. Note D7 makes a pre-flight scanning fix *harder*, not easier — there is no stored object for Rekognition to inspect asynchronously, so moderation would have to run inline inside the already-30s-capped request. If pre-flight moderation is ever required, that is an argument for revisiting D7, and it should be weighed then rather than discovered. |
| **Users will send sensitive photos and say sensitive things aloud.** This is a reflective, emotionally intimate product; expect medical, personal and identifying content. | High | **D7 is the main mitigation and it is a strong one** — we store no photos and no recordings at all, so there is no at-rest exposure, no breach surface and no deletion obligation for the media itself. What remains: the bytes transit our Lambda and go to OpenAI, and D4's text description of the photo *is* persisted. Privacy-policy update is a release blocker (Phase 6.7). Consider a one-time consent dialog on first attachment. |
| **The 30s API Gateway ceiling, now with upload time inside it.** The client's `MIRROR_CHAT_TIMEOUT_MS = 60_000` is already larger than the server can ever take, so a slow chat surfaces as a confusing 504. D7 moves ~400KB of transfer *into* that same request, which the S3 design would have kept outside it. | High | This is the one place D7 is a genuine regression versus the S3 design, and it is accepted knowingly. Mitigations: compress hard on pick (Phase 0 already caps at 1536px/q.85, landing 200-500KB); measure p95 of an image turn on throttled cellular before shipping; correct the client timeout to ~30s so failures are honest. If p95 approaches 25s, the escape hatch is to reinstate the upload step for photos only — the §3.2 recon is preserved for exactly that reason. |
| **Android 13+ permission bug, inherited.** `NewEchoAudioScreen.tsx:113` and `NewEchoComposeScreen.tsx:213-221` request `*_EXTERNAL_STORAGE` without an API-level branch, so on Android 13+ they resolve denied while the manifest's `READ_MEDIA_*` are never requested. | Medium | **Does not affect chat** — chat never requests storage permissions, because `launchImageLibrary` uses the system picker's implicit grant (see Phase 0). The bug is confined to those two Echo Vault call sites and needs its own PR. Phase 0's uniform use of Vision Camera's cross-platform statics means chat cannot reintroduce the bug class. |
| **iOS picker-while-modal-dismissing race.** | Medium | Replicate the `pendingPicker` + `onDismiss` fix from `CreateEchoScreen.tsx:543-636`. Called out explicitly in Phase 3.3 because it is non-obvious and fails only on device. |
| **`ChatMessage` is used by five subsystems.** Widening it touches the orchestrator, summarizer, soul pings and greeting. | Medium | Keep `str` the default; add tests pinning each existing caller. This is the highest-blast-radius change in the plan. |
| **No per-user rate limiting exists.** A single account could run unbounded transcription cost. | Medium | Per-user daily caps are in scope (Phases 2 and 4), not deferred. |
| **The Echo Vault storage quota is inert** — `storage_quota_service.py:56` sums the prefix `users/{user_id}/`, which no upload path ever writes to, so usage is always 0.0 GB and the `402` never fires. Discovered while verifying D2. | Medium (pre-existing, unrelated to this feature) | Own ticket, own PR. Flagged here because (a) it means the quota system cannot be cited as a working cost control for *any* media feature, and (b) when it is fixed, real users will start hitting limits for the first time — that needs its own comms and a usage audit first. |
| **Client CI runs no tests.** Only a path-filtered Figma-token check; the husky pre-commit hook is the real gate, and it can be bypassed with `--no-verify`. | Medium | Out of scope to fix here, but worth a separate ticket — this plan adds meaningful client logic with no automated CI safety net. Flagging rather than silently relying on it. |
| **`NSAllowsArbitraryLoads = true`** in `Info.plist` — ATS fully disabled. | Low (pre-existing) | Unrelated to this work but it is an App Store review risk that a media-feature submission may draw attention to. Separate ticket. |
| **Release signs with the debug keystore** (`android/app/build.gradle`, `release` → `signingConfig signingConfigs.debug`). | Low (pre-existing) | Unrelated; flagging because Phase 6 involves release builds. |
| **Base64 echoed into logs or error responses.** FastAPI's default 422 body includes the offending input, so a malformed `data_base64` would dump ~400KB of base64 into the HTTP response *and* the CloudWatch log line. | Medium | The single genuinely new hazard D7 introduces. Phase 1.4 handles it explicitly (redact `data_base64` in the `RequestValidationError` handler) and Phase 1's exit criteria assert on it. Flagged separately because it is easy to omit and silent when wrong. |
| **No server-side record of what the user sent.** A "the Mirror misread my photo" report cannot be investigated — only D4's description survives. | Low | Accepted cost of D7. Log `{kind, mime_type, decoded_bytes}` plus the generated description so reports are partially diagnosable. |
| **Lambda buffers the whole request body in memory** via Mangum. | Low | At ~640KB against 1769MB of Lambda memory this is noise. It only matters if the size caps are ever raised substantially. |

---

## 9. Open questions

1. **Does the Mirror's system prompt need to change for images?**
   `MIRRORGPT_SYSTEM_PROMPT` is tuned for 1-3 sentence reflective replies to
   text, and `OPENAI_MAX_TOKENS` defaults to 450. A photo invites a different
   register ("I see…"). Needs a prompt-engineering pass and probably a
   dedicated instruction fragment when an attachment is present. **Owner: product + prompt.**
2. **Should an image turn feed the archetype engine at all?** D4 makes the
   description text available to `analyze_message`, so it *will* produce
   signals from a machine-written sentence. Is that desirable, or should image
   turns be excluded from archetype analysis to avoid polluting the user's
   signal history with the model's own words? **Owner: product.** Leaning
   toward excluding; it is a one-line guard either way.
3. **`whisper-1` or `gpt-4o-transcribe`?** Same order of cost; accuracy on
   emotional, halting, reflective speech differs. Needs a real benchmark on
   sample recordings before Phase 4 locks the default.
4. **One-time consent dialog before the first photo send?** Defensible given
   the sensitivity of the content (§8), but it is friction on a
   much-requested feature. **Owner: product + legal.**
5. **Is visible chat history genuinely off the roadmap?** D7 rests on it
   (§3.6). Confirmed once, but it is the assumption most likely to change —
   the backend already stores every turn with full signals, so history is more
   a client feature than a data problem. If it lands, photos from this era are
   permanently text-only. **Owner: product.** Worth re-confirming before
   Phase 3 rather than after.
6. **Does the "File" option stay on the attachment sheet?** Its current
   behaviour (dump document text into the draft) is odd but shipped. Phase 3
   preserves it to avoid a regression; product may prefer to remove it.

---

## 10. First demoable milestone

**Phase 1 + 2 + Postman** — Phase 0 is already done, and this is the smallest
remaining slice that proves the risky half.

Concretely: `ChatMessage` carries content parts, `/api/mirrorgpt/chat` accepts
a base64 image and replies about it, and the stored turn reads sensibly as
text. Drive it from Postman (the repo has a collection) with a base64 fixture —
no client work at all, which D7 makes possible: there is no upload ceremony to
stand up first, so a single `curl` exercises the entire feature.

That front-loads every genuine unknown:

1. **The `ChatMessage` blast radius** — the one invasive change, touching the
   orchestrator, summarizer, soul pings and greeting.
2. **Vision latency against the 30s ceiling**, now including payload transfer
   (§8). Measure this on a throttled connection before committing to the UI.
3. **Whether the Mirror's voice survives contact with images** — the open
   question in §9.1, and the one most likely to need product iteration.

All three are answerable in a backend-only PR. Everything deferred past this
point is UI work with four in-repo precedents to copy.

---

## 11. Implementation log — what changed while building

Everything above §11 was written before any code existed. Eight things turned
out differently once the code met the codebase. They are recorded here rather
than by silently editing the phase bodies, so the reasoning stays visible.

| # | Plan said | Actually did | Why |
|---|---|---|---|
| 1 | Persist `metadata.attachments` (kind + MIME) on the user turn | **Dropped it.** Only D4's text description is persisted. | It buys nothing concrete: the composed `[shared a photo: …]` text already records that a photo was shared, telemetry covers counting, and there is no history UI to render a marker in (§3.6). Adding it would have meant a new param on `add_message_with_mirrorgpt_analysis`. |
| 2 | Relax `conversation_service._validate_message_inputs` to accept empty content | **No change needed.** | Composing the turn as `"[shared a photo: …]"` is always non-empty, even with no caption — so the existing non-empty-content rule is satisfied. One less edit to shared code than assumed. |
| 3 | — (not anticipated) | **Added `VisionResponse.degraded`.** | Without it, "the vision call failed and the user got a template reply" (an outage) is indistinguishable from "the model returned no description" (prompt drift). They need different responses, so telemetry reports them separately as `degraded` vs `description_returned`. |
| 4 | `MAX_CHAT_AUDIO_BYTES = 3MB`, justified as "larger than the image cap" | **1.5MB, derived from the recording config.** | The original basis was simply wrong: a 120s speech-tuned recording is ~480KB, *smaller* than a detailed 1.5MB photo, not larger. Re-derived as 120s × 16kHz mono AAC × 3 headroom. |
| 5 | "Enforce a max duration (reject >120s server-side)" | **The byte cap is the enforcement.** Real duration is reported in telemetry instead. | There is no honest way to know duration before paying for the transcription without parsing the MP4 `mvhd` atom. The byte cap plus the per-user daily cap already bound spend to cents, so parsing was judged over-engineering for V1. Requesting `verbose_json` returns the true duration, so the assumption can be checked against real usage rather than trusted. |
| 6 | — (flagged only as a §8 mitigation) | **Corrected `MIRROR_CHAT_TIMEOUT_MS` from 60s to 30s**, and updated the test that pinned 60s. | 60s was unreachable: the api Lambda is `timeout: 30` and API Gateway caps the integration there, so anything slower returned a gateway 504 while the user watched a spinner for another 30 seconds. |
| 7 | Add a `RequestValidationError` handler to redact `data_base64` | **The existing handler was already safe**; pinned with tests instead. | `validation_exception_handler` builds its own `{field, message}` shape and never includes pydantic's `input`. The real discipline needed is narrower: our own validators must not interpolate the payload into an error message. Tests now assert that, in the service and through the HTTP layer. |
| 8 | — (not anticipated) | **Pinned `language="en"` on the Whisper call.** | Whisper otherwise mis-detects halting or heavily accented speech as another language and "translates" it into nonsense — a real failure mode for a product that deliberately invites hesitant, emotional speech. |

### Two architectural choices worth re-reading

Both were made to remove a bug *class* rather than fix an instance:

- **Permissions** (Phase 0) use Vision Camera's cross-platform **static**
  methods rather than the planned `Build.VERSION.SDK_INT >= 33` branch. That
  deletes the Android/iOS divergence that caused the inherited storage-permission
  bug instead of adding a corrected branch, and keeps the helpers callable from
  an event handler rather than forcing the caller to be a component.
- **Attachment decode** sits *outside* the `/chat` route's main `try` block.
  That block ends in a broad `except Exception -> HTTPException(500)`, which
  turned "unsupported image type" into "Mirror chat failed". Moving the decode
  out was narrower than widening the exception handling.

### What is NOT proven

**No code here has run against a real OpenAI model or a real deployment.**
Every vision and transcription call is mocked. 2,038 passing tests
(1,245 API + 793 client) demonstrate the plumbing, not the product. Three
things remain genuinely unknown and are the first things staging should answer:

1. **Whether the Mirror's voice survives contact with images.** `_VISION_INSTRUCTION`
   is a first pass at keeping the reply evocative rather than descriptive; it
   has never met a model. This is §9.1 and it is the most likely thing to need
   iteration.
2. **Real p95 latency for an image turn** against the 30s ceiling — the one
   genuine regression from dropping S3 (§8).
3. **Whether `whisper-1` is good enough** on halting, emotional speech, or
   whether `gpt-4o-transcribe` is worth the switch (§9.3).

### Test coverage added

| Area | Tests |
|---|---|
| Phase 0 — permissions, MIME, chat-photo compression | 41 |
| Phase 1 — attachment decode/validate, request model | 45 |
| Phase 2 — `ChatMessage` widening, vision response, route, telemetry, quota | 58 |
| Phase 3 — prepare, hook, ChatInput, MessageBubble | 68 |
| Phase 4 — transcription service, route, transcription cap | 45 |

Incidental fix: the global Vision Camera jest mock added in Phase 0 repaired
`CreateEchoScreen.test.tsx`, which was failing on `main` with
`TypeError: Cannot read properties of undefined (reading 'CameraView')`.
