# Reflection Room V1 — Backend Implementation Spec

**Repository:** `mirror-collective-python-api`
**Source of truth:** _Reflection Room Logic + Weighting Configuration — Development Handoff V1 (4/27/26)_
**Architecture decision:** Parallel system. New endpoints, new tables, new services. Does **not** touch the existing MirrorGPT archetype quiz.

---

## 0. How to Read This Document

This spec is meant to be executed by Claude Code with minimal interpretation. Every algorithm, payload, and configuration value is fully specified. When this spec conflicts with old mocks, comments, or older Figma frames, **this spec wins** (per Section 2 of the handoff PDF).

Before writing any code, Claude Code must:

1. Read `src/app/api/`, `src/app/services/`, `src/app/core/`, and `src/app/repositories/` (or equivalent) in the existing repo.
2. Mirror the existing FastAPI router pattern, dependency-injection style, and DynamoDB DAO pattern.
3. Mirror the existing test layout under `tests/`.

If the existing patterns differ from anything below, **prefer the existing patterns for style** (router shape, settings access, error envelopes, auth dependency). The names, payloads, algorithms, and config-file contents in this spec are non-negotiable.

---

## 1. V1 Non-Negotiables (carried forward from PDF §3)

1. **Motifs and loops are different systems.** The quiz produces a motif. Echo Signature, Echo Map, and Mirror Moment use loops.
2. **Six loop families only:** `overwhelm`, `pressure`, `grief`, `self_silencing`, `agency`, `transition`. No `clarity`, `flow`, or `crossing` as standalone loop families.
3. **`/echo/snapshot` is the single source of truth** for active loop state. Frontend must not infer loop state.
4. **One practice recommendation engine.** Echo Signature CTA and Mirror Moment buttons both call `/echo/recommend-practice`. There is no second logic stack on the frontend.
5. **Mirror Moment buttons are dynamic** — generated from snapshot top-3, never hardcoded.
6. **Cooldowns and safety filters run server-side.** UI may surface state, but the API enforces it.
7. **`reduced_motion`, `no_breathwork`, `private_mode` are respected at the service layer**, not just UI.
8. **Echo Signature card front is recognition-only.** It is built from snapshot + tone library. The practice engine is only invoked on tap.

---

## 2. New Module Structure

Add the following under `src/app/`. Names are illustrative — match the existing repo's naming convention if it differs (e.g., `routes/` vs `routers/`).

```
src/app/
├── api/
│   ├── routers/
│   │   ├── reflection_router.py       # POST /reflection/quiz, PUT /me/reflection/room
│   │   ├── echo_router.py             # GET /echo/snapshot, POST /echo/recommend-practice
│   │   └── practice_router.py         # POST /practice/complete
│   └── models/
│       ├── reflection_models.py
│       ├── echo_models.py
│       └── practice_models.py
├── services/
│   ├── reflection/
│   │   ├── __init__.py
│   │   ├── quiz_scorer.py             # weighted tag scoring → motif tag
│   │   ├── motif_mapper.py            # tag → motif payload
│   │   ├── loop_seeder.py             # quiz answers → initial loop_state seeds (§4.8 + §8.3)
│   │   └── room_skin_resolver.py      # default + override
│   ├── echo/
│   │   ├── __init__.py
│   │   ├── snapshot_service.py        # build snapshot from loop-state store
│   │   ├── tone_library_loader.py     # icon + reflection_line lookup
│   │   ├── active_loop_filter.py      # §9.3 active-loop scoring rule
│   │   └── intensity_label_mapper.py  # 0..1 → High/Medium/Low
│   ├── practice/
│   │   ├── __init__.py
│   │   ├── recommender.py             # orchestrates rule + filter + score
│   │   ├── rule_matcher.py            # echo_practice_rules.v1.yaml
│   │   ├── catalog_loader.py          # micro_practices.v1.yaml
│   │   ├── personalizer.py            # §11.2 weights
│   │   ├── safety_filter.py           # no_breathwork, disallow_types
│   │   └── cooldown_enforcer.py       # per-loop cooldowns
│   └── telemetry/
│       └── reflection_events.py       # emits the 8 telemetry events
├── repositories/
│   ├── reflection_session_repo.py
│   ├── echo_loop_state_repo.py
│   ├── practice_completion_repo.py
│   └── user_personalization_repo.py
├── data/
│   ├── reflection/
│   │   ├── reflection_quiz_rules.v1.yaml
│   │   ├── motif_mapping.v1.json
│   │   └── quiz_to_loop_seeding.v1.yaml
│   └── micro_practice/
│       ├── echo_signature_tone_library.v1.yaml
│       ├── echo_practice_rules.v1.yaml
│       ├── micro_practices.v1.yaml
│       ├── micro_practice.settings.v1.yaml
│       └── personalization.defaults.v1.json
└── core/
    └── (extend existing config.py with new env vars; see §13)
```

---

## 3. DynamoDB Tables (4 new)

Table names follow the pattern `mc_<name>_<env>` (or whatever the existing convention is — inspect `scripts/create_*tables*.py` and match).

### 3.1 `mc_reflection_sessions_<env>`

| Attribute | Type | Notes |
|---|---|---|
| `session_id` (PK) | String | UUIDv4. Generated on first quiz submission. |
| `user_id` | String | Cognito `sub`. |
| `motif_id` | String | From motif_mapping.v1.json. |
| `motif_name` | String | Display name. |
| `room_skin` | String | e.g. "Spiral Room". |
| `motif_payload` | Map | Full payload returned to FE for replay. |
| `quiz_answers` | Map | `{q1, q2, q3, q4}` raw inputs. |
| `scores` | Map | All tag bucket scores. |
| `room_skin_override` | String? | Set only via `PUT /me/reflection/room`. |
| `user_tz` | String | IANA timezone used to compute `expires_at` (e.g. `America/Los_Angeles`). Captured at session creation. |
| `expires_at` | String (ISO) | Next midnight in `user_tz` at creation time. Sessions are considered "active" while `now < expires_at`. |
| `created_at` | String (ISO) | |
| `updated_at` | String (ISO) | |
| `ttl` | Number | Epoch sec. 30 days from `created_at`. DynamoDB TTL is for storage cleanup only — app logic uses `expires_at` for active-session checks. |

GSI: `user_id-created_at-index` (sort by `created_at` desc) — for finding the user's most recent active session.

### 3.2 `mc_echo_loop_state_<env>`

This is the **active loop state per user** — the source data behind `/echo/snapshot`.

| Attribute | Type | Notes |
|---|---|---|
| `user_id` (PK) | String | |
| `loop_id` (SK) | String | One of the 6 loop families. |
| `tone_state` | String | `rising` \| `steady` \| `softening` |
| `intensity_score` | Number | 0.0 to 1.0. |
| `intensity_label` | String | `High` \| `Medium` \| `Low` |
| `last_seen` | String (ISO) | |
| `recently_changed` | Bool | True if changed within last 24h. |
| `narrative_stage` | String? | Nullable. Used by some rules. |
| `updated_at` | String (ISO) | |

V1 note: For the **first-pass** implementation, this table is seeded from the quiz scores (mapping a small set of tag→loop heuristics) and from practice completions. A full inference engine is out of scope; see §8.3.

### 3.3 `mc_practice_completions_<env>`

| Attribute | Type | Notes |
|---|---|---|
| `user_id` (PK) | String | |
| `completion_id` (SK) | String | `<ts_iso>#<uuid>` for sortable scan. |
| `session_id` | String | |
| `loop_id` | String | |
| `tone_state` | String | At time of action. |
| `practice_id` | String | |
| `rule_id` | String | The matched rule from echo_practice_rules.v1.yaml. |
| `helpful` | Bool? | Nullable. Set when user votes. |
| `completed_at` | String (ISO) | |
| `user_hash` | String | One-way hash of user_id for audit log scan without PII join. |

GSI: `practice_id-completed_at-index` — for cooldown lookup.

### 3.4 `mc_user_personalization_<env>`

| Attribute | Type | Notes |
|---|---|---|
| `user_id` (PK) | String | |
| `flags` | Map | `{ no_breathwork: bool, reduced_motion: bool, private_mode: bool }` |
| `disallow_types` | List<String> | User-level practice-type blocklist. |
| `practice_helpfulness` | Map | `{ <practice_id>: { positive: int, negative: int, last_vote_at: iso } }` |
| `recent_use` | Map | `{ <practice_id>: { last_used_at: iso, count_30d: int } }` |
| `time_of_day_history` | Map | `{ "morning": int, "midday": int, "evening": int, "night": int }` — completion counts. |
| `updated_at` | String (ISO) | |

---

## 4. Configuration Files (full contents)

These files live in `src/app/data/` (per §2). All file paths in `Appendix A` of the source PDF should resolve to these locations. If the PDF appendix paths (`/services/micro_practice/...`) are required for traceability, add a top-level `services/` symlink or duplicate.

### 4.1 `data/reflection/reflection_quiz_rules.v1.yaml`

```yaml
version: 1
weights:
  q1: 1
  q2: 2
  q3: 2
  q4: 1
questions:
  q1:
    prompt: "How are you arriving today?"
    answers:
      curious:    [direction, clarity]
      grounded:   [structure]
      hopeful:    [growth, illumination]
      heavy:      [boundary, structure]
      scattered:  [clarity]
      numb:       [reflection, transition]
  q2:
    prompt: "What intention would you like to bring into your Reflection Room today?"  # Figma-confirmed canonical copy (node 4654-3272)
    answers:
      clarity:     [clarity]
      peace:       [reflection]
      healing:     [growth, expression]
      inspiration: [illumination, evolution]
      stillness:   [reflection, flow]
  q3:
    prompt: "Which of these speaks to you the most today?"  # Figma-confirmed canonical copy (node 4654-3272)
    answers:
      compass:       [direction]
      mirror:        [reflection]
      blocks:        [boundary]
      spiral:        [evolution]
      feather:       [transition]
      radiant_burst: [illumination]
      waves:         [flow]
      pyramid:       [clarity]
      water_drop:    [expression]
      brick_stack:   [structure]
      sprout:        [growth]
  q4:
    prompt: "What kind of message would help right now?"
    answers:
      soothing: [expression, reflection]
      gentle:   [growth]
      insight:  [clarity, evolution]
      direct:   [structure, direction]
      presence: [flow, reflection]
tie_break:
  use_q3: true
  allow_user_override: true
session:
  # Session lifetime: until next midnight in user's IANA timezone.
  # If no user_tz available, fall back to default_tz.
  default_tz: "America/New_York"
  # On quiz submission within an active session (now < expires_at):
  #   - Same answers → reuse session (motif + loops untouched)
  #   - Different answers → overwrite (new motif, reseed loops)
  # On quiz submission after session expiry (now >= expires_at):
  #   - Always create new session
```

### 4.2 `data/reflection/motif_mapping.v1.json`

The PDF gives one full motif (`evolution → spiral`). The other 10 are extrapolated by mapping each tag to its corresponding Q3 symbol. Copy/clinical leadership should review the `why_text` lines before launch.

```json
{
  "version": 1,
  "motifs": {
    "evolution": {
      "motif_id": "spiral",
      "motif_name": "Spiral",
      "icon": "🌀",
      "element": "Fire",
      "tone_tag": "Evolution / Integration",
      "why_text": "You're in a season of growth and integration — every loop brings you closer to wholeness.",
      "room_skin": "Spiral Room"
    },
    "clarity": {
      "motif_id": "pyramid",
      "motif_name": "Pyramid",
      "icon": "🔺",
      "element": "Air",
      "tone_tag": "Clarity / Insight",
      "why_text": "You're seeking sharpened clarity — let what's true rise to the surface.",
      "room_skin": "Pyramid Room"
    },
    "structure": {
      "motif_id": "brick_stack",
      "motif_name": "Brick Stack",
      "icon": "🧱",
      "element": "Earth",
      "tone_tag": "Structure / Foundation",
      "why_text": "You're rebuilding what holds you up — steady, deliberate, grounded.",
      "room_skin": "Brick Stack Room"
    },
    "growth": {
      "motif_id": "sprout",
      "motif_name": "Sprout",
      "icon": "🌱",
      "element": "Earth",
      "tone_tag": "Growth / Becoming",
      "why_text": "Something new is taking root — give it light and patience.",
      "room_skin": "Sprout Room"
    },
    "illumination": {
      "motif_id": "radiant_burst",
      "motif_name": "Radiant Burst",
      "icon": "✨",
      "element": "Fire",
      "tone_tag": "Illumination / Insight",
      "why_text": "A flash of clarity is moving through you — let it land.",
      "room_skin": "Radiant Burst Room"
    },
    "boundary": {
      "motif_id": "blocks",
      "motif_name": "Blocks",
      "icon": "🟦",
      "element": "Earth",
      "tone_tag": "Boundary / Protection",
      "why_text": "You're learning to define what is yours and what is not. Both matter.",
      "room_skin": "Blocks Room"
    },
    "reflection": {
      "motif_id": "mirror",
      "motif_name": "Mirror",
      "icon": "🪞",
      "element": "Water",
      "tone_tag": "Reflection / Stillness",
      "why_text": "You're being asked to slow down and look — what does the surface show you?",
      "room_skin": "Mirror Room"
    },
    "transition": {
      "motif_id": "feather",
      "motif_name": "Feather",
      "icon": "🪶",
      "element": "Air",
      "tone_tag": "Transition / Crossing",
      "why_text": "You're crossing a threshold — light touch, steady steps.",
      "room_skin": "Feather Room"
    },
    "flow": {
      "motif_id": "waves",
      "motif_name": "Waves",
      "icon": "🌊",
      "element": "Water",
      "tone_tag": "Flow / Surrender",
      "why_text": "Stop pushing — let movement carry you for a while.",
      "room_skin": "Waves Room"
    },
    "expression": {
      "motif_id": "water_drop",
      "motif_name": "Water Drop",
      "icon": "💧",
      "element": "Water",
      "tone_tag": "Expression / Release",
      "why_text": "Something inside is asking to be spoken or released. Make space.",
      "room_skin": "Water Drop Room"
    },
    "direction": {
      "motif_id": "compass",
      "motif_name": "Compass",
      "icon": "🧭",
      "element": "Air",
      "tone_tag": "Direction / Choice",
      "why_text": "You know more than you think you know. Trust the next small step.",
      "room_skin": "Compass Room"
    }
  }
}
```

### 4.3 `data/micro_practice/echo_signature_tone_library.v1.yaml`

18 entries: 6 loops × 3 tone states. Reflection lines are V1-acceptable; should be reviewed by content team.

```yaml
version: 1
loops:
  pressure:
    icon: "🔺"
    label: "Pressure"
    tones:
      rising:
        reflection_line: "Pressure is climbing. You don't have to meet every demand at full force."
      steady:
        reflection_line: "Pressure is steady — a constant hum in the background. What's it asking of you?"
      softening:
        reflection_line: "Pressure is easing. Notice what's loosened, even slightly."
  overwhelm:
    icon: "🌊"
    label: "Overwhelm"
    tones:
      rising:
        reflection_line: "The waves are getting bigger. You don't have to hold all of it at once."
      steady:
        reflection_line: "There's a steady flood you're navigating. Small footing first."
      softening:
        reflection_line: "The water is calming. Let yourself rest here."
  grief:
    icon: "🌿"
    label: "Grief"
    tones:
      rising:
        reflection_line: "Grief is surfacing. It's asking for presence, not resolution."
      steady:
        reflection_line: "Grief sits with you today. You're not behind for feeling it."
      softening:
        reflection_line: "Something in the grief is opening. Notice what feels lighter."
  self_silencing:
    icon: "🕊"
    label: "Self-Silencing"
    tones:
      rising:
        reflection_line: "You're swallowing something true. What would you say if it were safe?"
      steady:
        reflection_line: "There's a sentence you keep not finishing. It's still yours."
      softening:
        reflection_line: "Your voice is finding its way back. Don't rush it."
  agency:
    icon: "🔑"
    label: "Agency"
    tones:
      rising:
        reflection_line: "Something in you is ready to choose. The next move is yours."
      steady:
        reflection_line: "You're sitting with your own power. What does it want to do?"
      softening:
        reflection_line: "You don't have to act today. Holding agency is also a use of it."
  transition:
    icon: "🌉"
    label: "Transition"
    tones:
      rising:
        reflection_line: "You're stepping onto the bridge. Both sides are real."
      steady:
        reflection_line: "You're mid-crossing. The middle is its own place."
      softening:
        reflection_line: "You're nearly through. Let yourself land before naming what's next."
```

### 4.4 `data/micro_practice/echo_practice_rules.v1.yaml`

Direct YAML transcription of PDF §11.1.

```yaml
version: 1
rules:
  - id: pressure_loop_v1
    when:
      loop_id: pressure
      min_strength: 0.60
      trend_in: [rising, steady]
    candidates: [breath_4_6, reappraisal_alt_intent, one_percent_first_sentence]
    cooldown_hours: 12
    priority: 50

  - id: overwhelm_v1
    when:
      loop_id: overwhelm
      min_strength: 0.50
      trend_in: [rising, steady]
    candidates: [breath_box_4, name_and_need, boundary_prompt]
    cooldown_hours: 12
    priority: 50

  - id: grief_softening_v1
    when:
      loop_id: grief
      trend_in: [softening]
    candidates: [heart_hand_breath, name_what_softened, gratitude_molecule]
    cooldown_hours: 24
    priority: 60

  - id: self_silencing_v1
    when:
      loop_id: self_silencing
      min_strength: 0.50
      trend_in: [rising, steady]
    candidates: [speak_truth_sentence, reappraisal_self_compassion]
    cooldown_hours: 12
    priority: 45

  - id: agency_key_low_v1
    when:
      loop_id: agency
      min_strength: 0.45
      trend_in: [rising, steady]
    candidates: [key_door_list, one_percent_first_call, posture_reset]
    cooldown_hours: 12
    priority: 40

  - id: transition_bridge_v1
    when:
      loop_id: transition
      min_strength: 0.45
      trend_in: [rising, steady, softening]
      recent_days_max: 3
    candidates: [step_across_bridge, clarity_two_options, timebox_10min]
    cooldown_hours: 18
    priority: 40

fallback:
  enabled: true
  default_practice_id: breath_4_6
  alternate_for_no_breathwork_id: name_and_need
  rule_id: fallback   # used by telemetry/audit to distinguish fallback completions from rule-driven ones
```

> **Note on rule changes from PDF §11.1:** The original PDF specified `motif_any` and `narrative_stage_in` clauses on the last three rules. Those are dropped for V1 because the producing system isn't defined (see `06_OPEN_QUESTIONS_FOR_PRODUCT.md` Q1 + Q2). All six rules now gate on `loop_id` only — uniform vocabulary, no rule-vs-loop contradiction, all six loop families have a working V1 path. Awaiting product confirmation.

### 4.5 `data/micro_practice/micro_practices.v1.yaml`

`breath_4_6`, `breath_box_4`, and `heart_hand_breath` are now **Figma-confirmed** as the canonical practices for Ease Pressure / Ease Overwhelm / Soften Grief respectively (production design node `4654-3335`, see `08_FIGMA_ALIGNMENT_DELTA.md` §6.5). The remaining 14 practices are V1 reasonable defaults — flag for content/clinical review (Tier 3 #17 in `05_GAPS_AND_OPEN_QUESTIONS.md`).

**The closed set of `practice.type` values for V1:** `breath, somatic, cognitive, action, reflection`. This matches the `PracticeType` Pydantic literal (§5.2). Type drives the safety filter (`no_breathwork → drop type=breath`) and `disallow_types`. The mapping for the 17 V1 practices below:

| Type | Practices |
|---|---|
| `breath` | `breath_4_6`, `breath_box_4` |
| `somatic` | `heart_hand_breath`, `posture_reset` |
| `cognitive` | `reappraisal_alt_intent`, `name_and_need`, `boundary_prompt`, `reappraisal_self_compassion`, `key_door_list`, `clarity_two_options`, `speak_truth_sentence` |
| `action` | `one_percent_first_sentence`, `one_percent_first_call`, `timebox_10min` |
| `reflection` | `name_what_softened`, `gratitude_molecule`, `step_across_bridge` |

```yaml
version: 1
practices:
  - id: breath_4_6
    title: "Ease Pressure"           # Figma-confirmed (node 4654-3335)
    type: breath
    duration_sec: 120                # "TWO MINUTE PRACTICE" framing
    steps:
      - "Inhale for 4."
      - "Exhale for 6."
      - "Repeat three more times."

  - id: reappraisal_alt_intent
    title: "Name a different intention"
    type: cognitive
    duration_sec: 90
    steps:
      - "Notice the demand you're meeting."
      - "Ask: what would I do if I trusted I had time?"
      - "Write that as a one-line intention."

  - id: one_percent_first_sentence
    title: "Write the first sentence"
    type: action
    duration_sec: 120
    steps:
      - "Pick the smallest task pressing on you."
      - "Open it. Write only the first sentence."
      - "Close it. You've started."

  - id: breath_box_4
    title: "Ease Overwhelm"          # Figma-confirmed (node 4654-3335)
    type: breath
    duration_sec: 120                # "TWO MINUTE PRACTICE" framing
    steps:
      - "Inhale 4. Hold 4."
      - "Exhale 4. Hold 4."
      - "Repeat twice."              # Figma: "Repeat twice" (not four times)

  - id: name_and_need
    title: "Name it, and the need under it"
    type: cognitive
    duration_sec: 120
    steps:
      - "Name what you're feeling, in one word."
      - "Ask: what does this feeling need?"
      - "Say the need out loud."

  - id: boundary_prompt
    title: "Draft a boundary line"
    type: cognitive
    duration_sec: 120
    steps:
      - "Pick the request or pull that's costing too much."
      - "Write: 'I can't / I won't / I need…'"
      - "You don't have to send it. Just write it."

  - id: heart_hand_breath
    title: "Soften Grief"            # Figma-confirmed (node 4654-3335)
    type: somatic
    duration_sec: 120                # "TWO MINUTE PRACTICE" framing
    steps:
      - "Hand to heart."
      - "Inhale 4, exhale 6 — three rounds."
      - "Whisper: 'I allow myself to soften.'"

  - id: name_what_softened
    title: "Name what softened"
    type: reflection
    duration_sec: 90
    steps:
      - "Notice one thing that hurts less than it did."
      - "Say it out loud, in the present tense."
      - "Let that be enough for today."

  - id: gratitude_molecule
    title: "One small gratitude"
    type: reflection
    duration_sec: 60
    steps:
      - "Find one small thing — a sound, a texture, a person."
      - "Hold attention on it for thirty seconds."
      - "That's the practice."

  - id: speak_truth_sentence
    title: "Write the unsaid sentence"
    type: cognitive
    duration_sec: 120
    steps:
      - "Picture the conversation you're avoiding."
      - "Write the sentence you keep not saying."
      - "You don't have to send it. Just stop swallowing it."

  - id: reappraisal_self_compassion
    title: "Speak to yourself like a friend"
    type: cognitive
    duration_sec: 90
    steps:
      - "Notice the harsh thing you're saying to yourself."
      - "Ask: would I say this to someone I love?"
      - "Rewrite the sentence with that voice instead."

  - id: key_door_list
    title: "List the door, list the key"
    type: cognitive
    duration_sec: 120
    steps:
      - "Name one thing you feel stuck behind."
      - "Name one move — small — that opens it."
      - "You don't have to do it. Just see the key."

  - id: one_percent_first_call
    title: "Send one message"
    type: action
    duration_sec: 90
    steps:
      - "Pick the person you've been avoiding."
      - "Send three words: 'thinking of you,' 'have a sec?' — anything."
      - "That's the whole practice."

  - id: posture_reset
    title: "Stand up, two breaths"
    type: somatic
    duration_sec: 60
    steps:
      - "Stand. Roll your shoulders back."
      - "Breathe in. Breathe out."
      - "Sit back down on purpose."

  - id: step_across_bridge
    title: "Name the side you're on"
    type: reflection
    duration_sec: 90
    steps:
      - "Where are you — leaving, mid-bridge, arriving?"
      - "Say it in one sentence."
      - "You don't have to know what's next yet."

  - id: clarity_two_options
    title: "List the two options"
    type: cognitive
    duration_sec: 120
    steps:
      - "Write down option A. One sentence."
      - "Write down option B. One sentence."
      - "Notice which one your body leans toward."

  - id: timebox_10min
    title: "Ten-minute timebox"
    type: action
    duration_sec: 60
    steps:
      - "Pick one transition task."
      - "Set a 10-minute timer."
      - "When it goes off, you're done — no extending."
```

### 4.6 `data/micro_practice/micro_practice.settings.v1.yaml`

```yaml
version: 1
defaults:
  cooldown_hours_default: 12
  cooldown_hours_grief: 24
  fallback_enabled: true   # see §9 recommender + §4.4 fallback block; resolves dead-ends from §11.1 rule coverage gaps
  max_practices_per_session: 3
  snapshot_refresh_after_completion: true
```

### 4.7 `data/micro_practice/personalization.defaults.v1.json`

```json
{
  "version": 1,
  "weights": {
    "helpful_vote": 2.0,
    "not_helpful_vote": -2.0,
    "time_of_day_match": 0.5,
    "recent_use_penalty": -1.0
  },
  "decay": {
    "recency_decay_half_life_days": 21
  },
  "global": {
    "disallow_types": []
  },
  "user_flags_default": {
    "no_breathwork": false,
    "reduced_motion": false,
    "private_mode": false
  },
  "cooldowns": {
    "default_hours": 12,
    "grief_hours": 24
  },
  "time_of_day_buckets": {
    "_comment": "Bucket boundaries computed using the user's user_tz (or default_user_tz if missing). Hours are local. Bucket names are stable; only ranges may change.",
    "morning": [5, 11],
    "midday":  [11, 16],
    "evening": [16, 21],
    "night":   [21, 5]
  }
}
```

### 4.8 `data/reflection/quiz_to_loop_seeding.v1.yaml`

This file is the producer of initial loop state. Per product confirmation, the V1 system has no real-time inference engine — the quiz answers themselves seed `mc_echo_loop_state`, and practice completions mutate that state from there. Empty Echo Map for first-time users (and sparsely populated for ambiguous quiz inputs) is the **correct** V1 behavior.

The mapping below is a V1 starter. Treat it as content/clinical work — iterate on it as user testing produces signal. The architecture allows changes to this file without code changes.

```yaml
version: 1

# Algorithm (full spec in §8.3):
#   1. For each (q, answer), accumulate (loop, tone) buckets weighted by question_weight × score
#   2. Per loop, pick the tone with the highest score (rising > steady > softening on tie)
#   3. Drop loops below min_seed_score
#   4. Take top_n loops by score
#   5. Normalize to intensity_score in [0.50, 0.85] and upsert

config:
  top_n: 3
  min_seed_score: 0.45
  intensity_floor: 0.50
  intensity_ceiling: 0.85
  tone_tiebreak_priority: [rising, steady, softening]

contributions:
  q1:
    weight: 1.0
    answers:
      curious:
        - { loop: agency, tone: rising, score: 0.70 }
      grounded: []   # No loop seeded — settled state, empty is correct.
      hopeful:
        - { loop: transition, tone: rising, score: 0.70 }
      heavy:
        - { loop: grief, tone: rising, score: 0.65 }
        - { loop: overwhelm, tone: rising, score: 0.40 }
      scattered:
        - { loop: overwhelm, tone: rising, score: 0.80 }
      numb:
        - { loop: self_silencing, tone: steady, score: 0.65 }
        - { loop: grief, tone: steady, score: 0.40 }

  q2:
    weight: 0.7
    answers:
      clarity:
        - { loop: pressure, tone: steady, score: 0.40 }
      peace:
        - { loop: overwhelm, tone: rising, score: 0.50 }
        - { loop: pressure, tone: rising, score: 0.30 }
      healing:
        - { loop: grief, tone: softening, score: 0.55 }
      inspiration:
        - { loop: agency, tone: rising, score: 0.55 }
      stillness:
        - { loop: pressure, tone: softening, score: 0.40 }
        - { loop: overwhelm, tone: softening, score: 0.30 }

  q3:
    weight: 1.5   # Highest signal — matches PDF tie-break logic
    answers:
      compass:
        - { loop: agency, tone: rising, score: 0.60 }
      mirror:
        - { loop: self_silencing, tone: steady, score: 0.45 }
      blocks:
        - { loop: pressure, tone: rising, score: 0.60 }
      spiral:
        - { loop: agency, tone: steady, score: 0.45 }
        - { loop: transition, tone: rising, score: 0.35 }
      feather:
        - { loop: transition, tone: rising, score: 0.70 }
      radiant_burst:
        - { loop: agency, tone: rising, score: 0.65 }
      waves:
        - { loop: overwhelm, tone: softening, score: 0.60 }
      pyramid:
        - { loop: pressure, tone: rising, score: 0.50 }
      water_drop:
        - { loop: grief, tone: rising, score: 0.65 }
        - { loop: self_silencing, tone: rising, score: 0.35 }
      brick_stack:
        - { loop: pressure, tone: steady, score: 0.60 }
      sprout:
        - { loop: transition, tone: rising, score: 0.55 }

  q4:
    weight: 0.7
    answers:
      soothing:
        - { loop: grief, tone: rising, score: 0.50 }
        - { loop: self_silencing, tone: rising, score: 0.30 }
      gentle:
        - { loop: self_silencing, tone: rising, score: 0.40 }
        - { loop: grief, tone: softening, score: 0.30 }
      insight:
        - { loop: agency, tone: rising, score: 0.45 }
      direct:
        - { loop: agency, tone: rising, score: 0.50 }
        - { loop: pressure, tone: steady, score: 0.30 }
      presence:
        - { loop: grief, tone: steady, score: 0.40 }
        - { loop: transition, tone: steady, score: 0.30 }
```

**Worked example (the canonical "Spiral" quiz from PDF §5.1):**

Input: `q1=hopeful, q2=inspiration, q3=spiral, q4=insight`

| q | weight | answer contributions (raw × question_weight) |
|---|---|---|
| q1 | 1.0 | (transition, rising) +0.70 |
| q2 | 0.7 | (agency, rising) +0.385 |
| q3 | 1.5 | (agency, steady) +0.675; (transition, rising) +0.525 |
| q4 | 0.7 | (agency, rising) +0.315 |

Loop totals (after tone-tiebreak):

| Loop | Best tone | Total score |
|---|---|---|
| transition | rising | 1.225 |
| agency | rising (0.70 vs steady 0.675) | 1.375 |

Both above `min_seed_score=0.45`. Top 2 seeded. Normalized intensity (rough): agency ≈ 0.78, transition ≈ 0.74. So a spiral-quiz user lands in their first Echo Signature with two cards: agency (rising, High) and transition (rising, High). The Reflection Room feels populated.

**Test fixture:** the integration test suite must include this exact case (`test_seeding_spiral_canonical`) and assert the resulting loops set.

---

## 5. Pydantic Models

Use Pydantic v2. Place under `src/app/api/models/`.

### 5.1 `reflection_models.py`

```python
from datetime import datetime
from typing import Literal, Optional, Dict, List
from pydantic import BaseModel, Field

Q1Answer = Literal["curious", "grounded", "hopeful", "heavy", "scattered", "numb"]
Q2Answer = Literal["clarity", "peace", "healing", "inspiration", "stillness"]
Q3Answer = Literal["compass", "mirror", "blocks", "spiral", "feather", "radiant_burst",
                   "waves", "pyramid", "water_drop", "brick_stack", "sprout"]
Q4Answer = Literal["soothing", "gentle", "insight", "direct", "presence"]


class QuizAnswers(BaseModel):
    q1: Q1Answer
    q2: Q2Answer
    q3: Q3Answer
    q4: Q4Answer


class QuizRequest(BaseModel):
    answers: QuizAnswers
    session_id: Optional[str] = None
    user_override_tag: Optional[str] = None  # tie-break override (PDF §6.3 step 14)


class MotifPayload(BaseModel):
    motif_id: str
    motif_name: str
    icon: str
    element: str
    tone_tag: str
    why_text: str
    room_skin: str
    scores: Dict[str, int]
    explanation: List[str]
    override_allowed: bool


class QuizResponse(BaseModel):
    session_id: str = Field(..., description="UUIDv4 for the new or reused session")
    motif: MotifPayload
    tied_motifs: Optional[List[MotifPayload]] = Field(
        default=None,
        description="Populated only when override_allowed=true. Contains all motifs tied for the max score, "
                    "including the one returned in `motif`. FE renders these in the override chooser.",
    )


class RoomSkinOverrideRequest(BaseModel):
    motif_id: str  # must exist in motif_mapping.v1.json
    apply_to: Literal["session", "core_room"] = "session"


class RoomSkinOverrideResponse(BaseModel):
    session_id: str
    motif: MotifPayload
    applied_to: str
```

### 5.2 `echo_models.py`

```python
from datetime import datetime
from typing import Literal, Optional, List
from pydantic import BaseModel, Field, conint, confloat

LoopId = Literal["pressure", "overwhelm", "grief",
                 "self_silencing", "agency", "transition"]
ToneState = Literal["rising", "steady", "softening"]
IntensityLabel = Literal["High", "Medium", "Low"]
PracticeType = Literal["breath", "somatic", "cognitive", "action", "reflection"]


class LoopState(BaseModel):
    loop_id: LoopId
    tone_state: ToneState
    intensity_score: confloat(ge=0.0, le=1.0)
    intensity_label: IntensityLabel
    last_seen: datetime
    recently_changed: bool = False
    narrative_stage: Optional[str] = None
    icon: Optional[str] = None            # populated from tone library
    reflection_line: Optional[str] = None # populated from tone library


class MotifContext(BaseModel):
    motif_id: str
    room_skin: str


class SnapshotResponse(BaseModel):
    session_id: str
    motif_context: MotifContext
    loops: List[LoopState] = Field(
        default_factory=list,
        description="Sorted by intensity_score descending. Empty if no active loops."
    )
    updated_at: datetime


class RecommendPracticeRequest(BaseModel):
    session_id: str
    selected_loop: Optional[LoopId] = None  # if None, recommender picks from snapshot top
    surface: Literal["echo_signature", "mirror_moment", "chat"] = "echo_signature"


class PatternInfo(BaseModel):
    loop_id: LoopId
    strength: confloat(ge=0.0, le=1.0)
    trend: ToneState
    last_seen: datetime


class PracticePayload(BaseModel):
    id: str
    title: str
    type: PracticeType
    duration_sec: conint(ge=0)
    steps: List[str]


class RecommendPracticeResponse(BaseModel):
    pattern: PatternInfo
    practice: PracticePayload
    rule_id: str
```

### 5.3 `practice_models.py`

```python
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from .echo_models import LoopId, ToneState, SnapshotResponse


class CompletePracticeRequest(BaseModel):
    session_id: str
    loop_id: LoopId
    tone_state: ToneState
    practice_id: str
    rule_id: str
    helpful: Optional[bool] = None  # may be None at first POST, updated later
    completed_at: Optional[datetime] = None


class CompletePracticeResponse(BaseModel):
    completion_id: str
    snapshot: SnapshotResponse
```

---

## 6. Endpoint Specifications

All endpoints sit under the existing FastAPI app and require authentication. Auth dependency: reuse the existing user-resolution dependency (Cognito JWT). All endpoints derive `user_id` from the JWT — no anonymous fallback for the Reflection Room flow.

### 6.1 `POST /reflection/quiz`

**Purpose:** Score 4 quiz answers and return motif payload. **Also seeds initial loop state** in `mc_echo_loop_state` per the algorithm in §8.3 — this is what makes Echo Signature/Map/Moment populated for new users.

**Auth:** Required. Cognito JWT. The user must be authenticated to take the quiz.

**Request body:**
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

**Errors:**
- `400` — invalid answer enum, missing question
- `409` — `user_override_tag` is not in the tie-set or override not allowed (i.e. there was no tie)
- `500` — config file load failure

**Reuse rule (replaces PDF §6.4 "reuse_if_within_hours=48"):** Sessions expire at next midnight in the user's timezone (or `America/New_York` if no `user_tz` is stored on the user record). If the user has an active session (`now < session.expires_at`) and submits the quiz again:

- Same answers as the active session → return that session's motif unchanged; do not reseed loops.
- Different answers → overwrite the active session's quiz_answers, motif, and loop seeds; same `session_id` is reused so client correlation stays consistent.

If no active session exists, a new session row is created with `expires_at = next_midnight(user_tz)`.

**Timezone resolution order:**
1. `X-User-Timezone` request header (IANA name, e.g. `America/Los_Angeles`) — for cases where the client knows the device timezone but the user record hasn't been updated.
2. The user's stored `tz` (or equivalent) field on the existing user profile.
3. Default: `America/New_York`.

### 6.2 `GET /echo/snapshot`

**Purpose:** Return active loop state for the user's current session.

**Query params:** `session_id` (optional). If omitted, server resolves the user's most recent session.

**Auth:** Required. Cognito JWT.

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

**Empty state:** Return `loops: []`, `motif_context` populated, `updated_at` set. The frontend renders the "All quiet for now" empty state from this. Status remains 200.

**Important:**
- Loops MUST be sorted by `intensity_score` descending (PDF §9.2 step 24).
- `icon` and `reflection_line` SHOULD be populated server-side from the tone library so the FE doesn't need a second fetch (PDF §5.2 "Preferred API improvement").

### 6.3 `POST /echo/recommend-practice`

**Purpose:** Return one ranked 1–2 minute practice for the selected active loop.

**Request body:**
```json
{
  "session_id": "abc123",
  "selected_loop": "pressure",
  "surface": "echo_signature"
}
```

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

**Errors (with V1 default `fallback_enabled = true`):**
- `400` — `selected_loop` not in supported families
- `404 NO_ACTIVE_LOOPS` — snapshot has no active loops (only when `selected_loop` is null)
- `409 FALLBACK_ON_COOLDOWN` — extremely rare; fires only when even the fallback practice is within its cooldown. Return `Retry-After` header.

**Note:** `404 NO_RULE_MATCHED` and `409 ALL_CANDIDATES_FILTERED` only fire when `fallback_enabled = false`. With V1's default settings these never reach the FE. Documented in error envelope (§12) for completeness.

**Behavior:**
1. If `selected_loop` is None, pick the highest-scoring loop from snapshot that satisfies the active-loop rule (§9.3 of PDF).
2. Match rules from `echo_practice_rules.v1.yaml` (§8.4 below).
3. Filter candidates: drop if user has `no_breathwork=true` and practice.type=`breath`; drop if practice.type in user `disallow_types`; drop if cooldown not elapsed.
4. Score remaining candidates with personalization weights (§7).
5. Tie-break with rule `priority`.
6. Return single winner.

### 6.4 `POST /practice/complete`

**Purpose:** Log practice completion + helpfulness, then refresh snapshot.

**Request body:**
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

**Response 200:**
```json
{
  "completion_id": "2026-04-27T20:14:00Z#uuid",
  "snapshot": { /* same shape as GET /echo/snapshot, freshly recomputed */ }
}
```

**Side effects:**
1. Insert row into `mc_practice_completions_<env>`.
2. Update `mc_user_personalization_<env>` (helpfulness counts, recent_use, time_of_day_history).
3. Recompute the affected loop's state in `mc_echo_loop_state_<env>` (e.g., decay intensity slightly on `helpful=true`).
4. Emit telemetry events: `practice_complete` (always), `practice_helpful`/`practice_not_helpful` (if `helpful` set).
5. Return refreshed snapshot inline so FE doesn't need a second call.

**`helpful` may be null:** If the user dismisses the helpfulness prompt, `helpful=null`. Allow a follow-up `POST /practice/complete` with the same `completion_id` to update `helpful`. Implement as `PUT /practice/complete/{completion_id}/helpful` if cleaner — see §6.6.

### 6.5 `PUT /me/reflection/room`

**Purpose:** Optional room skin override.

**Auth:** Authenticated only.

**Request body:**
```json
{
  "motif_id": "mirror",
  "apply_to": "session"
}
```

`apply_to` = `"session"` updates only the current session's `room_skin_override`. `"core_room"` updates the user's persistent default — see PDF §6.4 "first onboarding quiz can assign the user's core room."

**Response 200:** Returns the same shape as `QuizResponse` (with the new motif applied).

**Errors:**
- `400` — `motif_id` not in motif_mapping.v1.json
- `403` — quiz `override_allowed=false` for current session

### 6.6 (Optional) `PATCH /practice/complete/{completion_id}/helpful`

For the case where user submits helpfulness vote after the initial completion call.

**Request body:**
```json
{ "helpful": false }
```

Returns updated completion row.

---

## 7. Quiz Scoring Algorithm (full)

Implement in `services/reflection/quiz_scorer.py`.

```
INPUT: answers = { q1, q2, q3, q4 }
INPUT: rules = parsed reflection_quiz_rules.v1.yaml
INPUT: optional user_override_tag

1. Initialize buckets: dict<tag, int> = {} (defaultdict(int))

2. For each q in [q1, q2, q3, q4]:
     weight = rules.weights[q]
     answer = answers[q]
     for tag in rules.questions[q].answers[answer]:
         buckets[tag] += weight

3. If buckets is empty: raise ConfigError (impossible if config is valid).

4. max_score = max(buckets.values())
   winners = [tag for tag, score in buckets.items() if score == max_score]

5. If len(winners) == 1:
       winning_tag = winners[0]
       override_allowed = false
       explanation = build_explanation(answers, buckets)
   else:
       # Tie-break #1: Q3 symbol
       q3_tags = rules.questions.q3.answers[answers.q3]
       q3_winners = [w for w in winners if w in q3_tags]
       if len(q3_winners) == 1:
           winning_tag = q3_winners[0]
           override_allowed = false
       else:
           # Tie-break #2: user override OR pick first deterministically
           if user_override_tag is provided:
               if user_override_tag not in winners:
                   raise ValidationError("override tag not in tied set")
               winning_tag = user_override_tag
               override_allowed = false
           else:
               # Return tie state — frontend prompts user to pick
               winning_tag = sorted(winners)[0]   # deterministic default
               override_allowed = true

6. motif = motif_mapping.motifs[winning_tag]
   return MotifPayload(
       motif_id, motif_name, icon, element, tone_tag, why_text, room_skin,
       scores=buckets,
       explanation=explanation,
       override_allowed=override_allowed
   )
```

**Explanation builder:** For each question/answer pair, append a string of the form `"Q{n}={answer} (×{weight} → {tags_joined})"`. Keep it ordered q1→q4.

---

## 8. Echo Snapshot — Service Logic

### 8.1 Building the snapshot

`services/echo/snapshot_service.py`:

```
def build_snapshot(user_id, session_id) -> SnapshotResponse:
    session = reflection_session_repo.get(session_id)
    if not session: raise NotFound

    rows = echo_loop_state_repo.query_by_user(user_id)
    # rows: List[EchoLoopState] for all 6 loop families (or fewer if not seeded)

    loops = []
    for row in rows:
        if row.loop_id not in V1_SUPPORTED_LOOPS:
            continue  # PDF §9.2 step 26
        if row.intensity_score <= 0.0:
            continue  # §8.3 edge case: fully resolved loops fade from snapshot until reseed

        icon, reflection_line = tone_library.lookup(row.loop_id, row.tone_state)
        loops.append(LoopState(
            loop_id=row.loop_id,
            tone_state=row.tone_state,
            intensity_score=row.intensity_score,
            intensity_label=label_from_score(row.intensity_score),
            last_seen=row.last_seen,
            recently_changed=row.recently_changed,
            narrative_stage=row.narrative_stage,
            icon=icon,
            reflection_line=reflection_line,
        ))

    loops.sort(key=lambda l: l.intensity_score, reverse=True)

    return SnapshotResponse(
        session_id=session_id,
        motif_context=MotifContext(motif_id=session.motif_id, room_skin=session.effective_room_skin()),
        loops=loops,
        updated_at=now_utc(),
    )
```

### 8.2 Intensity label mapping

```
def label_from_score(score: float) -> IntensityLabel:
    if score >= 0.66: return "High"
    if score >= 0.33: return "Medium"
    return "Low"
```

### 8.3 Initial loop-state seeding — quiz-driven (V1)

V1 has **no real-time inference engine**. The loop-state store is populated by two sources only:

1. **The Reflection Quiz seeds initial loop state** on every quiz submission, using the seeding table in `data/reflection/quiz_to_loop_seeding.v1.yaml` (see §4.8).
2. **Practice completions mutate that state** over time.

This is a deliberate V1 simplification, confirmed by product. An empty Echo Map for first-time users (before quiz) — and a sparsely populated one for users whose quiz answers are ambiguous — is the **correct** V1 state.

#### Seeding algorithm (run inside `POST /reflection/quiz` after the motif is assigned)

```
INPUT: answers, user_id, session_id
INPUT: seeding_config = parsed quiz_to_loop_seeding.v1.yaml

1. Initialize buckets: dict<(loop_id, tone_state), float> = {}

2. For each q in [q1, q2, q3, q4]:
     question_weight = seeding_config.contributions[q].weight
     for contrib in seeding_config.contributions[q].answers[answers[q]]:
         key = (contrib.loop, contrib.tone)
         buckets[key] += contrib.score * question_weight

3. Resolve tone-state collisions per loop:
   For each loop_id with multiple (loop, tone) entries:
     - Pick the tone with highest accumulated score
     - On tie, prefer rising > steady > softening
   Collapse to: dict<loop_id, (tone_state, total_score)>

4. Filter:
   - Drop loops with total_score < seeding_config.min_seed_score
   - Sort remaining by score desc
   - Take top seeding_config.top_n

5. For each surviving (loop_id, tone, raw_score):
     # Normalize raw_score to intensity_score in [0.50, 0.85]
     intensity_score = clamp(0.50 + 0.35 * normalize(raw_score), 0.0, 1.0)
     intensity_label = label_from_score(intensity_score)
     upsert mc_echo_loop_state row:
       user_id, loop_id, tone_state=tone,
       intensity_score, intensity_label,
       last_seen=now, recently_changed=true,
       narrative_stage=null
```

**Reseeding rules (interaction with session lifetime, see §3.1 + §4.1):**

A "session" runs until the next midnight in the user's timezone (or `America/New_York` if unknown). On `POST /reflection/quiz`:

- **No active session** (`now >= expires_at` of most recent session, or no prior session) → new session created, motif assigned, loops fully seeded from quiz answers.
- **Active session, same answers as the active session's row** → motif reused, **loops NOT reseeded**. Preserves any practice-driven mutations the user has earned during the day.
- **Active session, different answers** → motif may stay or change per existing rules; **loops are fully reseeded**, overwriting prior state. The session row's `quiz_answers` is updated to match.

Rationale: midnight is the daily reset. Within a single day, retaking the quiz with the same answers is a no-op (the user is just re-entering the room). Within a single day, retaking with new answers reflects "I feel different now" and overrides. Across midnight, every entry is a fresh check-in.

#### State mutations from practice completions

When `POST /practice/complete` succeeds:

- `helpful=true` → reduce target loop's `intensity_score` by 0.10 (floor 0.0). If the cumulative drop within the last 24h is ≥ 0.05, set `tone_state=softening` and `recently_changed=true`.
- `helpful=false` → no intensity change; `tone_state` unchanged. Personalization scoring penalizes the practice for future picks.
- `helpful=null` → record completion only; no state change.

**Edge cases:**

- **Intensity floor at 0.0.** If a series of helpful completions drives `intensity_score` to 0.0, the row stays in DDB (for completion history and replay) but is **excluded from `/echo/snapshot` output**. A fully resolved loop fades from Echo Map and Mirror Moment naturally. It re-emerges only on next quiz reseed.
- **Snapshot inclusion threshold.** A loop is included in the snapshot response if `intensity_score > 0.0`. Loops at exactly 0.0 are dropped. Threshold logic for *active surfaces* — e.g., the `min_strength: 0.60` in `pressure_loop_v1` — applies on top of this, in the recommender.
- **`recently_changed` window.** Set to `true` when the loop's `tone_state` or `intensity_score` (≥0.05 delta) changes within the last 24h, in UTC. It's a transient flag, not a sticky one — it auto-clears on the next mutation that doesn't qualify.
- **Mid-day midnight crossing.** If a user is mid-practice when `user_tz` midnight ticks over, the practice still completes against the original session. `expires_at` is set at session creation, not slid forward.

#### `recent_days_max` interpretation (rule `transition_bridge_v1`)

`recent_days_max: 3` checks `loop.last_seen >= now_utc - timedelta(days=3)`. UTC is fine — a few hours of timezone offset doesn't materially affect a 3-day window.

In V1 with quiz-driven seeding (every quiz updates `last_seen` to `now`), this gate rarely matters in practice — any user actively engaging will have recent `last_seen` values. The clause is preserved for V2 forward compatibility, where loops may persist longer with stale `last_seen` if an inference engine populates them less frequently than the user takes the quiz.

#### QA / FE development support

A dev-only endpoint **`POST /dev/echo/loop-state`** lets QA set arbitrary loop states for testing without going through the quiz. Gate behind `ENVIRONMENT != "production"`. This is essential for FE engineers to test all (loop × tone) combinations without rigging quiz inputs.

#### What the seeding table is and isn't

The mapping table in `quiz_to_loop_seeding.v1.yaml` is a **starter** — content/clinical/product should iterate on it once user testing data exists. Treat it as the V1 honest-best-effort baseline. The architecture is designed so this file can change without code changes.

### 8.4 Rule matching is uniform (post Q1/Q2 resolution)

All six rules in `echo_practice_rules.v1.yaml` gate on `loop_id` only. The `motif_any` and `narrative_stage_in` clauses from the PDF have been dropped for V1 — see `06_OPEN_QUESTIONS_FOR_PRODUCT.md` Q1 and Q2 for the rationale.

`rule_matcher.py` therefore takes a single `LoopState` plus the rule list and runs straightforward field matching: `loop_id`, `min_strength`, `trend_in`, `recent_days_max`. No tag expansion, no narrative-stage gating.

**Forward compatibility:** the rule schema still permits optional `motif_any` and `narrative_stage_in` fields. They're just unused by V1 rules. V2 work that adds an inference engine producing those tags can introduce new rules without a schema migration.

---

## 9. Practice Recommendation — Service Logic

`services/practice/recommender.py`:

```
def recommend(user_id, session_id, selected_loop, surface) -> RecommendPracticeResponse:
    snapshot = snapshot_service.build_snapshot(user_id, session_id)
    user_prefs = user_personalization_repo.get_or_default(user_id)

    # 1. Pick target loop
    if selected_loop:
        target = next((l for l in snapshot.loops if l.loop_id == selected_loop), None)
        if not target:
            raise BadRequest("loop not in snapshot")
    else:
        active = active_loop_filter.filter(snapshot.loops)
        if not active:
            raise NotFound("no active loops")
        target = active[0]  # already sorted

    # 2. Match rules
    matched_rules = rule_matcher.match(target, snapshot)
    if not matched_rules:
        if settings.fallback_enabled:
            return _fallback_practice(target, user_prefs)
        raise NotFound("no rule matched")

    # 3. Expand candidates from highest-priority rule first
    matched_rules.sort(key=lambda r: r.priority, reverse=True)

    for rule in matched_rules:
        candidates = [catalog.get(pid) for pid in rule.candidates]

        # 4. Filter
        candidates = safety_filter.apply(candidates, user_prefs)
        candidates = cooldown_enforcer.apply(candidates, user_id, rule.cooldown_hours)

        if not candidates:
            continue

        # 5. Score
        scored = personalizer.score(candidates, user_id, user_prefs, now_utc())

        # 6. Pick winner
        winner = max(scored, key=lambda s: s.score)
        return RecommendPracticeResponse(
            pattern=PatternInfo(
                loop_id=target.loop_id,
                strength=target.intensity_score,
                trend=target.tone_state,
                last_seen=target.last_seen,
            ),
            practice=PracticePayload(**winner.practice.dict()),
            rule_id=rule.id,
        )

    # 7. All candidates filtered (cooldowns + safety wiped the pool)
    if settings.fallback_enabled:
        return _fallback_practice(target, user_prefs)
    raise Conflict("all candidates filtered")  # 409 with Retry-After header


def _fallback_practice(target, user_prefs) -> RecommendPracticeResponse:
    """
    Fires in two cases:
      (a) No rule matched the target loop's (loop_id, tone_state, intensity).
      (b) All matched rules' candidates were filtered out by safety/cooldown.

    Picks the configured default; if user has no_breathwork=true and the default is breath,
    swaps to the configured alternate. Cooldown is checked against the chosen fallback ID;
    if even the fallback is on cooldown, raises 409 (no infinite retry).
    """
    rules_cfg = practice_rules_loader.load()
    fb_id = rules_cfg.fallback.default_practice_id

    practice = catalog.get(fb_id)
    if user_prefs.flags.no_breathwork and practice.type == "breath":
        practice = catalog.get(rules_cfg.fallback.alternate_for_no_breathwork_id)

    # Even fallbacks respect cooldown — prevents same fallback firing every time.
    recent = practice_completion_repo.list_by_user_since(
        user_id=user_prefs.user_id,
        since=now_utc() - timedelta(hours=settings.cooldown_hours_default),
    )
    if any(r.practice_id == practice.id for r in recent):
        raise Conflict("fallback on cooldown")  # 409 with Retry-After

    return RecommendPracticeResponse(
        pattern=PatternInfo(
            loop_id=target.loop_id,
            strength=target.intensity_score,
            trend=target.tone_state,
            last_seen=target.last_seen,
        ),
        practice=PracticePayload(**practice.dict()),
        rule_id=rules_cfg.fallback.rule_id,  # "fallback"
    )
```

### 9.1 Active-loop filter (PDF §9.3)

```
def filter(loops: List[LoopState]) -> List[LoopState]:
    return [
        l for l in loops
        if (l.intensity_score >= 0.60 and l.tone_state in {"rising", "steady"})
        or l.recently_changed
        or l.tone_state == "softening"
    ]
```

### 9.2 Personalization scoring (PDF §11.2)

```
def score(candidates, user_id, prefs, now) -> List[ScoredPractice]:
    cfg = personalization_defaults
    scored = []
    for practice in candidates:
        score = 0.0

        # Helpfulness with recency decay (half-life 21 days)
        history = prefs.practice_helpfulness.get(practice.id, {})
        for vote in history:  # iterate vote events stored per practice
            age_days = (now - vote.timestamp).days
            decay = 0.5 ** (age_days / cfg.decay.recency_decay_half_life_days)
            if vote.helpful:
                score += cfg.weights.helpful_vote * decay
            else:
                score += cfg.weights.not_helpful_vote * decay

        # Time-of-day match — bucket computed in user's local time (user_tz, or default fallback)
        tz = ZoneInfo(user_tz_for(user_id))   # falls back to settings.default_user_tz
        local_now = now.astimezone(tz)
        bucket_now = bucket_for(local_now, cfg.time_of_day_buckets)
        if prefs.time_of_day_history.get(bucket_now, 0) > 0:
            most_common = max(prefs.time_of_day_history.items(), key=lambda x: x[1])[0]
            if bucket_now == most_common:
                score += cfg.weights.time_of_day_match

        # Recent use penalty (within 24h)
        last_used = prefs.recent_use.get(practice.id, {}).get("last_used_at")
        if last_used and (now - last_used).total_seconds() < 24*3600:
            score += cfg.weights.recent_use_penalty

        scored.append(ScoredPractice(practice=practice, score=score))
    return scored
```

> **Note:** `practice_helpfulness` storage must allow per-event records, not just running totals, so decay can be applied. Suggested shape: `{ <practice_id>: [ {ts, helpful}, ... ] }` capped at last N events (e.g., 50) per practice.

### 9.3 Safety filter

```
def apply(candidates, prefs):
    out = []
    for p in candidates:
        if prefs.flags.no_breathwork and p.type == "breath":
            continue
        if p.type in (prefs.disallow_types or []):
            continue
        if p.type in (cfg.global.disallow_types or []):
            continue
        out.append(p)
    return out
```

### 9.4 Cooldown enforcer

```
def apply(candidates, user_id, rule_cooldown_hours):
    cutoff = now_utc() - timedelta(hours=rule_cooldown_hours)
    recent = practice_completion_repo.list_by_user_since(user_id, cutoff)
    recent_ids = {r.practice_id for r in recent}
    return [p for p in candidates if p.id not in recent_ids]
```

---

## 10. Telemetry

`services/telemetry/reflection_events.py` defines a small `Protocol`-based interface so the V1 implementation can be a stub that V2 swaps for a real metrics backend without changing call sites:

```python
from typing import Protocol

class TelemetryEmitter(Protocol):
    def emit(self, event_name: str, *, user_hash: str, **fields) -> None: ...

# V1 implementation: structured logs. Sufficient for shipping; pluggable for V2.
class StructuredLogEmitter:
    def __init__(self, logger=None):
        self._log = logger or logging.getLogger("telemetry.reflection")

    def emit(self, event_name: str, *, user_hash: str, **fields) -> None:
        # PII filter at the boundary: refuse free-form text fields entirely.
        sanitized = {k: v for k, v in fields.items()
                     if isinstance(v, (int, float, bool, str)) and len(str(v)) <= 64}
        self._log.info(json.dumps({
            "event": event_name,
            "user_hash": user_hash,
            "ts": datetime.now(timezone.utc).isoformat(),
            **sanitized,
        }))

# Wired via dependency injection — routes call self.telemetry.emit(...)
```

**V2 swap path:** drop in a `MixpanelEmitter`, `SegmentEmitter`, or `KinesisEmitter` implementing the same Protocol. No call-site changes.

Eight V1 events (PDF §14.1):

| Event | When emitted | Required fields |
|---|---|---|
| `echo_signature_view` | `GET /echo/snapshot` returns 200 | `loops_count`, `motif_id` |
| `practice_expand` | client→server beacon when card back opens | `loop_id`, `practice_id` |
| `practice_complete` | `POST /practice/complete` 200 | `loop_id`, `tone_state`, `practice_id`, `rule_id` |
| `practice_helpful` | helpful=true | `practice_id`, `rule_id` |
| `practice_not_helpful` | helpful=false | `practice_id`, `rule_id` |
| `nudge_opened` | client→server when external nudge expanded | `nudge_type` |
| `private_mode_reveal` | `POST /me/private-mode/reveal` (or client beacon) | `surface` |
| `echo_map_refresh` | client→server when "Update My Mirror" tapped | (none beyond user_hash) |

**Rule:** events MUST be IDs only — never raw text. The PII filter in `StructuredLogEmitter` (§10) refuses free-form fields and caps string length at 64 chars. If a future event needs richer fields, add them to a typed dataclass per event rather than loosening the filter.

### 10.1 Privacy and Safety Flag Behavior (V1)

Three user-level flags drive backend behavior:

| Flag | Default | Backend behavior |
|---|---|---|
| `no_breathwork` | `false` | Safety filter (§9.3) drops candidates with `type=breath`. Fallback (§9) swaps `breath_4_6` for `name_and_need`. |
| `reduced_motion` | `false` | No backend impact. The flag is stored on the user and returned in user-prefs responses; FE consumes it directly. |
| `private_mode` | `false` | All practice content (title + steps) is blurred on the FE practice overlay until the user taps "Reveal." Blanket rule for V1 — no per-practice sensitivity tagging. Backend echoes `private_mode_active: true` in `recommend-practice` and `practice/complete` responses so the FE knows to gate the overlay. |

**Why blanket-blur for `private_mode` in V1:** Private Mode is shoulder-surfer protection. Even ostensibly innocuous practices (e.g., `name_and_need`, `clarity_two_options`) can feel exposing when someone is reading over the user's shoulder. A simple "blur everything until tapped" rule is faster to implement, easier for users to predict, and removes the per-practice classification work from V1 scope. V2 can refine with sensitivity tags on individual practices if user feedback warrants.

**Telemetry:** `private_mode_reveal` fires (with `surface` field: `echo_signature`, `mirror_moment`, `chat`) each time the user taps to reveal. Useful for measuring how often Private Mode is actually engaged with.

---

## 11. Configuration Loading

Add to `core/config.py`:

```python
class ReflectionRoomSettings(BaseSettings):
    quiz_rules_path: str = "src/app/data/reflection/reflection_quiz_rules.v1.yaml"
    motif_mapping_path: str = "src/app/data/reflection/motif_mapping.v1.json"
    quiz_to_loop_seeding_path: str = "src/app/data/reflection/quiz_to_loop_seeding.v1.yaml"
    tone_library_path: str = "src/app/data/micro_practice/echo_signature_tone_library.v1.yaml"
    practice_rules_path: str = "src/app/data/micro_practice/echo_practice_rules.v1.yaml"
    practice_catalog_path: str = "src/app/data/micro_practice/micro_practices.v1.yaml"
    micro_practice_settings_path: str = "src/app/data/micro_practice/micro_practice.settings.v1.yaml"
    personalization_defaults_path: str = "src/app/data/micro_practice/personalization.defaults.v1.json"

    cache_config_files: bool = True  # in-memory cache; reload on file mtime change in dev
    default_user_tz: str = "America/New_York"  # fallback when user has no tz on record
```

All loaders should be lazy and cached (`functools.lru_cache` or a small registry). Hot-reload in dev via mtime watch is a nice-to-have.

---

## 12. Error Envelopes

Match the existing error envelope. If the existing pattern is FastAPI's default (`{"detail": "..."}`), use that. If the repo uses a custom envelope (`{"error": {"code": "...", "message": "..."}}` is common), match it.

Reflection-Room-specific error codes to standardize:

| HTTP | Code | When |
|---|---|---|
| 400 | `INVALID_QUIZ_ANSWER` | Enum mismatch |
| 400 | `LOOP_NOT_SUPPORTED` | Unsupported loop_id |
| 400 | `MOTIF_NOT_FOUND` | Override motif_id missing in mapping |
| 403 | `OVERRIDE_NOT_ALLOWED` | Quiz did not produce a tie |
| 404 | `NO_ACTIVE_LOOPS` | Snapshot empty when recommending |
| 404 | `NO_RULE_MATCHED` | Only when `fallback_enabled = false`. With V1 default (true), this never fires — the fallback practice is returned instead. |
| 409 | `ALL_CANDIDATES_FILTERED` | Only when `fallback_enabled = false`. With V1 default (true), this never fires — the fallback practice is returned instead. Include `Retry-After`. |
| 409 | `FALLBACK_ON_COOLDOWN` | Fallback fired but the fallback practice itself is within cooldown. Genuine "no practice for you right now" state. Include `Retry-After`. |
| 409 | `OVERRIDE_TAG_NOT_IN_TIE` | User-supplied override not in tied set |
| 500 | `CONFIG_LOAD_ERROR` | YAML/JSON failed to parse at startup |

---

## 13. Environment Variables

Add to `.env.example`:

```
# Reflection Room V1
REFLECTION_DEFAULT_USER_TZ=America/New_York   # used when user record has no tz and no X-User-Timezone header
REFLECTION_QUIZ_RULES_PATH=src/app/data/reflection/reflection_quiz_rules.v1.yaml
REFLECTION_MOTIF_MAPPING_PATH=src/app/data/reflection/motif_mapping.v1.json
REFLECTION_QUIZ_TO_LOOP_SEEDING_PATH=src/app/data/reflection/quiz_to_loop_seeding.v1.yaml
REFLECTION_TONE_LIBRARY_PATH=src/app/data/micro_practice/echo_signature_tone_library.v1.yaml
REFLECTION_PRACTICE_RULES_PATH=src/app/data/micro_practice/echo_practice_rules.v1.yaml
REFLECTION_PRACTICE_CATALOG_PATH=src/app/data/micro_practice/micro_practices.v1.yaml
REFLECTION_MICRO_PRACTICE_SETTINGS_PATH=src/app/data/micro_practice/micro_practice.settings.v1.yaml
REFLECTION_PERSONALIZATION_DEFAULTS_PATH=src/app/data/micro_practice/personalization.defaults.v1.json

# Tables (defaults are environment-suffixed at runtime)
DDB_REFLECTION_SESSIONS_TABLE=mc_reflection_sessions
DDB_ECHO_LOOP_STATE_TABLE=mc_echo_loop_state
DDB_PRACTICE_COMPLETIONS_TABLE=mc_practice_completions
DDB_USER_PERSONALIZATION_TABLE=mc_user_personalization
```

Add to `serverless.yml` IAM policy: include all 4 new tables and their GSIs.

---

## 14. DynamoDB Migration Scripts

Create `scripts/create_reflection_room_tables.py`. Pattern after the existing `create_*_tables*.py` scripts. Add to `setup-local.sh`:

```bash
python scripts/create_reflection_room_tables.py
python scripts/seed_reflection_config.py   # validates YAMLs parse
```

`seed_reflection_config.py` does no DB writes; it loads each config file and asserts schema validity. It's a fail-fast guard for CI.

---

## 15. Endpoint-to-Logic Map (one-line cheat sheet)

```
POST /reflection/quiz         → quiz_scorer + motif_mapper + loop_seeder        → reflection_session_repo.put + echo_loop_state_repo.upsert_many
GET  /echo/snapshot           → echo_loop_state_repo.query + tone_library       → SnapshotResponse
POST /echo/recommend-practice → snapshot + rule_matcher + safety + cooldown + personalizer
POST /practice/complete       → practice_completion_repo.put + state_updater + telemetry + snapshot rebuild
PUT  /me/reflection/room      → motif_mapper + reflection_session_repo.update_room_skin
```

---

## 16. Out of Scope for V1

These are deliberately deferred and should **not** be implemented in this pass:

- Real-time loop-state inference from conversation/usage signals. V1 uses **quiz seeding** (§4.8 + §8.3) plus practice-completion deltas. The seeding table is the entire producer.
- Echo Map rendering server-side (it's a client surface; backend just feeds the snapshot).
- Push notifications / nudges (telemetry slot exists, no engine).
- Multi-session aggregation (each session is a discrete row).
- A/B test framework on rule weights.
- Admin-side tuning of personalization weights.
- Real-time snapshot streaming (websockets) — V1 is request/response only.
