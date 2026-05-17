import ReactNativeBlobUtil from 'react-native-blob-util';

import type { ApiResponse } from '@types';
import {
  compressImageIfNeeded,
  compressVideoIfNeeded,
  unlinkQuietly,
} from '@utils/media/compress';
import { uuidV4 } from '@utils/uuid';

import { BaseApiService } from './base';
import { ApiErrorHandler } from './errorHandler';
import {
  MULTIPART_THRESHOLD,
  getFileSize,
  uploadMediaMultipart,
} from './multipart';
import { withUploadLifecycle } from './uploadLifecycle';

/**
 * Strip the `file://` scheme from a local URI. react-native-blob-util's
 * `wrap()` wants a plain filesystem path; passing the scheme can produce
 * "file not found" errors on iOS.
 */
function stripFileScheme(uri: string): string {
  return uri.startsWith('file://') ? uri.replace(/^file:\/\//, '') : uri;
}

/**
 * Stage in the upload pipeline, reported via the optional onStage callback.
 * Lets the UI render a "Compressing video…" / "Uploading 42%…" / "Finalizing…"
 * label that reflects what's actually happening — replacing the all-purpose
 * "Saving…" spinner that hid 30s of compression time.
 */
export type UploadStage =
  | { type: 'compressing'; fraction: number }
  | { type: 'requesting_url' }
  | { type: 'uploading'; sent: number; total: number }
  | { type: 'finalizing' };

/**
 * Convert a failed ApiResponse of one data shape into a failed ApiResponse
 * of another. Used when an early step in a pipeline fails: we want to
 * propagate the error envelope but the caller's declared return type is
 * a different data type, so we strip `data` (which is `undefined` on
 * failure anyway) and re-typed the envelope.
 *
 * Safer than `as unknown as ApiResponse<T>` because it explicitly
 * narrows on `success === false` and drops the foreign `data` field.
 */
function forwardFailure<T>(
  failed: ApiResponse<unknown>,
): ApiResponse<T> {
  return { success: false, error: failed.error };
}

export interface CreateEchoRequest {
  title: string;
  category: string;
  echo_type: 'TEXT' | 'AUDIO' | 'VIDEO';
  recipient_id?: string;
  guardian_id?: string;
  content?: string; // For text echoes
  release_date?: string; // ISO 8601 date string for scheduled release
  unlock_on_death?: boolean; // If true, echo is released when creator dies (verified by guardian)
  /** Optional cover note shown alongside the echo in the recipient's inbox. */
  letter_to_recipient?: string;
}

/**
 * Authoritative echo lifecycle state, mirrored from the backend `EchoStatus`
 * enum (src/app/models/echo.py).
 *
 * - DRAFT    — saved but not yet delivered. Recipient may be absent.
 * - LOCKED   — guardian-flow lock; awaits guardian release.
 * - RELEASED — delivered to recipient. Notification email sent.
 */
export type EchoStatus = 'DRAFT' | 'LOCKED' | 'RELEASED';

export interface EchoResponse {
  echo_id: string;
  title: string;
  category: string;
  echo_type: 'TEXT' | 'AUDIO' | 'VIDEO';
  /** Backend lifecycle state — use this (not date heuristics) to drive UI. */
  status?: EchoStatus;
  created_at: string;
  media_url?: string;
  content?: string;
  recipient?: {
    recipient_id: string;
    name: string;
    email: string;
    motif?: string;
    profile_image_url?: string;   // uploaded photo, shown in vault list
  };
  /** Present on inbox echoes — the user who created and sent the echo. */
  sender?: {
    user_id: string;
    name: string;
    email: string;
    motif?: string;
  };
  /**
   * User-chosen scheduled release timestamp (ISO 8601).
   * On inbox echoes this is aliased from the backend `release_date` field.
   * On vault echoes it's surfaced under the same name from PR 1 onwards.
   */
  release_date?: string;
  /** Timestamp when the echo transitioned to LOCKED via the guardian flow. */
  lock_date?: string;
  /** Optional cover note set on the recipient picker step. */
  letter_to_recipient?: string;
  /**
   * @deprecated Use `release_date` — `scheduled_at` is the inbox-side alias.
   * Kept for the EchoInboxScreen until PR 4 migrates it to `release_date`.
   */
  scheduled_at?: string;
}


export interface UploadUrlResponse {
  upload_url: string;
  media_url: string;
  /** Canonical S3 object key — pass to POST /finalize-media. */
  key: string;
  /** Bucket the upload lands in (informational; clients rarely need it). */
  bucket: string;
  expires_in: number;
}

export interface MultipartInitiateResponse {
  upload_id: string;
  key: string;
  bucket: string;
}

export interface MultipartPartUrlsResponse {
  part_urls: Array<{ part_number: number; url: string }>;
}

export interface Guardian {
  guardian_id: string;
  name: string;
  email: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export interface Recipient {
  recipient_id: string;
  name: string;
  email: string;
  relationship?: string;
  motif?: string;
  profile_image_url?: string;
  created_at: string;
  has_shared_echoes?: boolean;
}

export interface CreateGuardianRequest {
  name: string;
  email: string;
}

export interface CreateRecipientRequest {
  name: string;
  email: string;
  relationship?: string;
  motif?: string;
  profile_image_url?: string;   // S3 URL after upload, not a local file:// URI
}

// ========== PAGINATION ==========
// The backend list endpoints (/api/echoes, /api/echoes/inbox, /api/recipients,
// /api/guardians) accept `?limit=&cursor=` and return `next_cursor` alongside
// `data`. We expose two flavors of each:
//   - `getXxx()` — returns the FULL list, loops through pages internally with
//                  a safety cap. Preserves the legacy contract so existing
//                  screens (which expect a full list) keep working.
//   - `getXxxPage({ limit, cursor })` — returns ONE page plus `nextCursor`,
//                  for future `FlatList.onEndReached` infinite-scroll
//                  migration.

/** Hard cap on pages a `getXxx()` (full-list) call will fetch. Prevents an
 *  unbounded loop if the backend's `next_cursor` is buggy. 200 pages × 100
 *  items/page = 20,000 items — well above any real-user scenario. */
const MAX_PAGES_FULL_FETCH = 200;

/** Safe per-page size for the "fetch all" loop. The backend caps `limit` at
 *  100, so requesting 100 minimizes round-trips while staying inside the
 *  contract. */
const PAGE_SIZE_FULL_FETCH = 100;

export interface PageOpts {
  /** 1..100. Backend clamps to this range; sending 200 returns 100. */
  limit?: number;
  /** Opaque cursor from a previous page's `nextCursor`. `null`/`undefined` =
   *  first page. */
  cursor?: string | null;
}

export interface Page<T> {
  items: T[];
  /** `null` when the server has no more pages. */
  nextCursor: string | null;
}

function buildPaginationQuery(opts: PageOpts | undefined): string {
  if (!opts) return '';
  const params: string[] = [];
  if (typeof opts.limit === 'number' && opts.limit > 0) {
    params.push(`limit=${Math.min(100, Math.max(1, Math.floor(opts.limit)))}`);
  }
  if (opts.cursor) {
    // Backend sends URL-safe base64; encodeURIComponent is belt-and-braces
    // against any cursor character that needs escaping.
    params.push(`cursor=${encodeURIComponent(opts.cursor)}`);
  }
  return params.length === 0 ? '' : `?${params.join('&')}`;
}

function extractItemsArray<T>(raw: any): T[] {
  if (!raw) return [];
  const r = raw as any;
  if (Array.isArray(r.data)) return r.data as T[];
  if (Array.isArray(r.data?.echoes)) return r.data.echoes as T[];
  if (Array.isArray(r.data?.received_echoes)) return r.data.received_echoes as T[];
  if (Array.isArray(r.echoes)) return r.echoes as T[];
  if (Array.isArray(r.received_echoes)) return r.received_echoes as T[];
  return [];
}

function extractNextCursor(raw: any): string | null {
  if (!raw) return null;
  const r = raw as any;
  return (
    (r.next_cursor as string | null) ??
    (r.data?.next_cursor as string | null) ??
    null
  );
}

export class EchoApiService extends BaseApiService {

  /** Generic single-page fetch. Returns the page items + the next cursor. */
  private async fetchPage<T>(
    endpoint: string,
    opts: PageOpts | undefined,
    successMsg: string,
  ): Promise<ApiResponse<Page<T>>> {
    const qs = buildPaginationQuery(opts);
    const response = await this.makeRequest<any>(
      `${endpoint}${qs}`,
      'GET',
      null,
      true,
    );
    const items = extractItemsArray<T>(response);
    const nextCursor = extractNextCursor(response);
    const wrapped = { ...response, data: { items, nextCursor } };
    return ApiErrorHandler.handleApiResponse<Page<T>>(wrapped, successMsg);
  }

  /** Generic full-list fetch — loops through pages until `next_cursor` is
   *  null (or the safety cap fires). Preserves the legacy contract for
   *  screens that haven't migrated to infinite-scroll yet. */
  private async fetchAllPages<T>(
    endpoint: string,
    successMsg: string,
  ): Promise<ApiResponse<T[]>> {
    const items: T[] = [];
    let cursor: string | null = null;
    let lastResponse: any = null;

    for (let page = 0; page < MAX_PAGES_FULL_FETCH; page++) {
      const qs = buildPaginationQuery({
        limit: PAGE_SIZE_FULL_FETCH,
        cursor,
      });
      const response = await this.makeRequest<any>(
        `${endpoint}${qs}`,
        'GET',
        null,
        true,
      );
      lastResponse = response;
      items.push(...extractItemsArray<T>(response));
      cursor = extractNextCursor(response);
      if (!cursor) break;
    }

    if (cursor) {
      // Safety-cap hit. Surface as a warning but return what we have —
      // truncated lists are strictly better than 500s.
      console.warn(
        `[EchoApi] fetchAllPages hit MAX_PAGES_FULL_FETCH=${MAX_PAGES_FULL_FETCH} ` +
          `on ${endpoint}; returning ${items.length} items, more remain`,
      );
    }

    return ApiErrorHandler.handleApiResponse(
      { ...lastResponse, data: items },
      successMsg,
    );
  }

// ========== ECHOES ==========

  /** Fetch ALL echoes for the current user (paginates internally). Preserves
   *  the legacy contract — callers get one flat array. Use `getEchoesPage`
   *  for infinite-scroll UIs. */
  async getEchoes(): Promise<ApiResponse<EchoResponse[]>> {
    return this.fetchAllPages<EchoResponse>('/api/echoes', 'Echoes retrieved');
  }

  /** Fetch one page of echoes. `opts.cursor` from a prior call's
   *  `data.nextCursor`; pass `undefined`/`null` for the first page. */
  async getEchoesPage(
    opts?: PageOpts,
  ): Promise<ApiResponse<Page<EchoResponse>>> {
    return this.fetchPage<EchoResponse>(
      '/api/echoes',
      opts,
      'Echoes page retrieved',
    );
  }

  async getEcho(id: string): Promise<ApiResponse<EchoResponse>> {
    const response = await this.makeRequest<EchoResponse>(
      `/api/echoes/${id}`,
      'GET',
      null,
      true
    );
    return ApiErrorHandler.handleApiResponse(response, 'Echo retrieved');
  }

  /** Fetch ALL inbox echoes (received by the current user). Loops through
   *  pages internally. The legacy shape-normalisation (data.echoes /
   *  received_echoes) is preserved via `extractItemsArray` so older backend
   *  versions still resolve. */
  async getInboxEchoes(): Promise<ApiResponse<EchoResponse[]>> {
    try {
      return await this.fetchAllPages<EchoResponse>(
        '/api/echoes/inbox',
        'Inbox echoes retrieved',
      );
    } catch (err: any) {
      // makeRequest throws on 5xx and network errors. Mirror the legacy
      // error envelope so the screens that show "Network error loading
      // inbox" keep showing it instead of crashing the FlatList.
      console.error(
        '[EchoInbox] request failed:',
        err?.message,
        err?.status,
        err,
      );
      return {
        success: false,
        data: undefined,
        message: err?.message || 'Network error loading inbox',
        error: 'NetworkError',
      };
    }
  }

  /** Fetch one page of inbox echoes. For infinite-scroll callers. */
  async getInboxEchoesPage(
    opts?: PageOpts,
  ): Promise<ApiResponse<Page<EchoResponse>>> {
    return this.fetchPage<EchoResponse>(
      '/api/echoes/inbox',
      opts,
      'Inbox echoes page retrieved',
    );
  }

  async createEcho(data: CreateEchoRequest): Promise<ApiResponse<EchoResponse>> {
    // One UUID per logical createEcho call. The BaseApiService 429
    // retry-with-backoff loop replays with the same headers, so a
    // 429-driven retry hits the server's idempotency cache on
    // subsequent attempts within the same flow. A fresh call from
    // the screen (e.g. the user tapping Save again after a manual
    // failure) generates a new UUID — that's a new logical attempt
    // and should not be deduped.
    const response = await this.makeRequest<EchoResponse>(
      '/api/echoes',
      'POST',
      data,
      true,
      { 'Idempotency-Key': uuidV4() },
    );
    return ApiErrorHandler.handleApiResponse(response, 'Echo created successfully');
  }

  async updateEcho(
    id: string,
    /**
     * `release_date` and `recipient_id` accept `null` to *clear* the stored
     * value (backend honours this via `model_dump(exclude_unset=True)`).
     * Omit the field from `data` if you don't want to change it.
     */
    data: Partial<Omit<CreateEchoRequest, 'release_date' | 'recipient_id' | 'letter_to_recipient'>> & {
      media_url?: string;
      release_date?: string | null;
      recipient_id?: string | null;
      letter_to_recipient?: string | null;
    },
  ): Promise<ApiResponse<EchoResponse>> {
    const response = await this.makeRequest<EchoResponse>(
      `/api/echoes/${id}`,
      'PATCH',
      data,
      true
    );
    return ApiErrorHandler.handleApiResponse(response, 'Echo updated successfully');
  }

  // ── Send-later helpers ─────────────────────────────────────────────────────
  // Thin semantic wrappers around updateEcho / release so call sites in the
  // detail-screen overflow menu read like English. All four ultimately hit
  // PATCH /api/echoes/{id} (or its /release variant).

  /** Attach (or replace) the recipient on a DRAFT echo. */
  async assignRecipient(
    echoId: string,
    recipientId: string,
  ): Promise<ApiResponse<EchoResponse>> {
    return this.updateEcho(echoId, { recipient_id: recipientId });
  }

  /** Set (or replace) the scheduled release date on a DRAFT echo. */
  async scheduleEcho(
    echoId: string,
    releaseDate: string,
  ): Promise<ApiResponse<EchoResponse>> {
    return this.updateEcho(echoId, { release_date: releaseDate });
  }

  /**
   * Clear the scheduled release date on a DRAFT echo.
   *
   * Use this for "Cancel scheduled send" — keeps the recipient attached but
   * unsets the date, so the row falls back to the "Saved" state.
   */
  async clearSchedule(echoId: string): Promise<ApiResponse<EchoResponse>> {
    return this.updateEcho(echoId, { release_date: null });
  }

  /**
   * Release a DRAFT echo to its recipient immediately (no-guardian path).
   *
   * Backend preconditions (enforced server-side): echo must be DRAFT, owned
   * by caller, have a `recipient_id`, and have no `guardian_id`. The server
   * transitions the echo to RELEASED and emails the recipient.
   */
  async releaseEcho(echoId: string): Promise<ApiResponse<EchoResponse>> {
    const response = await this.makeRequest<EchoResponse>(
      `/api/echoes/${echoId}/release`,
      'PATCH',
      null,
      true,
    );
    return ApiErrorHandler.handleApiResponse(response, 'Echo released successfully');
  }

  async deleteEcho(id: string): Promise<ApiResponse<void>> {
    const response = await this.makeRequest<void>(
      `/api/echoes/${id}`,
      'DELETE',
      null,
      true
    );
    return ApiErrorHandler.handleApiResponse(response, 'Echo deleted');
  }

  /**
   * Get a presigned S3 upload URL.
   *
   * @param fileType   MIME type e.g. 'audio/m4a', 'video/mp4', 'image/jpeg'
   * @param echoId     Required for echo media (audio/video/text attachments).
   *                   Omit for non-echo uploads (e.g. profile images) — backend
   *                   generates the URL without an echo association.
   * @param uploadType Hint to the backend: 'echo' (default) | 'profile'.
   *                   Allows the backend to apply appropriate S3 path/policy.
   *
   * All callers share the same endpoint and the same uploadMedia() utility,
   * so no separate API is needed for profile images.
   */
  async getUploadUrl(
    fileType: string,
    echoId?: string,
    uploadType: 'echo' | 'profile' = 'echo',
  ): Promise<ApiResponse<UploadUrlResponse>> {
    const response = await this.makeRequest<UploadUrlResponse>(
      '/api/echoes/upload-url',
      'POST',
      {
        file_type:   fileType,
        upload_type: uploadType,
        ...(echoId ? { echo_id: echoId } : {}),
      },
      true,
    );
    return ApiErrorHandler.handleApiResponse(response, 'Upload URL retrieved');
  }

  async uploadMedia(
    uploadUrl: string,
    fileUri: string,
    contentType: string,
    onProgress?: (sent: number, total: number) => void,
  ): Promise<void> {
    // Stream the file natively to S3 via react-native-blob-util.
    // The previous implementation used `fetch(fileUri).blob()` which copies
    // the entire file across the JS bridge as a base64 string, then ships
    // it back across the bridge a second time as the request body —
    // catastrophic for video (a 1m14s clip could take 5+ minutes and
    // routinely OOM'd the JS thread). `ReactNativeBlobUtil.wrap(path)`
    // tells the native module to stream the file directly from disk into
    // the HTTP request, bypassing the bridge entirely.
    const localPath = stripFileScheme(fileUri);

    try {
      const task = ReactNativeBlobUtil.fetch(
        'PUT',
        uploadUrl,
        { 'Content-Type': contentType },
        ReactNativeBlobUtil.wrap(localPath),
      );

      if (onProgress) {
        task.uploadProgress({ interval: 250 }, (sent, total) => {
          onProgress(Number(sent), Number(total));
        });
      }

      const response = await task;
      const status = response.respInfo?.status ?? 0;

      if (status < 200 || status >= 300) {
        const body = response.text?.() ?? '';
        console.error('S3 upload failed:', status, body);
        throw new Error(`Media upload failed (${status})`);
      }
    } catch (error: unknown) {
      // ReactNativeBlobUtil throws on network failure / cancellation;
      // surface a consistent message to the caller.
      if (error instanceof Error && error.message.startsWith('Media upload failed')) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown upload error';
      console.error('Native upload error:', message);
      throw new Error(`Cannot upload media file: ${message}`);
    }
  }

  /**
   * Tell the backend "the PUT succeeded — verify and commit it."
   *
   * The backend HEADs the S3 object, validates the key prefix matches the
   * caller's namespace, captures the real Content-Type + size + ETag from
   * S3 (not from caller input), and atomically writes the canonical
   * media_url to the echo row. This replaces the older client-driven
   * `PATCH /echoes/:id` with a `media_url` payload — that path is still
   * accepted by the backend for compatibility but is no longer the
   * recommended call shape.
   */
  async finalizeMedia(
    echoId: string,
    key: string,
    contentType?: string,
  ): Promise<ApiResponse<EchoResponse>> {
    // Same idempotency contract as createEcho — survives the 429 retry
    // loop within one logical attempt. Particularly important here
    // because the finalize call comes AFTER the S3 PUT succeeded: a
    // duplicate finalize without dedup would race the first one and
    // can produce a "media already finalized" reject on the second.
    //
    // Longer timeout (20 s) than the default 10 s: the server-side
    // HeadObject + DDB write is normally <3 s, but a cold S3 partition
    // or transient cross-AZ latency can push it past 10 s, and a
    // timeout here is bad UX — the upload bytes ARE in S3 at this
    // point, the user just sees a "could not be confirmed" error.
    const response = await this.makeRequest<EchoResponse>(
      `/api/echoes/${encodeURIComponent(echoId)}/finalize-media`,
      'POST',
      {
        key,
        ...(contentType ? { content_type: contentType } : {}),
      },
      true,
      { 'Idempotency-Key': uuidV4() },
      { timeoutMs: 20_000 },
    );
    return ApiErrorHandler.handleApiResponse(response, 'Media finalized');
  }

  // ========== Multipart upload (files > MULTIPART_THRESHOLD) ==========
  //
  // Wraps the four backend routes that bridge to S3's MultipartUpload
  // API. Used by uploadEchoMedia when the source file is large enough
  // that the single-PUT path becomes lossy on cellular. The actual
  // orchestration (slice → upload parts → complete) lives in
  // services/api/multipart.ts; these are just typed wrappers around
  // makeRequest.

  async initiateMultipart(
    echoId: string,
    fileType: string,
  ): Promise<ApiResponse<MultipartInitiateResponse>> {
    const response = await this.makeRequest<MultipartInitiateResponse>(
      `/api/echoes/${encodeURIComponent(echoId)}/multipart/initiate`,
      'POST',
      { file_type: fileType },
      true,
      { 'Idempotency-Key': uuidV4() },
    );
    return ApiErrorHandler.handleApiResponse(response, 'Multipart upload initiated');
  }

  async getMultipartPartUrls(
    echoId: string,
    uploadId: string,
    key: string,
    partNumbers: number[],
  ): Promise<ApiResponse<MultipartPartUrlsResponse>> {
    // NOT idempotency-keyed — the server doesn't cache these either,
    // because the presigned URLs themselves rotate every call.
    const response = await this.makeRequest<MultipartPartUrlsResponse>(
      `/api/echoes/${encodeURIComponent(echoId)}/multipart/part-urls`,
      'POST',
      { upload_id: uploadId, key, part_numbers: partNumbers },
      true,
    );
    return ApiErrorHandler.handleApiResponse(response, 'Part URLs generated');
  }

  async completeMultipart(
    echoId: string,
    uploadId: string,
    key: string,
    parts: Array<{ part_number: number; etag: string }>,
  ): Promise<ApiResponse<EchoResponse>> {
    // 30 s timeout — well above the 10 s default. S3's
    // CompleteMultipartUpload is roughly O(parts) on the server side;
    // a 2 GB file split into 400 parts can take 5-10 s to assemble,
    // and a 5 GB / 1000-part file can land at 10-15 s. Plus the
    // server-side HeadObject + DDB write that finalize_upload runs
    // afterward. A tight timeout here would surface as "upload
    // failed" to the user even though the bytes successfully landed
    // and S3 was simply busy assembling them.
    const response = await this.makeRequest<EchoResponse>(
      `/api/echoes/${encodeURIComponent(echoId)}/multipart/complete`,
      'POST',
      { upload_id: uploadId, key, parts },
      true,
      { 'Idempotency-Key': uuidV4() },
      { timeoutMs: 30_000 },
    );
    return ApiErrorHandler.handleApiResponse(response, 'Multipart upload completed');
  }

  async abortMultipart(
    echoId: string,
    uploadId: string,
    key: string,
  ): Promise<ApiResponse<void>> {
    const response = await this.makeRequest<void>(
      `/api/echoes/${encodeURIComponent(echoId)}/multipart/abort`,
      'POST',
      { upload_id: uploadId, key },
      true,
    );
    return ApiErrorHandler.handleApiResponse(response, 'Multipart upload aborted');
  }

  /**
   * End-to-end echo-media upload: compress → presign → stream → finalize.
   *
   * Why this exists: three screens (NewEchoVideoScreen, NewEchoAudioScreen,
   * NewEchoComposeScreen) each duplicated the same six lines of glue code
   * around `getUploadUrl + uploadMedia + updateEcho`. Centralizing the
   * pipeline lets us:
   *   - apply compression uniformly (only on this path; profile-photo
   *     upload-paths in ProfileScreen / AddNewProfileScreen still call
   *     getUploadUrl + uploadMedia directly because they have a separate
   *     compression sequence already, via compressImageIfNeeded);
   *   - emit consistent UploadStage events so each screen's progress UI
   *     can use the same shape; and
   *   - migrate to the new POST /finalize-media endpoint in one place.
   *
   * @param echoId The echo this media belongs to. Must exist on the
   *   backend already (a stub row was created by `createEcho`).
   * @param fileUri Local URI of the file to upload. May be transformed
   *   by compression before the PUT.
   * @param contentType MIME type of the *original* file. Compression may
   *   change the underlying container (mp4 vs mov) but we pass the source
   *   MIME so the backend's HeadObject sees the right value.
   * @param onStage Optional progress reporter. Fires for compressing /
   *   requesting URL / uploading (bytes) / finalizing transitions.
   * @param onBackground Optional callback fired the FIRST time the user
   *   backgrounds the app while the upload is in flight. Use it to
   *   surface a "your save will pause when the app is backgrounded"
   *   hint. Today's upload pipeline does not survive full backgrounding
   *   (see uploadLifecycle.ts for the roadmap); the callback exists so
   *   screens can warn the user rather than silently failing.
   *
   * @returns The fully populated echo row (status, media_url, recipient,
   *   etc.) — same shape as `GET /echoes/{id}` so callers can drop it
   *   straight into their cached state.
   */
  async uploadEchoMedia(
    echoId: string,
    fileUri: string,
    contentType: string,
    onStage?: (stage: UploadStage) => void,
    onBackground?: () => void,
  ): Promise<ApiResponse<EchoResponse>> {
    // Wrap the entire pipeline (compress → upload → finalize) in an
    // AppState listener so the screen can surface a "save will pause"
    // hint if the user backgrounds mid-upload. Today's upload pipeline
    // pauses when the OS suspends the JS thread; the lifecycle helper
    // documents this honestly rather than papering over it. See
    // src/services/api/uploadLifecycle.ts for the roadmap toward true
    // NSURLSession background uploads.
    return withUploadLifecycle({ onBackground }, async () => {
      return this._uploadEchoMediaInner(echoId, fileUri, contentType, onStage);
    });
  }

  private async _uploadEchoMediaInner(
    echoId: string,
    fileUri: string,
    contentType: string,
    onStage?: (stage: UploadStage) => void,
  ): Promise<ApiResponse<EchoResponse>> {
    // 1. Compress when the source is large. Track the compressed URI
    // separately so we can clean it up regardless of how the rest of
    // the pipeline ends — without this, every failed upload leaks a
    // temp file into the cache directory.
    let workingUri = fileUri;
    if (contentType.startsWith('video/')) {
      const { uri } = await compressVideoIfNeeded(fileUri, fraction => {
        onStage?.({ type: 'compressing', fraction });
      });
      workingUri = uri;
    } else if (contentType.startsWith('image/')) {
      onStage?.({ type: 'compressing', fraction: 0 });
      const { uri } = await compressImageIfNeeded(fileUri);
      workingUri = uri;
      onStage?.({ type: 'compressing', fraction: 1 });
    }

    try {
      // 2. Decide single-PUT vs multipart based on (post-compression)
      // file size. Anything we can't measure (PHAsset-style URI before
      // export) defaults to single-PUT.
      const fileSize = await getFileSize(workingUri);
      if (fileSize !== null && fileSize >= MULTIPART_THRESHOLD) {
        return await uploadMediaMultipart({
          api: this,
          echoId,
          fileUri: workingUri,
          contentType,
          fileSize,
          onStage,
        });
      }

      // 3. Single-PUT path. Ask the backend for a presigned PUT URL.
      onStage?.({ type: 'requesting_url' });
      const presigned = await this.getUploadUrl(contentType, echoId, 'echo');
      if (!presigned.success || !presigned.data) {
        return forwardFailure<EchoResponse>(presigned);
      }
      const { upload_url, key } = presigned.data;

      // 4. Stream the (possibly compressed) file to S3.
      await this.uploadMedia(
        upload_url,
        workingUri,
        contentType,
        (sent, total) => {
          onStage?.({ type: 'uploading', sent, total });
        },
      );

      // 5. Atomic commit. Server HEADs S3, captures truth, writes DDB.
      // If this fails, the bytes are in S3 but the echo row has no
      // media_url — the user must re-attempt media attach. We surface
      // a specific error message so the UI can tell them so.
      onStage?.({ type: 'finalizing' });
      const finalized = await this.finalizeMedia(echoId, key, contentType);
      if (!finalized.success) {
        // Use || (not ??) — backend may return `error: ''` for a 500.
        // The user-facing copy is intentionally specific: the bytes ARE
        // in S3 at this point, so "upload failed" is misleading. The
        // remediation is "try saving again", which re-creates the row.
        return {
          ...finalized,
          error:
            finalized.error ||
            'Upload completed but could not be confirmed. Please try saving again.',
        };
      }
      return finalized;
    } finally {
      // Best-effort cleanup of the compressed temp file. The original
      // (picker-supplied) URI is the platform's — never touch it.
      if (workingUri !== fileUri) {
        await unlinkQuietly(workingUri);
      }
    }
  }

  // ========== GUARDIANS ==========

  async getGuardians(): Promise<ApiResponse<Guardian[]>> {
    return this.fetchAllPages<Guardian>('/api/guardians', 'Guardians retrieved');
  }

  async getGuardiansPage(
    opts?: PageOpts,
  ): Promise<ApiResponse<Page<Guardian>>> {
    return this.fetchPage<Guardian>(
      '/api/guardians',
      opts,
      'Guardians page retrieved',
    );
  }

  async addGuardian(data: CreateGuardianRequest): Promise<ApiResponse<Guardian>> {
    const response = await this.makeRequest<Guardian>(
      '/api/guardians',
      'POST',
      data,
      true
    );
    return ApiErrorHandler.handleApiResponse(response, 'Guardian added');
  }

  async removeGuardian(id: string): Promise<ApiResponse<void>> {
    const response = await this.makeRequest<void>(
      `/api/guardians/${id}`,
      'DELETE',
      null,
      true
    );
    return ApiErrorHandler.handleApiResponse(response, 'Guardian removed');
  }

  // ========== RECIPIENTS ==========

  async getRecipients(): Promise<ApiResponse<Recipient[]>> {
    return this.fetchAllPages<Recipient>(
      '/api/recipients',
      'Recipients retrieved',
    );
  }

  async getRecipientsPage(
    opts?: PageOpts,
  ): Promise<ApiResponse<Page<Recipient>>> {
    return this.fetchPage<Recipient>(
      '/api/recipients',
      opts,
      'Recipients page retrieved',
    );
  }

  async addRecipient(data: CreateRecipientRequest): Promise<ApiResponse<Recipient>> {
    const response = await this.makeRequest<Recipient>(
      '/api/recipients',
      'POST',
      data,
      true
    );
    return ApiErrorHandler.handleApiResponse(response, 'Recipient added');
  }

  async removeRecipient(id: string): Promise<ApiResponse<void>> {
    const response = await this.makeRequest<void>(
      `/api/recipients/${id}`,
      'DELETE',
      null,
      true
    );
    return ApiErrorHandler.handleApiResponse(response, 'Recipient removed');
  }
}

export const echoApiService = new EchoApiService();

