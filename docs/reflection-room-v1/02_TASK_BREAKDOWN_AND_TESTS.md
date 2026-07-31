# Reflection Room V1 — Task Breakdown & Test Plan

Companion to `01_BACKEND_IMPLEMENTATION_SPEC.md`. This document is for sequencing the work and verifying it.

---

## Part A — Task Breakdown

The phases below mirror PDF §18 ("Recommended Build Order") and add explicit task-level work, file deltas, and exit criteria. Estimates assume one engineer working with Claude Code as a coding assistant.

### Phase 0 — Repo onboarding & scaffolding (0.5 day)

**Goal:** Confirm existing patterns; lay down empty modules; wire CI.

| # | Task | Files touched | Exit criteria |
|---|---|---|---|
| 0.1 | Inventory existing FastAPI router pattern, DI for auth, settings access, error envelope, DAO style. | (read-only) | Short note in PR description listing the 4-5 patterns being mirrored. |
| 0.2 | Create empty modules per spec §2. | new files under `src/app/api/routers/`, `src/app/services/{reflection,echo,practice,telemetry}/`, `src/app/repositories/`, `src/app/data/{reflection,micro_practice}/` | `pytest --collect-only` passes (no new tests yet). |
| 0.3 | Add new env vars to `.env.example`, `.env.staging`, `.env.production`. | `.env.*`, `core/config.py` | App boots locally with new vars defaulted. |
| 0.4 | Add new tables to `serverless.yml` resources block + IAM. | `serverless.yml` | `serverless package` succeeds. |

### Phase 1 — Configuration loaders & data files (0.5 day)

**Goal:** All 7 YAML/JSON config files exist and parse.

| # | Task | Files | Exit |
|---|---|---|---|
| 1.1 | Drop in all 7 config files verbatim from spec §4. | `src/app/data/...` (7 files) | Files present, valid YAML/JSON. |
| 1.2 | Implement `services/reflection/quiz_rules_loader.py`, `motif_mapping_loader.py`. | new | `pytest tests/services/reflection/test_loaders.py` green. |
| 1.3 | Implement `services/echo/tone_library_loader.py`. | new | Returns `(icon, reflection_line)` for all 18 (loop, tone) pairs. |
| 1.4 | Implement `services/practice/{rule_loader, catalog_loader, settings_loader, personalization_loader}.py`. | new | Each loader has a unit test confirming key counts: 6 rules, 17 practices, etc. |
| 1.5 | Add `scripts/seed_reflection_config.py` that imports every loader and asserts shape. | new | `python scripts/seed_reflection_config.py` exits 0. |

### Phase 2 — DynamoDB tables & repositories (1 day)

| # | Task | Files | Exit |
|---|---|---|---|
| 2.1 | Write `scripts/create_reflection_room_tables.py` (4 tables + GSIs). | new | `./setup-local.sh` creates all 4 tables locally. |
| 2.2 | Implement `repositories/reflection_session_repo.py` (`put`, `get`, `get_latest_for_user`, `update_room_skin`). | new | Repo unit tests pass against DynamoDB Local. |
| 2.3 | Implement `repositories/echo_loop_state_repo.py` (`query_by_user`, `upsert`, `seed_for_user`). | new | Same. |
| 2.4 | Implement `repositories/practice_completion_repo.py` (`put`, `list_by_user_since`, `update_helpful`). | new | Same. |
| 2.5 | Implement `repositories/user_personalization_repo.py` (`get_or_default`, `record_completion`, `record_helpfulness`). | new | Same. |
| 2.6 | Add `serverless.yml` table resources for staging/prod. | `serverless.yml` | `serverless deploy --stage staging` runs in dry-run cleanly. |

### Phase 3 — Reflection Quiz endpoint (1.5 days)

| # | Task | Files | Exit |
|---|---|---|---|
| 3.1 | `services/reflection/quiz_scorer.py` per spec §7 algorithm. | new | Unit tests cover: clean win, Q3 tie-break, override required, override applied, override-not-in-tie error. |
| 3.2 | `services/reflection/motif_mapper.py` (tag → MotifPayload). | new | Unit test for every tag in `motif_mapping.v1.json`. |
| 3.3 | `services/reflection/loop_seeder.py` per spec §4.8 + §8.3. **This is the producer of all loop state.** | new | Unit tests: canonical "Spiral" quiz seeds agency+transition; `Q1=grounded` alone seeds nothing; `Q1=scattered` seeds overwhelm rising at high intensity; tone-tiebreak rising>steady>softening. |
| 3.4 | `services/reflection/room_skin_resolver.py` (default + override resolution). | new | Unit test. |
| 3.5 | `api/routers/reflection_router.py` — `POST /reflection/quiz`, `PUT /me/reflection/room`. Quiz endpoint must call seeder after motif assignment. | new | Integration tests for both endpoints (happy path + each error code) + assertion that loop_state rows are written. |
| 3.6 | Session lifetime + reuse logic: sessions expire at next midnight in user's tz (default `America/New_York`). Same answers within active session → reuse. Different answers within active session → overwrite. After expiry → new session. | router + repo + new `session_lifecycle.py` helper | Tests cover all four cases (same/diff × active/expired) plus tz resolution order (header → user record → default). |

### Phase 4 — Echo Snapshot endpoint (0.5 day)

| # | Task | Files | Exit |
|---|---|---|---|
| 4.1 | `services/echo/snapshot_service.py` per spec §8. | new | Unit test: empty user → `loops=[]`. |
| 4.2 | `services/echo/intensity_label_mapper.py`. | new | Unit test for each band boundary (`0.65`/`0.66`/`0.32`/`0.33`). |
| 4.3 | `services/echo/active_loop_filter.py` per spec §9.1. | new | Unit test for each branch of the `or` clause. |
| 4.4 | `api/routers/echo_router.py` — `GET /echo/snapshot`. | new | Integration test confirms loops sorted desc by intensity. |
| 4.5 | Dev-only `POST /dev/echo/loop-state` for QA seeding (env-gated). | new | 404 in production env. |

### Phase 5 — Practice Recommendation endpoint (1.5 days)

| # | Task | Files | Exit |
|---|---|---|---|
| 5.1 | `services/practice/rule_matcher.py` (incl. `motif_any` expansion per spec §8.4). | new | Unit tests for all 6 rules, both matching and non-matching cases. |
| 5.2 | `services/practice/safety_filter.py` per spec §9.3. | new | Unit tests: `no_breathwork` removes breath; `disallow_types` removes typed. |
| 5.3 | `services/practice/cooldown_enforcer.py` per spec §9.4. | new | Unit test against seeded recent completions. |
| 5.4 | `services/practice/personalizer.py` per spec §9.2. | new | Unit tests: helpful boost, not-helpful penalty, time-of-day match, recency decay. |
| 5.5 | `services/practice/recommender.py` (orchestration). | new | Tests for: rule found, no rule, all filtered (409), priority tie-break. |
| 5.6 | `api/routers/echo_router.py` — `POST /echo/recommend-practice`. | extend | Integration test for happy path + all error codes. |

### Phase 6 — Practice Completion endpoint (1 day)

| # | Task | Files | Exit |
|---|---|---|---|
| 6.1 | `services/echo/loop_state_updater.py` (apply state delta on completion per spec §8.3). | new | Unit tests for helpful/not-helpful/null cases. |
| 6.2 | `api/routers/practice_router.py` — `POST /practice/complete`. | new | Integration test: completion → personalization updated → snapshot reflects change. |
| 6.3 | (Optional) `PATCH /practice/complete/{id}/helpful`. | extend | Integration test. |

### Phase 7 — Telemetry & privacy (0.5 day)

| # | Task | Files | Exit |
|---|---|---|---|
| 7.1 | `services/telemetry/reflection_events.py` with PII filter at boundary. | new | Unit test: emitting an event with raw text-looking content gets sanitized or rejected. |
| 7.2 | Wire 8 events into endpoints per spec §10. | routers | Integration tests assert events fired with correct field set. |
| 7.3 | `private_mode` flag honored: server returns `private_mode=true` in user prefs; FE handles blur. (Server-side, just the flag plumbing.) | personalization repo | Test: PUT user prefs sets flag; GET reflects it. |

### Phase 8 — Polish & error states (0.5 day)

| # | Task | Files | Exit |
|---|---|---|---|
| 8.1 | Confirm all error codes from spec §12 fire correctly with the project's standard envelope. | routers | Errors-suite integration tests. |
| 8.2 | Confirm `Retry-After` header on 409 ALL_CANDIDATES_FILTERED. | recommender + router | Test asserts header present and integer-valued. |
| 8.3 | Add OpenAPI `summary`/`description`/`response_model` to every new endpoint. | routers | `/docs` renders cleanly; Postman collection regenerates. |
| 8.4 | Update `Mirror-Collective-API.postman_collection.json` with new endpoints. | postman files | Manual: import, run all, all green against local. |

### Phase 9 — Acceptance verification (0.5 day)

Run the §17 acceptance checklist below. Every item must be a green test or documented manual check.

---

## Part B — Test Plan

### B.1 Test layout

Mirror the existing test structure. Suggested:

```
tests/
├── unit/
│   ├── services/
│   │   ├── reflection/
│   │   │   ├── test_quiz_scorer.py
│   │   │   ├── test_motif_mapper.py
│   │   │   ├── test_loop_seeder.py
│   │   │   └── test_room_skin_resolver.py
│   │   ├── echo/
│   │   │   ├── test_snapshot_service.py
│   │   │   ├── test_active_loop_filter.py
│   │   │   ├── test_intensity_label_mapper.py
│   │   │   └── test_tone_library_loader.py
│   │   └── practice/
│   │       ├── test_rule_matcher.py
│   │       ├── test_safety_filter.py
│   │       ├── test_cooldown_enforcer.py
│   │       ├── test_personalizer.py
│   │       └── test_recommender.py
│   └── repositories/
│       ├── test_reflection_session_repo.py
│       ├── test_echo_loop_state_repo.py
│       ├── test_practice_completion_repo.py
│       └── test_user_personalization_repo.py
├── integration/
│   ├── test_quiz_endpoint.py
│   ├── test_room_override_endpoint.py
│   ├── test_snapshot_endpoint.py
│   ├── test_recommend_practice_endpoint.py
│   └── test_practice_complete_endpoint.py
├── acceptance/
│   └── test_v1_acceptance_checklist.py    # one test per §17 item
└── fixtures/
    ├── quiz_answers.py
    ├── seed_loops.py
    └── conftest.py                         # DynamoDB Local fixtures
```

### B.2 Unit test scenarios

#### B.2.1 `test_quiz_scorer.py`

| Test | Setup | Expectation |
|---|---|---|
| `test_clean_winner` | Answers all leaning to `evolution` (q3=spiral, q4=insight, q2=inspiration, q1=hopeful). | `winning_tag="evolution"`, `override_allowed=false`. |
| `test_q3_breaks_tie` | Construct answers producing a tie between two tags where one is in q3's tag list. | The Q3-aligned tag wins; `override_allowed=false`. |
| `test_unbreakable_tie_returns_override_allowed` | Construct answers producing a tie not resolved by Q3. | `override_allowed=true`; `winning_tag` is the deterministic alphabetical default. |
| `test_user_override_applied` | Same as above, with `user_override_tag="clarity"`. | `winning_tag="clarity"`; `override_allowed=false`. |
| `test_user_override_not_in_tie_raises` | `user_override_tag` not in tied set. | Raises `ValidationError` (→ 409 in router). |
| `test_weighting_correct` | Submit known answers; verify `scores` dict has Q1×1, Q2×2, Q3×2, Q4×1 contributions. | Math matches by hand. |
| `test_explanation_format` | Any valid input. | `explanation` is list of length 4, format `"Q{n}={ans} (×{w} → {tags})"`. |

#### B.2.2 `test_motif_mapper.py`

| Test | Expectation |
|---|---|
| `test_every_tag_maps` | For all 11 tags in `reflection_quiz_rules.v1.yaml`, `motif_mapper.lookup(tag)` returns a populated MotifPayload. |
| `test_unknown_tag_raises` | `lookup("notatag")` raises. |
| `test_no_two_motifs_share_id` | All `motif_id` values are unique. |

#### B.2.2b `test_loop_seeder.py` (new — covers §4.8 + §8.3)

| Test | Setup | Expectation |
|---|---|---|
| `test_seeding_spiral_canonical` | Inputs `q1=hopeful, q2=inspiration, q3=spiral, q4=insight` (PDF §5.1 canonical) | Seeds exactly 2 loops: `agency` rising and `transition` rising; both `intensity_score` between 0.65 and 0.85. |
| `test_seeding_grounded_only_seeds_nothing` | `q1=grounded`, all other answers neutral toward grounded | Returns empty seed list. Snapshot will be empty. |
| `test_seeding_scattered_seeds_overwhelm` | `q1=scattered, q2=peace, q3=waves, q4=presence` | Overwhelm seeded at high intensity; tone is `rising` (Q1+Q2 outweigh Q3 softening). |
| `test_tone_tiebreak_prefers_rising` | Construct contributions where (grief, rising)=0.5 and (grief, steady)=0.5 | Selected tone is `rising` (priority order). |
| `test_below_min_seed_score_dropped` | Set `min_seed_score=0.45` and contributions producing total 0.40 | That loop is not seeded. |
| `test_top_n_limit` | Construct contributions yielding 5 loops above threshold; `top_n=3` | Exactly 3 seeded; lowest 2 by score dropped. |
| `test_intensity_normalized_to_floor_ceiling` | Single contribution with raw score 0.10 (above min) | Normalized to ≥ 0.50 (the `intensity_floor`). |
| `test_intensity_normalized_to_ceiling` | Stack contributions to raw score 5.0 | Normalized to ≤ 0.85 (the `intensity_ceiling`). |
| `test_seeding_writes_to_repo` | Mock `echo_loop_state_repo.upsert_many` | Called once with the resolved seed list; `recently_changed=true` on every row. |
| `test_seeding_idempotent_on_same_answers_within_session` | Two quiz submits with identical answers within the same session (before midnight) | Second call does not overwrite (per §8.3 reseeding rules) |
| `test_seeding_overwrites_on_different_answers_within_session` | Two different quizzes within the same session | Second call's seeds replace the first's |
| `test_seeding_fresh_after_session_expiry` | Submit, advance clock past midnight in user's tz, submit again | New session row, full reseed regardless of answer similarity |

#### B.2.3 `test_active_loop_filter.py`

| Test | Loop input | Expected included |
|---|---|---|
| `test_high_rising_included` | intensity=0.7, tone=rising | yes |
| `test_high_steady_included` | intensity=0.7, tone=steady | yes |
| `test_high_softening_included` | intensity=0.7, tone=softening | yes (softening always) |
| `test_low_softening_included` | intensity=0.2, tone=softening | yes |
| `test_low_rising_excluded` | intensity=0.2, tone=rising, recently_changed=false | no |
| `test_recently_changed_included` | intensity=0.2, tone=steady, recently_changed=true | yes |
| `test_threshold_boundary` | intensity=0.60, tone=rising | yes (`>=` boundary) |

#### B.2.4 `test_intensity_label_mapper.py`

| Score | Expected label |
|---|---|
| 0.0 | Low |
| 0.32 | Low |
| 0.33 | Medium |
| 0.65 | Medium |
| 0.66 | High |
| 1.0 | High |

#### B.2.5 `test_rule_matcher.py`

For each of the 6 rules, write at least one matching test and one non-matching test. All rules now gate on `loop_id` only (post Q1/Q2 resolution — see `06_OPEN_QUESTIONS_FOR_PRODUCT.md`).

| Rule | Matches when | Doesn't match when |
|---|---|---|
| `pressure_loop_v1` | loop=pressure, score=0.6, tone=rising | score=0.59 OR tone=softening |
| `overwhelm_v1` | loop=overwhelm, score=0.5, tone=steady | score=0.49 OR tone=softening |
| `grief_softening_v1` | loop=grief, tone=softening (any score) | tone=rising OR tone=steady |
| `self_silencing_v1` | loop=self_silencing, score=0.5, tone=rising | score=0.49 OR tone=softening |
| `agency_key_low_v1` | loop=agency, score=0.5, tone=rising | score=0.4 OR tone=softening |
| `transition_bridge_v1` | loop=transition, score=0.5, tone=any-of-3, last_seen ≤ 3d ago | score=0.44 OR last_seen > 3d ago |

#### B.2.6 `test_safety_filter.py`

| Test | Setup | Expected |
|---|---|---|
| `test_no_breathwork_removes_breath` | flags.no_breathwork=true; candidates include `breath_4_6` | breath candidate dropped |
| `test_disallow_types` | user disallow_types=["somatic"] | `heart_hand_breath` dropped |
| `test_global_disallow` | global disallow_types=["action"] | `one_percent_first_call` dropped |
| `test_no_filter` | All flags false, no disallows | all candidates returned |

#### B.2.7 `test_cooldown_enforcer.py`

| Test | Setup | Expected |
|---|---|---|
| `test_no_recent` | No completions for user | All candidates kept |
| `test_within_cooldown_dropped` | Completion 6h ago, cooldown=12h | That practice removed |
| `test_outside_cooldown_kept` | Completion 13h ago, cooldown=12h | Kept |
| `test_grief_24h` | Completion 20h ago of grief practice, grief cooldown=24h | Removed |

#### B.2.8 `test_personalizer.py`

| Test | Setup | Expected effect on score |
|---|---|---|
| `test_helpful_boost` | 1 helpful vote, today | +2.0 (no decay yet) |
| `test_not_helpful_penalty` | 1 not-helpful vote, today | -2.0 |
| `test_decay` | 1 helpful vote 21d ago | +1.0 (half-life decay) |
| `test_time_of_day_match` | Most-completed bucket = "morning"; now is morning | +0.5 |
| `test_recent_use_penalty` | Practice used 1h ago | -1.0 |
| `test_combined` | Helpful 1x today + recent_use 1h ago | +2.0 - 1.0 = +1.0 |

#### B.2.9 `test_recommender.py`

| Test | Setup | Expected |
|---|---|---|
| `test_rule_match_returns_practice` | Snapshot with pressure 0.7 rising | Returns a practice in `pressure_loop_v1.candidates`; `rule_id="pressure_loop_v1"` |
| `test_no_active_loops_404` | Snapshot all loops below `min_seed_score` after filter; `selected_loop=null` | 404 NO_ACTIVE_LOOPS |
| `test_no_rule_matched_with_fallback_returns_breath_4_6` | Snapshot has grief rising 0.7 (no rule matches grief rising); `fallback_enabled=true` | Returns `breath_4_6`; `rule_id="fallback"` |
| `test_no_rule_matched_no_breathwork_returns_alternate` | Same as above but user has `no_breathwork=true` | Returns `name_and_need`; `rule_id="fallback"` |
| `test_no_rule_matched_fallback_disabled_404` | `fallback_enabled=false`; grief rising | 404 NO_RULE_MATCHED |
| `test_all_candidates_filtered_with_fallback_returns_breath` | Pressure 0.7 rising; user has completed all 3 candidates within cooldown; `fallback_enabled=true` | Returns `breath_4_6`; `rule_id="fallback"` |
| `test_all_candidates_filtered_no_fallback_409` | Same as above but `fallback_enabled=false` | 409 ALL_CANDIDATES_FILTERED with `Retry-After` |
| `test_fallback_on_cooldown_409` | All practices including `breath_4_6` and `name_and_need` recently completed | 409 FALLBACK_ON_COOLDOWN with `Retry-After` |
| `test_priority_tiebreak` | Two rules both match | Higher-priority rule's practice returned |
| `test_selected_loop_overrides_top` | Snapshot has overwhelm > pressure but `selected_loop=pressure` | Returns pressure practice |
| `test_journey_a_heavy_user_grief_rising` | Quiz Q1=heavy → grief rising 0.80 seeded; user taps "Face Grief" via recommend with `selected_loop=grief` | Returns `breath_4_6` (fallback); `rule_id="fallback"`. **This is the headline regression test for the dead-end analysis.** |

### B.3 Integration test scenarios

Use DynamoDB Local + FastAPI TestClient.

#### B.3.1 `test_quiz_endpoint.py`

| Test | Request | Expected |
|---|---|---|
| `test_quiz_happy_path` | All clean evolution-leaning answers | 200; spiral motif; new session_id |
| `test_quiz_invalid_answer_400` | `q1="purple"` | 400 with `INVALID_QUIZ_ANSWER` |
| `test_quiz_same_answers_within_session_no_reseed` | Submit, then re-submit identical answers before midnight | Same `session_id` returned; loop_state rows untouched (no reseed) |
| `test_quiz_different_answers_within_session_reseeds` | Submit, then submit different answers before midnight | Same `session_id` reused; motif and loops overwritten |
| `test_quiz_after_midnight_creates_new_session` | Submit at 11pm, freeze clock to next 1am, submit again | New `session_id` returned |
| `test_quiz_unauthenticated_401` | No JWT in request | 401 from auth dependency (Reflection Room flow is auth-only) |
| `test_quiz_uses_user_tz_for_expiry` | User has tz="America/Los_Angeles"; submit at 11pm Pacific | `expires_at` is next 00:00 Pacific (08:00 UTC), not 00:00 Eastern |
| `test_quiz_uses_default_tz_when_user_missing` | User has no tz on record, no X-User-Timezone header | `expires_at` computed from `America/New_York` |
| `test_quiz_uses_header_tz_override` | Send `X-User-Timezone: Asia/Tokyo` regardless of user record | `expires_at` computed from Tokyo midnight |
| `test_quiz_override_required_then_applied` | First call returns `override_allowed=true`; resubmit with `user_override_tag` | 200; override applied |
| `test_quiz_override_not_in_tie_409` | Submit `user_override_tag` not in tied set | 409 with `OVERRIDE_TAG_NOT_IN_TIE` |

#### B.3.2 `test_snapshot_endpoint.py`

| Test | Setup | Expected |
|---|---|---|
| `test_snapshot_empty_for_new_user` | Quiz only; no completions | `loops=[]`; 200 |
| `test_snapshot_returns_seeded_loops_sorted` | Use dev endpoint to seed loops with mixed scores | Loops sorted desc by `intensity_score` |
| `test_snapshot_includes_icon_and_reflection_line` | Seed pressure rising | Response has `icon="🔺"`, reflection_line populated |
| `test_snapshot_unsupported_loops_filtered` | Insert a row with `loop_id="clarity"` (manually) | Not included in response |
| `test_snapshot_404_invalid_session` | Bad session_id | 404 |

#### B.3.3 `test_recommend_practice_endpoint.py`

| Test | Setup | Expected |
|---|---|---|
| `test_recommend_happy_path` | Snapshot with pressure 0.7 rising | 200; practice from `pressure_loop_v1.candidates`; rule_id matches |
| `test_recommend_no_active_loops_404` | All loops Low/steady (filtered out) | 404 with `NO_ACTIVE_LOOPS` |
| `test_recommend_grief_rising_returns_fallback` | Quiz Q1=heavy seeds grief rising 0.8; user taps Mirror Moment "Face Grief" | 200; fallback practice (`breath_4_6`) returned; rule_id="fallback" |
| `test_recommend_no_breathwork_filters_breath` | User flag `no_breathwork=true`; pressure rule matches | Returns non-breath practice from candidates (or `name_and_need` if fallback fires) |
| `test_recommend_cooldown_falls_through_to_fallback` | All 3 pressure candidates within cooldown; fallback enabled | 200; fallback practice returned |
| `test_recommend_helpful_history_boosts` | User has +5 helpful for `breath_4_6`; another candidate at 0 | `breath_4_6` returned |
| `test_recommend_selected_loop` | Pass `selected_loop="overwhelm"` | Returns overwhelm-rule practice even if pressure higher |

#### B.3.4 `test_practice_complete_endpoint.py`

| Test | Setup | Expected |
|---|---|---|
| `test_complete_logs_and_refreshes_snapshot` | Recommend + complete with `helpful=true` | 200; snapshot in response shows that loop's intensity reduced |
| `test_complete_helpful_updates_personalizer` | Complete with helpful=true | User's helpfulness count for that practice +1 |
| `test_complete_null_helpful` | helpful=null | Row written; helpful field null |
| `test_complete_emits_telemetry` | Mock telemetry sink | Events `practice_complete` and `practice_helpful` fired |

#### B.3.5 `test_room_override_endpoint.py`

| Test | Setup | Expected |
|---|---|---|
| `test_override_session_only` | Apply `apply_to=session` | New room_skin in current session; user default unchanged |
| `test_override_core_room` | Apply `apply_to=core_room` | User's persistent default updated |
| `test_override_invalid_motif_400` | `motif_id="banana"` | 400 with `MOTIF_NOT_FOUND` |
| `test_override_blocked_when_not_allowed_403` | Session quiz produced unique winner (override_allowed=false) | 403 with `OVERRIDE_NOT_ALLOWED` |

### B.4 Acceptance Tests (PDF §17 mapping)

One test per checklist item. These should call the real endpoints end-to-end against DynamoDB Local. Mark with `@pytest.mark.acceptance`.

| # | PDF §17 item | Test |
|---|---|---|
| 1 | Quiz scoring matches rules YAML | `test_acc_01_quiz_scoring_matches_yaml`: re-implement scoring inline from yaml; assert API matches across 100 random inputs. |
| 2 | Motif payload uses motif_mapping.json | `test_acc_02_motif_payload_keys`: every API motif response has the seven required keys with values from the JSON file. |
| 3 | Room shell ambience-only | (FE-side; doc only — N/A backend). |
| 4 | Snapshot returns only V1 supported loops | `test_acc_04_snapshot_supported_loops_only`: insert unsupported loop_id directly; confirm filtered out. |
| 5 | Echo Signature shows tone state on every card | `test_acc_05_every_loop_has_tone_state`: every loop in snapshot has non-null `tone_state`. |
| 6 | Echo Signature card front uses snapshot+tone library only | `test_acc_06_signature_inputs_only`: assert recommend-practice never called by snapshot endpoint (mock spy). |
| 7 | Echo Signature CTA uses shared engine | `test_acc_07_shared_engine`: signature CTA + mirror moment both hit `/echo/recommend-practice`. |
| 8 | Echo Map renders 6 loops, correct overlay | `test_acc_08_map_data_contract`: snapshot for 6 active loops returns all 6 with required fields. |
| 9 | Mirror Moment buttons fully dynamic from top-3 | `test_acc_09_top3`: snapshot service exposes a helper returning top-3 loops; FE-side label generation is doc-only here. |
| 10 | Mirror Moment labels follow approved matrix | (FE-side, doc only; matrix lives in `04_UI_DEVELOPER_HANDOFF.md`). |
| 11 | Practice completion refreshes snapshot + personalizer | `test_acc_11_completion_side_effects`: assert both DDB rows updated and snapshot reflects state delta. |
| 12 | Cooldowns enforced server-side | `test_acc_12_cooldown_server_side`: client cannot bypass; second call within cooldown returns alternate or 409. |
| 13 | `no_breathwork` and `reduced_motion` enforced service-side | `test_acc_13a_no_breathwork`: filter applied at recommend; `test_acc_13b_reduced_motion_in_response`: flag is reflected in user state response. |
| 14 | Empty/loading/error states for Room, Signature, Map | `test_acc_14_empty_state_returns_200_empty_loops`. |
| 15 | Telemetry events firing IDs only, not text | `test_acc_15_telemetry_no_pii`: assert payload fields match whitelist; sanitizer rejects raw text fields. |

### B.5 Test fixtures

Write `tests/fixtures/seed_loops.py`:

```python
def seed_user_with_loops(user_id: str, loops: list[dict]) -> None:
    """Direct-write to mc_echo_loop_state table for tests."""
    ...

# Common scenarios
PRESSURE_HIGH_RISING = [{"loop_id": "pressure", "tone_state": "rising",
                         "intensity_score": 0.74, ...}]
GRIEF_SOFTENING = [{"loop_id": "grief", "tone_state": "softening",
                    "intensity_score": 0.58, ...}]
```

Quiz answer fixtures in `tests/fixtures/quiz_answers.py`:

```python
EVOLUTION_CLEAN = QuizAnswers(q1="hopeful", q2="inspiration", q3="spiral", q4="insight")
TIE_RESOLVABLE_BY_Q3 = ...   # construct so Q3 breaks the tie
TIE_UNRESOLVABLE = ...       # construct so override_allowed=true
```

### B.6 CI pipeline checklist

Add to `.github/workflows/`:

- `pytest tests/unit/` runs on every PR — fast, no DDB.
- `pytest tests/integration/ tests/acceptance/` runs against DynamoDB Local — slower, on PR + main.
- Schema validation step: `python scripts/seed_reflection_config.py` runs first; fails fast if a YAML is broken.
- Type-check: `mypy src/app/services/reflection src/app/services/echo src/app/services/practice`.
- Lint: existing pre-commit (`.pre-commit-config.yaml`) is already wired; just include new dirs.

### B.7 Definition of Done

A PR is mergeable for V1 only when:

1. All Phase 0–9 exit criteria are green.
2. Every PDF §17 item has a passing acceptance test or a documented FE-side carry-forward.
3. Postman collection updated and a manual smoke test of all 5 endpoints passes against staging.
4. New env vars and new tables are present in `staging` deploy.
5. Coverage on new modules ≥ 85% (or matching the repo's existing target, whichever is higher).
