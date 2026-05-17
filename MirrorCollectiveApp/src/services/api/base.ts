import type { ApiResponse, ApiError } from '@types';

import { API_CONFIG } from '@constants/config';
import { authEvents } from '@services/authEvents';
import { tokenManager } from '@services/tokenManager';

import { ApiErrorHandler } from './errorHandler';

// ---------------------------------------------------------------------------
// 429 retry-with-backoff
// ---------------------------------------------------------------------------
// API Gateway now throttles at 1000 RPS sustained / 5000 burst (see backend
// `infra/replace-in-memory-rate-limiter-with-apigw-throttling`). Without
// client-side retry, transient throttling surfaces as opaque red toasts.
// We retry 429s up to MAX_429_RETRIES times with exponential-backoff +
// jitter. If the server sends a `Retry-After` header (seconds or HTTP date),
// we honor it as the base delay instead of computing one.
const MAX_429_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 500;
const RETRY_MAX_DELAY_MS = 8000;

/** Sleep with cancellation support. */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Compute the wait time before retry N (0-indexed). Honors a `Retry-After`
 *  header if the server set one; otherwise uses exponential backoff with
 *  full jitter. Capped at RETRY_MAX_DELAY_MS to bound user-visible latency. */
function computeRetryDelayMs(
  attempt: number,
  retryAfterHeader: string | null,
): number {
  if (retryAfterHeader) {
    // Two valid formats per RFC 7231: integer seconds, or an HTTP date.
    const asSeconds = Number(retryAfterHeader);
    if (Number.isFinite(asSeconds) && asSeconds >= 0) {
      return Math.min(asSeconds * 1000, RETRY_MAX_DELAY_MS);
    }
    const asDateMs = Date.parse(retryAfterHeader);
    if (!Number.isNaN(asDateMs)) {
      const deltaMs = asDateMs - Date.now();
      if (deltaMs > 0) {
        return Math.min(deltaMs, RETRY_MAX_DELAY_MS);
      }
    }
  }
  // Exponential backoff with full jitter: random in [0, base * 2^attempt].
  const exponential = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
  const jittered = Math.random() * exponential;
  return Math.min(jittered, RETRY_MAX_DELAY_MS);
}

/**
 * Per-call options for makeRequest. Lives in an options bag so future
 * additions don't keep growing the positional-arg list.
 */
export interface MakeRequestOptions {
  /**
   * Override the default request timeout for this single call. Useful for
   * routes whose server-side work is legitimately slow (e.g. S3
   * CompleteMultipartUpload for 1000+ part files). Default is
   * `API_CONFIG.TIMEOUT` (10 s) — keep it tight on routes that should be
   * fast so a real backend hang doesn't go unnoticed.
   */
  timeoutMs?: number;
}

export class BaseApiService {
  public readonly baseUrl: string;
  private readonly timeout: number;

  constructor() {
    this.baseUrl = API_CONFIG.HOST;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  protected async makeRequest<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
    data?: any,
    requiresAuth: boolean = false,
    extraHeaders?: Record<string, string>,
    options?: MakeRequestOptions,
  ): Promise<ApiResponse<T>> {
    let lastError: any;
    for (let attempt = 0; attempt <= MAX_429_RETRIES; attempt++) {
      try {
        return await this._attemptRequest<T>(
          endpoint,
          method,
          data,
          requiresAuth,
          extraHeaders,
          options,
        );
      } catch (error: any) {
        lastError = error;
        // Retry only on 429. Any other error (network, 4xx, 5xx) is
        // surfaced immediately — the caller's existing error handling
        // applies. We don't retry POST/PUT/DELETE for non-429 because
        // the server may have already processed the request.
        if (
          error?.status === 429 &&
          attempt < MAX_429_RETRIES
        ) {
          const retryAfter = error?.retryAfter ?? null;
          const delayMs = computeRetryDelayMs(attempt, retryAfter);
          console.warn(
            `[API] 429 on ${method} ${endpoint}; ` +
              `retry ${attempt + 1}/${MAX_429_RETRIES} in ${Math.round(delayMs)}ms`,
          );
          await sleep(delayMs);
          continue;
        }
        throw error;
      }
    }
    // Exhausted retries — rethrow the last 429 so callers can present a
    // "still being rate-limited" message.
    throw lastError;
  }

  private async _attemptRequest<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
    data?: any,
    requiresAuth: boolean = false,
    extraHeaders?: Record<string, string>,
    options?: MakeRequestOptions,
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    // Per-call override beats the instance default. Callers that pass a
    // timeoutMs here are opting in to a longer wait for routes whose
    // server-side work is known-slow (S3 assembly, etc.).
    const effectiveTimeout = options?.timeoutMs ?? this.timeout;
    const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);
    let response: Response | undefined;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(extraHeaders ?? {}),
      };

      if (requiresAuth) {
        const token = await tokenManager.getValidToken();
        if (!token) {
          authEvents.emitSessionExpired();
          throw this.createApiError('Session expired. Please log in again.', 401);
        }
        headers.Authorization = `Bearer ${token}`;
      }

      const config: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.body = JSON.stringify(data);
      }

      response = await fetch(`${this.baseUrl}${endpoint}`, config);

      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        // Handle cases where response is not valid JSON
        clearTimeout(timeoutId);
        if (!response.ok) {
          throw this.createApiError(
            `Server error: ${response.statusText}`,
            response.status,
          );
        }
        // For successful responses that aren't JSON, return empty object
        return {} as ApiResponse<T>;
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401 && requiresAuth) {
          authEvents.emitSessionExpired();
        }
        if (ApiErrorHandler.shouldHandleGracefully(endpoint, response.status)) {
          return { ...responseData, statusCode: response.status };
        }
        // Extract error message from response data
        const errorMessage = responseData?.error || responseData?.message || `Server error: ${response.status}`;
        const err = this.createApiError(errorMessage, response.status);
        // Attach Retry-After (if present) so the outer retry loop can
        // honor it. Only meaningful for 429, but always attaching is
        // cheap and avoids a branch.
        const retryAfter = response.headers.get('retry-after');
        if (retryAfter) {
          (err as any).retryAfter = retryAfter;
        }
        throw err;
      }

      return { ...responseData, statusCode: response.status };
    } catch (error: any) {
      clearTimeout(timeoutId);

      // If it is already an ApiError (custom), rethrow it
      if (error && error.message && error.status) {
         throw error;
      }

      // Use centralized error handling for system errors
      const errorResponse = ApiErrorHandler.handleSystemError(error, {
        endpoint,
        method,
        statusCode: response?.status,
        originalError: error,
      });

      // If it's a graceful endpoint, return the error response
      if (ApiErrorHandler.shouldHandleGracefully(endpoint)) {
        return errorResponse;
      }

      // Otherwise, throw the error
      throw this.createApiError(
        errorResponse.message || 'Unknown error',
        errorResponse.error as any,
      );
    }
  }

  private createApiError(message: string, status?: number): ApiError {
    return {
      message,
      status,
    };
  }

  protected async get<T = any>(endpoint: string, requiresAuth: boolean = true, extraHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, 'GET', undefined, requiresAuth, extraHeaders);
  }

  protected async post<T = any>(endpoint: string, data?: any, requiresAuth: boolean = true, extraHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, 'POST', data, requiresAuth, extraHeaders);
  }

  protected async put<T = any>(endpoint: string, data?: any, requiresAuth: boolean = true, extraHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, 'PUT', data, requiresAuth, extraHeaders);
  }

  protected async delete<T = any>(endpoint: string, requiresAuth: boolean = true, extraHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, 'DELETE', undefined, requiresAuth, extraHeaders);
  }
}
