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
 * 60 s gives the server room to complete on tail latency while still
 * surfacing a clear "request hung" if the Lambda itself stalled. The
 * OpenAI tier limits + Lambda 60 s default execution cap make a
 * longer client wait pointless.
 */
const MIRROR_CHAT_TIMEOUT_MS = 60_000;


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
