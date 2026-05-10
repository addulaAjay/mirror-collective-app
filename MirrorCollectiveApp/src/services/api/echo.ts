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

export class EchoApiService extends BaseApiService {
  
// ========== ECHOES ==========

  async getEchoes(): Promise<ApiResponse<EchoResponse[]>> {
    const response = await this.makeRequest<EchoResponse[]>(
      '/api/echoes',
      'GET',
      null,
      true
    );
    return ApiErrorHandler.handleApiResponse(response, 'Echoes retrieved');
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

  async getInboxEchoes(): Promise<ApiResponse<EchoResponse[]>> {
    let raw: any;
    try {
      raw = await this.makeRequest<any>('/api/echoes/inbox', 'GET', null, true);
    } catch (err: any) {
      // makeRequest throws on 5xx and network errors — always log so the cause
      // is visible in Metro even before normalisation runs.
      console.error('[EchoInbox] request failed:', err?.message, err?.status, err);
      return {
        success: false,
        data: undefined,
        message: err?.message || 'Network error loading inbox',
        error: 'NetworkError',
      };
    }

    console.log('[EchoInbox] raw response:', JSON.stringify(raw, null, 2));

    // Normalise response shape — backend may return echoes under different keys.
    const r = raw as any;
    const echoes: EchoResponse[] | undefined =
      Array.isArray(r.data)                  ? r.data :
      Array.isArray(r.data?.echoes)          ? r.data.echoes :
      Array.isArray(r.data?.received_echoes) ? r.data.received_echoes :
      Array.isArray(r.echoes)                ? r.echoes :
      Array.isArray(r.received_echoes)       ? r.received_echoes :
      undefined;

    const normalised = { ...raw, data: echoes };
    return ApiErrorHandler.handleApiResponse<EchoResponse[]>(normalised, 'Inbox echoes retrieved');
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
    data: Partial<Omit<CreateEchoRequest, 'release_date' | 'recipient_id'>> & {
      media_url?: string;
      release_date?: string | null;
      recipient_id?: string | null;
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
    const response = await this.makeRequest<Guardian[]>(
      '/api/guardians',
      'GET',
      null,
      true
    );
    return ApiErrorHandler.handleApiResponse(response, 'Guardians retrieved');
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
    const response = await this.makeRequest<Recipient[]>(
      '/api/recipients',
      'GET',
      null,
      true
    );
    return ApiErrorHandler.handleApiResponse(response, 'Recipients retrieved');
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

