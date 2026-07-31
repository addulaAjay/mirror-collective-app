# Reflection Room V1 — Kickoff Guide

> **You are here.** All 10 spec docs are written. Now we ship.
>
> Two repos, two Claude Code sessions, one feature. This guide gets both running in ~5 minutes.

---

## 0. What you need before starting

- The 10 spec docs downloaded to a single local folder. Suggested: `~/Downloads/reflection-room-v1-docs/` or anywhere convenient. Set this in your shell:

```bash
export RR_DOCS=~/Downloads/reflection-room-v1-docs
ls "$RR_DOCS"
# Should list: 00_README.md ... 09_FRONTEND_CLAUDE_CODE_PROMPT.md (10 files)
```

- Claude Code installed and working in your terminal (`claude --version`).
- Both repos cloned at the paths you specified:
  - `/Users/ajayaddula/mc_workspace/mirror_collective_python_api`
  - `/Users/ajayaddula/mc_workspace/mirror_collective_app`

---

## 1. Backend repo prep (~1 minute)

```bash
cd /Users/ajayaddula/mc_workspace/mirror_collective_python_api

# Sync main, branch off
git checkout main
git pull --rebase origin main
git checkout -b feat/reflection-room-v1

# Drop the spec docs into the repo
mkdir -p docs/reflection-room-v1
cp "$RR_DOCS"/*.md docs/reflection-room-v1/

# Sanity check
ls docs/reflection-room-v1/
# Should show all 10 .md files

# Commit the spec set
git add docs/reflection-room-v1/
git commit -m "docs: add Reflection Room V1 spec set (10 documents)

Source-of-truth set for the Reflection Room V1 backend build:
  - Backend implementation spec
  - Task breakdown + tests
  - UI developer handoff
  - Claude Code build prompts (FE + BE)
  - Gaps & open questions
  - Open questions for product
  - Fallback / dead-end analysis
  - Figma alignment delta
"

# Optional: push the branch so it's visible to the team
git push -u origin feat/reflection-room-v1
```

---

## 2. Frontend repo prep (~1 minute)

```bash
cd /Users/ajayaddula/mc_workspace/mirror_collective_app

# Sync main, branch off
git checkout main
git pull --rebase origin main
git checkout -b feat/reflection-room-v1

# Drop the spec docs (same set — 10 files; FE primarily uses 00, 03, 06, 08, 09)
mkdir -p docs/reflection-room-v1
cp "$RR_DOCS"/*.md docs/reflection-room-v1/

# Commit
git add docs/reflection-room-v1/
git commit -m "docs: add Reflection Room V1 spec set (10 documents)

Source-of-truth set for the Reflection Room V1 frontend build.
Primary FE references: 03_UI_DEVELOPER_HANDOFF.md (esp. §12),
08_FIGMA_ALIGNMENT_DELTA.md, 09_FRONTEND_CLAUDE_CODE_PROMPT.md.
"

git push -u origin feat/reflection-room-v1
```

---

## 3. Launch Claude Code — Backend

```bash
cd /Users/ajayaddula/mc_workspace/mirror_collective_python_api
claude
```

When Claude Code opens, **paste the entire contents of** `docs/reflection-room-v1/04_CLAUDE_CODE_PROMPT.md` **section "The Prompt"** (the fenced block starting `You are implementing Reflection Room V1 for the mirror-collective-python-api repo...`) as your first message.

Claude Code will:
1. Read the 4 required docs.
2. Explore the repo (router, services, repositories, core, tests, scripts, serverless.yml, .env.example).
3. State Phase 0 in 5 bullets.
4. **Stop** and wait for you to say `go`.

Reply `go` to start Phase 0.

After each phase Claude Code will:
- Run `pytest tests/`, report.
- Show file diff summary.
- **Stop** and wait for you to say `continue`.

---

## 4. Launch Claude Code — Frontend (separate terminal window)

```bash
cd /Users/ajayaddula/mc_workspace/mirror_collective_app
claude
```

Paste the contents of `docs/reflection-room-v1/09_FRONTEND_CLAUDE_CODE_PROMPT.md` **section "The Prompt"** (the fenced block starting `You are implementing the Reflection Room V1 feature in this repo (the mirror_collective_app frontend)...`) as your first message.

Same protocol: it explores, proposes Phase 0, stops, waits for `go`.

---

## 5. Cadence — how the two run together

**You can run both in parallel.** They sync at Phase 8 (FE) / staging-deploy (BE).

| Backend phase | Frontend phase | Why they pair |
|---|---|---|
| Phase 0 — scaffolding | Phase 0 — scaffolding | Independent, run in parallel |
| Phase 1 — config loaders | Phase 1 — mock API client | FE mock matches BE response shapes; both reference the same spec §5. |
| Phase 2 — data models | Phase 2 — Welcome + Landing | Independent |
| Phase 3 — services | Phase 3 — Quiz flow | FE consumes BE spec §5.1 contract; FE still on mock. |
| Phase 4 — endpoints | Phase 4 — Echo Signature | FE on mock; BE has endpoints behind auth. |
| Phase 5 — recommendation engine | Phase 5 — Practice overlay | FE on mock for /recommend-practice. |
| Phase 6 — telemetry | Phase 6 — Echo Map | Independent |
| Phase 7 — IaC + DDB | Phase 7 — Mirror Moment | FE on mock. |
| Phase 8 — staging deploy | Phase 8 — backend integration | **Sync point.** BE deployed to staging; FE switches mock → real client. |
| Phase 9 — load test + monitoring | Phase 9 — polish + states | Independent |

**Practical pacing:** if you're solo, do BE Phase 0 → BE Phase 1 → switch to FE Phase 0 → FE Phase 1, alternating. Or do BE end-to-end first if you'd rather not context-switch (FE is mostly mock-able anyway).

---

## 6. When something looks wrong

**Claude Code starts inventing UI copy.**
> Stop. Tell it: "Use only strings from §12 of 03_UI_DEVELOPER_HANDOFF.md. If a string isn't there, mark a TODO and continue — don't invent."

**Claude Code hardcodes the 18 Mirror Moment button labels.**
> Stop. Tell it: "Generate from the matrix function in §6.2 of the UI handoff. The 18 labels must come from one (loop, tone) function, not 18 string constants."

**Claude Code modifies the existing MirrorGPT quiz / chat / archetype code.**
> Stop. Hard rule. The Reflection Room is a parallel system — see Hard Constraints in the prompt.

**Claude Code asks for something we deferred to Tier 3.**
> Tell it: "Use the placeholder values currently in `motif_mapping.v1.json` / `micro_practices.v1.yaml` / `echo_signature_tone_library.v1.yaml`. Tier 3 #16/#17/#18 are content gaps owned by clinical, not engineering. Don't block on them."

**A phase test fails.**
> Don't say `continue`. Have Claude Code resolve the failure first. If the failure exposes a spec ambiguity, log it as a follow-up question and patch the test to match the intended behavior.

---

## 7. After both repos finish Phase 9

You should have:
- A staging-deployed backend with all 5 endpoints working under Cognito auth.
- A frontend pointed at staging that exercises the full journey: home → welcome → quiz → motif → signature → practice → map → mirror moment → practice → completion.
- Tests green on both repos.
- All copy from Figma. No invented strings.
- Mirror Moment buttons via matrix function only.
- Privacy / accessibility flags honored on every surface.

What V1 is **not** yet:
- Tier 3 content (motif why_texts, tone library, 14 of 17 practice scripts) is still placeholder until clinical/content review lands. UX is shippable behind a feature flag for internal testing; not for public launch.
- Real-time loop inference (Tier 4 — V2).
- Multi-language (Tier 4 — V2).

---

## 8. Optional — make life easier on yourself

**Pin the Figma file in a tab while building.** When Claude Code asks an ambiguous copy question, you can verify against the production design in seconds. The 7 production design nodes are listed in §1 of `08_FIGMA_ALIGNMENT_DELTA.md`.

**Keep the conversation thread.** Each Claude Code session can run for many phases — don't `/clear` between phases. The context Claude Code accumulates about your repo's patterns is valuable.

**If you start a new Claude Code session mid-build:** paste the prompt again, but add: "I'm resuming after Phase N. Verify Phase 0-N are complete by checking the relevant files exist, then propose Phase N+1."
