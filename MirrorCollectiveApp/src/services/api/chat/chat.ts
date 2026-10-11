import type { ApiResponse, ChatRequest, ChatResponse } from '@types';

import { API_CONFIG } from '@constants/config';

import { BaseApiService } from '../base';
import { ApiErrorHandler } from '../errorHandler';

/**
 * Per-route timeout for MirrorGPT chat.
 *
 * The endpoint chains an OpenAI completion (sometimes two — main reply
 * plus archetype analysis) plus a suggested-practice lookup. p50 lands
 * at ~6-10 s; p95 at ~25-35 s, with cold-start GPT-4 calls occasionally
 * hitting 40 s+. The default 10 s API_CONFIG.TIMEOUT was firing
 * AbortController before the reply arrived, surfacing as
 * "abort error" on the chat input.
 *
 * ## Why 30 s and not 60
 *
 * This was 60_000, which was never reachable: the api Lambda is configured
 * with `timeout: 30` (serverless.yml) and API Gateway HTTP API caps its
 * integration at 30 s regardless. Anything slower than 30 s comes back as a
 * gateway 504, not as a slow success — so a 60 s client timeout just meant
 * the user stared at a spinner for an extra 30 s after the request had
 * already failed.
 *
 * 30 s matches the real server ceiling, so a timeout here means the same
 * thing the server means by it.
 *
 * Note an attachment turn spends part of this budget transferring the photo
 * (~400 KB), which is why the client compresses hard before sending — see
 * features/chat-media/prepareChatPhoto.ts.
 */
const MIRROR_CHAT_TIMEOUT_MS = 30_000;


export class ChatApiService extends BaseApiService {
  /**
   * Send message to MirrorGPT API
   */
  async sendMessage(request: ChatRequest): Promise<ApiResponse<ChatResponse>> {
    const response = await this.makeRequest<ChatResponse>(
      API_CONFIG.ENDPOINTS.MIRROR_CHAT,
      'POST',
      request,
      true, // Requires authentication - Bearer token
      undefined, // no extra headers
      { timeoutMs: MIRROR_CHAT_TIMEOUT_MS },
    );

    return ApiErrorHandler.handleApiResponse<ChatResponse>(
      response,
      'Message sent successfully',
      'ChatError',
    );
  }
}

export const chatApiService = new ChatApiService();
