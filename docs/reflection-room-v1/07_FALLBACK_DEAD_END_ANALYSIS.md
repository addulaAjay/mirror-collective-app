# `fallback_enabled = false` — Dead-End Use Case Analysis

**Status:** ✅ **DECISION APPLIED 2026-05-03** — `fallback_enabled` is now `true` with `breath_4_6` (default) and `name_and_need` (no-breathwork alternate). All dead-ends below are addressed by the fallback. Document retained as the rationale record.

**Question being answered:** With the original spec setting (`fallback_enabled = false`), what user journeys hit a dead-end (404 from `/echo/recommend-practice`)?

**Why this matters:** Mirror Moment renders a button for every active loop, and Echo Signature renders a CTA per card. If those buttons/CTAs lead to 404s, the user taps and nothing happens. That's the dead-end.

---

## The matrix: Mirror Moment buttons vs. rule coverage

The Mirror Moment label matrix (PDF §13.2) has **18 cells** — 6 loops × 3 tones. The FE renders a button label for every cell. The post-Q1-fix rule map covers only **11 of those cells**. Seven cells have **no rule**.

### Rule coverage by (loop, tone)

| Loop | Rising | Steady | Softening |
|---|---|---|---|
| **pressure** | ✅ `pressure_loop_v1` (≥0.60) | ✅ `pressure_loop_v1` (≥0.60) | ❌ **NO RULE** |
| **overwhelm** | ✅ `overwhelm_v1` (≥0.50) | ✅ `overwhelm_v1` (≥0.50) | ❌ **NO RULE** |
| **grief** | ❌ **NO RULE** | ❌ **NO RULE** | ✅ `grief_softening_v1` |
| **self_silencing** | ✅ `self_silencing_v1` (≥0.50) | ✅ `self_silencing_v1` (≥0.50) | ❌ **NO RULE** |
| **agency** | ✅ `agency_key_low_v1` (≥0.45) | ✅ `agency_key_low_v1` (≥0.45) | ❌ **NO RULE** |
| **transition** | ✅ `transition_bridge_v1` (≥0.45) | ✅ `transition_bridge_v1` (≥0.45) | ✅ `transition_bridge_v1` (≥0.45) |

### Gap summary

**6 cells with no rule** (note: the count differs from "7" because grief has only one rule covering only softening, so 2 cells fail; transition is fully covered):

1. **Pressure softening** ("Soften Pressure" button)
2. **Overwhelm softening** ("Soften Overwhelm" button)
3. **Grief rising** ("Face Grief" button) ⚠️
4. **Grief steady** ("Reclaim Presence" button) ⚠️
5. **Self-silencing softening** ("Soften Silence" button)
6. **Agency softening** ("Rest in Agency" button)

Plus a **second class of 404s**: cells where a rule exists but `min_strength` is not met. These aren't matrix cells — they're per-user state.

---

## User journeys that hit dead-ends

### Journey A — "Heavy" user (will happen daily) ⚠️

**Profile:** User answers Q1=`heavy`, Q4=`soothing`. Per the seeding table, this produces:
- `grief, rising, ~0.80`
- `overwhelm, rising, ~0.50`
- `self_silencing, rising, ~0.55` (from Q4=soothing)

**What they see:**
- Echo Signature top card: **Grief — Rising — High**
- Echo Map: grief is the closest loop, glowing amber
- Mirror Moment: top button is **"Face Grief"**

**What happens when they tap:**
- `POST /echo/recommend-practice` with `selected_loop=grief`
- Backend evaluates rules. `grief_softening_v1` requires `tone=softening` — fails. No other grief rule exists.
- **404 NO_RULE_MATCHED**

**Result:** The user *most needing* support — the one who said "I'm arriving heavy and want soothing" — taps the most prominent button on the screen and gets nothing.

This is the worst dead-end because it's deterministic: every "heavy" user hits it on first session.

---

### Journey B — "Numb" user (will happen daily) ⚠️

**Profile:** User answers Q1=`numb`. Seeding produces:
- `self_silencing, steady, ~0.65`
- `grief, steady, ~0.40` (below threshold; not seeded)

Wait — let me re-check. `min_seed_score=0.45`. With `numb` contributing 0.40 to grief and Q2/Q3/Q4 potentially adding more, grief may or may not seed depending on other answers. Let's say they also answered Q2=`stillness`, Q3=`mirror`, Q4=`presence`:
- `self_silencing, steady, ~0.95` (numb 0.65 + mirror 0.45 = 1.10 normalized)
- `grief, steady, ~0.74` (numb 0.40 + presence 0.28 ≈ 0.68 → just over threshold)
- `pressure, softening, ~0.50` (stillness 0.40)

**What they see:**
- Echo Signature top card: **Self-Silencing — Steady — High**
- Mirror Moment: **"Reclaim Voice"**

**What happens when they tap "Reclaim Voice":**
- ✅ `self_silencing_v1` matches (steady ≥ 0.50). Returns a practice.

**What if they instead tap "Reclaim Presence" (grief, steady)?**
- Grief steady has no rule.
- **404 NO_RULE_MATCHED**

**What if they tap "Soften Pressure"?**
- Pressure softening has no rule.
- **404 NO_RULE_MATCHED**

So this user has *one* working button out of three.

---

### Journey C — Returning user with practiced loops (likely)

**Profile:** User completed several practices throughout the day, dropping intensities. Their snapshot is now:
- `pressure, softening, 0.45` (after a successful pressure practice)
- `overwhelm, softening, 0.40` (same)
- `grief, softening, 0.35` (same — below threshold, may not appear)

**What they see:**
- Mirror Moment: "Soften Pressure", "Soften Overwhelm" (and possibly "Soften Grief")

**What happens:**
- "Soften Pressure" → 404
- "Soften Overwhelm" → 404
- "Soften Grief" → ✅ matches `grief_softening_v1`

**Result:** The engaged user — the one we *want* to retain — sees their progress on the map but can't get a practice for the loops they've been working on.

---

### Journey D — Below-threshold loops (common)

**Profile:** A user with mild-to-moderate state:
- `pressure, rising, 0.55` (below the 0.60 threshold)

**What they see:**
- Echo Signature shows pressure with a "Try a 2-min practice" CTA.
- Mirror Moment: **"Ease Pressure"**

**What happens when they tap:**
- `pressure_loop_v1` requires `min_strength=0.60`. Fails.
- **404 NO_RULE_MATCHED**

**Result:** A loop is visible and labeled "Pressure rising," the user wants help, taps, gets nothing. Threshold-based gating creates dead-ends invisible from the FE.

---

### Journey E — "Curious" user with isolated agency (less common)

**Profile:** Q1=`curious`, all other answers neutral. Seeding produces:
- `agency, rising, ~0.65`

**What they see:**
- Echo Signature: **Agency — Rising — High**
- Mirror Moment: only **"Ignite Agency"**

**What happens:**
- ✅ `agency_key_low_v1` matches (rising ≥ 0.45).

**No dead-end here.** This is what the system does well.

---

### Journey F — Cooldown wipeout on a single-rule loop (rare-ish)

**Profile:** User has only `grief, softening, 0.55` active. They complete `heart_hand_breath`. Then a few hours later they revisit and tap "Soften Grief" again.

**What happens:**
- Rule `grief_softening_v1` matches.
- Cooldown filter removes `heart_hand_breath` (12h cooldown not yet elapsed).
- Two candidates remain: `name_what_softened`, `gratitude_molecule`.
- They complete one of those too.
- Third visit: all three candidates within cooldown.
- **409 ALL_CANDIDATES_FILTERED** (with `Retry-After` header).

**Note:** This is a 409, not a 404. Different error code, different FE handling. But still functionally a dead-end for the immediate moment. PDF §11.3 fallback talk applies here too — would the fallback kick in on 409 or only on 404? Worth clarifying with product. (My recommended fallback design only fires on 404; cooldown 409s remain.)

---

## Frequency estimate

| Journey | Dead-end likelihood | Severity |
|---|---|---|
| A — Heavy/Soothing user → grief rising | **100% of heavy users on first quiz** | High — the user most in need hits the dead-end first |
| B — Numb user → mixed buttons | **Frequent, partial** — 2 of 3 Mirror Moment buttons fail | Medium |
| C — Practiced user with all-softening | **Common after engagement** | Medium — punishes the engaged user |
| D — Below-threshold loops | **Common** for users with mild state | Medium-low — invisible to FE, harder to debug |
| E — Curious / clean cases | **Never** | None (works fine) |
| F — Cooldown wipeout | **Rare** in single sessions | Low |

**The headline:** Journey A alone is enough to make the case. Any user who answers "heavy" to Q1 — likely a sizeable fraction of the target audience for a reflection app — hits a dead-end on their *first* tap of their *first* session.

---

## Recommendation

**Switch to `fallback_enabled = true` with the configuration below.** The dead-ends from Journeys A–D are concentrated in exactly the user states this product is meant to serve.

```yaml
fallback:
  enabled: true
  default_practice_id: breath_4_6
  alternate_for_no_breathwork_id: name_and_need
```

**What this changes:**
- 404 NO_RULE_MATCHED becomes a 200 returning the fallback practice.
- The fallback respects the same safety filters: if `no_breathwork=true`, return `name_and_need` (cognitive type) instead.
- Cooldowns still apply: if the fallback itself is on cooldown, the recommender returns 409 (which is fine; that's a real "you've done a lot today" state, not a system gap).

**What this preserves:**
- The personalization story stays honest: when there's a matching rule, the user gets a personalized practice. When there isn't, they get a centering breath.
- Telemetry can distinguish: `practice_complete` events have a `rule_id` field — the fallback's rule_id is `"fallback"`, so analytics will show how often the fallback is firing. If it's >20% of completions, that's a signal the rule map needs more rules.

**Cost:** about 1 hour of work on top of the existing recommender — a single `if not matched_rules: if settings.fallback_enabled: return fallback_with_safety_filter()` branch.

---

## Alternative: keep `fallback_enabled = false`

If you decide against the fallback, the FE has two choices for handling 404s gracefully:

1. **Pre-filter buttons client-side** — call `recommend-practice` with `dry_run=true` for each Mirror Moment button before rendering, hide the buttons that would 404. Adds 3 round-trips per Mirror Moment render. Probably too expensive.

2. **Friendly 404 copy** — when a 404 returns, show "Nothing to surface for this one right now — try a different loop or come back tomorrow." Low effort, but turns engaged users away.

Neither is as good as just providing a fallback. The fallback is the cheaper, more honest choice.

---

## Action

Reply with one of:

**(A)** "Apply `fallback_enabled = true` with breath_4_6 + name_and_need as alternate" — I'll update the spec.

**(B)** "Keep `fallback_enabled = false`, add friendly 404 copy" — I'll update the UI handoff doc with the empty-state copy.

**(C)** Some other configuration — let me know.
