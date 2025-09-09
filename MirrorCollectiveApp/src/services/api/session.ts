import { BaseApiService } from './base';
import { API_CONFIG } from '../../constants/config';
import { ApiErrorHandler } from './errorHandler';
import type { ApiResponse, SessionGreetingResponse } from '../../types';

export class SessionApiService extends BaseApiService {
  /**
   * Get session greeting when user enters MirrorGPT screen
   */
  async getGreeting(): Promise<ApiResponse<SessionGreetingResponse>> {
    const response = await this.makeRequest<SessionGreetingResponse>(
      API_CONFIG.ENDPOINTS.SESSION.GREETING,
      'GET',
      null,
      true, // Requires authentication
    );

    return ApiErrorHandler.handleApiResponse<SessionGreetingResponse>(
      response,
      'Session greeting retrieved successfully',
      'SessionError',
    );
  }
}

export const sessionApiService = new SessionApiService();
