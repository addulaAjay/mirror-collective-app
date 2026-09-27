# Reflection Room V1 — End-to-End Implementation Plan

> **Status:** Draft for review · **Owner:** _(assign)_ · **Last updated:** 2026-09-27
> **Sources:** [Reflection Room Developer Handoff (9.25.26)](https://docs.google.com/document/d/1eCOqU4ApPqN2ebujnpmHQXphdKyi-XPi/edit) · [Figma Dev Master File — node 7128-1706](https://www.figma.com/design/xn6MdQV0gGGeedaFtHWWCo/Dev-Master-File?node-id=7128-1706&m=dev)
> **Repos:** app = `mirror_collective_app/MirrorCollectiveApp` · backend = `mirror_collective_python_api`

This is a **tracked** plan. Check boxes as items land. Every task links to a Decision (D1–D6) or a Gap (G1–Gn) below.

### Decision log
| Date | Decision | Notes |
| :-- | :-- | :-- |
| **2026-09-27** | **D1 / G1 — V1 uses quiz-seeded loops + completion deltas; NO chat→loop detection.** | Product call. Signal-driven detection (the spec's *proposed* direction) is deferred to **V2** as a new, separately-scoped requirement. The current backend already implements this deterministic model, so no detector build is needed for V1. |

> **On the spec basis for D1 (verbatim, for the record):** the spec's chat-signal direction was a **proposal + open decision**, not approved behavior — the "Read this first" preamble states *"Items marked Proposed … Do not treat those proposals as previously approved behavior."* Relevant lines: §Read-this-first *"Loop detection comes from the existing pattern-analysis service; its input and scoring contract still need confirmation under D1"* and *"**Proposed V1:** use authorized Mirror chat/reflection signals for loops…"*; §2 Step 4 *"Do not infer three loops from the assigned motif"*; §4 *"classifies supported families from permitted reflection/chat signals"*; §9 D1 *"Use chat/reflection evidence; quiz adds motif context only."* V1 consciously supersedes these in favor of the quiz-seeded model.

---

## 0. TL;DR — this is an integration project, not a greenfield build

A current-state audit of both repos found the feature is **~90% implemented on both sides**:

| Layer | State | What remains |
| :-- | :-- | :-- |
| **Frontend** | All 12 screens exist and are wired to a real API client behind a `REFLECTION_ROOM_USE_MOCK` toggle (**defaults to mock**). JourneyContext, 18-label matrix, error/empty/loading states present. | Flip to the real client, auth, session-expiry handling, retry/idempotency fields, privacy/telemetry, close design asks. |
| **Backend** | All 5 endpoints + quiz scorer, motif mapping, 18-line tone library, practice catalog/rules/cooldowns/personalization, 4 DynamoDB tables — implemented. **D1 resolved: quiz-seeded loops are V1 — no detector to build.** | Idempotency on quiz/complete (G4), fallback-vs-`no_eligible_practice` policy (D4), field-name/contract alignment (G3), safety-metadata normalization (D6). |

**The critical path is not code volume — it's closing the remaining spec decisions (D2–D6) and conflicts (G2–G5), then a supervised mock→real integration. D1/G1 are now closed: V1 uses quiz-seeded loops, no chat→loop detection.**

---

## 1. Scope & journey

Single **linear** journey (no Echo-Vault-style branching), per the Figma USER STORY and spec §2:

```
Landing/Entry → Quiz (Q1–Q4) → Loading → Today's Motif → Echo Signature
   → Echo Map → Mirror Moment → Practice (2-min) → Practice Complete → Core/Return
```

Each step has loading / error / empty / info states (Figma sections: Reflection Room quiz `7128:3504`, Reflection MOTIFS `7128:1952`, Echo Signature `7128:6438`, Echo Map `7128:2360`, Mirror Moment `7128:7807`, Homescreen `7128:9711`).

**Six family IDs only:** `pressure, overwhelm, grief, self_silencing, agency, transition`. **Three trend IDs only:** `rising, steady, softening`. Archetype Timeline, ambient controls, nudges, and generated-practice fallback are **out of scope** unless separately enabled.

---

## 2. Current-state architecture (as built)

**Frontend** (`src/features/reflection-room/` + `src/screens/reflectionRoom/`)
- `state/JourneyContext.tsx` — single source of truth: `sessionId`, `motif`, `snapshot`, `welcomeSeen`. Snapshot fetched once on Echo Signature focus, reused across Signature→Map→Moment, refreshed only after `practice/complete`.
- `api/` — `ReflectionRoomClient` interface with `RealReflectionRoomClient` (`realClient.ts`) and `MockReflectionRoomClient`; factory `getReflectionRoomClient()` switches on `REFLECTION_ROOM_USE_MOCK` (**default `true`**).
- `data/quizQuestions.ts` — Q1–Q4 questions/options **hardcoded** (answer keys match backend enums).
- `utils/labelFor.ts` — 6×3 = 18 action labels (pure function).
- Screens registered in `App.tsx`; order in `reflectionRoomFlow.ts`.

**Backend** (`mirror_collective_python_api/src/app/`)
- Routes: `reflection_routes.py` (`POST /reflection/quiz`, `PUT /me/reflection/room`), `echo_v1_routes.py` (`GET /echo/snapshot`, `POST /echo/recommend-practice`), `practice_routes.py` (`POST /practice/complete`, `PATCH …/helpful`).
- Services: `quiz_scorer.py`, `snapshot_service.py`, `active_loop_filter.py`, `loop_state_updater.py`, `recommender.py` + `rule_matcher.py` + `cooldown_enforcer.py` + `safety_filter.py` + `personalizer.py`.
- Config (all present): `data/reflection/{reflection_quiz_rules,motif_mapping,quiz_to_loop_seeding}.v1.*`, `data/micro_practice/{echo_signature_tone_library,echo_practice_rules,micro_practices,personalization.defaults}.v1.*`.
- Tables: `mc_reflection_sessions`, `mc_echo_loop_state`, `mc_practice_completions`, `mc_user_personalization` (all read/written).

---

## 3. Blocking decisions (D1–D6, from spec §9) + additional conflicts (G1–G2)

> These gate release. **Do not start the mock→real switch (Phase 3) until D1, D5, G1, G2 are closed** — they change data semantics and screen behavior.

### Spec decisions
| ID | Owner (proposed) | Decision | Current code reality | Recommendation |
| :-- | :-- | :-- | :-- | :-- |
| **D1** ✅ | Tony + Ajay | Loop detection, trend, activity, intensity contract | **RESOLVED 2026-09-27: V1 = quiz-seeded loops + completion deltas; NO chat→loop detection.** Loop strength seeded from the quiz (`quiz_to_loop_seeding.v1.yaml`), decremented on helpful completions; trend set at seed time. This matches the current build. | Deterministic quiz model is V1; signal-driven detection deferred to **V2** (new requirement). No classifier to build. Remaining: confirm intensity normalization + softening-on-completion thresholds are sound. |
| **D2** | Stacey + Tony | When a quiz is required / what resets | Backend sets `expires_at`+`ttl` on the session; **frontend JourneyContext has no expiry handling.** | Rolling 24 h from successful assignment + voluntary Recalibrate; expire motif session only (preserve history). Wire frontend to honor expiry (re-entry after expiry → quiz). |
| **D3** | Stacey + Tony | Q3 option set, ties, override | Frontend ships **6 Q3 glyphs**; backend defines up to 11 symbols + Q3 tie-break + `override_allowed`/`tied_motifs` picker. | Confirm launch set = 6 (or 11). Confirm tie-break = Q3 tag, then stable alphabetical fallback; keep the tied-motif picker or drop it. |
| **D4** | Stacey + Tony | Practice coverage + ranking | Backend returns a **global default fallback** (`breath_4_6`) on no-match; spec says *return `no_eligible_practice` until starred fallbacks are approved.* Ranking (helpful decay, recency, time-of-day) implemented. | Approve the starred `P*/O*/G*/S*/A*/T*` mappings **or** switch the fallback off to `no_eligible_practice`. Confirm cooldowns (12 h; grief 24 h; transition 18 h) and time-of-day/recency definitions. |
| **D5** | Stacey + frontend lead | Signature vs Moment launch | Frontend: Echo Signature = recognition (loop cards); Mirror Moment = 3 action buttons → practice. Matches "select → Continue → practice." | Ratify: Signature = recognition, Map = context, Moment = action. Resolves against the Figma user-story text that describes practice cards on Signature (see G2). |
| **D6** | Stacey + Tony | Practice input, feedback, safety | PracticeOverlay shows instructions; timer static. Need to confirm **no in-app writing capture/persistence** and normalize safety metadata (`no_breathwork` must exclude `breath_soothe`; review `posture_reset`). | Instruction-only + voluntary Done; helpfulness optional/late-updatable. Normalize safety tags across the whole catalog. |

### Additional conflicts found in the audit (not in the spec's D-list)
| ID | Severity | Conflict | Detail |
| :-- | :-- | :-- | :-- |
| **G1** ✅ | Resolved | **Quiz-seeded loops accepted for V1.** | **RESOLVED 2026-09-27 with D1.** The spec's chat-signal lines (§2 "do not infer loops from the motif"; §4 pattern-analysis; §9 D1 "quiz adds motif context only") were a **proposal**, not approved behavior, and are consciously superseded for V1; signal-driven detection → V2. Note for the record: quiz *answers* seed loops via `quiz_to_loop_seeding.v1.yaml` (a mapping separate from the motif skin), so **motif-independence still holds** — changing the room skin does not alter loops. |
| **G2** | High | **Figma user-story says Echo Signature has "3 micro-practice cards"; spec D5 says Signature is recognition-only, Moment is action.** | The Figma node text ("Echo Signature page where they see 3 micro practice cards to choose from") contradicts spec D5. Frontend currently follows D5 (action on Moment). Confirm Figma text is stale, or move practice launch to Signature. |
| **G3** | Medium | **Field-name contract drift.** | Spec §4 wants normalized `loop_family / trend_state / intensity_score`. Backend emits and frontend consumes legacy `loop_id / tone_state / motif_context`. Frontend+backend agree with each other, so it *works*, but diverges from the documented contract. Decide: adopt spec names (adds a boundary mapping) or update the spec to the legacy names. |
| **G4** | Medium | **Idempotency / retry fields absent.** | Spec §8 requires `idempotency key` on `/reflection/quiz` and `completion_event_id` on `/practice/complete` with server dedup. Backend has no `@idempotent` on these; frontend sends no `completion_event_id`. Double-tap / retry / multi-device can double-record. |
| **G5** | Low | **Design asks.** | Transition loop icon is a placeholder; `softening` aqua tone color has no design token; Private Mode masking deferred. |

---

## 4. Gap analysis — frontend (per screen)

Legend: ✅ done · 🟡 partial / needs integration work · ⬜ missing

| Screen | File | Status | Remaining work |
| :-- | :-- | :-- | :-- |
| Landing / Entry | `ReflectionRoomLandingScreen.tsx` | ✅ | Verify info overlay copy vs Figma. |
| Quiz Q1–Q4 | `ReflectionRoomQuizScreen.tsx` | 🟡 | Confirm Q3 set (D3); Back preserves selections; disable double-submit. |
| Loading / Tuning | `ReflectionRoomLoadingScreen.tsx` | 🟡 | Real `POST /reflection/quiz`; add idempotency key (G4); tie-result path (D3). |
| Today's Motif | `ReflectionRoomTodaysMotifScreen.tsx` | ✅ | Error state parity with Figma "Today's motif - error". |
| Echo Signature | `ReflectionRoomEchoSignatureScreen.tsx` | 🟡 | Confirm recognition-only (D5/G2); 0/1/2/3-loop rendering; empty/error parity. |
| Echo Map | `ReflectionRoomEchoMapScreen.tsx` | 🟡 | 1–6 family ring; per-family intensity label; Transition icon (G5). |
| Mirror Moment | `ReflectionRoomMirrorMomentScreen.tsx` | 🟡 | select → Continue → practice (D5); no global-top substitution. |
| Practice Overlay | `ReflectionRoomPracticeOverlayScreen.tsx` | 🟡 | `recommend-practice` + `complete`; `completion_event_id` (G4); `stale_snapshot` reload; no writing capture (D6). |
| Practice Complete | `ReflectionRoomPracticeCompleteScreen.tsx` | ✅ | Show success only after server accepts; refresh-retry without re-submitting. |
| Core / Return | `ReflectionRoomCoreScreen.tsx` | 🟡 | Return routes; session-expiry re-quiz (D2). |
| Welcome Onboarding | `ReflectionRoomWelcomeScreen.tsx` | ✅ | — |
| Session lifetime | `JourneyContext.tsx` | ⬜ | **No expiry logic** — implement 24 h expiry + Recalibrate (D2). |

**Cross-cutting frontend:** flip `REFLECTION_ROOM_USE_MOCK`→false with Cognito JWT; reduced-motion pass; Private Mode masking (G5); telemetry logs IDs not text (§10).

---

## 5. Gap analysis — backend (per endpoint/component)

| Component | File(s) | Status | Remaining work |
| :-- | :-- | :-- | :-- |
| `POST /reflection/quiz` | `reflection_routes.py`, `quiz_scorer.py` | 🟡 | Add idempotency (G4); confirm tie output (D3). |
| Quiz config | `reflection_quiz_rules.v1.yaml`, `motif_mapping.v1.json` | ✅ | Confirm Q3 symbol count (D3). |
| `GET /echo/snapshot` | `echo_v1_routes.py`, `snapshot_service.py` | 🟡 | Field-name alignment (G3); ensure valid empty snapshot; snapshot_id/config_version present. |
| **Loop detector** | `active_loop_filter.py`, `loop_state_updater.py` | ✅ (V1 scope) | **D1/G1 RESOLVED: quiz-seeded + completion deltas IS V1.** No chat classifier to build. Remaining: confirm intensity normalization + softening thresholds; document that `trend_state` is seed-time-only for V1 (V2 = signal-driven). |
| `POST /echo/recommend-practice` | `echo_v1_routes.py`, `recommender.py`, `rule_matcher.py` | 🟡 | Honors selected loop ✅; reconcile fallback vs `no_eligible_practice` (D4). |
| Practice rules/catalog | `echo_practice_rules.v1.yaml`, `micro_practices.v1.yaml` | 🟡 | Approve starred fallbacks (D4); normalize safety tags (D6). |
| Cooldowns | `cooldown_enforcer.py` | 🟡 | Confirm 12/24/18 h per family (D4). |
| `POST /practice/complete` | `practice_routes.py`, `practice_completion_repo.py` | 🟡 | Add `completion_event_id` dedup (G4); confirm one cooldown per accepted completion. |
| Late helpful | `PATCH …/helpful` | ✅ | Confirm no extra completion/cooldown created. |
| Tone library (18 lines) | `echo_signature_tone_library.v1.yaml` | ✅ | Byte-verify against spec §5. |
| Tables | `*_repo.py` | ✅ | — |
| Feature flags / tz | `session_lifecycle.py` etc. | ✅ | Wire `X-User-Timezone` from app; confirm 24 h vs calendar-day (D2). |

---

## 6. Phased implementation plan

### Phase 0 — Close decisions (blocking; no code) — _owner: product + Tony/Ajay_
- [x] **D1 / G1** — ✅ **Decided 2026-09-27:** V1 = **quiz-seeded loops + completion deltas; no chat→loop detection.** Signal-driven detection deferred to V2.
- [ ] **D5 / G2**: confirm Signature=recognition, Moment=action; mark Figma practice-card text stale or re-scope.
- [ ] **D2**: confirm 24 h rolling expiry (vs calendar day) + Recalibrate semantics.
- [ ] **D3**: confirm Q3 set (6 vs 11) + tie-break + whether to keep the tied-motif picker.
- [ ] **D4**: approve starred fallbacks or `no_eligible_practice`; confirm cooldowns + ranking term defaults.
- [ ] **D6**: instruction-only practices; safety-metadata normalization list.
- [ ] **G3**: choose field-naming (spec-normalized vs legacy) for the snapshot contract.

### Phase 1 — Backend gap-closing — _owner: backend_
- [ ] **D1/G1** (decided ✅ — no build): document the deterministic V1 loop model (quiz-seed + completion deltas); confirm intensity normalization + softening-on-completion thresholds; ensure `trend_state` is coherent as a seed-time value. No chat classifier.
- [ ] **G4**: add idempotency to `POST /reflection/quiz` (idempotency key) and `POST /practice/complete` (`completion_event_id` dedup + single cooldown).
- [ ] **D4**: reconcile fallback policy in `recommender.py` + `echo_practice_rules.v1.yaml`.
- [ ] **D6**: normalize safety tags for the whole catalog (`no_breathwork` excludes `breath_soothe`; review `posture_reset`).
- [ ] **G3**: apply the chosen field naming at the snapshot boundary; add `snapshot_id`/`config_version` if missing.
- [ ] Byte-verify tone library + catalog steps against spec §5/§7.

### Phase 2 — Contract & test alignment — _owner: both_
- [ ] Freeze the request/response schema for all 5 endpoints; publish a shared contract doc.
- [ ] Backend contract tests for §8 failure matrix (stale_snapshot, no rule/all unsafe/cooldown → typed reasons, empty snapshot = success).
- [ ] Frontend types regenerated from the frozen contract.

### Phase 3 — Frontend integration (mock→real) — _owner: frontend_ — **gated on Phase 0 D1/D5/G1/G2**
- [ ] Flip `REFLECTION_ROOM_USE_MOCK`→false behind a feature flag; attach Cognito JWT + `X-User-Timezone`.
- [ ] **D2**: implement JourneyContext session-expiry (24 h) + Recalibrate + re-entry re-quiz.
- [ ] **G4**: send `completion_event_id`; retry-safe complete; `stale_snapshot` reload.
- [ ] **D5**: verify select→Continue→practice; no global-top substitution.
- [ ] 0/1/2/3-loop Signature/Moment and 1–6-loop Map rendering.
- [ ] Error/empty/loading/info parity with Figma states per screen.

### Phase 4 — Hardening — _owner: both_
- [ ] Privacy: Private Mode masking + Reveal; clear on background/exit (G5, §10).
- [ ] Accessibility: reduced motion; announce family/trend/intensity as text.
- [ ] Telemetry: log IDs/status/timestamps only — never chat/reflection/written text; no streaks/gamification.
- [ ] Design asks: Transition icon; `softening` tone token (G5).

### Phase 5 — QA vs acceptance checks (§10)
- [ ] Run every §10 check (below) on staging with the real backend.

### Phase 6 — Rollout
- [ ] Staged enablement behind the feature flag; monitor telemetry + error rates; backend deploy to `production-v2` via PR merge.

---

## 7. Acceptance-check mapping (spec §10)

| Check | Verifies | Depends on |
| :-- | :-- | :-- |
| Quiz & validation | weighted totals + tie paths deterministic; invalid input → no session | D3, Phase 1/2 |
| Motif independence | motif change does not create family/trend/strength | D1/G1 |
| 18 combinations | every family/trend → exact line + label | tone lib verify |
| Ranking & counts | 0/1/2/3/6-loop renders; stable equal-score order | Phase 3 |
| Selected action | 2nd/3rd action returns that family's practice | D4, Phase 3 |
| Safety & cooldown | no prohibited practice; server-side cooldown; correct empty reason | D4, D6 |
| Completion & retry | double-tap/timeout/multi-device → one completion + one cooldown | G4 |
| Refresh & expiry | newer snapshot replaces older; expiry preserves history | D2 |
| Privacy & access | Private Mode; auth-scoped reads/writes; delete invalidates snapshots | Phase 4 |
| Accessibility & telemetry | reduced motion; text announcements; IDs-only logging | Phase 4 |

---

## 8. Risks

- **R1 (resolved ✅):** D1/G1 was the big product+architecture fork; **decided 2026-09-27 for deterministic quiz-seeded loops** — shippable now, no classifier to build. Residual (product, not engineering): quiz-seeded loops mean the room reflects the *quiz answers*, not evolving chat behavior — a user-expectation to communicate. Signal-driven detection is a scoped V2 item.
- **R2:** The mock client masks integration bugs; the real snapshot's field names/empty-states may not match mock assumptions (G3). Contract-freeze (Phase 2) before the flip.
- **R3:** Idempotency gaps (G4) surface as duplicate completions/cooldowns under real network conditions — easy to miss in mock testing.
- **R4:** Figma-vs-spec conflicts (G2) could cause rework if closed late; resolve in Phase 0.

---

## 9. References
- Spec: Reflection Room Developer Handoff 9.25.26 (this plan's source of record).
- Config sources R1–R7 (linked in the handoff): quiz system, tone library, practice rule map, catalog, service architecture, personalization defaults, file map.
- Figma: Dev Master File node `7128-1706` (sections `7128:3504` quiz, `7128:1952` motifs, `7128:6438` signature, `7128:2360` map, `7128:7807` moment, `7128:9711` homescreen).
- Current-state audit: this plan §4–§5 (file:line evidence available in the audit that produced it).
