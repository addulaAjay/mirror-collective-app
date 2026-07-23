# Visual QA — Echo Lock Date "sends immediately" disclaimer

**Figma:** Dev-Master-File → node `7820-2208` ("CHOOSE YOUR RECIPIENT")
**Screen:** `src/screens/echoVault/ChooseRecipientScreen.tsx`

## Problem

When creating an echo, leaving the Lock Date empty makes the backend deliver
the echo **immediately** (the auto-release rule: recipient set + no lock date →
send now, enforced in `CreateEchoScreen.tsx` and mirrored server-side). Nothing
in the UI told the user this, so an unset lock date could send a draft the user
still considered a work-in-progress.

## Change (matches node 7820-2208)

- Added an italic-gold caption directly under the Lock Date field:
  **"(echo is sent immediately if lock date is not set)"**.
- Simplified the field label from "Lock Date (only if required)" to **"Lock Date"**
  — the new caption now carries the optionality/behaviour, matching the design.

No behavioural change — this is disclosure of existing behaviour at the point of
decision (the single screen where the lock date is chosen for both the wizard
and the unified compose flow).

## Tokens

| Property | Value | Source |
|---|---|---|
| Caption font | `fontFamily.bodyItalic` (Inter Italic) | Figma `Body XS Italic` |
| Caption size / line-height | `fontSize.xs` 14 / `lineHeight.s` 20 | Figma `font/size/XS`, `font/line-height/S` |
| Caption color | `palette.gold.DEFAULT` #f2e2b1 | Figma `Text/Paragraph-1` #f2e1b0 |

No token gaps.

## Notes

- The deeper "let the user review/confirm the final version" concern is broader
  than this microcopy; the design (7820-2208) scopes the fix to disclosure. A
  dedicated confirm/review step before an immediate send would be a separate
  change if desired.
- Reference render: Figma node `7820-2208` (screenshot attached to the PR).
