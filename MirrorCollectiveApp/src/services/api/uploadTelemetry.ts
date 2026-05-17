/**
 * Client-side echo-upload telemetry.
 *
 * Fires one structured event per upload outcome (success / failed /
 * aborted) so we can answer in CloudWatch Logs Insights:
 *
 *   - What % of uploads are backgrounded mid-flight?
 *   - p50/p95 wall-clock duration by upload_path?
 *   - Which stage fails most often (compress / presign / upload / finalize)?
 *
 * Fire-and-forget by design — telemetry must never block the user
 * or take down a successful upload. A 5 s timeout bounds the wait.
 * Authentication is required (matches the backend route's auth
 * gate); if no token is present we drop silently.
 */

import { Platform } from 'react-native';

import { API_CONFIG } from '@constants/config';
import { tokenManager } from '@services/tokenManager';

import { version as APP_VERSION } from '../../../package.json';

const TELEMETRY_ENDPOINT = '/api/telemetry/echo-upload';

// Client-side bound matching the server's; defends against shipping
// huge payloads if a future error path produces verbose messages.
const MAX_ERROR_MESSAGE_LEN = 200;

// Telemetry must never hang the upload. 5 s is comfortably above any
// healthy backend response time and well below any user-visible
// "stuck" window. AbortController + fetch handles the cancellation.
const TELEMETRY_TIMEOUT_MS = 5_000;

export type UploadPath = 'single-put' | 'multipart';
export type UploadStatus = 'success' | 'failed' | 'aborted';
export type UploadFailureStage =
  | 'compress'
  | 'presign'
  | 'upload'
  | 'finalize';
export type AppStateAtCompletion = 'active' | 'background';

export interface UploadTelemetryEvent {
  // What was uploaded
  echo_id: string;
  content_type: string;
  original_bytes: number;
  compressed_bytes: number | null;
  upload_path: UploadPath;
  parts_count: number | null;

  // Outcome
  status: UploadStatus;
  failure_stage?: UploadFailureStage;
  error_message?: string;

  // Performance (ms)
  duration_compress_ms: number | null;
  duration_upload_ms: number;
  duration_finalize_ms: number | null;
  duration_total_ms: number;

  // Lifecycle / client context
  backgrounded_during_upload: boolean;
  retry_count: number;
  app_state_at_completion: AppStateAtCompletion;
  platform: 'ios' | 'android';
  app_version: string;
}

/**
 * Truncate + path-scrub an error message before it leaves the device.
 *
 * The server also scrubs (belt + suspenders) but doing it here keeps
 * the payload small over the wire and avoids leaking iOS-side paths
 * to network observers (proxies, HAR exports, etc.). The patterns
 * mirror the server's _scrub_error_message.
 */
export function scrubErrorMessage(raw: string): string {
  if (!raw) return '';
  const scrubbed = raw.replace(
    /(?:file:\/\/)?(?:content:\/\/[^\s]+|\/(?:var|Users|Library|System|private|tmp)\/[^\s]+)/gi,
    '[path]',
  );
  return scrubbed.length > MAX_ERROR_MESSAGE_LEN
    ? scrubbed.slice(0, MAX_ERROR_MESSAGE_LEN)
    : scrubbed;
}

/**
 * POST one upload telemetry event. Returns immediately; never throws.
 * Caller does not await — this is fire-and-forget.
 */
export async function fireUploadTelemetry(
  event: UploadTelemetryEvent,
): Promise<void> {
  try {
    const token = await tokenManager.getValidToken();
    if (!token) {
      // No auth = nothing the server can attribute. Drop silently
      // rather than firing an event we know will 401.
      return;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      TELEMETRY_TIMEOUT_MS,
    );
    try {
      await fetch(`${API_CONFIG.HOST}${TELEMETRY_ENDPOINT}`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(event),
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch {
    // Never throw — telemetry is fire-and-forget. Any thrown error
    // (timeout, network, parse) is swallowed so the user flow never
    // breaks because telemetry hiccuped.
  }
}

/**
 * In-place accumulator for upload metrics. The pipeline mutates this
 * across stages; at the end the orchestrator calls
 * ``buildTelemetryEvent`` and fires the result. Keeping the
 * accumulator separate from the event shape lets the pipeline track
 * timings even before it knows the final status.
 */
export class UploadMetricsAccumulator {
  readonly startedAt = Date.now();
  // Stage start timestamps; null until the stage actually runs.
  private compressStartedAt: number | null = null;
  private uploadStartedAt: number | null = null;
  private finalizeStartedAt: number | null = null;
  // Stage durations; populated by markStageEnd.
  private compressDurationMs: number | null = null;
  private uploadDurationMs: number = 0;
  private finalizeDurationMs: number | null = null;
  // Outcome metadata accumulated as we learn it.
  private retryCount = 0;
  private partsCount: number | null = null;
  private compressedBytes: number | null = null;
  // Most recently entered stage — used to classify a thrown error
  // into a failure_stage without the caller having to introspect
  // exception types.
  private currentStage: UploadFailureStage | null = null;
  // Caller (uploadEchoMedia) may switch from single-put → multipart
  // mid-pipeline once the post-compression size crosses threshold.
  private path: UploadPath;

  constructor(
    public readonly echoId: string,
    public readonly contentType: string,
    public readonly originalBytes: number,
    initialPath: UploadPath,
  ) {
    this.path = initialPath;
  }

  setUploadPath(p: UploadPath): void {
    this.path = p;
  }

  get uploadPath(): UploadPath {
    return this.path;
  }

  get lastEnteredStage(): UploadFailureStage | null {
    return this.currentStage;
  }

  markStageStart(stage: UploadFailureStage): void {
    const now = Date.now();
    this.currentStage = stage;
    if (stage === 'compress') this.compressStartedAt = now;
    else if (stage === 'upload') this.uploadStartedAt = now;
    else if (stage === 'finalize') this.finalizeStartedAt = now;
    // 'presign' has no duration tracked separately — too short to be
    // useful and the timestamp would just be overhead. The stage
    // marker still helps with failure classification.
  }

  markStageEnd(stage: UploadFailureStage): void {
    const now = Date.now();
    if (stage === 'compress' && this.compressStartedAt !== null) {
      this.compressDurationMs = now - this.compressStartedAt;
    } else if (stage === 'upload' && this.uploadStartedAt !== null) {
      this.uploadDurationMs = now - this.uploadStartedAt;
    } else if (stage === 'finalize' && this.finalizeStartedAt !== null) {
      this.finalizeDurationMs = now - this.finalizeStartedAt;
    }
    if (this.currentStage === stage) this.currentStage = null;
  }

  setCompressedBytes(n: number): void {
    this.compressedBytes = n;
  }

  setPartsCount(n: number): void {
    this.partsCount = n;
  }

  incrementRetryCount(): void {
    this.retryCount += 1;
  }

  /**
   * Build the final telemetry event. Caller supplies status + any
   * failure metadata; the accumulator fills in everything else.
   */
  build(args: {
    status: UploadStatus;
    failureStage?: UploadFailureStage;
    errorMessage?: string;
    backgroundedDuringUpload: boolean;
    appStateAtCompletion: AppStateAtCompletion;
  }): UploadTelemetryEvent {
    return {
      echo_id: this.echoId,
      content_type: this.contentType,
      original_bytes: this.originalBytes,
      compressed_bytes: this.compressedBytes,
      upload_path: this.path,
      parts_count: this.partsCount,

      status: args.status,
      failure_stage: args.failureStage,
      error_message: args.errorMessage
        ? scrubErrorMessage(args.errorMessage)
        : undefined,

      duration_compress_ms: this.compressDurationMs,
      duration_upload_ms: this.uploadDurationMs,
      duration_finalize_ms: this.finalizeDurationMs,
      duration_total_ms: Date.now() - this.startedAt,

      backgrounded_during_upload: args.backgroundedDuringUpload,
      retry_count: this.retryCount,
      app_state_at_completion: args.appStateAtCompletion,
      platform: Platform.OS === 'android' ? 'android' : 'ios',
      app_version: APP_VERSION,
    };
  }
}
