import type { ApiResponse } from '@types';

import { BaseApiService } from './base';
import { ApiErrorHandler } from './errorHandler';

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
  /**
   * Size of the uploaded media in bytes. Forwarded to the backend so storage
   * quota can be summed from DynamoDB without a per-call S3 scan. Omit for
   * TEXT echoes; set on AUDIO/VIDEO after `probeLocalFileSize`.
   */
  size_bytes?: number;
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
  expires_in: number;
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
    const response = await this.makeRequest<EchoResponse>(
      '/api/echoes',
      'POST',
      data,
      true // requiresAuth
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
      /** Set alongside media_url after upload so storage quota stays accurate. */
      size_bytes?: number;
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
    /**
     * Declared byte size of the file the client is about to upload. The
     * backend pre-flights the storage quota using this value (only for
     * upload_type='echo') and persists it on the echo row so the quota
     * service can sum sizes from DynamoDB without a per-call S3 scan.
     */
    fileSizeBytes?: number,
  ): Promise<ApiResponse<UploadUrlResponse>> {
    const response = await this.makeRequest<UploadUrlResponse>(
      '/api/echoes/upload-url',
      'POST',
      {
        file_type:   fileType,
        upload_type: uploadType,
        ...(echoId ? { echo_id: echoId } : {}),
        ...(typeof fileSizeBytes === 'number' && fileSizeBytes >= 0
          ? { file_size_bytes: fileSizeBytes }
          : {}),
      },
      true,
    );
    return ApiErrorHandler.handleApiResponse(response, 'Upload URL retrieved');
  }

  /**
   * Read a local file (file:// URI or content://) and report its byte size.
   *
   * Used by the audio / video compose flows to declare `file_size_bytes`
   * on the upload-url call so the backend can pre-flight the storage
   * quota before issuing a presigned S3 URL. Returns 0 on failure rather
   * than throwing — the upload itself will still happen; a missing size
   * just degrades the pre-flight to the same "no_quota only" gate the
   * server applies when the field is omitted.
   */
  async probeLocalFileSize(fileUri: string): Promise<number> {
    try {
      const res = await fetch(fileUri);
      if (!res.ok) {
        return 0;
      }
      const blob = await res.blob();
      return blob.size || 0;
    } catch {
      return 0;
    }
  }

  async uploadMedia(uploadUrl: string, fileUri: string, contentType: string): Promise<void> {
    // Step 1: Read the local file into a blob
    let blob: Blob;
    try {
      const fileResponse = await fetch(fileUri);
      if (!fileResponse.ok) {
        throw new Error(`Failed to read local file: ${fileResponse.status}`);
      }
      blob = await fileResponse.blob();
    } catch (error: any) {
      console.error('Failed to read media file:', error);
      throw new Error(`Cannot read media file: ${error.message}`);
    }

    // Step 2: PUT the blob to the presigned S3 URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: blob,
    });

    if (!uploadResponse.ok) {
      const body = await uploadResponse.text().catch(() => '');
      console.error('S3 upload failed:', uploadResponse.status, body);
      throw new Error(`Media upload failed (${uploadResponse.status})`);
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

