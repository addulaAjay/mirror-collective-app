# Visual QA — Edit Recipient Photo (EDIT PROFILE)

**Figma:** Dev-Master-File → node `7767-5632` (`?node-id=7767-5632`)
**Screen:** `src/screens/echoVault/AddNewProfileScreen.tsx` (edit mode)

## Summary

Edit mode reuses the existing Add-Profile screen (built from Figma `780:1147`),
which already encodes the shared tokens, so there are no net-new visual tokens.
Edit-mode deltas vs. the create screen (matching node 7767-5632):

- Title: **"EDIT PROFILE"** (vs "ADD PROFILE").
- Avatar shows the **existing** photo with an **"Edit Image +"** overlay
  (darkened scrim); tapping opens the same crop picker to replace it.
- **Name + Email are pre-filled and read-only** — this is a picture-only edit,
  enforced server-side by `PATCH /api/recipients/{id}` (name/email are not in
  the request body).
- Primary button saves the new photo via `updateRecipientPhoto`.

## Tokens

Inherits AddNewProfileScreen's tokens (gold heading `Cormorant 28/32`, subtitle
`Inter 16/24`, 186px gold-bordered glow circle, `TextInputField`). One local UI
value: the edit overlay scrim `rgba(0,0,0,0.35)` — not a Figma variable
(**Token gap**), acceptable for a functional scrim.

## Notes / deviations

- The design's button label reads "ADD"; implemented as **"SAVE"** (agreed —
  clearer on an edit surface).
- Reference render: Figma node `7767-5632` (screenshot attached to the PR).
- Entry point: tapping a row in `ManageRecipientScreen` opens this screen in
  edit mode.
