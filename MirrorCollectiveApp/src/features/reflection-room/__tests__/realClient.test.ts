/**
 * Tests for RealReflectionRoomClient.
 *
 * Verifies:
 *  - Cognito JWT is attached to every request.
 *  - X-User-Timezone is sent on POST /reflection/quiz only.
 *  - Snake-case payloads round-trip.
 *  - Error responses are translated into ReflectionRoomApiError with
 *    the right code (INVALID_QUIZ_ANSWER, FALLBACK_ON_COOLDOWN, etc.).
 *  - The error-code mapper handles status fallbacks.
 */

jest.mock('@services/tokenManager', () => ({
  __esModule: true,
  tokenManager: {
    getValidToken: jest.fn().mockResolvedValue('fake.jwt.token'),
  },
}));

jest.mock('@services/authEvents', () => ({
  __esModule: true,
  authEvents: { emitSessionExpired: jest.fn() },
}));

import {
  RealReflectionRoomClient,
  __test__,
} from '../api/realClient';
import { ReflectionRoomApiError } from '../api/types';

type FetchMock = jest.Mock<Promise<Response>, [RequestInfo, RequestInit?]>;

const originalFetch = global.fetch;

function mockFetch(response: {
  status: number;
  body?: any;
  ok?: boolean;
  /** When set, .json() rejects (forces the parse-error path). */
  invalidJson?: boolean;
}) {
  const fetchMock: FetchMock = jest.fn().mockResolvedValue({
    ok: response.ok ?? (response.status >= 200 && response.status < 300),
    status: response.status,
    statusText: 'mocked',
    json: response.invalidJson
      ? jest.fn().mockRejectedValue(new Error('not json'))
      : jest.fn().mockResolvedValue(response.body ?? {}),
    text: jest.fn().mockResolvedValue(JSON.stringify(response.body ?? {})),
  } as unknown as Response);
  (global as any).fetch = fetchMock;
  return fetchMock;
}

afterAll(() => {
  (global as any).fetch = originalFetch;
});

describe('RealReflectionRoomClient', () => {
  let client: RealReflectionRoomClient;

  beforeEach(() => {
    client = new RealReflectionRoomClient();
  });

  describe('postQuiz', () => {
    it('attaches the JWT and X-User-Timezone header on /reflection/quiz', async () => {
      const fetchMock = mockFetch({
        status: 200,
        body: {
          session_id: 'sess-1',
          motif: { motif_id: 'spiral' },
        },
      });

      await client.postQuiz({
        answers: { q1: 'curious', q2: 'clarity', q3: 'spiral', q4: 'insight' },
        session_id: null,
        user_override_tag: null,
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(String(url)).toContain('/api/reflection/quiz');
      expect(init?.method).toBe('POST');
      const headers = (init?.headers ?? {}) as Record<string, string>;
      expect(headers.Authorization).toBe('Bearer fake.jwt.token');
      expect(headers['X-User-Timezone']).toMatch(/^[A-Za-z_]+\/[A-Za-z_]+/);
      expect(headers['Content-Type']).toBe('application/json');
      // Body round-trips snake_case.
      const body = JSON.parse(init?.body as string);
      expect(body).toEqual({
        answers: { q1: 'curious', q2: 'clarity', q3: 'spiral', q4: 'insight' },
        session_id: null,
        user_override_tag: null,
      });
    });

    it('translates a 400 INVALID_QUIZ_ANSWER into ReflectionRoomApiError', async () => {
      mockFetch({
        status: 400,
        body: { error: 'INVALID_QUIZ_ANSWER', message: 'INVALID_QUIZ_ANSWER: bad q1' },
      });

      await expect(
        client.postQuiz({
          answers: { q1: 'curious' as any, q2: 'clarity', q3: 'spiral', q4: 'insight' },
          session_id: null,
          user_override_tag: null,
        }),
      ).rejects.toBeInstanceOf(ReflectionRoomApiError);
    });
  });

  describe('getSnapshot', () => {
    it('does NOT send X-User-Timezone (only quiz does)', async () => {
      const fetchMock = mockFetch({
        status: 200,
        body: {
          session_id: 'sess-1',
          motif_context: { motif_id: 'spiral', room_skin: 'Spiral Room' },
          loops: [],
          updated_at: '2026-05-04T00:00:00Z',
        },
      });

      await client.getSnapshot('sess-1');

      const [, init] = fetchMock.mock.calls[0];
      const headers = (init?.headers ?? {}) as Record<string, string>;
      expect(headers.Authorization).toBe('Bearer fake.jwt.token');
      expect(headers['X-User-Timezone']).toBeUndefined();
    });

    it('URL-encodes the session id query param', async () => {
      const fetchMock = mockFetch({
        status: 200,
        body: {
          session_id: 'has space',
          motif_context: { motif_id: 'spiral', room_skin: 'Spiral Room' },
          loops: [],
          updated_at: '2026-05-04T00:00:00Z',
        },
      });

      await client.getSnapshot('has space');
      const [url] = fetchMock.mock.calls[0];
      expect(String(url)).toContain('session_id=has%20space');
    });

    it('translates a 404 SESSION_NOT_FOUND envelope into the typed code', async () => {
      mockFetch({
        status: 404,
        body: { error: 'SESSION_NOT_FOUND', message: 'no such session' },
      });

      await expect(client.getSnapshot('does-not-exist')).rejects.toMatchObject({
        code: 'SESSION_NOT_FOUND',
      });
    });
  });

  describe('recommendPractice + completePractice', () => {
    it('sends snake-case body for /echo/recommend-practice', async () => {
      const fetchMock = mockFetch({
        status: 200,
        body: {
          pattern: { loop_id: 'pressure', strength: 0.7, trend: 'rising', last_seen: 't' },
          practice: { id: 'p', title: 't', type: 'breath', duration_sec: 60, steps: ['x'] },
          rule_id: 'pressure_loop_v1',
        },
      });

      await client.recommendPractice({
        session_id: 'sess-1',
        selected_loop: 'pressure',
        surface: 'echo_signature',
      });

      const [, init] = fetchMock.mock.calls[0];
      const body = JSON.parse(init?.body as string);
      expect(body).toEqual({
        session_id: 'sess-1',
        selected_loop: 'pressure',
        surface: 'echo_signature',
      });
    });

    it('translates 409 FALLBACK_ON_COOLDOWN to the right code', async () => {
      mockFetch({
        status: 409,
        body: { error: 'FALLBACK_ON_COOLDOWN', message: 'FALLBACK_ON_COOLDOWN — try later' },
      });

      try {
        await client.recommendPractice({
          session_id: 'sess-1',
          selected_loop: 'pressure',
          surface: 'echo_signature',
        });
        fail('expected throw');
      } catch (err) {
        expect((err as ReflectionRoomApiError).code).toBe('FALLBACK_ON_COOLDOWN');
      }
    });

    it('passes practice/complete payload verbatim', async () => {
      const fetchMock = mockFetch({
        status: 200,
        body: {
          completion_id: 'cid',
          snapshot: {
            session_id: 'sess-1',
            motif_context: { motif_id: 'spiral', room_skin: 'Spiral Room' },
            loops: [],
            updated_at: 't',
          },
        },
      });

      await client.completePractice({
        session_id: 'sess-1',
        loop_id: 'pressure',
        tone_state: 'rising',
        practice_id: 'breath_4_6',
        rule_id: 'pressure_loop_v1',
        helpful: null,
      });

      const [, init] = fetchMock.mock.calls[0];
      const body = JSON.parse(init?.body as string);
      expect(body).toEqual({
        session_id: 'sess-1',
        loop_id: 'pressure',
        tone_state: 'rising',
        practice_id: 'breath_4_6',
        rule_id: 'pressure_loop_v1',
        helpful: null,
      });
    });
  });

  describe('setRoomSkin', () => {
    it('issues a PUT /me/reflection/room with the override payload', async () => {
      const fetchMock = mockFetch({
        status: 200,
        body: {
          session_id: 'sess-1',
          motif: { motif_id: 'mirror' },
          applied_to: 'session',
        },
      });

      await client.setRoomSkin({ motif_id: 'mirror', apply_to: 'session' });

      const [url, init] = fetchMock.mock.calls[0];
      expect(String(url)).toContain('/api/me/reflection/room');
      expect(init?.method).toBe('PUT');
      const body = JSON.parse(init?.body as string);
      expect(body).toEqual({ motif_id: 'mirror', apply_to: 'session' });
    });
  });

  describe('mapApiErrorToCode (unit)', () => {
    const { mapApiErrorToCode } = __test__;

    it('detects each canonical code from the message', () => {
      const codes: Array<[string, string]> = [
        ['INVALID_QUIZ_ANSWER: bad', 'INVALID_QUIZ_ANSWER'],
        ['OVERRIDE_TAG_NOT_IN_TIE — pick from set', 'OVERRIDE_TAG_NOT_IN_TIE'],
        ['CONFIG_LOAD_ERROR — config broken', 'CONFIG_LOAD_ERROR'],
        ['LOOP_NOT_SUPPORTED', 'LOOP_NOT_SUPPORTED'],
        ['NO_ACTIVE_LOOPS', 'NO_ACTIVE_LOOPS'],
        ['FALLBACK_ON_COOLDOWN', 'FALLBACK_ON_COOLDOWN'],
        ['NO_RULE_MATCHED', 'NO_RULE_MATCHED'],
        ['ALL_CANDIDATES_FILTERED', 'ALL_CANDIDATES_FILTERED'],
        ['SESSION_NOT_FOUND', 'SESSION_NOT_FOUND'],
      ];
      for (const [msg, expected] of codes) {
        expect(mapApiErrorToCode(msg, 500)).toBe(expected);
      }
    });

    it('falls back to NETWORK_ERROR when status is 0/undefined', () => {
      expect(mapApiErrorToCode('connection refused', 0)).toBe('NETWORK_ERROR');
      expect(mapApiErrorToCode('socket hang up', undefined)).toBe('NETWORK_ERROR');
    });

    it('falls back to SESSION_NOT_FOUND on a bare 404', () => {
      expect(mapApiErrorToCode('not found', 404)).toBe('SESSION_NOT_FOUND');
    });

    it('falls back to UNKNOWN otherwise', () => {
      expect(mapApiErrorToCode('something else', 500)).toBe('UNKNOWN');
    });
  });
});
