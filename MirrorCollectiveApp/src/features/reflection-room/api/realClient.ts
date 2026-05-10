/**
 * Real Reflection Room API client — wires the 5 endpoints to the existing
 * authenticated REST plumbing (BaseApiService + tokenManager + Cognito JWT).
 *
 * All five endpoints require Cognito JWT (UI handoff §2). The base service
 * adds the `Authorization: Bearer <token>` header automatically when
 * `requiresAuth = true`. POST /reflection/quiz additionally sends
 * `X-User-Timezone: <IANA>` from the device per UI handoff §2.1.
 *
 * Backend errors are translated into the typed `ReflectionRoomApiError`
 * (with `code`, `status`, optional `retryAfterSec`) so screens can
 * pattern-match on `code` rather than parsing strings.
 *
 * Switching from mock → real:
 *   1. Set `REFLECTION_ROOM_USE_MOCK=false` in your .env (or env var).
 *   2. Confirm `MIRROR_API_BASE_URL` / `API_BASE_URL` points at staging.
 *   3. Sign into the app — Cognito session feeds the token manager.
 *   4. The factory in api/index.ts returns this client instead of the mock.
 */

import type { ApiError, ApiResponse } from '@types';

import { API_CONFIG } from '@constants/config';
import { BaseApiService } from '@services/api/base';

import { getDeviceTimezone } from '../utils/timezone';

import type { ReflectionRoomClient } from './client';
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
import { ReflectionRoomApiError, type RRApiErrorCode } from './types';

// ---------------------------------------------------------------------------
// Error translation
// ---------------------------------------------------------------------------

/**
 * Map a wire error message (or HTTP status) to the typed code union.
 *
 * The backend (per spec §12) returns `{error: <CODE>, message: <text>}`.
 * BaseApiService surfaces the message string and HTTP status via ApiError.
 * We attempt to detect the canonical code from the message; otherwise we
 * fall back to a status-based mapping so the FE can still pattern-match.
 */
function mapApiErrorToCode(message: string, status: number | undefined): RRApiErrorCode {
  const KNOWN_CODES: RRApiErrorCode[] = [
    'INVALID_QUIZ_ANSWER',
    'OVERRIDE_TAG_NOT_IN_TIE',
    'CONFIG_LOAD_ERROR',
    'LOOP_NOT_SUPPORTED',
    'NO_ACTIVE_LOOPS',
    'FALLBACK_ON_COOLDOWN',
    'NO_RULE_MATCHED',
    'ALL_CANDIDATES_FILTERED',
    'SESSION_NOT_FOUND',
  ];
  for (const code of KNOWN_CODES) {
    if (message.includes(code)) return code;
  }
  // Fall through to coarse mapping by HTTP status.
  if (status === 0 || status === undefined) return 'NETWORK_ERROR';
  if (status === 404) return 'SESSION_NOT_FOUND';
  return 'UNKNOWN';
}

function asReflectionRoomError(err: unknown, op: string): ReflectionRoomApiError {
  if (err instanceof ReflectionRoomApiError) return err;
  // BaseApiService throws an `ApiError = { message, status? }`.
  const apiErr = err as Partial<ApiError>;
  const message = typeof apiErr?.message === 'string' ? apiErr.message : `Failure in ${op}`;
  const status = typeof apiErr?.status === 'number' ? apiErr.status : null;
  const code = mapApiErrorToCode(message, status ?? undefined);
  return new ReflectionRoomApiError(code, message, status, null);
}

function unwrap<T>(
  envelope: ApiResponse<T> | T | null | undefined,
  op: string,
  status: number | null = null,
): T {
  if (envelope == null) {
    throw new ReflectionRoomApiError('UNKNOWN', `Empty response for ${op}`);
  }
  // BaseApiService gracefully returns the JSON body for 4xx responses
  // (rather than throwing) — per ApiErrorHandler.shouldHandleGracefully.
  // The backend's error envelope is `{error: <CODE>, message: <text>}`,
  // so detect that and translate into a typed RR error.
  const env = envelope as { error?: unknown; message?: unknown };
  if (typeof env.error === 'string' && env.error.length > 0) {
    const code = mapApiErrorToCode(env.error, status ?? undefined);
    const message =
      typeof env.message === 'string' ? env.message : env.error;
    throw new ReflectionRoomApiError(code, message, status, null);
  }
  // Backend returns the payload directly per spec §6 — BaseApiService's
  // `ApiResponse<T>` type is loose; cast back to the concrete shape.
  return envelope as unknown as T;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class RealReflectionRoomClient
  extends BaseApiService
  implements ReflectionRoomClient
{
  async postQuiz(req: QuizRequest): Promise<QuizResponse> {
    try {
      const response = await this.post<QuizResponse>(
        API_CONFIG.ENDPOINTS.REFLECTION_ROOM.QUIZ,
        req,
        true,
        { 'X-User-Timezone': getDeviceTimezone() },
      );
      return unwrap(response, 'POST /reflection/quiz');
    } catch (err) {
      throw asReflectionRoomError(err, 'POST /reflection/quiz');
    }
  }

  async getSnapshot(sessionId: string): Promise<SnapshotResponse> {
    const path = `${API_CONFIG.ENDPOINTS.REFLECTION_ROOM.SNAPSHOT}?session_id=${encodeURIComponent(sessionId)}`;
    try {
      const response = await this.get<SnapshotResponse>(path, true);
      return unwrap(response, 'GET /echo/snapshot');
    } catch (err) {
      throw asReflectionRoomError(err, 'GET /echo/snapshot');
    }
  }

  async recommendPractice(
    req: RecommendPracticeRequest,
  ): Promise<RecommendPracticeResponse> {
    try {
      const response = await this.post<RecommendPracticeResponse>(
        API_CONFIG.ENDPOINTS.REFLECTION_ROOM.RECOMMEND_PRACTICE,
        req,
        true,
      );
      return unwrap(response, 'POST /echo/recommend-practice');
    } catch (err) {
      throw asReflectionRoomError(err, 'POST /echo/recommend-practice');
    }
  }

  async completePractice(
    req: CompletePracticeRequest,
  ): Promise<CompletePracticeResponse> {
    try {
      const response = await this.post<CompletePracticeResponse>(
        API_CONFIG.ENDPOINTS.REFLECTION_ROOM.PRACTICE_COMPLETE,
        req,
        true,
      );
      return unwrap(response, 'POST /practice/complete');
    } catch (err) {
      throw asReflectionRoomError(err, 'POST /practice/complete');
    }
  }

  async setRoomSkin(
    req: RoomSkinOverrideRequest,
  ): Promise<RoomSkinOverrideResponse> {
    try {
      const response = await this.put<RoomSkinOverrideResponse>(
        API_CONFIG.ENDPOINTS.REFLECTION_ROOM.ROOM_OVERRIDE,
        req,
        true,
      );
      return unwrap(response, 'PUT /me/reflection/room');
    } catch (err) {
      throw asReflectionRoomError(err, 'PUT /me/reflection/room');
    }
  }
}

// Test-only helper — exposed for unit tests.
export const __test__ = { mapApiErrorToCode };
