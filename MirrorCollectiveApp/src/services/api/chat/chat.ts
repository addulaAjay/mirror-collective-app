import { BaseApiService } from '../base';
import { API_CONFIG } from '../../../constants/config';
import { ApiErrorHandler } from '../errorHandler';
import type { ApiResponse, ChatRequest, ChatResponse } from '../../../types';

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
