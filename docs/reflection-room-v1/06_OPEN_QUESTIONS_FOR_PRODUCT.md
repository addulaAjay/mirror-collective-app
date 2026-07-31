# Reflection Room V1 — Open Questions for Product / Design / Clinical

**Context:** Engineering has a complete implementation spec ready (`01_BACKEND_IMPLEMENTATION_SPEC.md`). Four blocking questions remain from the source PDF (`Reflection_Room_Logic_Weighting_Dev_Handoff_V1`). This doc has the questions, the exact PDF passages they come from, what's at stake, and a recommended resolution for each.

**Time to discuss:** ~30 minutes if alignment exists; one of these will likely surface a deeper product call.

**Already resolved (for context):**
- ✅ Loop state is driven by the quiz alone for V1 (no inference engine)
- ✅ All 11 motif names finalized (`compass, mirror, blocks, spiral, feather, radiant_burst, waves, pyramid, water_drop, brick_stack, sprout`)
- ✅ Anonymous flow is out of scope — Reflection Room is auth-only
- ✅ Session lifetime = until next midnight in user's timezone (default `America/New_York`)

---

## Q1. The `motif_any` rule vocabulary doesn't match anything  ⏳ APPLIED, awaiting confirmation

### PDF references

**§3, V1 Non-Negotiables, item 1:**
> Do not mix motifs and loops. Motifs come from the quiz. Loops drive Signature, Map, and Moment.

**§11.1, Rule map conditions** — three of six rules gate on tags called `motif_any`:

| Rule | `motif_any` value |
|---|---|
| `self_silencing_v1` | `[throat, silence, not_speaking]` |
| `agency_key_low_v1` | `[agency_low, stuck, key]` |
| `transition_bridge_v1` | `[bridge, transition]` |

### What's wrong

These tags (`throat`, `silence`, `key`, `bridge`, etc.) **are not motifs**. The 11 finalized motifs are physical/symbolic objects: `compass, mirror, blocks, spiral, feather, radiant_burst, waves, pyramid, water_drop, brick_stack, sprout`. And §3 explicitly forbids mixing motifs and loops. So three rules contradict the rule on the previous page.

### What's at stake

If we ship as written, **three of six loop families have no practice rule that fires** (`self_silencing`, `agency`, `transition`). Users with active loops in those families will get `NO_RULE_MATCHED` errors. That's half the feature broken.

### The question

What produces these `motif_any` tags? Three options:

**(a)** They're outputs of a separate narrative-tag inference engine that V1 doesn't have. → The three rules will never fire in V1 unless we ship that engine too (out of scope per our earlier decision).

**(b)** They were intended to be `loop_id`s written in older language. → Rewrite the rules to use `loop_id` (`self_silencing`, `agency`, `transition`) and drop `motif_any` entirely.

**(c)** They're a planned V2 feature to be hard-stripped from V1 and shipped separately later.

### Recommendation: (b)

Rewrite the three rules. Concrete proposal:

```yaml
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
```

**What this gains:** all 6 loops have working rules in V1. The §3 contradiction is gone. Folds Q2 (below) into the same fix.

**What we lose:** the narrative specificity hinted at by `throat/silence/key/bridge` (e.g., "you've been near a key moment for 3 days — try this *unlocking* practice"). For V1, we get generic-but-working. V2 can layer on richer rules using a new field if/when an inference engine exists.

---

## Q2. `narrative_stage` is referenced by a rule but never defined  ⏳ APPLIED, awaiting confirmation

### PDF references

**§5.2, snapshot payload model:**
> `"narrative_stage": null` (and the model says it's nullable)

**§11.1, rule `self_silencing_v1`:**
> `narrative_stage_in: [Testing, Crossing]`

### What's wrong

The rule requires `narrative_stage` to be `Testing` or `Crossing`, but the PDF never defines:
- The complete set of valid `narrative_stage` values
- What populates the field
- When stages transition

### What's at stake

For V1, `narrative_stage` is always `null` (we have no producer). So the `self_silencing_v1` rule **never matches in V1** — even after we fix Q1. Self-silencing as a loop family ships dead unless we resolve this.

### The question

For V1, is `narrative_stage`:

**(a)** Populated by the same inference engine V1 doesn't have? → Drop the `narrative_stage_in` clause from rules in V1 (folds into Q1 recommendation).

**(b)** Populated by some signal we haven't identified yet?

**(c)** Intentionally null for V1, with the rule clause expected to be a no-op? → Same fix: drop the clause for V1.

### Recommendation: (a/c) — drop the field from V1 rules

If we accept the Q1 recommendation, this is already handled — the rewritten `self_silencing_v1` rule above doesn't reference `narrative_stage` at all. Keep the field in the snapshot model as nullable for forward compatibility; remove it from V1 rule conditions.

---

## Q3. Tone-state transitions are never defined  ⏳ APPLIED, awaiting confirmation

### PDF references

**§8, Loop System:**
> Tone states allowed in V1: `rising`, `steady`, `softening`.

**§10.1, Echo Signature card front** — uses `tone_state` directly.

**§12.1, Echo Map color coding:**
> amber = rising, aqua = softening, lavender = steady

**§13.2, Mirror Moment label matrix** — different button labels for each (loop, tone) combination across all 6 loops.

### What's wrong

The PDF lists the three valid states but never defines when a loop transitions between them. Tone drives:
- Echo Signature reflection lines (different per tone)
- Echo Map colors
- Mirror Moment button labels (the whole 6×3 matrix)

### What's at stake

The whole copy and color system depends on tones being correct. If transitions are wrong, the wrong reflection line shows on Echo Signature; the wrong color on Echo Map; the wrong button label on Mirror Moment.

### The question

What's the rule for tone-state transitions? My current spec assumes:

1. **Initial tone** is set by the quiz seeding table (§4.8 of backend spec). Each Q answer contributes to a `(loop, tone)` bucket; tone with highest score wins.
2. **`helpful=true` on a practice** → if cumulative intensity drop within 24h is ≥0.05, tone becomes `softening` and `recently_changed=true`.
3. **`helpful=false`** → tone unchanged.
4. **`helpful=null`** → tone unchanged.
5. **No automatic time-based decay.** Within a session (until midnight), tone only changes via practice completions.

### Specific things to confirm

- Should tone **age out** automatically? E.g., if a loop is `rising` but no practice is taken for 24h, should it drift to `steady`? If yes, with what decay model?
- Is there a path for a loop to **re-enter `rising`** after `softening`? E.g., user dismisses a helpfulness vote, loop sits idle, next day's quiz reseeds it.
- Should `steady` ever auto-promote to `rising`? (Probably not, but confirm.)

### Recommendation

Ship V1 with the assumptions above (no time decay, tone moves only via practice completions). Reasoning: it's deterministic, debuggable, and a user who never engages stays on the same tone-color-copy throughout the day, which is fine — they reset at midnight anyway. We can layer in decay in V2 if it feels stale.

If product wants more dynamism in V1, the cheapest add is: **after 8 hours of no engagement, `rising` softens to `steady`**. That's one timestamp comparison; ~half a day of work.

---

## Q4. The "guarded fallback" practice is undefined  ⏳ APPLIED, awaiting confirmation

### PDF references

**§11.3, step 8:**
> If no rule matches, use the guarded fallback only if that fallback is explicitly enabled. Do not generate ad hoc practices on the frontend.

**Settings file** (`micro_practice.settings.v1.yaml`, §4.6 of backend spec) — currently has `fallback_enabled: false`.

### What's wrong

The PDF tells us **how** to enable a fallback but never defines:
- **What practice IS the fallback.**
- What "guarded" means (safety check? clinical review gate? user-flag-aware?).
- Whether `fallback_enabled` should be `true` for V1.

### What's at stake

When a user has active loops but somehow no rule matches (rare but possible — e.g., all candidates filtered by cooldowns, or a `narrative_stage` gate failing per Q2), the recommend endpoint returns 404. The frontend then has to show "Nothing to surface right now" and hide the practice CTA. That's a soft dead-end.

### The question

For V1, do we want:

**(a) `fallback_enabled = true` with `breath_4_6` as the safe fallback** (subject to `no_breathwork` flag — falls through to a non-breath alternative if the user has the flag). → Users always get *something* when they tap the CTA. Tradeoff: feature feels less personalized in edge cases.

**(b) `fallback_enabled = false`** (current spec). → Users see "Nothing to surface right now" and the CTA is hidden. Tradeoff: occasional dead-ends.

**(c) `fallback_enabled = true` with a special "centering breath" that bypasses the practice catalog entirely.** → Simplest backstop; no rule-matching pretense.

### Recommendation: (a) with `breath_4_6` and a non-breath alternate

```yaml
fallback:
  enabled: true
  default_practice_id: breath_4_6
  alternate_for_no_breathwork_id: name_and_need
```

Rationale: this avoids dead-ends, keeps the personalization story honest (we're explicit that the fallback is generic), and respects the `no_breathwork` user flag. "Guarded" then means: the fallback respects safety filters (`no_breathwork`, `disallow_types`) just like a regular recommendation. No new clinical review gate needed.

---

## Decision Log Template

Copy this into your meeting notes:

```
Q1 (motif_any vocabulary): [accept (b) rewrite to loop_id  /  alternative: ____]
Q2 (narrative_stage):       [accept (a) drop from V1 rules  /  alternative: ____]
Q3 (tone transitions):      [accept current spec  /  add 8h auto-soften  /  alternative: ____]
Q4 (fallback):              [accept (a) breath_4_6 + alternate  /  (b) keep disabled  /  (c) special centering breath  /  alternative: ____]

Other open questions raised in meeting:
1.
2.

Action items:
- [ ] Engineering to update spec sections per decisions
- [ ] Content/clinical to review motif why_text + practice steps + tone library reflection lines
- [ ] PM to confirm seeding table mappings (Tier 3 #27 in 05_GAPS_AND_OPEN_QUESTIONS.md)
```

---

## What happens after this meeting

Once Q1–Q4 are answered:
1. Engineering updates `01_BACKEND_IMPLEMENTATION_SPEC.md` with the decisions (small, surgical edits).
2. The remaining gaps (Tier 2 + Tier 3) are non-blocking — they get addressed during the build, not before it.
3. Claude Code can start Phase 0 (repo onboarding + scaffolding) per `04_CLAUDE_CODE_PROMPT.md`.

Total estimated build time after this meeting: ~7 working days for one engineer with Claude Code, per the phased breakdown in `02_TASK_BREAKDOWN_AND_TESTS.md`.
