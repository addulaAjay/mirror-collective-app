# Figma Production Design — Copy Alignment with V1 Spec

> **Purpose.** Reconcile the eight V1 spec docs against the production design in Figma "Design-Master-File". Where Figma has canonical UI copy, the spec and UI handoff are updated to match. Where Figma reveals product details the PDF left as TBD (e.g., Mirror Moment practice content), those gaps get closed.
>
> **What this doc is *not*.** This is not the V2 user story node `1810-2276` analysis — that node was reviewed on 2026-05-03 and rejected as authoritative. The original V2 analysis is preserved at the bottom of this document for traceability.

---

## 1. Production design nodes pulled (2026-05-03)

| Node | Section | What it covers |
|---|---|---|
| `4654-3338` | "Welcome to RR" | 3 first-time onboarding overlays |
| `4654-3272` | "Reflection Room quiz" | Entry, 4 quiz questions, tuning screen, today's motif, error state |
| `4654-3274` | "Echo Signature" | Header, 3 loop cards, error/empty/loading states |
| `4654-2881` | "Echo Map" | Header, info overlays (×2), per-loop tap overlays (×3), error/loading states, all 6 loop nodes |
| `4654-3335` | "Mirror Moment" | Header, info overlays (×3), **practice content for Pressure / Overwhelm / Grief**, complete/fail/loading/error states |
| `4791-2304` | "Homescreen → RR CTA" | Reflection Room entry tile + fail state |
| `261-1245` | "Reflection MOTIFS for the day" | 11 motif visualizations (full set) |

All copy strings below are quoted directly from Figma's text node contents.

---

## 2. Welcome / Onboarding (node `4654-3338`)

Three full-screen overlays shown to first-time users before they enter the quiz. Sequential, swipeable.

### Overlay 1 — Welcome
- Eyebrow: `WELCOME TO REFLECTION ROOM`
- Headline: `Catch the Pattern.`
- Body: `Notice the feeling. See it repeat. Watch it shift.`
- Tagline: `Change starts here.`

### Overlay 2 — Daily snapshot
- Eyebrow: `ONE SMALL STEP, EVERY DAY`
- Headline: `Your emotional snapshot — right now.`
- Body: `Your pattern, in real time. What's rising. What's steady. One small step to shift it.`
- Tagline: `See it. Shift it.`

### Overlay 3 — Patterns
- Eyebrow: `SEE YOUR PATTERNS CLEARLY`
- Headline: `Your Echo Map shows what's strongest — and what's ready to shift.`
- Body: `Your Echo Map shows what's strongest, what's softening, and what keeps repeating. Your Mirror Moment gives you one small action to shift it.`
- Tagline: `You can't change what you can't see.`

**Spec impact:** none. These are FE-only first-run strings. Add to UI handoff.

---

## 3. Reflection Room Entry + Quiz (node `4654-3272`)

### 3.1 Entry / Landing block
- Eyebrow: `REFLECTION ROOM`
- Body: `Where awareness turns into real change. Small moments. Real change. Over time. A quick reflection helps you access the space you need right now.`
- Element label: `Ambient Sounds` (toggle)

### 3.2 Quiz prompts (CANONICAL — spec must match)

| # | Figma prompt | Current spec prompt | Action |
|---|---|---|---|
| Q1 | `How are you arriving today?` | `How are you arriving today?` | ✅ Match |
| Q2 | `What intention would you like to bring into your Reflection Room today?` | `What intention are you bringing?` | 🔴 **Update spec** |
| Q3 | `Which of these speaks to you the most today?` | `Which symbol speaks to you?` | 🔴 **Update spec** |
| Q4 | `What kind of message would help right now?` | `What kind of message would help right now?` | ✅ Match |

### 3.3 Quiz footer microcopy

- Q1, Q2, Q4 footer: `Choose the word that resonates. There's no right answer.`
- Q3 footer: `Choose the option that resonates. There's no right answer.` (Q3 has icon options, not words — note the wording difference)

### 3.4 Tuning / loading state

- Eyebrow: `YOUR REFLECTION IS TUNING...`
- Status: `Your reflection is taking shape.`
- Body: `You'll enter your Reflection Room in a moment. This is where the Mirror begins to understand your patterns more clearly.`

### 3.5 Today's Motif reveal

- Eyebrow: `TODAY'S MOTIF`
- Motif name (example shown): `SPIRAL` — uppercase
- Why-text (example shown): `You're growing. Even if it feels like you've been here before.`

**Spec impact:** Q3 spec text uses snake_case `radiant_burst`, `water_drop`, `brick_stack`. Figma displays them as Title Case with spaces (`Radiant Burst`, `Water Drop`, `Brick Stack`). FE needs a display-label mapping — see §8.

### 3.6 Error state

- Eyebrow: `RESULTS NOT AVAILABLE`
- Body: `We weren't able to shape your results this time. Let's try again to uncover your patterns.`
- (Retry button — "Component 5" — label not in metadata; standard primary button)

---

## 4. Echo Signature (node `4654-3274`)

### 4.1 Header
- Eyebrow: `ECHO SIGNATURE`
- Subhead: `Recognize and implement any changes in your life.`

### 4.2 Loop cards (3 cards — top 3 active loops)

Card structure confirmed: NAME (uppercase) / `- ` + tone state / reflection line.

Cards shown in design:

| # | Loop label | Tone state | Reflection line |
|---|---|---|---|
| 1 | `OVERWHELM` | `- Rising` | `Everything feels like too much at once—start with one breath.` |
| 2 | `PRESSURE` | `- Steady` | `Pressure builds where your care runs deepest.` |
| 3 | `GRIEF` | `- Softening` | `Something heavy is beginning to ease.` |

**Important formatting note:** the tone state is rendered with a prefix `- ` (hyphen + space), e.g., `- Rising`, not just `Rising`. Spec returns the tone as a bare string `"rising" | "steady" | "softening"`; FE prepends `- ` for display.

### 4.3 States
- Loading: `YOUR ECHO SIGNATURE IS LOADING...` / `Your reflection is taking shape.`
- Empty (no loops at intensity ≥ threshold): `NO LOOPS FOUND` / `All quiet for now.`
- Error: `RESULTS NOT AVAILABLE` / `We couldn't load your Echo Signature right now.`

**Spec impact:** confirms PDF V1 interpretation that Echo Signature shows top-3 *loops* (each with a single reflection line), not 3 micro-practice cards. This resolves the V2 ambiguity in the rejected node `1810-2276`.

---

## 5. Echo Map (node `4654-2881`)

### 5.1 Header + footer
- Eyebrow: `ECHO MAP`
- Subhead: `See what's repeating, and what's ready to change.`
- Footer line: `This is a mirror, not a label.`

### 5.2 Loop nodes shown on the map

Full set: Pressure, Overwhelm, Grief, **Self- silencing** (note the hyphen-space rendering), Agency, Transition. ✅ Matches the 6 V1 loops in the spec exactly.

**Display-label rule:** Figma displays the `self_silencing` loop as `Self- silencing` (with a hyphen and space). FE display label mapping should produce `Self-silencing` (single hyphen, no space) which is the more standard rendering — confirm with design before shipping.

### 5.3 Info overlay 1 — "What is the Echo Map?"
- Header: `WHAT IS THE ECHO MAP?`
- Body: `The Echo Map shows how your inner patterns move over time — stress, clarity, grief, confidence, pressure. The closer a pattern is to you, the more it's influencing your mood, energy, and decisions right now. As it softens, it moves outward. This isn't a score. It's awareness — made visible.`
- Footer: `If you can see the pattern, you can change it. If you can't, it quietly runs the show.`

### 5.4 Info overlay 2 — "How to read your Echo Map"
- Header: `HOW TO READ YOUR ECHO MAP`
- Subhead: `Distance = influence`
- Body: `Near YOU: Actively shaping how you feel, think, or react right now. Middle orbit: Still present, but no longer in control. Outer orbit: Easing. Less pull. Integration happening.`
- Footer: `Patterns move as you do. Small shifts add up. This map isn't you — it reflects what you're working through.`

### 5.5 Per-loop tap overlay — confirmed structure

When the user taps a loop node on the map, an overlay panel opens with:

```
[Loop Name]            ← e.g., "Pressure"
[Tone state]           ← e.g., "Steady"
[Reflection line]      ← the one-liner for that loop
[INTENSITY label]      ← e.g., "HIGH INTENSITY" / "MEDIUM INTENSITY" / "LOW INTENSITY"
"click anywhere to continue"
```

Three example overlays shown in design:

| Loop | Tone | Reflection | Intensity |
|---|---|---|---|
| Pressure | Steady | `You're pushing toward perfection again—breathe before the next move.` | HIGH INTENSITY |
| Grief | Softening | `Something heavy is finally beginning to ease.` | MEDIUM INTENSITY |
| Overwhelm | Rising | `Clarity comes when you take one small action.` | LOW INTENSITY |

**Important:** the overlay structure here is NOT temporal/comparative ("the pattern has changed" — which the rejected V2 node had asked for). It's the spec's existing structure: name + tone + reflection + intensity label. ✅ Spec UI handoff §5.4 already matches this — no changes needed.

### 5.6 States
- Loading: `YOUR ECHO MAP IS LOADING...`
- Error: `RESULTS NOT AVAILABLE` / `We couldn't load your Echo Map right now.`

---

## 6. Mirror Moment (node `4654-3335`) — major content unlock

### 6.1 Header + back nav
- Eyebrow: `MIRROR MOMENT`
- Subhead: `Choose one small shift.`
- Back button label: `My Reflection Room`

### 6.2 Info overlay 1 — "What is a Mirror Moment?"
- Header: `WHAT IS A MIRROR MOMENT?`
- Body: `A Mirror Moment is a 2-minute reset that turns awareness into action. After you see your patterns, this is where you shift them. You'll use breath, focus, and simple prompts to interrupt stress, emotion, or autopilot — and respond with intention instead of reacting. Small moments like this are what create real change.`

### 6.3 Info overlay 2 — "When should I use it?"
- Header: `WHEN SHOULD I USE IT?`
- Body (4 contexts):
  - `When you feel overwhelmed or emotionally tight`
  - `Before a hard conversation`
  - `When your thoughts are spiraling`
  - `When you want to reset without overthinking`

### 6.4 Info overlay 3 — "What happens after?"
- Header: `WHAT HAPPENS AFTER?`
- Body: `Each Mirror Moment gently updates your Reflection Room — helping you see what's shifting over time, not just how you feel right now.`

### 6.5 🟢 PRACTICE CONTENT — partially closes Tier 3 #17

The PDF V1 left micro-practice step content as TBD. Figma supplies real content for three loops:

| Practice slot | Title | Steps (verbatim from Figma) |
|---|---|---|
| `pressure_low` (4-6 breath) | `Ease Pressure` | `Inhale for 4. Exhale for 6. Repeat three more times.` |
| `overwhelm_low` (box breath) | `Ease Overwhelm` | `Inhale 4 -- Hold 4 Exhale 4 -- Hold 4 Repeat twice` |
| `grief_low` (somatic + affirmation) | `Soften Grief` | `Hand to heart. Inhale 4, exhale 6 ×3. Whisper: "I allow myself to soften."` |

All three are confirmed as **2-minute** practices via the on-screen `TWO MINUTE PRACTICE` framing.

**Spec impact:**
- `micro_practices.v1.yaml` can be populated for these three slots.
- The `breath_4_6` fallback default proposed earlier (Tier 1 Q4 resolution) is now confirmed as canonical practice content for Pressure.
- The `Ease Overwhelm` practice is **box breathing (4-4-4-4)**, not the same as the Pressure practice. Good signal that the practice library should not collapse all breath-style practices into one entry — they are distinct.

**Remaining content gaps (still Tier 3 #17):**
- Self-silencing × all tones (3 cells)
- Agency × all tones (3 cells)
- Transition × all tones (3 cells)
- Pressure rising/steady (2 cells)
- Overwhelm rising/steady (2 cells)
- Grief rising/steady (2 cells)

Goes from 18 cells unknown → 15 cells unknown. Updated count in `05_GAPS_AND_OPEN_QUESTIONS.md`.

### 6.6 Completion + failure + states

- Practice complete: `PRACTICE COMPLETE` / `Nice. You noticed it. You shifted it. The more you notice, the easier it gets to choose differently.`
- Practice fail: `PRACTICE UNAVAILABLE` / `We weren't able to finish your practice. Would you like to try again?`
- Loading: `YOUR MIRROR MOMENT IS LOADING...` / `Please wait.`
- Error: `RESULTS NOT AVAILABLE` / `We couldn't load your Mirror Moment right now.`

---

## 7. Homescreen — Reflection Room CTA (node `4791-2304`)

The entry tile shown on the app home that takes the user into the Reflection Room.

- Header: `REFLECTION ROOM`
- Subhead: `See it. Choose what comes next.`
- Body line under the motif glyph: `Tap on motif to view your current Echo Signature.`
- Two CTAs (component types `Component 5` and `Component 4` — primary + secondary). Labels not exposed in metadata; design should confirm. Common pattern based on the rest of the flow: primary "Begin Reflection" / secondary "Open Echo Map".

### Fail state
- Header: `RESULTS NOT AVAILABLE`
- Body: `We couldn't load your reflection room right now.`
- Retry button (Component 5)

**Spec impact:** none. Pure FE entry surface. Add to UI handoff §1 (journey diagram top step).

---

## 8. Motif Gallery (node `261-1245`) — full motif set confirmed

The "Reflection MOTIFS for the day" section contains a separate frame for each of the 11 V1 motifs, with a visual treatment for each. All 11 spec motifs are present:

| Spec ID (snake_case) | Figma display label | Frame ID |
|---|---|---|
| `compass` | Compass | `261:1135` |
| `mirror` | Mirror | `261:1099` |
| `blocks` | Blocks | `261:1025` |
| `spiral` | Spiral | `261:1183` |
| `feather` | Feather | `261:1228` |
| `radiant_burst` | Radiant Burst | `261:1063` |
| `waves` | Waves | `261:1160` |
| `pyramid` | Pyramid | `261:1117` |
| `water_drop` | Water Drop | `261:1046` |
| `brick_stack` | Brick Stack | `261:1199` |
| `sprout` | Sprout | `261:1082` |

✅ The spec's 11-motif vocabulary is fully covered by design. No motif additions or removals needed.

**Display-label mapping** (FE concern — add to UI handoff):

```
compass        → "Compass"
mirror         → "Mirror"
blocks         → "Blocks"
spiral         → "Spiral"
feather        → "Feather"
radiant_burst  → "Radiant Burst"
waves          → "Waves"
pyramid        → "Pyramid"
water_drop     → "Water Drop"
brick_stack    → "Brick Stack"
sprout         → "Sprout"
```

For uppercase contexts (e.g., the "TODAY'S MOTIF" reveal screen shows `SPIRAL`), the FE should uppercase the display label — backend should not return separately formatted strings.

---

## 9. Action items applied to the spec set

| # | Change | Doc | Severity |
|---|---|---|---|
| 1 | Q2 prompt: `What intention are you bringing?` → `What intention would you like to bring into your Reflection Room today?` | `01_BACKEND_IMPLEMENTATION_SPEC.md` §4.1 | 🔴 Applied |
| 2 | Q3 prompt: `Which symbol speaks to you?` → `Which of these speaks to you the most today?` | `01_BACKEND_IMPLEMENTATION_SPEC.md` §4.1 | 🔴 Applied |
| 3 | Add Figma-confirmed copy for Welcome onboarding, quiz states, Echo Signature, Echo Map, Mirror Moment | `03_UI_DEVELOPER_HANDOFF.md` (new §12 appendix) | 🟢 Applied |
| 4 | Add display-label mapping for 11 motifs and 6 loops | `03_UI_DEVELOPER_HANDOFF.md` (new §12 appendix) | 🟢 Applied |
| 5 | Populate `micro_practices.v1.yaml` for `pressure_low`, `overwhelm_low`, `grief_low` from Figma practice content | `01_BACKEND_IMPLEMENTATION_SPEC.md` §6 | 🟡 Applied |
| 6 | Update Tier 3 #17 count from 16/18 unknown to 15/18 unknown | `05_GAPS_AND_OPEN_QUESTIONS.md` Tier 3 | 🟢 Applied |

🔴 = blocking change applied; 🟡 = content-fill applied with provisional scoring (helpful_delta defaults); 🟢 = additive copy update

---

## 10. Items still NOT covered by Figma (open content gaps)

The Figma extraction above doesn't supply content for:

| Item | Owner | Notes |
|---|---|---|
| 10 motif `why_text` strings (only `spiral` is shown) | Content / clinical | Tier 3 #16 launch blocker |
| 18 echo_signature_tone_library lines | Content / clinical | Tier 3 #18; only 3 examples in design (the loop cards) |
| 15 of 18 micro-practice steps still unfilled | Content / clinical | Tier 3 #17 partially unblocked |
| Quiz→loop seeding contributions table | Product / clinical | Tier 3 #27 highest-priority blocker |
| Display label canonicalization for `Self-silencing` (with vs without space after hyphen) | Design | Minor — confirm before shipping |
| Homescreen primary/secondary CTA labels | Design | Component labels not in metadata |

These remain as Tier 3 items in `05_GAPS_AND_OPEN_QUESTIONS.md`.

---

## 11. Source-of-truth summary (post-Figma)

| Layer | Authoritative source |
|---|---|
| Backend logic, scoring, schemas, endpoints | PDF V1 (`Reflection_Room_Logic_Weighting_Dev_Handoff_V1_4_27_26`) |
| UI copy (English) | Figma "Design-Master-File" production frames (this doc, §2–§8) |
| Motif vocabulary + visuals | Figma node `261-1245` |
| 6-loop vocabulary | PDF V1 + Figma Echo Map (consistent) |
| Mirror Moment practice content (3 of 18 cells) | Figma node `4654-3335` §6.5 |
| Mirror Moment practice content (15 of 18 cells) | TBD — Tier 3 #17 |
| Tone library copy (English) | TBD — Tier 3 #18 |

The V2 user story node `1810-2276` is **not** authoritative for any layer.

---

# Appendix: Original V2 User Story Analysis (REJECTED 2026-05-03)

> The following sections analyze Figma node `1810-2276` ("User Story for RR", marked V2 1.6.26). On 2026-05-03 product confirmed this node is not authoritative for V1; the PDF V1 (4.27.26) remains the source of backend truth. The analysis is preserved here as a record of what was considered, in case the V2 direction surfaces in a later release.

---

**Source:** Figma "Design-Master-File" → frame "User Story for RR" (1471×1292), node id `1810:2276`
**Document version per Figma:** "Updated V2 1.6.26"

The Figma node contained a single text block — the V2 user journey for the Reflection Room. It was a more recent revision than the PDF (V1 from 4.27.26).

## A.1 Linear journey order (matched spec)

```
Landing Page → Quiz → Today's Motif → Echo Signature → Echo Map → Mirror Moment → Core Reflection Room
```

## A.2 Conflicts identified at the time

- **Echo Signature card semantics:** V2 said "3 micro practice cards"; spec said "3 loops with practice CTA." → **Resolved by production design (§4 above): cards are loops, not practices.**
- **Mirror Moment basis:** V2 said "based on current motif"; spec said "based on top-3 loops." → **Resolved by production design (§6 above): cards are loop+tone pairs, not motif-derived. PDF stance held.**
- **Info icons on 3 screens:** V2 added them; spec didn't have them. → **Confirmed by production design — info overlays exist on Echo Map (×2) and Mirror Moment (×3); see §5.3, §5.4 and §6.2–6.4.**
- **Echo Map per-loop overlay copy direction:** V2 asked for "what changed" temporal copy; spec had descriptive present-tense copy. → **Resolved by production design (§5.5): structure is name + tone + reflection + intensity, no temporal delta required. PDF stance held.**
- **Echo Map bottom summary line:** V2 added "overall pattern change" line; spec didn't have it. → **Resolved by production design (§5.1): bottom line is `This is a mirror, not a label.` — a fixed string, not a dynamic summary. No backend addition needed.**

All five "would have been required if V2 was authoritative" changes turn out to **not** be needed once the production design is treated as canonical.

## A.3 Lessons captured

- The V2 user story doc was a *narrative* of the experience, not a *spec*. The actual screens (production design frames in §2–§8) are the binding source of UI copy.
- "Based on current motif" in V2 prose was a paraphrase, not a backend rule. The actual Mirror Moment cards are still loop-derived.
- The temporal "what changed" framing in V2 didn't survive into the production overlays — the simpler descriptive structure was kept.
- Doing a full alignment pass against production frames *before* applying the V2 narrative changes saved the spec from a likely-incorrect rewrite.
