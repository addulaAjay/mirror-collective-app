# Visual QA — Save a MirrorGPT reply into an Echo

**Figma:** Dev-Master-File → node `7811-2866` (MirrorGPT chat)
**Feature:** copy/paste capability — save a MirrorGPT reply as a new Echo (V1 Must Have)

## Summary

Each MirrorGPT **assistant reply** now shows a **save (download) icon** beneath
the bubble. Tapping it starts the create-Echo flow and carries the reply's text
all the way through to the compose box:

```
[save icon on reply] → NewEchoScreen (title / category / recipient?)
  → ChooseRecipientScreen (recipient + lock date)   [recipient path]
  → CreateEchoScreen  ← message box prefilled with the reply text
```

The no-recipient path (`NewEchoScreen → CreateEchoScreen`) prefills the same way.

## Implementation

- **`MessageBubble`**: new optional `onSave` prop → renders a gold download-into-tray
  icon (Figma 7811-2866) in an action row under **assistant** bubbles only. The
  bubble/action row now stack in a left-aligned column (the column carries the
  80% width cap so bubble width is unchanged).
- **`MirrorChatScreen`**: `handleSaveToEcho(text)` navigates to `NewEchoScreen`
  with `prefillContent`; `onSave` is passed only for assistant messages.
- **Threading** (this is the plumbing that was missing): `prefillContent` flows
  `NewEchoScreen → ChooseRecipientScreen → CreateEchoScreen.initialContent`.
  `CreateEchoScreen` previously **ignored** `initialContent`; it now seeds the
  message box from it (edit/view mode still overrides with the loaded echo).
- Nav type: `NewEchoScreen` param gains `prefillContent?: string`.

## Tokens

Save icon: `palette.gold.DEFAULT`, 20×20, 1.6 stroke — matches the thin gold
line icons in the design. Action row: 8px above the bubble's baseline, 16px gap
(reserved for the thumbs icons, see below).

## Notes / deviations

- **Thumbs up / down (feedback) are shown in the Figma but NOT implemented here.**
  They need a reply-feedback backend endpoint, and the V1 Must-Have scope is the
  save-to-Echo capability. The action row is laid out to accept them later.
- Reference render: Figma node `7811-2866` (screenshot attached to the PR).
