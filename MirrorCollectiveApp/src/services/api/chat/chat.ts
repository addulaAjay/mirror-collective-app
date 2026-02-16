import type { ApiResponse, ChatRequest, ChatResponse } from '@types';

import { API_CONFIG } from '@constants/config';

import { BaseApiService } from '../base';
import { ApiErrorHandler } from '../errorHandler';


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
    );

    return ApiErrorHandler.handleApiResponse<ChatResponse>(
      response,
      'Message sent successfully',
      'ChatError',
    );
  }
}

export const chatApiService = new ChatApiService();
