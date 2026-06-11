# Visual QA — Create an Echo (New Design)

**Figma:** Dev-Master-File → section "Create an Echo" (`7544:1733`),
frame "Echo - Write message (New Design)" (`7544:1873`).
**Screen:** `src/screens/echoVault/CreateEchoScreen.tsx`

> Reference render: capture with
> `npm run figma:check -- "https://www.figma.com/design/xn6MdQV0gGGeedaFtHWWCo/Dev-Master-File?node-id=7544-1873" --name=create-echo`
> (requires `FIGMA_ACCESS_TOKEN`). Not committed here — figma asset dir was not
> on the MCP allowlist during this pass.

## What was built

A unified compose screen replacing the mode-siloed flow: a text **Message**
plus optional attachments via three "Add to your Echo" cards, and a **SAVE**
button. Reachable from:

- `NewEchoVaultScreen` → (no recipient) → **CreateEchoScreen**
- `NewEchoVaultScreen` → `ChooseRecipientScreen` → **CreateEchoScreen** (create flow)
- Edit flow still uses `NewEchoComposeScreen` (media-replace + mode tabs).

### Element → design mapping

| Figma node | Element | Implementation |
| --- | --- | --- |
| 7544:1878 | "CREATE AN ECHO" heading | Cormorant 28/32 gold, glow shadow |
| 7544:1880 | Star divider | `✦` between two 73px lines |
| 7544:1884 | Message field | Multiline `TextInput`, min 160h, subtle border |
| 7544:1886 | "Add to your Echo" divider | gold label between lines |
| 7544:1891 | Add photo or video | card → file-upload bottom sheet (7544:2839) |
| 7544:1894 | Add voice recording | card → "Record your Voice" modal (7544:2806) |
| 7544:1897 | Record a video | card → native camera (`launchCamera`) |
| 7544:1900 | SAVE | `Button` primary L |
| 7544:2839 | File-upload sheet | Modal: **File** (DocumentPicker) / **Gallery** (image library), `.pdf/.png/.jpg/.mp4` hint |
| 7544:2806 | "Record your Voice" modal | title + ✕, timer, gold mic button (→ stop square), SAVE |

### Attachment flavors (one screen, type-specific previews)

The dedicated "Voice"/"Video" frames are the **same compose screen** with a
type-specific attachment preview — handled by `<AttachmentPreview>`:

| Type | Figma | Render |
| --- | --- | --- |
| File (pdf) | 7544:1923 | compact chip: 📄 name + ✕ |
| Image | 7556:2644 | full-width preview card: image + "name / Tap to add more" caption + floating ✕ |
| Video | 7544:2192 | preview card: play overlay + duration badge + "See more:" + floating ✕ |
| Audio | 7544:2806 | compact chip: 🎤 name + duration + ✕ |
| Upload error | 7544:2106 | inline red-info banner(s) below the message (not `Alert`) |

### Token audit

- Text/Paragraph-1 `#f2e1b0` → `palette.gold.DEFAULT`
- Text/Paragraph-2 `#fdfdf9` → `palette.gold.subtlest`
- Border/Subtle `#a3b3cc` → `palette.navy.light`
- Heading → `fontFamily.heading` (Cormorant); Body → `fontFamily.body` (Inter)
- Spacing M/L/XL = 16/20/24, Radius S/M = 12/16 — via `spacing`/`radius` tokens
- Scale helpers `scale`/`verticalScale`/`moderateScale` throughout

## Backend integration

- Multi-attachment: each file goes `createEcho` → `uploadEchoAttachment`
  (compress → presigned PUT → S3 → `POST /echoes/{id}/attachments`); video
  attachments also upload a poster as `thumb_key`.
- Auto-release mirrors create-echo rule (recipient + no lock date → `releaseEcho`).
- Attachments feed the recipient email (`attachment_count` / `media_duration` /
  hero image) via the backend's `build_email_media_fields`.

## Verification

- `npx tsc --noEmit`: **0 errors in changed files** (19 pre-existing repo errors
  unchanged — generated figma-components, `user.ts`, an existing test).
- `jest src/services/api`: 117 passed (API client change green).
- Screen imports no `react-native-video` / `vision-camera`, so it avoids the
  pre-existing `NewEchoComposeScreen.test.tsx` native-mock failure.

## Token gaps / follow-ups

- **Not yet run in a simulator** — no pixel diff captured. Needs an on-device
  pass (preview-card sizing, record-modal layout, camera permissions, banner +
  chip wrapping on small screens).
- **Icons:** photo icon is an inline SVG approximation; voice/video reuse
  `@assets/mic.png` / `@assets/videocam.png`. Swap for the exact Figma
  `add_photo_alternate` / `mic` / `camera` exports when allowlisted.
- **Video preview thumbnail:** the draft video preview shows a dark card + play
  overlay (no frame thumbnail) because the poster is generated server-side at
  upload. Could extract a local thumbnail for the preview as a polish step.
- **Record Video modal** (7544:2830): uses the native camera (`launchCamera`)
  rather than the in-app camera-preview modal. Functionally complete; the
  custom modal (with `react-native-vision-camera`, as in `NewEchoVideoScreen`)
  is a fidelity follow-up. The **voice** modal matches the design.
- **"Record your Voice" waveform:** shown as a running timer rather than a live
  waveform graphic — visual polish follow-up.
- **Attachment multipart:** very large videos via the attachment path use
  single-PUT; multipart-for-attachments is a follow-up.
- **Edit flow** for multi-attachment echoes (view/remove existing attachments)
  not built — edit still routes to the legacy compose.

## Consistency fixes applied (this pass)

- Type-specific attachment previews (file chip / image card / video card /
  audio chip) replacing the prior uniform chip.
- Inline upload-error banners replacing `Alert` for create/upload failures,
  with per-attachment messages ("Recording failed…" vs "Attachment upload
  failed…").
- SAVE is retry-safe: the echo is created once and succeeded attachments are
  not re-uploaded, so a partial-failure retry can't create duplicate echoes.
- Voice modal aligned to Figma (✕ to close, mic button, centered SAVE).
- **File (.pdf) attachments wired end-to-end:** the upload-sheet "File" option
  (`DocumentPicker`) derives content type from the extension; backend
  `ALLOWED_UPLOAD_MIME_TYPES` now includes `application/pdf` (+ extension map),
  so the presigned-URL step accepts it; `add_attachment` classifies it as
  `FILE`; and the recipient email counts it in the "See N attachments: Download"
  row (written/voice templates).
