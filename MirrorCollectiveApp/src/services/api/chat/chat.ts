import { BaseApiService } from '../base';
import { API_CONFIG } from '../../../constants/config';
import type { ChatRequest, ChatResponse } from '../../../types';

export class ChatApiService extends BaseApiService {
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await this.makeRequest<{ reply: string }>(
      API_CONFIG.ENDPOINTS.MIRROR_CHAT,
      'POST',
      request
    );
    
    return {
      success: response.success,
      data: response.data,
      error: response.error,
    };
  }
}

export const chatApiService = new ChatApiService();