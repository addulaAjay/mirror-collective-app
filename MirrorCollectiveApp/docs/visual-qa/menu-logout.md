# Visual QA — Navigation menu "Logout"

**Figma:** Dev-Master-File → node `2336-3446` (slide-in navigation menu)
**Files:** `src/screens/NavigationMenuScreen.tsx` (menu), `src/components/LogoHeader.tsx` (wiring)

## Problem

There was no way for a signed-in user to manually log out. `signOut()` existed
in `SessionContext` (and fired automatically on session expiry) but was never
surfaced in the UI. The design adds a **Logout** row at the bottom of the
slide-in menu.

## Change (matches node 2336-3446)

- Added a **Logout** row (label + Material "exit" icon in gold) as the last item
  in the menu's secondary list, styled to match the other menu items
  (Cormorant 24/28, `palette.gold.subtlest`; icon `palette.gold.warm`).
- `MirrorSideMenu` gained an `onLogout` prop; `LogoHeader` wires it to
  `useSession().signOut()`, guarded by a confirmation alert
  ("Log out — Are you sure?") so an accidental tap doesn't drop the session.
  On confirm, the drawer closes and `signOut()` clears tokens + dispatches
  `LOGOUT_SUCCESS`, which returns the user to the auth stack.

## Tokens

| Element | Value | Source |
|---|---|---|
| Label | Cormorant Regular 24/28, `palette.gold.subtlest` #fdfdf9 | reuses `primaryText` (Figma Text/Paragraph-2) |
| Icon | Material logout glyph, `palette.gold.warm` | matches menu icon tint |
| Row padding | 12px all sides | matches `secondaryItem` |

No token gaps.

## Notes / deviations

- The design also shows **Home** (top of the primary list) and **Subscription**
  (in the secondary list). Those are **not** part of this change: the menu
  intentionally omits Home (there's a Home affordance in the header), and
  `Subscription` has no destination route yet (it's commented out in
  `SECONDARY_ITEMS`). Scoped this change to the reported gap — the missing
  Logout. Adding Home / Subscription can be a follow-up if desired.
- Reference render: Figma node `2336-3446` (screenshot attached to the PR).
