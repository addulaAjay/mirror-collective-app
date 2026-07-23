# Visual QA — MirrorGPT Typing Indicator ("MirrorGPT Processing")

**Figma:** Dev-Master-File → node `7811-2866` (`?node-id=7811-2866`)
**Component:** `src/components/ui/TypingIndicator/TypingIndicator.tsx`
**Used by:** `src/screens/MirrorChatScreen.tsx` (rendered while `loading` is true)

## Summary

The design ("MirrorGPT Processing") is the chat screen while a reply is being
generated. The only delta vs. the normal chat screen is the **`· · ·` typing
bubble** that appears left-aligned above the input, in place of the previous
centered `…thinking…` text (`LoadingIndicator`).

`TypingIndicator` renders that bubble and **animates** the three dots: each dot
pulses opacity `0.3 → 1 → 0.3` (with a subtle `0.8 → 1` scale), staggered by
160ms so the row shimmers left-to-right in a continuous loop. The loop is built
from recursive `Animated.timing().start()` calls (native driver) rather than
`Animated.loop`, which keeps it driving cleanly under the hand-rolled RN test
mock. The OS **"reduce motion"** setting is honoured — when enabled the dots
render static at 0.7 opacity instead of animating.

## Tokens

The bubble mirrors `MessageBubble`'s assistant `systemBubble` so it reads as an
incoming message, matching the design:

| Property | Value | Source |
|---|---|---|
| Corner radius | `radius.s` = 12 | Figma `Radius/S` = 12 |
| Border | 1px `rgba(155,170,194,0.5)` | matches `systemBubble` (Figma `Border/Subtle` #a3b3cc family) |
| Background | `rgba(253,253,249,0.05)` | matches `systemBubble` |
| Dot color | `palette.gold.DEFAULT` #f2e2b1 | Figma `Text/Paragraph-1` #f2e1b0 |
| Shadow | `shadows.MEDIUM` | matches `systemBubble` |

**Token gaps:** the dot geometry (6px circle, 6px gap) and the animation
timing (500ms pulse, 160ms stagger, 0.3 min opacity) are not Figma variables —
they're implementation values for a functional micro-animation the static design
can't encode.

## Notes / deviations

- Replaces the old centered `LoadingIndicator` ("…thinking…") in the chat. The
  `LoadingIndicator` component itself is left in place (still exported) as a
  generic utility; it is no longer used by the chat screen.
- Reference render: Figma node `7811-2866` (screenshot attached to the PR).
