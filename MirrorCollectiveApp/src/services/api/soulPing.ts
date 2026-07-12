import { API_CONFIG } from '@constants/config';
import type { ApiResponse } from '@types';

import { BaseApiService } from './base';

export interface MarkSoulPingReadResponse {
  success: boolean;
  ping_id: string;
}

/**
 * Soul Ping API — reports engagement with proactive notifications.
 *
 * The backend uses "seen" state to decide the next scheduled ping: a fresh
 * content nudge, a different re-engagement message, or skip — so the user
 * stops getting duplicate notifications for a conversation they've already
 * been nudged about. See the API's soul_ping_service.
 */
export class SoulPingApiService extends BaseApiService {
  /**
   * Mark a Soul Ping as seen/opened. Best-effort — callers should not block
   * UI on the result. `pingId` comes from the push `data` payload.
   */
  async markRead(
    pingId: string,
  ): Promise<ApiResponse<MarkSoulPingReadResponse>> {
    const endpoint = API_CONFIG.ENDPOINTS.SOUL_PING.MARK_READ.replace(
      '{ping_id}',
      encodeURIComponent(pingId),
    );
    return this.post<MarkSoulPingReadResponse>(endpoint, undefined, true);
  }
}

export const soulPingApiService = new SoulPingApiService();
