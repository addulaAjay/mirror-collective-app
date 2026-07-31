# Claude Code Prompt — Reflection Room V1 Implementation

This is the prompt to paste into Claude Code in your `mirror-collective-python-api` workspace. It assumes the four spec files in this folder are checked into the repo (or otherwise readable) at known paths.

---

## How to use this

1. Drop these four files into your repo, e.g. under `docs/reflection-room-v1/`:
   - `01_BACKEND_IMPLEMENTATION_SPEC.md`
   - `02_TASK_BREAKDOWN_AND_TESTS.md`
   - `03_UI_DEVELOPER_HANDOFF.md` (for reference/contract verification)
   - The original PDF (`Reflection_Room_Logic_Weighting_Dev_Handoff_V1`) if you want it inline.
2. Open Claude Code in the repo root.
3. Paste the prompt below. Claude Code will read the spec files, plan, and implement phase-by-phase.

You should expect Claude Code to take **multiple back-and-forth turns** to complete this. It's not a one-shot job. The phases in `02_TASK_BREAKDOWN_AND_TESTS.md` are designed so you can stop, review, and continue at phase boundaries.

---

## The Prompt

```
You are implementing Reflection Room V1 for the mirror-collective-python-api repo.

## Required reading (read these IN ORDER before writing any code)

1. docs/reflection-room-v1/01_BACKEND_IMPLEMENTATION_SPEC.md  — full backend spec, source of truth
2. docs/reflection-room-v1/02_TASK_BREAKDOWN_AND_TESTS.md     — phased work plan and test plan
3. docs/reflection-room-v1/03_UI_DEVELOPER_HANDOFF.md         — contracts FE will rely on (for verification); §12 has all Figma-confirmed UI copy
4. docs/reflection-room-v1/08_FIGMA_ALIGNMENT_DELTA.md        — record of which spec values came from Figma; §6.5 has the 3 confirmed micro-practice contents

Then explore the existing codebase, in this order:
  - src/app/api/                    (router and Pydantic patterns)
  - src/app/services/               (business logic + DAO style)
  - src/app/repositories/ (or wherever DDB DAOs live)
  - src/app/core/                   (config, security, error envelopes)
  - tests/                          (test layout)
  - scripts/create_*tables*.py      (DDB table creation pattern)
  - serverless.yml                  (resources block, IAM)
  - .env.example                    (env var conventions)

## Hard constraints

- DO NOT modify the existing MirrorGPT archetype quiz, conversation services, or auth.
- DO NOT introduce new loop families beyond the 6 listed in spec §1.
- DO NOT hard-code Mirror Moment button labels — use the matrix function.
- DO match the existing repo's: router shape, error envelope, settings access, DAO pattern, test layout.
  When in doubt about *style*, mirror what's already in the repo.
  When in doubt about *behavior*, follow the spec.
- ALL new endpoints must use the existing auth dependency (Cognito JWT). The Reflection Room flow has no anonymous fallback — all 5 endpoints require an authenticated user.
- ALL configuration must be loadable from files (the 7 YAML/JSON files in spec §4) — no inline literals.

## Build order

Follow Phase 0 → Phase 9 from 02_TASK_BREAKDOWN_AND_TESTS.md. After each phase, STOP and:
  1. Run `pytest tests/` and report results.
  2. Show me the file diff summary for that phase.
  3. Wait for me to say "continue" before starting the next phase.

If a phase reveals that an existing repo pattern conflicts with the spec, raise it as a question
before deviating from either. Don't silently invent.

## What "done" looks like for the whole task

- All exit criteria from Phases 0-9 met.
- All §17 acceptance tests passing (see 02_TASK_BREAKDOWN_AND_TESTS.md §B.4).
- Postman collection updated with the 5 new endpoints.
- New env vars in .env.example, .env.staging, .env.production.
- New tables in serverless.yml resources block with correct IAM.
- `./setup-local.sh` boots the local stack with all new tables and config files validated.
- Coverage on new modules ≥ 85%.

## Start

Begin with Phase 0. Confirm in your first response which existing patterns you'll mirror
(router, auth dep, error envelope, DAO style, test layout) by quoting 2-3 lines from each
to ground the references. Then plan Phase 0 work and ask any clarifying questions before
touching files.
```

---

## What to do if Claude Code goes off-script

A few likely failure modes and how to redirect:

**Claude Code starts implementing without reading spec files.**
> "Stop. Re-read all three spec files in `docs/reflection-room-v1/` before continuing. Tell me which sections are most relevant to the work you're about to do."

**Claude Code skips the existing-patterns inventory in Phase 0.**
> "Before any code, finish Phase 0.1: quote the existing FastAPI router shape, the existing error envelope, the existing DAO pattern, and the existing test fixture for DynamoDB Local. We need to mirror these."

**Claude Code adds a 7th loop family or invents new tone states.**
> "Spec §1 lists exactly 6 loop families and exactly 3 tone states. Roll back. The supported set is fixed for V1."

**Claude Code hardcodes Mirror Moment labels in the FE handoff verification.**
> Note: the FE handoff is read-only for Claude Code (it's a contract doc). If you find Claude Code editing it, redirect to backend-only changes. Mirror Moment labels are FE concern, but the backend should expose top-3 loops in the snapshot in the right order so the FE can compute them.

**Claude Code wants to wire up a real loop-state inference engine.**
> "Out of scope — see spec §16. V1 uses seeded state + practice-completion deltas. Add the dev-only POST /dev/echo/loop-state endpoint and move on."

**Claude Code wants to add an LLM call to the practice recommender.**
> "No. The recommender is deterministic for V1 — rule map + safety + cooldown + scoring. No OpenAI calls in this path."

**Claude Code asks 'should I create the staging tables now?'**
> "Yes for staging tables in serverless.yml. Don't actually deploy from your end — leave that to me."

---

## After Claude Code finishes

Before merging:

1. **Manual smoke test** of all 5 endpoints via Postman against staging.
2. **Run the FE contract tests** (if you have any) against the staging API to confirm payload shapes.
3. **Hand `03_UI_DEVELOPER_HANDOFF.md` to your UI dev** along with the staging URL.
4. **Tag this commit** as `reflection-room-v1` for easy rollback.
5. **Watch the telemetry events** for the first 48 hours — confirm they're firing at expected rates and contain only IDs/enums, no PII.

---

## Recommended additional connector access (would have made this spec sharper)

The spec was built from your PDF + the public README of your repo. To improve quality on V2 work, consider enabling:

### Figma MCP connector
**Why:** I could not see your design at https://www.figma.com/design/CKupz8fZOJEx3IQyUsm4ia/... because it requires authentication. With Figma access, I could:
- Validate that motif room-skin names match exactly what's in your design system.
- Confirm the empty/error/loading states copy matches what design has spec'd.
- Cross-check the Mirror Moment button positions and the Echo Map loop placements.
- Pull color tokens for the tone-state colors (amber/aqua/lavender) directly.

**To enable:** In Claude.ai, go to Settings → Connectors → search "Figma" → connect with your Figma account. Then in our next conversation, I can fetch frames from the file you shared.

### GitHub MCP connector
**Why:** I could only read the public README of your repo. I had to make educated guesses about your existing FastAPI router shape, error envelope, and DAO pattern. With repo access I could:
- Read the actual existing quiz engine and ensure the new Reflection Quiz parallels (not collides with) it.
- Confirm the Cognito auth dependency name and signature.
- See your existing test fixtures and align new tests exactly to them.
- Verify which DynamoDB DAO pattern is in use (raw boto3 vs. PynamoDB vs. custom wrapper).

**To enable:** In Claude.ai, go to Settings → Connectors → search "GitHub" → connect → grant access to the `mirror-collective-python-api` repo. With this, I can directly read source files instead of inferring from the README.

### What we can do without these
The current spec is implementation-ready. It instructs Claude Code to inventory existing patterns in Phase 0 and mirror them — that's a reasonable substitute. But the V2 iteration (loop inference engine, real-time signals) will benefit a lot from the direct access above.

---

## Quick Q&A

**Q: What if my repo's directory structure doesn't match `src/app/api/routers/`?**
A: It probably doesn't exactly. Tell Claude Code: "use the existing router directory; add new files there." The spec's directory tree is illustrative.

**Q: What if the existing error envelope is different from spec §12?**
A: Match the existing envelope. The spec lists the *codes* and *conditions* — those are what matter. Wrap them in whatever envelope the rest of the API uses.

**Q: What if Phase 5 takes more than 1.5 days?**
A: Probably the personalization scoring or the rule matcher. Both have nuance (decay, motif_any expansion). Push back to the next phase rather than rushing — the recommender is the riskiest module.

**Q: Should the dev endpoint `POST /dev/echo/loop-state` be in production?**
A: No. Gate it behind `ENVIRONMENT != "production"`. It should 404 in prod.

**Q: What's the rollback story?**
A: All five endpoints are net-new. Tables are net-new. Removing them shouldn't affect any existing endpoint. Tag the merge commit; revert to it if needed. The DDB tables can be left in place (they're not joined to anything else).
