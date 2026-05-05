/**
 * TypeScript contracts for the 5 Reflection Room V1 backend endpoints.
 *
 * Source: 01_BACKEND_IMPLEMENTATION_SPEC.md §5 (Pydantic models) +
 *         03_UI_DEVELOPER_HANDOFF.md §2 (endpoint reference).
 *
 * All shapes mirror the wire format. Backend snake_case is preserved.
 * Display-label conversion lives in features/reflection-room/copy/strings.ts.
 */

import type {
  IntensityLabel,
  LoopId,
  MotifId,
  PracticeSurface,
  ToneState,
} from '../types/ids';

// ---------------------------------------------------------------------------
// Quiz answer enums (per backend Q1Answer / Q2Answer / Q3Answer / Q4Answer)
// ---------------------------------------------------------------------------

export const Q1_ANSWERS = [
  'curious',
  'grounded',
  'hopeful',
  'heavy',
  'scattered',
  'numb',
] as const;
export type Q1Answer = (typeof Q1_ANSWERS)[number];

export const Q2_ANSWERS = [
  'clarity',
  'peace',
  'healing',
  'inspiration',
  'stillness',
] as const;
export type Q2Answer = (typeof Q2_ANSWERS)[number];

/** Q3 answers ARE the motif IDs. */
export type Q3Answer = MotifId;

export const Q4_ANSWERS = [
  'soothing',
  'gentle',
  'insight',
  'direct',
  'presence',
] as const;
export type Q4Answer = (typeof Q4_ANSWERS)[number];

export interface QuizAnswers {
  q1: Q1Answer;
  q2: Q2Answer;
  q3: Q3Answer;
  q4: Q4Answer;
}

// ---------------------------------------------------------------------------
// 2.1 POST /reflection/quiz
// ---------------------------------------------------------------------------

export interface QuizRequest {
  answers: QuizAnswers;
  /** null on first call; set on resubmit if user picked a tie-breaker. */
  session_id: string | null;
  /** null unless the user is resolving a tie via override. */
  user_override_tag: string | null;
}

export interface MotifPayload {
  motif_id: MotifId;
  motif_name: string;
  icon: string;
  element: string;
  tone_tag: string;
  why_text: string;
  room_skin: string;
  scores: Record<string, number>;
  explanation: string[];
  override_allowed: boolean;
}

export interface QuizResponse {
  session_id: string;
  motif: MotifPayload;
  /**
   * Populated only when motif.override_allowed === true.
   * Contains every motif tied at the max score, including motif itself.
   */
  tied_motifs?: MotifPayload[] | null;
}

// ---------------------------------------------------------------------------
// 2.2 GET /echo/snapshot?session_id=...
// ---------------------------------------------------------------------------

export interface MotifContext {
  motif_id: MotifId;
  room_skin: string;
}

export interface LoopState {
  loop_id: LoopId;
  tone_state: ToneState;
  /** 0.0 .. 1.0 — closer to YOU on Echo Map = higher value. */
  intensity_score: number;
  intensity_label: IntensityLabel;
  /** ISO 8601. */
  last_seen: string;
  recently_changed: boolean;
  /** V1: always null. Reserved for narrative engine in V2. */
  narrative_stage: string | null;
  icon: string | null;
  reflection_line: string | null;
}

export interface SnapshotResponse {
  session_id: string;
  motif_context: MotifContext;
  /** Always sorted DESC by intensity_score. May be empty (200, not error). */
  loops: LoopState[];
  /** ISO 8601. */
  updated_at: string;
}

// ---------------------------------------------------------------------------
// 2.3 POST /echo/recommend-practice
// ---------------------------------------------------------------------------

export interface RecommendPracticeRequest {
  session_id: string;
  /** null = engine picks from top of snapshot. V1 surfaces always pick. */
  selected_loop: LoopId | null;
  surface: PracticeSurface;
}

export type PracticeType =
  | 'breath'
  | 'somatic'
  | 'cognitive'
  | 'action'
  | 'reflection';

export interface PatternInfo {
  loop_id: LoopId;
  strength: number;
  trend: ToneState;
  last_seen: string;
}

export interface PracticePayload {
  id: string;
  title: string;
  type: PracticeType;
  /** 0+; renderer shows a timer when type=breath/somatic. */
  duration_sec: number;
  steps: string[];
}

export interface RecommendPracticeResponse {
  pattern: PatternInfo;
  practice: PracticePayload;
  /** Identifies the rule that fired. "fallback" when V1 fallback was used. */
  rule_id: string;
}

// ---------------------------------------------------------------------------
// 2.4 POST /practice/complete
// ---------------------------------------------------------------------------

export interface CompletePracticeRequest {
  session_id: string;
  loop_id: LoopId;
  tone_state: ToneState;
  practice_id: string;
  rule_id: string;
  /** null when the user dismisses the helpfulness prompt. */
  helpful: boolean | null;
  /** Optional ISO 8601; backend defaults to server time. */
  completed_at?: string;
}

export interface CompletePracticeResponse {
  completion_id: string;
  /** Freshly recomputed — same shape as GET /echo/snapshot. */
  snapshot: SnapshotResponse;
}

// ---------------------------------------------------------------------------
// 2.5 PUT /me/reflection/room
// ---------------------------------------------------------------------------

export interface RoomSkinOverrideRequest {
  motif_id: MotifId;
  apply_to: 'session' | 'core_room';
}

export interface RoomSkinOverrideResponse {
  session_id: string;
  motif: MotifPayload;
  applied_to: string;
}

// ---------------------------------------------------------------------------
// Error envelope (per UI handoff §2.1, §2.3 + spec §12)
// ---------------------------------------------------------------------------

export type RRApiErrorCode =
  | 'INVALID_QUIZ_ANSWER'
  | 'OVERRIDE_TAG_NOT_IN_TIE'
  | 'CONFIG_LOAD_ERROR'
  | 'LOOP_NOT_SUPPORTED'
  | 'NO_ACTIVE_LOOPS'
  | 'FALLBACK_ON_COOLDOWN'
  | 'NO_RULE_MATCHED'
  | 'ALL_CANDIDATES_FILTERED'
  | 'SESSION_NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export class ReflectionRoomApiError extends Error {
  readonly code: RRApiErrorCode;
  readonly status: number | null;
  /** From `Retry-After` header on 409 FALLBACK_ON_COOLDOWN responses. */
  readonly retryAfterSec: number | null;

  constructor(
    code: RRApiErrorCode,
    message: string,
    status: number | null = null,
    retryAfterSec: number | null = null,
  ) {
    super(message);
    this.name = 'ReflectionRoomApiError';
    this.code = code;
    this.status = status;
    this.retryAfterSec = retryAfterSec;
  }
}
