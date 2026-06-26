/**
 * Tests for BaseApiService — focused on the 429 retry-with-backoff path.
 *
 * Other request behavior (auth header, JSON parse, graceful 5xx handling)
 * is exercised through the per-service test files (auth.test, echo.test,
 * subscriptionApi etc.).
 */

import { BaseApiService } from './base';
import { ApiErrorHandler } from './errorHandler';

// --- Mocks ---------------------------------------------------------------

jest.mock('@services/tokenManager', () => ({
  tokenManager: {
    getValidToken: jest.fn().mockResolvedValue('mock-token'),
  },
}));

jest.mock('@services/authEvents', () => ({
  authEvents: { emitSessionExpired: jest.fn() },
}));

// Graceful-handling shim — return false so the 429 actually throws and
// our retry loop gets a chance to fire (instead of being absorbed into a
// graceful envelope).
jest.mock('./errorHandler', () => ({
  ApiErrorHandler: {
    handleApiResponse: jest.fn(r => r),
    handleSystemError: jest.fn(() => ({ success: false, error: 'sys' })),
    shouldHandleGracefully: jest.fn(() => false),
    formatValidationErrors: jest.fn(() => undefined),
  },
}));

jest.mock('@constants/config', () => ({
  API_CONFIG: { HOST: 'https://api.example.test', TIMEOUT: 5000 },
}));

global.fetch = jest.fn();

// --- Subclass exposing the protected makeRequest --------------------------

class TestApiService extends BaseApiService {
  call<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any,
  ): Promise<any> {
    return this.makeRequest<T>(endpoint, method, body, false);
  }

  callWithTimeout<T = any>(
    endpoint: string,
    timeoutMs: number,
  ): Promise<any> {
    return this.makeRequest<T>(endpoint, 'POST', {}, false, undefined, { timeoutMs });
  }
}

const svc = new TestApiService();

// Tiny helper that returns a Headers-like object for our fake responses.
function makeResponse(opts: {
  status?: number;
  ok?: boolean;
  body?: any;
  retryAfter?: string;
}): any {
  const status = opts.status ?? 200;
  const headers = new Map<string, string>();
  if (opts.retryAfter !== undefined) {
    headers.set('retry-after', opts.retryAfter);
  }
  return {
    ok: opts.ok ?? (status >= 200 && status < 300),
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: { get: (k: string) => headers.get(k.toLowerCase()) ?? null },
    json: async () => opts.body ?? {},
  };
}

// --- Tests ----------------------------------------------------------------

describe('BaseApiService — 429 retry-with-backoff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Make Math.random deterministic so the jitter math doesn't flake CI.
    jest.spyOn(Math, 'random').mockReturnValue(0); // → minimum jittered delay
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('passes through a 200 response without retrying', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      makeResponse({ status: 200, body: { success: true, data: [] } }),
    );

    const result = await svc.call('/api/whatever');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
  });

  it('retries on 429 then succeeds on the second attempt', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        makeResponse({ status: 429, body: { error: 'Slow down' } }),
      )
      .mockResolvedValueOnce(
        makeResponse({ status: 200, body: { success: true } }),
      );

    const result = await svc.call('/api/x');

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(true);
  });

  it('honors numeric Retry-After header for the wait time', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        makeResponse({
          status: 429,
          body: { error: 'Slow down' },
          retryAfter: '1', // 1 second
        }),
      )
      .mockResolvedValueOnce(
        makeResponse({ status: 200, body: { success: true } }),
      );

    const start = Date.now();
    await svc.call('/api/x');
    const elapsed = Date.now() - start;

    // Should be at least ~1000ms (the Retry-After) and not absurdly more.
    expect(elapsed).toBeGreaterThanOrEqual(950);
    expect(elapsed).toBeLessThan(2500);
  });

  it('gives up after MAX_429_RETRIES and rethrows the last 429', async () => {
    // Always 429 — 1 initial + 3 retries = 4 fetch calls expected.
    (global.fetch as jest.Mock).mockResolvedValue(
      makeResponse({ status: 429, body: { error: 'Throttled' } }),
    );

    await expect(svc.call('/api/x')).rejects.toMatchObject({ status: 429 });

    expect(global.fetch).toHaveBeenCalledTimes(4);
  });

  it('does NOT retry non-429 errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      makeResponse({ status: 500, body: { error: 'boom' } }),
    );

    await expect(svc.call('/api/x')).rejects.toMatchObject({ status: 500 });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('also retries 429 on POST (server tells us "not processed")', async () => {
    // 429 means "we didn't process your request" → safe to retry even
    // for mutating methods.
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        makeResponse({ status: 429, body: { error: 'slow' } }),
      )
      .mockResolvedValueOnce(
        makeResponse({ status: 200, body: { success: true } }),
      );

    const result = await svc.call('/api/x', 'POST', { foo: 'bar' });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(true);
  });
});

describe('BaseApiService — validation errors (422)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws with the specific validation message and attaches the array', async () => {
    (ApiErrorHandler.formatValidationErrors as jest.Mock).mockReturnValueOnce(
      'Password must contain at least one special character',
    );
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      makeResponse({
        status: 422,
        body: {
          success: false,
          error: 'Validation Error',
          message: 'One or more fields contain invalid data',
          validationErrors: [
            { field: 'password', message: 'Password must contain at least one special character' },
          ],
        },
      }),
    );

    await expect(svc.call('/api/auth/register', 'POST', {})).rejects.toMatchObject({
      status: 422,
      // The user-facing message is the specific field message, not the
      // generic "Validation Error" envelope title.
      message: 'Password must contain at least one special character',
      validationErrors: [
        { field: 'password', message: 'Password must contain at least one special character' },
      ],
    });
  });
});

describe('BaseApiService — per-route timeout override', () => {
  /**
   * Mock fetch that listens to the abort signal and rejects when it
   * fires (real fetch behaves this way). Without this the test
   * promise never settles and Jest times out before our assertions.
   */
  function mockNeverResolvingFetch(): () => AbortSignal | undefined {
    let captured: AbortSignal | undefined;
    (global.fetch as jest.Mock).mockImplementation(
      (_url: string, init: { signal?: AbortSignal }) => {
        captured = init.signal;
        return new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => {
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
          });
        });
      },
    );
    return () => captured;
  }

  beforeEach(() => {
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('uses the API_CONFIG.TIMEOUT default when no override is given', async () => {
    // The mocked config has TIMEOUT: 5000.
    const getSignal = mockNeverResolvingFetch();
    const promise = svc.call('/api/slow').catch(() => undefined);

    // Hasn't aborted yet at t = 4999.
    await Promise.resolve();
    jest.advanceTimersByTime(4999);
    expect(getSignal()?.aborted).toBe(false);

    // Aborts at t = 5000.
    jest.advanceTimersByTime(1);
    expect(getSignal()?.aborted).toBe(true);

    await promise;
  });

  it('honors the timeoutMs override (does NOT abort at the default)', async () => {
    const getSignal = mockNeverResolvingFetch();
    const promise = svc
      .callWithTimeout('/api/slow', 30_000)
      .catch(() => undefined);

    // At t = 5001 the DEFAULT timeout would have fired — assert it didn't.
    await Promise.resolve();
    jest.advanceTimersByTime(5001);
    expect(getSignal()?.aborted).toBe(false);

    // Aborts at t = 30000.
    jest.advanceTimersByTime(30_000 - 5001);
    expect(getSignal()?.aborted).toBe(true);

    await promise;
  });

  it('still aborts at the override deadline', async () => {
    const getSignal = mockNeverResolvingFetch();
    const promise = svc
      .callWithTimeout('/api/slow', 20_000)
      .catch(() => undefined);

    await Promise.resolve();
    jest.advanceTimersByTime(19_999);
    expect(getSignal()?.aborted).toBe(false);
    jest.advanceTimersByTime(1);
    expect(getSignal()?.aborted).toBe(true);
    await promise;
  });
});
