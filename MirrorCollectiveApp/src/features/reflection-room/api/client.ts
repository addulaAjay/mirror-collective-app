/**
 * Reflection Room V1 API client interface.
 *
 * Both the mock client (used until Phase 8) and the real client (Phase 8+)
 * implement this. Screens depend on the interface only — never on the
 * concrete class — so swapping mock <-> real is config-driven.
 */

import type {
  CompletePracticeRequest,
  CompletePracticeResponse,
  QuizRequest,
  QuizResponse,
  RecommendPracticeRequest,
  RecommendPracticeResponse,
  RoomSkinOverrideRequest,
  RoomSkinOverrideResponse,
  SnapshotResponse,
} from './types';

export interface ReflectionRoomClient {
  /** §2.1 — POST /reflection/quiz */
  postQuiz(req: QuizRequest): Promise<QuizResponse>;

  /** §2.2 — GET /echo/snapshot?session_id=... */
  getSnapshot(sessionId: string): Promise<SnapshotResponse>;

  /** §2.3 — POST /echo/recommend-practice */
  recommendPractice(
    req: RecommendPracticeRequest,
  ): Promise<RecommendPracticeResponse>;

  /** §2.4 — POST /practice/complete */
  completePractice(
    req: CompletePracticeRequest,
  ): Promise<CompletePracticeResponse>;

  /** §2.5 — PUT /me/reflection/room (optional in V1 critical path) */
  setRoomSkin(req: RoomSkinOverrideRequest): Promise<RoomSkinOverrideResponse>;
}
