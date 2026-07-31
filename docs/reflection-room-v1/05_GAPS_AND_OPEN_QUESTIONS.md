# Reflection Room V1 — Critical Gap Analysis

A direct read of the source PDF, the questions it doesn't answer, and the assumptions I made to keep the spec implementable. Use this in your stakeholder review.

Gaps are tiered:

- **Tier 1 — Blockers.** These will break V1 at runtime or at product review. Must answer.
- **Tier 2 — Important.** V1 can ship without these but will be visibly degraded. Strongly recommend answering.
- **Tier 3 — Assumptions I made.** Not gaps in the PDF, but my interventions. Flag for review.
- **Tier 4 — Deferrable.** Genuine concerns but acceptable to push to V2.

---

## Source-of-truth decisions

- **PDF V1 (Reflection_Room_Logic_Weighting_Dev_Handoff_V1, 4.27.26)** — authoritative for V1 build.
- **Figma "User Story for RR" V2 (1.6.26), node `1810-2276`** — reviewed 2026-05-03, **not adopted for V1**. The V2 user story proposes changes (motif-driven Mirror Moment, info icons, Echo Map "what changed" copy, overall summary line). These are documented in `08_FIGMA_ALIGNMENT_DELTA.md` for product visibility but are not part of V1 scope. Decision: stick with PDF.

---

## Tier 1 — Blockers

### 1. Loop-state inference is completely undefined ✅ RESOLVED (2026-05-03)

**Resolution from product:** The Echo Map can be empty for first-time users, and loop state is **driven by the quiz alone** for V1. No real-time inference engine, no NLP, no background ML. Quiz answers seed the initial state; practice completions mutate it from there.

**Implementation impact:**
- New config file: `data/reflection/quiz_to_loop_seeding.v1.yaml` (see backend spec §4.8) — defines the answer-to-(loop, tone) contribution table.
- New service: `services/reflection/loop_seeder.py` — runs inside `POST /reflection/quiz` after motif assignment.
- Backend spec §8.3 fully rewritten with the new algorithm, reseeding rules (now driven by midnight session expiry — see Tier 2 #7), and a worked example using the canonical "Spiral" quiz.

**What this resolves:**
- Echo Signature, Echo Map, and Mirror Moment will be populated for any user who took the quiz with a non-`grounded` Q1 answer.
- The "hollow V1" risk is gone. Even ambiguous quiz inputs will populate at least one loop in most cases.
- Recommender failures are now bounded — `NO_ACTIVE_LOOPS` only happens for users who hit `Q1=grounded` AND all other contributions sum below `min_seed_score=0.45`. That's a genuine "all quiet" state, not a system failure.

**What this creates (now Tier 2 #15 below):**
- The seeding table itself is content/clinical work. The mappings I drafted in §4.8 are V1 honest-best-effort and need product/clinical review.
- Need a confirmed test fixture for the canonical "Spiral" quiz to assert seeding output.

**Original problem (kept for context):**

> The PDF treated `/echo/snapshot` as input to every other system but never named the upstream signal. Without a producer, the snapshot would have returned `loops: []` for every user who hadn't completed practices, which would have made Echo Signature/Map/Moment effectively non-functional for new users.

---

### 2. The `motif_any` vocabulary doesn't match the motif system ⏳ APPLIED, awaiting product confirmation (2026-05-03)

**Provisional resolution:** Engineering has rewritten the three `motif_any` rules to use `loop_id` directly. See `06_OPEN_QUESTIONS_FOR_PRODUCT.md` Q1 for the proposal product is reviewing.

**Spec impact already applied:**
- `echo_practice_rules.v1.yaml` (§4.4) — three rules rewritten with `loop_id` clauses; `narrative_stage_in` removed.
- §8.4 — old `motif_any → loop_id` workaround table replaced with note that rule matching is now uniform.
- Test plan §B.2.5 — `test_rule_matcher.py` scenarios updated.
- Recommender tests — `test_motif_any_expansion` removed.

**If product reverses:** revert the three rule definitions in `echo_practice_rules.v1.yaml`, restore §8.4 mapping table, restore the deleted test. ~30 minutes of work.

**Original problem (kept for context):**

> The PDF treated `motif_any` as if it were a known tag system, but the values (`throat`, `silence`, `key`, etc.) aren't in the motif vocabulary defined by motif_mapping (`compass, mirror, blocks, spiral, feather, radiant_burst, waves, pyramid, water_drop, brick_stack, sprout`). PDF §3 explicitly forbids mixing motifs and loops, but §11.1 had three rules doing exactly that. The provisional resolution drops the contradiction by gating all rules on `loop_id`.

---

### 3. `narrative_stage` is required by a rule but never defined ⏳ APPLIED, awaiting product confirmation (2026-05-03)

**Provisional resolution:** The `narrative_stage_in` clause has been dropped from `self_silencing_v1` as part of the Q1 rule rewrite (Tier 1 #2). The `narrative_stage` field remains in the snapshot model as nullable for V2 forward-compatibility, but no V1 rule references it. See `06_OPEN_QUESTIONS_FOR_PRODUCT.md` Q2.

**Spec impact already applied:** Folded into the `echo_practice_rules.v1.yaml` rewrite (§4.4 of backend spec).

**If product reverses:** restore `narrative_stage_in: [Testing, Crossing]` to `self_silencing_v1`. But note: with no producer for `narrative_stage`, the rule never fires in V1 either way.

**Original problem (kept for context):**

> The PDF's `self_silencing_v1` rule required `narrative_stage_in: [Testing, Crossing]` but never defined the field's valid values, who populates it, or when transitions happen. With no producer in V1, the rule effectively shipped dead. The provisional resolution removes the gating clause so `self_silencing` loops actually surface practices.

---

### 4. Tone-state transitions are undefined ⏳ APPLIED, awaiting product confirmation (2026-05-03)

**Provisional resolution:** Ship V1 with practice-completion-driven transitions only. No automatic time-based decay. Initial tones are set by the quiz seeding table (§4.8 of backend spec). On `practice/complete` with `helpful=true`, if cumulative intensity drop within 24h is ≥ 0.05, tone moves to `softening`. Otherwise tones don't change within a session. At midnight, the session expires and the next quiz reseeds.

**Spec impact already applied:** §8.3 of backend spec already specifies this behavior. No further code changes needed unless product reverses.

**If product wants more dynamism:** the cheapest add is "after 8 hours of no engagement, `rising` softens to `steady`" — one timestamp comparison, ~half a day of work. Hold pending product feedback.

**Original problem (kept for context):**

> The PDF lists three valid tone states (`rising`, `steady`, `softening`) but never defines transitions. The whole copy and color system depends on tones being correct.

---

### 5. The "guarded fallback" practice is undefined ⏳ APPLIED, awaiting product confirmation (2026-05-03)

**Provisional resolution:** `fallback_enabled = true` with `breath_4_6` as the default fallback and `name_and_need` as the alternate for users with `no_breathwork=true`. See `07_FALLBACK_DEAD_END_ANALYSIS.md` for the dead-end use cases that drove this decision.

**"Guarded" interpretation:** the fallback respects the same safety filters as rule-driven recommendations (`no_breathwork`, `disallow_types`) and the same cooldown discipline (a fallback can be on cooldown if recently fired). No separate clinical-review gate.

**Spec impact already applied:**
- `echo_practice_rules.v1.yaml` (§4.4) — `fallback` block updated with practice IDs and `rule_id: fallback` for telemetry distinction.
- `micro_practice.settings.v1.yaml` (§4.6) — `fallback_enabled: true`.
- Recommender pseudocode (§9) — `_fallback_practice()` helper added; fires on both no-rule-matched and all-candidates-filtered paths.
- Error envelope (§12) — added `FALLBACK_ON_COOLDOWN` (409); marked `NO_RULE_MATCHED` and `ALL_CANDIDATES_FILTERED` as not firing under V1 default.
- Test plan — added 5 new recommender tests including the headline "Journey A heavy user → grief rising → fallback" regression test.
- UI handoff (§2.3) — updated error table; explained that `rule_id="fallback"` is the analytics signal.

**Why we didn't keep `fallback_enabled = false`:** The Mirror Moment button matrix has 18 (loop, tone) cells. Only 11 have a matching rule. Six cells — including `grief rising` and `grief steady` — have no rule. The seeding table maps `Q1=heavy` to grief rising, so a user answering "heavy" would tap the most prominent Mirror Moment button on first session and get a 404. That dead-end is unacceptable for the target audience.

**If product reverses:** flip `fallback_enabled` to `false` in both YAML files; restore the FE empty-state copy from journey B (already templated in `07_FALLBACK_DEAD_END_ANALYSIS.md`).

**Original problem (kept for context):**

> The PDF specified the fallback control (`fallback_enabled`) but never named the fallback practice itself, never defined "guarded," and never said whether the flag should be true or false at launch.

---

## Tier 2 — Important

### 6. Anonymous → authenticated migration ✅ RESOLVED / N/A (2026-05-03)

**Resolution from product:** The Reflection Room flow does not support anonymous users. All 5 endpoints require authentication (Cognito JWT). Users must sign in before entering the quiz.

**Implementation impact:**
- `mc_reflection_sessions.user_id` is always a Cognito `sub` (no `anon_<uuid>` prefix).
- No migration logic needed — there's no anonymous state to migrate.
- The `session_id` parameter on `GET /echo/snapshot` becomes optional (server falls back to user's most recent session if omitted).
- Frontend routes the user through sign-in *before* the Reflection Room entry point. The empty-state for not-yet-quizzed users still applies — but only after auth.

**What the original concern was:** the existing repo has anonymous→authenticated linking for the MirrorGPT archetype quiz. Without explicit guidance, we might have either reinvented that for Reflection Room or accidentally created two divergent migration paths. With anonymous off the table, this question is moot.

---

### 7. What is a "session"? ✅ RESOLVED (2026-05-03)

**Resolution from product:** A session lasts until the next **midnight in the user's IANA timezone**. If the user has no timezone on record, default to `America/New_York` (DST-aware "midnight EST").

**Implementation impact:**
- `mc_reflection_sessions` row gets two new fields: `user_tz` (IANA) and `expires_at` (ISO timestamp at next midnight).
- DDB TTL stays at 30 days (storage cleanup only). App logic uses `expires_at` to determine "active" vs "expired."
- Timezone resolution order: `X-User-Timezone` header → user record → `America/New_York` default.
- The PDF's `reuse_if_within_hours: 48` rule is **dropped**. Calendar day is the boundary.

**What this gives:** A clean mental model — "my Reflection Room resets at midnight." No awkward 48h rolling window. Across midnight, every quiz is a fresh check-in.

**What this changes for FE:** the existing 48h reuse behavior goes away. If the FE was caching session state on the assumption it was good for 48h, that needs updating. New behavior: session may flip to expired between any two requests if they straddle midnight in the user's tz.

---

### 8. "Meaningful state change" for the 48h reuse rule ✅ RESOLVED / N/A (2026-05-03)

**Resolution:** Mooted by the resolution of Tier 2 #7. The 48h rule is replaced by the midnight-expiry rule, which doesn't require a "meaningful state change" qualifier — calendar day is the boundary.

**Replacement behavior (within an active session):** Same quiz answers → no-op reuse. Different quiz answers → overwrite (motif + loops). Across midnight → fresh session, regardless.

---

### 9. The `practice_type` vocabulary ✅ RESOLVED (2026-05-03)

**Resolution (engineering decision):** Closed set of 5 values: `breath, somatic, cognitive, action, reflection`. Defined as a Pydantic `Literal` in `echo_models.py` (§5.2 of backend spec). All 17 V1 practices mapped to these types in §4.5 of the spec.

**Why these 5:** Standard wellness/somatic-coaching taxonomy. Each has clear safety implications (breath ↔ `no_breathwork`; somatic ↔ body-aware contexts; etc.). Maps cleanly to the existing 17 practices without forcing any to a poor fit.

**Forward compat:** `disallow_types` (per-user blocklist) accepts this same closed set. New types can be added via Literal extension + minor migration.

**Original problem (kept for context):** PDF only specified `"type": "breath"` (§5.3). The safety filter and `disallow_types` only work with a closed set, so this needed nailing down.

---

### 10. Time-of-day buckets ✅ RESOLVED (2026-05-03)

**Resolution (engineering decision):** Four buckets, computed in the user's local time via `user_tz` (or `default_user_tz` fallback):

- `morning`: [5, 11)
- `midday`:  [11, 16)
- `evening`: [16, 21)
- `night`:   [21, 5)  *(wraps midnight)*

Locked in `personalization.defaults.v1.json` (§4.7 of backend spec). The personalizer (§9.2) explicitly converts UTC `now` to the user's local time before bucketing.

**Why local time:** "Morning" means morning *to the user*. A user in Tokyo opening the app at 09:00 local is at midday UTC; their personalization should weight morning-completed practices, not midday ones.

**Original problem (kept for context):** PDF specified `time_of_day_match = +0.5` (§11.2) without defining buckets or whether local/UTC.

---

### 11. `recent_days_max=3` in the transition rule ✅ RESOLVED (2026-05-03)

**Resolution (engineering decision):** Checks `loop.last_seen >= now_utc - timedelta(days=3)`. UTC computation — a few hours of TZ offset doesn't materially affect a 3-day window. Documented in §8.3 of backend spec.

**V1 reality:** Quiz-driven seeding updates `last_seen` to `now` on every quiz, so this gate effectively always matches for engaged users. The clause is preserved for V2 forward compatibility (if/when an inference engine populates loops independently of quiz cadence, `last_seen` could become stale).

**Original problem (kept for context):** PDF specified `recent_days_max: 3` without naming what "recent" measures.

---

### 12. What changes in loop state on `helpful=true` ✅ RESOLVED (2026-05-03)

**Resolution (engineering decision):** Locked in §8.3 of backend spec with explicit edge cases. Summary:

- `helpful=true` → `intensity_score -= 0.10` (floor 0.0). If cumulative drop ≥ 0.05 in 24h: `tone_state=softening`, `recently_changed=true`.
- `helpful=false` → no state change. (Personalization scoring penalizes the practice for future picks.)
- `helpful=null` → no state change.
- **At intensity 0.0:** loop is dropped from snapshot output entirely. Row stays in DDB; reappears on next quiz reseed.
- `recently_changed` is transient — auto-clears on next mutation that doesn't qualify.

**Original problem (kept for context):** PDF only said "log the event and refresh snapshot" (§6.3 step 6) without defining what "refresh" actually changed.

---

### 13. Telemetry destination ✅ RESOLVED (2026-05-03)

**Resolution (engineering decision):** Defined a `TelemetryEmitter` Protocol in §10 of backend spec. V1 implementation is `StructuredLogEmitter` (logs to `telemetry.reflection` logger as JSON). PII filter at the boundary refuses non-scalar fields and caps strings at 64 chars.

**V2 swap path:** Drop in `MixpanelEmitter`, `SegmentEmitter`, `KinesisEmitter`, etc. — same Protocol, no call-site changes.

**Original problem (kept for context):** PDF specified 8 events (§14.1) but not the destination or schema, so V2 risk of needing to refactor every call site was real. The Protocol-based design eliminates that risk.

---

### 14. Private Mode scope ✅ RESOLVED (2026-05-03)

**Resolution (engineering decision):** V1 = blanket blur on **all** practice content (title + steps) until reveal. No per-practice sensitivity classification. Documented in §10.1 of backend spec.

**Why blanket:** Private Mode is shoulder-surfer protection. Even ostensibly innocuous practices can feel exposing when someone is reading the user's screen. A simple, predictable rule beats a clever-but-confusing classification system in V1. V2 can refine with per-practice sensitivity tags if user feedback warrants.

**Backend echoes `private_mode_active: true`** in `recommend-practice` and `practice/complete` responses so the FE knows to gate the overlay. Telemetry `private_mode_reveal` fires on each tap-to-reveal with `surface` field.

**Original problem (kept for context):** PDF said "blur sensitive practice content" without defining which practices are sensitive or whether blur auto-disables.

---

### 15. The override UX when `override_allowed=true` ✅ RESOLVED (2026-05-03)

**Resolution (engineering + FE decision):** Backend returns `tied_motifs: List[MotifPayload]` in `QuizResponse` when `override_allowed=true` — an array of full motif payloads for each tied option. FE renders a chooser ("Several paths feel equally true today. Which one calls you?") with one card per tied motif. User picks one; FE resubmits with `user_override_tag` set.

If user dismisses without picking, fall back to the deterministic alphabetical winner the API already returned (no second call needed). Both behaviors documented in §03 UI Developer Handoff Override UX section.

**Backend changes applied:** `QuizResponse.tied_motifs` field added (§5.1 of backend spec).

**Original problem (kept for context):** PDF said "allow manual user override" (§6.3 step 14) without specifying what the user sees, what they can pick from, or how the chooser is built.

---

## Tier 3 — Assumptions I Made (validate before launch)

These aren't gaps in the PDF — they're places where I had to make a call to keep the spec implementable. All need a content/clinical/design pass.

| # | What I assumed | Where | Owner | Blocks launch? |
|---|---|---|---|---|
| 16 | 10 of 11 motif `why_text` strings (only `spiral` is in the PDF) | `motif_mapping.v1.json` | Content | **Yes** |
| 17 | Step text for **14 of 17 micro-practices** (Figma confirmed `breath_4_6` / `breath_box_4` / `heart_hand_breath` on 2026-05-03 — see `08_FIGMA_ALIGNMENT_DELTA.md` §6.5) | `micro_practices.v1.yaml` | Clinical / content | **Yes** |
| 18 | All 18 tone-library reflection lines (none are in the PDF) | `echo_signature_tone_library.v1.yaml` | Content | **Yes** |
| 19 | Intensity label boundaries: `>=0.66 = High`, `>=0.33 = Medium`, else Low | `intensity_label_mapper.py` | Product | No (calibratable post-launch) |
| 21 | Dev-only `POST /dev/echo/loop-state` endpoint for QA seeding | spec §8.3 | Product (sanity check) | No |
| 22 | `PATCH /practice/complete/{id}/helpful` for late helpfulness votes | spec §6.6 | Product / UX | No (optional endpoint) |
| 23 | DDB TTL of 30 days on sessions | spec §3.1 | Legal / privacy | **Yes** |
| 24 | `recently_changed = true` if change within last 24h | spec §8.3 edge cases | Product | No |
| **27** | **Quiz → loop seeding contributions table** (the entire mapping in `quiz_to_loop_seeding.v1.yaml`) | new file in §4.8 of backend spec | Content / clinical / product | **Yes — highest priority. This table produces the entire feature's UX.** |
| 28 | Score-to-intensity normalization range `[0.50, 0.85]` | seeding config | Product (calibration) | No |

**Items removed since the original list:** #20 (motif_any → loop mapping — obsoleted by Q1 rewrite), #25 (time_of_day_buckets — resolved as Tier 2 #10), #26 (practice types — resolved as Tier 2 #9), #29 (reseeding rule — resolved as part of Tier 2 #7).

---

## Tier 4 — Deferrable / V2

These are real concerns but explicitly out of scope per PDF §16 or reasonable to defer:

- Real-time loop-state inference (the elephant in the room — Tier 1 #1)
- i18n / multi-language
- Rate limiting on `recommend-practice` and `practice/complete`
- GDPR right-to-delete / data export
- Offline practice queue (mobile)
- A/B test framework on rule weights
- WebSocket snapshot streaming
- Admin tooling for tuning personalization weights

---

## Internal Contradictions in the PDF

These are genuine inconsistencies in the source document that should be resolved in the next revision.

### C1. "Don't mix motifs and loops" vs. rules that do exactly that

§3 (V1 Non-Negotiables, item 1): *"Do not mix motifs and loops. Motifs come from the quiz. Loops drive Signature, Map, and Moment."*

§11.1 (Rule Map): 3 of 6 rules use `motif_any: [throat, silence, …]` instead of `loop_id`.

**Likely intended distinction:** loops drive *visual surfaces* (Signature, Map, Moment), but the *rule map* can use either signal. Worth restating clearly.

### C2. "Don't ship clarity/flow/crossing as loop families" vs. Mirror Moment using "Clarity"

§3: *"Do not ship 'clarity,' 'flow,' or 'crossing' as standalone V1 loop families."*

§13.2: Mirror Moment button label for `transition + steady` is "Reclaim Clarity."

These are reconcilable (button label is copy, not a loop family) but worth flagging in code review so a future engineer doesn't "fix" the inconsistency.

### C3. First-vs-subsequent quiz distinction has no API hook

§6.4: *"The first onboarding quiz can assign the user's core room. Later entries reassign only the session motif, not the core room."*

§15: API has `POST /reflection/quiz` — same endpoint, no `onboarding=true` flag.

**Question:** How does the API know if it's the first quiz? My current spec assumes it's the first if the user has zero prior sessions. That works for fresh sign-ups but is awkward if a user wipes data.

### C4. Reflection Room shell missing a Loading state

§7 specifies an Error state for room load. §10.4 specifies Loading + Empty + Error for Signature; §12.3 same for Map.

**Implication:** PDF §17 acceptance item 14 says "Empty, loading, and error states exist for Room, Signature, and Map." But §7 only specifies the error state for the Room shell. Is there meant to be a Loading state on the Reflection Room itself, or does §7 trust the post-quiz transition to feel instantaneous?

**Recommendation:** Add a brief loading state to the Reflection Room shell (the quiz call can take ~500ms+).

---

## Recommended Discussion Sequence

If you have a 30-minute meeting with product / design / clinical, run it in this order (Tier 1 #1 already resolved):

1. **(8 min) Tier 1 #2 + #3 — `motif_any` tags and `narrative_stage`.** Resolve the rule-map vocabulary. Particularly: do `throat`, `silence`, `key`, `bridge` etc. correspond to the new quiz-driven loops, or are they meant to come from a different signal that V1 doesn't have? If the latter, the affected rules (`self_silencing_v1`, `agency_key_low_v1`, `transition_bridge_v1`) won't fire reliably in V1.
2. **(5 min) Tier 1 #4 + #5 — Tone transitions and fallback.** Confirm the practice-completion deltas in §8.3 of the backend spec match product intent. Decide if `fallback_enabled` should be true for V1 (recommended: yes, with a single safe practice like `breath_4_6`).
3. **(5 min) Tier 2 #6 + #7 — Migration and session lifetime.** Backend impact.
4. **(7 min) Tier 3 review — assumptions list.** Most importantly the **seeding table** (Tier 3 #27, new) — content/clinical needs to look at it because it's the producer of the entire UX.
5. **(5 min) Buffer / decisions log.**

---

## What I Recommend Doing Right Now

1. **Before Claude Code starts:** Get answers to Tier 1 #2, #3, #5. The seeding work (Tier 1 #1 resolution) means we'll have data flowing, but rules that need `narrative_stage` or undefined `motif_any` tags won't fire — confirm whether to ship those rules at all.
2. **In parallel with backend build:** Get content/clinical review on Tier 3 items, **especially the new #27 seeding table** — it's now the producer of the entire feature's UX. Bad seeding mappings = wrong loops surfaced. Schedule this review for week 1 of the build.
3. **Defer Tier 4 explicitly.** Put a note in the PR description: "V2 work tracked in [issue]. V1 ships without these and that's intentional."

A V1 launch with quiz-driven loop seeding + the 17 micro-practices + the recommendation engine is a real, defensible product. The honest framing for V1 is: "you take a quiz that reflects what's loud in you right now; we surface a few loops and offer a small practice for each; practices reduce the volume." That's coherent.
