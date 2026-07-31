# Reflection Room V1 — UI Developer Handoff

**Audience:** Frontend / mobile developer building the Reflection Room screens.
**Purpose:** Everything you need to integrate with the backend without reading the full backend spec.
**Companion docs:** `01_BACKEND_IMPLEMENTATION_SPEC.md` for backend internals; the source-of-truth PDF is the dev handoff document `Reflection_Room_Logic_Weighting_Dev_Handoff_V1`.

---

## 1. The V1 Journey

```
Home
  ↓
Reflection Room Landing
  ↓ (user starts quiz)
Reflection Quiz (4 questions)
  ↓ POST /reflection/quiz
Motif Assignment screen (shows motif_id, room_skin, why_text)
  ↓
Reflection Room (loaded with motif ambience only — same room, themed)
  ↓ user taps "Start Echo Signature"
Echo Signature (top 3 loop cards from snapshot)
  ↓ user taps "Try a 2-min practice" on a card
Practice overlay (single recommendation from engine)
  ↓ user completes
Echo Signature returns refreshed
  ↓ user taps "Open Echo Map"
Echo Map (visualization of same snapshot)
  ↓ user taps "Continue to Mirror Moment"
Mirror Moment (3 dynamic buttons from top-3 loops)
  ↓ user taps a button
Practice overlay (same engine, scoped to selected loop+tone)
  ↓ user completes
Completion screen
  ↓
Back to Reflection Room (or Home, or View Updated Echo Map)
```

**Hard rules:**
- The room itself does **not** change layout per motif. Only ambience (glyph, color/light shift, optional sound, motif copy).
- Echo Signature is the first recommended action every time.
- All three of Signature, Map, and Mirror Moment read from the same `/echo/snapshot` payload. Don't fetch it multiple times in a single screen flow — cache it for the duration of the journey and re-fetch only after a `practice/complete`.

---

## 2. Endpoint Reference

Base URL: whatever the existing API base is (staging/prod). Auth: same Cognito JWT pattern as the rest of the app — **all five endpoints require authentication.** There is no anonymous flow for the Reflection Room. If a user is not authenticated when they hit the entry point, route them through the existing sign-in flow first.

**Session lifetime:** A session runs until next midnight in the user's IANA timezone. If the backend can't find a tz on the user record, it defaults to `America/New_York` (DST-aware Eastern). You can optionally pass `X-User-Timezone: <IANA name>` (e.g. `America/Los_Angeles`, `Asia/Tokyo`) on `POST /reflection/quiz` to override — useful if the device knows the timezone but the user record hasn't been updated. **Practical implication:** a session may flip from active to expired between any two requests if they straddle midnight in the user's tz. The backend handles this transparently; from the FE's perspective, the next quiz call after midnight just gets a new `session_id` back.

### 2.1 `POST /reflection/quiz`

Use this when the user finishes the 4-question quiz.

**Request:**
```json
{
  "answers": {
    "q1": "hopeful",
    "q2": "inspiration",
    "q3": "spiral",
    "q4": "insight"
  },
  "session_id": null,
  "user_override_tag": null
}
```

**Response 200:**
```json
{
  "session_id": "abc123",
  "motif": {
    "motif_id": "spiral",
    "motif_name": "Spiral",
    "icon": "🌀",
    "element": "Fire",
    "tone_tag": "Evolution / Integration",
    "why_text": "You're in a season of growth and integration — every loop brings you closer to wholeness.",
    "room_skin": "Spiral Room",
    "scores": {"evolution": 6, "illumination": 4, "clarity": 3},
    "explanation": ["Q3=spiral (×2 → evolution)", "Q4=insight (×1 → evolution)"],
    "override_allowed": true
  }
}
```

**`override_allowed`:** When `true`, the quiz produced a tie. Show the user the top contenders (the keys of `scores` with the max value) and let them pick. Resubmit with `user_override_tag` set.

**Override UX flow (FE specification):**

1. Backend returns `override_allowed: true`. The `scores` field has multiple entries with the same max value (e.g., `{"clarity": 5, "evolution": 5, "growth": 3}`).
2. FE identifies the tied tags (those with score = `max(scores.values())`).
3. FE renders a chooser UI: "Several paths feel equally true today. Which one calls you?"
4. The chooser displays the corresponding motif card (icon + name + tone_tag) for each tied tag. **Use the `tied_motifs` array** in the response — it's populated only when `override_allowed=true` and contains the full motif payload for each tied option. Render one card per entry.
5. User taps one. FE calls `POST /reflection/quiz` again with the same `answers` plus `user_override_tag` set to the chosen tag.
6. Backend validates the tag is in the tied set (else 409 `OVERRIDE_TAG_NOT_IN_TIE`), creates/updates the session row, returns the chosen motif with `override_allowed: false`.
7. FE proceeds to the Reflection Room with the chosen motif.

If the user dismisses the chooser without picking, fall back to the motif the API returned in step 1 (it's the deterministic alphabetical winner among the tied tags). Persist that as the session's motif by re-calling the endpoint with `user_override_tag` set to that default — or skip the resubmit and just use the original response. Either is V1-acceptable.

**Errors you'll see:**

| Status | Code | Meaning | UI handling |
|---|---|---|---|
| 400 | `INVALID_QUIZ_ANSWER` | Bad enum value | Re-render quiz; the offending field can't have come from your UI if it's wired right. Log it. |
| 409 | `OVERRIDE_TAG_NOT_IN_TIE` | User picked a tag that wasn't in the tied set | Show a toast: "That option isn't available here — pick from the highlighted tags." |
| 500 | `CONFIG_LOAD_ERROR` | Backend config broken | Show the room-load error screen. Retry. |

### 2.2 `GET /echo/snapshot?session_id=...`

Returns the active loop state. **The single source of truth** for Echo Signature, Echo Map, and Mirror Moment.

**Response 200:**
```json
{
  "session_id": "abc123",
  "motif_context": {
    "motif_id": "spiral",
    "room_skin": "Spiral Room"
  },
  "loops": [
    {
      "loop_id": "pressure",
      "tone_state": "rising",
      "intensity_score": 0.74,
      "intensity_label": "High",
      "last_seen": "2026-04-27T20:10:00Z",
      "recently_changed": false,
      "narrative_stage": null,
      "icon": "🔺",
      "reflection_line": "Pressure is climbing. You don't have to meet every demand at full force."
    },
    {
      "loop_id": "grief",
      "tone_state": "softening",
      "intensity_score": 0.58,
      "intensity_label": "Medium",
      "last_seen": "2026-04-27T18:45:00Z",
      "recently_changed": true,
      "narrative_stage": null,
      "icon": "🌿",
      "reflection_line": "Something in the grief is opening. Notice what feels lighter."
    }
  ],
  "updated_at": "2026-04-27T20:12:00Z"
}
```

**Important guarantees:**
- `loops` is **always sorted descending by `intensity_score`**. Don't re-sort.
- `loops` may be empty (`[]`). That's a 200 response, not an error. Render the empty state.
- `icon` and `reflection_line` are **always populated server-side**. You don't need a separate tone-library fetch.
- Only six `loop_id` values are possible: `pressure`, `overwhelm`, `grief`, `self_silencing`, `agency`, `transition`. Don't render anything else even if it slips through.

**Tone state values:** `rising`, `steady`, `softening`. Only these three.

**Intensity label values:** `High`, `Medium`, `Low`. Only these three.

### 2.3 `POST /echo/recommend-practice`

Call this when the user taps "Try a 2-min practice" on an Echo Signature card or a Mirror Moment button.

**Request:**
```json
{
  "session_id": "abc123",
  "selected_loop": "pressure",
  "surface": "echo_signature"
}
```

`surface` values: `echo_signature`, `mirror_moment`, `chat`. Used for telemetry — set it correctly so we can analyze where users actually engage.

`selected_loop` is required when the user picked a specific loop (Signature card tap, Mirror Moment button tap). Pass `null` only if you want the engine to pick from the top of the snapshot — V1 surfaces always pick a loop, so this should generally be set.

**Response 200:**
```json
{
  "pattern": {
    "loop_id": "pressure",
    "strength": 0.74,
    "trend": "rising",
    "last_seen": "2026-04-27T20:10:00Z"
  },
  "practice": {
    "id": "breath_4_6",
    "title": "Try a 2-min reset",
    "type": "breath",
    "duration_sec": 90,
    "steps": ["Inhale for 4", "Exhale for 6", "Repeat three times"]
  },
  "rule_id": "pressure_loop_v1"
}
```

Render the practice overlay using `title` + `steps`. Show a timer for `duration_sec` if the type calls for one (breath/somatic typically yes; cognitive/reflection optional).

**Hold on to `rule_id` and `practice.id`** — you'll need both for `POST /practice/complete`.

**Errors:**

| Status | Code | Meaning | UI handling |
|---|---|---|---|
| 400 | `LOOP_NOT_SUPPORTED` | Bad `selected_loop` | Bug — log it. |
| 404 | `NO_ACTIVE_LOOPS` | Snapshot empty | Don't show practice CTA in this case in the first place. |
| 409 | `FALLBACK_ON_COOLDOWN` | Even the fallback practice is on cooldown — user has practiced a lot today | Read `Retry-After` header (seconds). Show: "You've already practiced a lot today — come back in {x} hours, or try again tomorrow." |

**About the fallback:** V1 has `fallback_enabled = true` configured. When a Mirror Moment button is tapped for a (loop, tone) combination with no specific rule (e.g., "Face Grief", "Soften Pressure"), the backend returns a generic centering practice (`breath_4_6`, or `name_and_need` for users with `no_breathwork=true`) instead of a 404. The `rule_id` field will be `"fallback"` in that case — useful for analytics, no special FE handling needed. The practice is rendered the same way as a rule-matched one.

You should **not** see `NO_RULE_MATCHED` (404) or `ALL_CANDIDATES_FILTERED` (409) under the V1 default settings. If you do, it means `fallback_enabled` was disabled in config — log and report.

### 2.4 `POST /practice/complete`

Call this when the user finishes the practice overlay. Always call it, even if they don't vote helpfulness.

**Request:**
```json
{
  "session_id": "abc123",
  "loop_id": "pressure",
  "tone_state": "rising",
  "practice_id": "breath_4_6",
  "rule_id": "pressure_loop_v1",
  "helpful": true
}
```

`helpful`: `true` / `false` / `null`. If the user dismisses the helpfulness prompt, send `null`. Don't make them vote.

**Response 200:**
```json
{
  "completion_id": "2026-04-27T20:14:00Z#uuid",
  "snapshot": { /* freshly recomputed — same shape as GET /echo/snapshot */ }
}
```

**Use the inline `snapshot`** to update Signature, Map, and Mirror Moment views — no need for a second `GET /echo/snapshot` call.

If you want to update the helpful flag later (e.g., user votes after the overlay closes), use the optional `PATCH /practice/complete/{completion_id}/helpful` endpoint:

```json
{ "helpful": false }
```

### 2.5 `PUT /me/reflection/room`

Optional — only needed if you build the room-skin override UI (likely a settings affordance, not in the V1 critical path).

**Request:**
```json
{
  "motif_id": "mirror",
  "apply_to": "session"
}
```

`apply_to`: `"session"` overrides only the current session; `"core_room"` updates the user's persistent default.

Returns the same shape as `POST /reflection/quiz`.

---

## 3. UI States — every screen needs all three

| Surface | Loading | Empty | Error |
|---|---|---|---|
| Reflection Room shell | Skeleton with motif glyph placeholder | (n/a — always loads after quiz) | "We couldn't load your Reflection Room right now." Buttons: Try Again / Back Home. |
| Echo Signature | Card skeletons (3) | "All quiet for now." CTA: "Take a centering breath." | "We couldn't load your Echo Signature right now." Buttons: Try Again / Back to Reflection Room. |
| Echo Map | Loading shimmer over the field | "No strong loops active." Body: same gentle copy as Signature empty. | "Failed to load map." Buttons: Try Again / Back to Reflection Room. |
| Practice overlay | Spinner inside overlay | (n/a — only opens on a successful recommend response) | "Couldn't start that practice." Buttons: Try Again / Close. |
| Mirror Moment | Button skeletons (3) | "Nothing pressing right now — that's its own kind of moment." | "Couldn't load your Mirror Moment." Try Again / Back. |

Required bottom actions on Signature: `Back to Reflection Room`, `Open Echo Map`.
Required controls on Map: `Update My Mirror ↻`, `Tune Signature`, `Continue to Mirror Moment`.

---

## 4. Echo Signature — Card Specification

### 4.1 What's on a card front

Each card front displays exactly four data points. Data source: `/echo/snapshot`. No other fetch.

| Position | Value | Source field |
|---|---|---|
| Top-left | Loop icon | `loops[i].icon` |
| Top-right | Tone-state pill | `loops[i].tone_state` (display: capitalize) |
| Center | Loop name | display map below |
| Below center | Reflection line | `loops[i].reflection_line` |

**Loop display names (do not vary by tone):**

| `loop_id` | Display name |
|---|---|
| `pressure` | Pressure |
| `overwhelm` | Overwhelm |
| `grief` | Grief |
| `self_silencing` | Self-Silencing |
| `agency` | Agency |
| `transition` | Transition |

**Card count:** Top 3 loops by intensity_score. If snapshot has fewer than 3, render however many it has (don't pad).

### 4.2 Card back / practice overlay

Triggered by tap on "Try a 2-min practice" CTA.

1. Call `POST /echo/recommend-practice` with `selected_loop = loops[i].loop_id`, `surface = "echo_signature"`.
2. Display the returned `practice.title` + `practice.steps` in an overlay.
3. Optionally show a timer for `duration_sec`.
4. On user "Done": call `POST /practice/complete` with the data from §2.4.
5. After 200 response: close overlay, refresh Signature view from the inline `snapshot`.
6. Optionally show helpful/not-helpful prompt; on vote, either include `helpful` in the original POST or `PATCH` after.

### 4.3 What NOT to put on Echo Signature

- No Mirror Moment copy.
- No "Clarity" or "Flow" cards (not V1 loops).
- No instruction text on the front. Front is recognition. Action lives on the back / overlay.

---

## 5. Echo Map — Specification

The map renders the **same six loops** around YOU. It's a visualization of `/echo/snapshot`, not a different data model.

### 5.1 Visual mapping

| Field | Visual |
|---|---|
| `loop_id` | Position (each loop has a fixed angular slot — agree on positions with design) and label |
| `tone_state` | Color: `rising` = amber, `softening` = aqua, `steady` = lavender |
| `intensity_score` | Distance from center. Higher score = closer to YOU. |
| `intensity_label` | Used in screen-reader text and tap overlay |

### 5.2 Motion

10-second breath/orbit cycle. Stronger loops can pulse more. **Must respect `reduced_motion`** — fall back to static positions and a single soft pulse if the user has the flag set.

### 5.3 Top copy and footer

- Top: "See what's repeating, and what's ready to change."
- Footer: "Map ≠ you — it's a mirror for awareness."

### 5.4 Tap overlay structure

When a user taps a loop on the map, show an overlay with exactly four lines:

```
Line 1: <Loop Display Name>
Line 2: <tone_state>
Line 3: <reflection_line>
Line 4: Intensity: <intensity_label>
```

All values come from the same loop object in the snapshot. **Use one reusable overlay component** — same one used by Echo Signature card-back where applicable. Do not build per-loop custom overlays.

### 5.5 Accessibility

Screen reader for each loop: `"<Loop name> <tone_state>, intensity <intensity_label>."` Example: `"Grief softening, intensity medium."`

---

## 6. Mirror Moment — Dynamic Buttons

**This is the part that goes wrong most often. Read carefully.**

### 6.1 Selection logic (run client-side from snapshot)

1. Take the **same `/echo/snapshot`** payload you've been using.
2. Sort by `intensity_score` desc (already sorted by API, but defensive).
3. Take the top 3 loops.
4. For each, generate a button label using the matrix in §6.2.
5. On button tap, call `POST /echo/recommend-practice` with that loop and `surface = "mirror_moment"`.

If the snapshot has fewer than 3 loops, render fewer buttons. If empty, render the empty state.

### 6.2 Button label matrix (mandatory)

| Loop | `rising` label | `steady` label | `softening` label |
|---|---|---|---|
| Overwhelm | Ease Overwhelm | Reclaim Calm | Soften Overwhelm |
| Pressure | Ease Pressure | Reclaim Balance | Soften Pressure |
| Grief | Face Grief | Reclaim Presence | Soften Grief |
| Self-Silencing | Speak Up | Reclaim Voice | Soften Silence |
| Agency | Ignite Agency | Reclaim Agency | Rest in Agency |
| Transition | Enter Transition | Reclaim Clarity | Soften Change |

**Hard prohibitions:**
- No static buttons like `Agency`, `Flow`, `Crossing`, `Generic`.
- No buttons that match (loop, tone) pairs not in this matrix.
- Buttons MUST be regenerated each session from the snapshot. Never cache them across sessions.

Implement as a small pure function: `labelFor(loopId, toneState) → string`. Unit-test it.

### 6.3 Mirror Moment screen copy

| Element | Copy |
|---|---|
| Header | MIRROR MOMENT |
| Supporting copy | Choose one small shift for what's active right now. |
| After completion (primary line) | Nice. You noticed it. You shifted it. |
| After completion (secondary line) | The more you notice, the easier it gets to choose differently. |
| Buttons after completion | Back to Reflection Room • Back Home • (optional) View Updated Echo Map |

---

## 7. Privacy / Accessibility / Motion

### 7.1 User flags (read from user prefs endpoint when available)

- `no_breathwork`: Backend already filters breath practices out of recommendations when this is true. **You don't need to filter** — but you may want to surface a "no breath" indicator in settings UI.
- `reduced_motion`: Reduce motion across Map orbit, card transitions, and any pulse animations. Fall back to text-only or haptics for practice timers.
- `private_mode`: Blur sensitive practice content on practice overlays until the user taps "Reveal." Implement as an obscured layer with a tap-to-reveal CTA. Emit `private_mode_reveal` telemetry on reveal.

### 7.2 Reusable components (one each)

- One Echo Signature card component
- One micro-practice overlay component
- One Mirror Moment button component
- One map overlay component (reused on Signature taps too where pattern fits)

This is a non-negotiable from the source PDF. No per-loop or per-motif custom components.

### 7.3 Accessibility minimums

- WCAG AA contrast for all text and tone pills.
- Logical focus order: top → bottom, left → right.
- Alt text / accessible labels for every icon and every map loop.
- Dynamic Type respected (iOS) / font scale respected (Android/web).

---

## 8. Telemetry events you fire (optional client beacons)

Backend fires most events server-side. Two are best fired from the client because they don't otherwise reach the server:

| Event | When | Body |
|---|---|---|
| `practice_expand` | User taps "Try a 2-min practice" — *before* recommend call returns | `{ loop_id, surface }` |
| `nudge_opened` | User opens a push/email nudge that lands on a Reflection Room screen | `{ nudge_type }` |
| `echo_map_refresh` | User taps "Update My Mirror" | `{}` |

If you don't have a telemetry SDK in place yet, POST these to a tiny `/telemetry/event` endpoint (backend can stub it for V1). Coordinate with backend on the shape.

**Never include** raw text fields, free-form notes, or anything PII-like in telemetry. IDs and enums only.

---

## 9. State management recommendation (mobile / web)

Cache the snapshot at the top of the journey (after `/reflection/quiz` or on first room entry). Pass it down through Signature, Map, and Mirror Moment. Re-fetch only:

- After `POST /practice/complete` (and use the inline `snapshot` it returns — no extra round trip).
- When the user taps "Update My Mirror" on the Map (`echo_map_refresh` telemetry + new `GET /echo/snapshot`).

This keeps the three views in sync without race conditions.

---

## 10. Edge cases & traps

| Situation | Handling |
|---|---|
| `loops=[]` on snapshot | Render empty state on every dependent screen. CTA: "Take a centering breath." Don't surface practice CTAs. |
| User has `no_breathwork=true` and ends up in a practice flow | Backend filtered; you'll get a non-breath recommendation. If somehow `type=breath` comes through anyway, log a bug — don't silently render. |
| Practice timer completes but user closes app before voting | Send `helpful=null` on the next app launch via background queue, OR accept that the vote is lost. Both are V1-acceptable. |
| Quiz returns `override_allowed=true` but user dismisses the override UI | Default to the deterministic-alphabetical winner the API gave you. Persist that as the session's motif. |
| `Retry-After` returned on recommend | Respect it. Show a non-blocking explanation, don't retry automatically. |
| Network error mid-quiz | Don't lose answers. Retry the submit. Persist answers locally until 200. |
| User isn't authenticated when they tap "Start Reflection" | Route through the existing sign-in flow before hitting `POST /reflection/quiz`. The Reflection Room flow has no anonymous mode. |

---

## 11. Sanity Checklist Before Submitting Your PR

- [ ] All five backend endpoints called from the right surfaces.
- [ ] Mirror Moment buttons generated dynamically — grep your code for hardcoded strings like "Ease Pressure" and confirm they're in the matrix function only.
- [ ] No "clarity," "flow," or "crossing" appear as a `loop_id` anywhere in client code.
- [ ] `reduced_motion`, `no_breathwork`, `private_mode` honored.
- [ ] All 5 surfaces have loading + empty + error states wired.
- [ ] Snapshot cached for the journey; refreshed only after `practice/complete` or `echo_map_refresh`.
- [ ] Reusable components: one each for card, overlay, button, map overlay.
- [ ] Telemetry beacons firing with IDs only.
- [ ] Accessibility passes: VoiceOver / TalkBack reads each surface coherently.

---

## 12. Figma-Confirmed Copy (canonical)

This section consolidates every UI string confirmed against the production Figma design "Design-Master-File" on 2026-05-03. For the full per-screen breakdown with node IDs, see `08_FIGMA_ALIGNMENT_DELTA.md`. Anything in this section is **canonical** — match it exactly, including punctuation and the emdash characters.

### 12.1 First-time Welcome (3 onboarding overlays — node `4654-3338`)

**Overlay 1**
- Eyebrow: `WELCOME TO REFLECTION ROOM`
- Headline: `Catch the Pattern.`
- Body: `Notice the feeling. See it repeat. Watch it shift.`
- Tagline: `Change starts here.`

**Overlay 2**
- Eyebrow: `ONE SMALL STEP, EVERY DAY`
- Headline: `Your emotional snapshot — right now.`
- Body: `Your pattern, in real time. What's rising. What's steady. One small step to shift it.`
- Tagline: `See it. Shift it.`

**Overlay 3**
- Eyebrow: `SEE YOUR PATTERNS CLEARLY`
- Headline: `Your Echo Map shows what's strongest — and what's ready to shift.`
- Body: `Your Echo Map shows what's strongest, what's softening, and what keeps repeating. Your Mirror Moment gives you one small action to shift it.`
- Tagline: `You can't change what you can't see.`

### 12.2 Reflection Room landing (node `4791-2304`)

- Eyebrow: `REFLECTION ROOM`
- Subhead: `See it. Choose what comes next.`
- Body under motif glyph: `Tap on motif to view your current Echo Signature.`
- Fail state header: `RESULTS NOT AVAILABLE`
- Fail state body: `We couldn't load your reflection room right now.`

### 12.3 Quiz entry (node `4654-3272`)

- Eyebrow: `REFLECTION ROOM`
- Body: `Where awareness turns into real change. Small moments. Real change. Over time. A quick reflection helps you access the space you need right now.`
- Audio toggle label: `Ambient Sounds`

### 12.4 Quiz prompts (CANONICAL — match exactly)

- Q1: `How are you arriving today?`
- Q2: `What intention would you like to bring into your Reflection Room today?`
- Q3: `Which of these speaks to you the most today?`
- Q4: `What kind of message would help right now?`

**Footer microcopy (per question):**
- Under Q1, Q2, Q4: `Choose the word that resonates. There's no right answer.`
- Under Q3 (icon options, not words): `Choose the option that resonates. There's no right answer.`

### 12.5 Quiz tuning state (after submit, before motif)

- Eyebrow: `YOUR REFLECTION IS TUNING...`
- Status: `Your reflection is taking shape.`
- Body: `You'll enter your Reflection Room in a moment. This is where the Mirror begins to understand your patterns more clearly.`

### 12.6 Today's Motif reveal

- Eyebrow: `TODAY'S MOTIF`
- Motif name shown UPPERCASE (e.g., `SPIRAL`)
- Why-text shown directly below (e.g., `You're growing. Even if it feels like you've been here before.`)

### 12.7 Quiz error state

- Header: `RESULTS NOT AVAILABLE`
- Body: `We weren't able to shape your results this time. Let's try again to uncover your patterns.`

### 12.8 Echo Signature (node `4654-3274`)

- Eyebrow: `ECHO SIGNATURE`
- Subhead: `Recognize and implement any changes in your life.`
- Card structure: NAME (uppercase) on line 1, `- ` + Tone (capitalized) on line 2, reflection line on line 3.
- Tone display rule: prepend `- ` to the backend's `tone_state` value. Backend returns `"rising"` → FE renders `- Rising`.

**State strings:**
- Loading: `YOUR ECHO SIGNATURE IS LOADING...` / `Your reflection is taking shape.`
- Empty (no loops above intensity threshold): `NO LOOPS FOUND` / `All quiet for now.`
- Error: `RESULTS NOT AVAILABLE` / `We couldn't load your Echo Signature right now.`

### 12.9 Echo Map (node `4654-2881`)

- Eyebrow: `ECHO MAP`
- Subhead: `See what's repeating, and what's ready to change.`
- Footer (fixed string, not dynamic): `This is a mirror, not a label.`

**Per-loop tap overlay structure (5 elements):**

```
Loop name              ← Title-case display label
Tone state             ← "Rising" / "Steady" / "Softening" (no "- " prefix in this overlay)
Reflection line        ← from echo_signature_tone_library
INTENSITY label        ← "HIGH INTENSITY" / "MEDIUM INTENSITY" / "LOW INTENSITY"
"click anywhere to continue"  ← fixed footer
```

**Info overlay 1** ("i" icon, top-right) — `WHAT IS THE ECHO MAP?`
> The Echo Map shows how your inner patterns move over time — stress, clarity, grief, confidence, pressure. The closer a pattern is to you, the more it's influencing your mood, energy, and decisions right now. As it softens, it moves outward. This isn't a score. It's awareness — made visible.
>
> Footer: *If you can see the pattern, you can change it. If you can't, it quietly runs the show.*

**Info overlay 2** — `HOW TO READ YOUR ECHO MAP`
> Distance = influence
>
> Near YOU: Actively shaping how you feel, think, or react right now.
> Middle orbit: Still present, but no longer in control.
> Outer orbit: Easing. Less pull. Integration happening.
>
> Footer: *Patterns move as you do. Small shifts add up. This map isn't you — it reflects what you're working through.*

**State strings:**
- Loading: `YOUR ECHO MAP IS LOADING...`
- Error: `RESULTS NOT AVAILABLE` / `We couldn't load your Echo Map right now.`

### 12.10 Mirror Moment (node `4654-3335`)

- Eyebrow: `MIRROR MOMENT`
- Subhead: `Choose one small shift.`
- Back nav label: `My Reflection Room`
- Practice screen header: `TWO MINUTE PRACTICE`

**Info overlay 1** — `WHAT IS A MIRROR MOMENT?`
> A Mirror Moment is a 2-minute reset that turns awareness into action. After you see your patterns, this is where you shift them. You'll use breath, focus, and simple prompts to interrupt stress, emotion, or autopilot — and respond with intention instead of reacting. Small moments like this are what create real change.

**Info overlay 2** — `WHEN SHOULD I USE IT?`
> When you feel overwhelmed or emotionally tight
> Before a hard conversation
> When your thoughts are spiraling
> When you want to reset without overthinking

**Info overlay 3** — `WHAT HAPPENS AFTER?`
> Each Mirror Moment gently updates your Reflection Room — helping you see what's shifting over time, not just how you feel right now.

**State strings:**
- Loading: `YOUR MIRROR MOMENT IS LOADING...` / `Please wait.`
- Practice complete: `PRACTICE COMPLETE` / `Nice. You noticed it. You shifted it. The more you notice, the easier it gets to choose differently.`
- Practice fail: `PRACTICE UNAVAILABLE` / `We weren't able to finish your practice. Would you like to try again?`
- Error: `RESULTS NOT AVAILABLE` / `We couldn't load your Mirror Moment right now.`

### 12.11 Display-label mapping (apply when rendering backend IDs)

**Loops** (backend `loop_id` → display label):

| `loop_id` | Display label | Echo Signature card label (uppercase) |
|---|---|---|
| `pressure` | Pressure | PRESSURE |
| `overwhelm` | Overwhelm | OVERWHELM |
| `grief` | Grief | GRIEF |
| `self_silencing` | Self-silencing | SELF-SILENCING |
| `agency` | Agency | AGENCY |
| `transition` | Transition | TRANSITION |

> Figma renders `self_silencing` as `Self- silencing` (with a space after the hyphen). The standard rendering is `Self-silencing` (no space). Confirm with design before shipping; default to `Self-silencing`.

**Motifs** (backend `motif_id` → display label):

| `motif_id` | Display label | TODAY'S MOTIF screen (uppercase) |
|---|---|---|
| `compass` | Compass | COMPASS |
| `mirror` | Mirror | MIRROR |
| `blocks` | Blocks | BLOCKS |
| `spiral` | Spiral | SPIRAL |
| `feather` | Feather | FEATHER |
| `radiant_burst` | Radiant Burst | RADIANT BURST |
| `waves` | Waves | WAVES |
| `pyramid` | Pyramid | PYRAMID |
| `water_drop` | Water Drop | WATER DROP |
| `brick_stack` | Brick Stack | BRICK STACK |
| `sprout` | Sprout | SPROUT |

**Tone states** (backend `tone_state` → display label, with `- ` prefix on Echo Signature cards only):

| `tone_state` | Echo Signature card label | Echo Map overlay label |
|---|---|---|
| `rising` | `- Rising` | `Rising` |
| `steady` | `- Steady` | `Steady` |
| `softening` | `- Softening` | `Softening` |

**Intensity labels** (derived from `intensity` numeric on snapshot):

| Numeric range | Label |
|---|---|
| `>= 0.66` | `HIGH INTENSITY` |
| `>= 0.33` and `< 0.66` | `MEDIUM INTENSITY` |
| `< 0.33` | `LOW INTENSITY` |

> Thresholds are configurable on the backend (`intensity_label_mapper.py`); FE should rely on the backend's `intensity_label` field if/when it ships rather than recomputing client-side.

