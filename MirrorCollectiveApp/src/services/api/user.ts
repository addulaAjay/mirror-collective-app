import type { ApiResponse } from '@types';
import { BaseApiService } from './base';
import { ApiErrorHandler } from './errorHandler';

interface PledgeAcceptanceResponse {
  pledgeAcceptedAt: string;
}

export class UserApiService extends BaseApiService {
  async updatePledgeAcceptance(): Promise<ApiResponse<PledgeAcceptanceResponse>> {
    const pledgeAcceptedAt = new Date().toISOString();
    
    const response = await this.makeRequest<PledgeAcceptanceResponse>(
      '/user/pledge-acceptance',
      'PATCH',
      { pledgeAcceptedAt },
      true, // requires auth
    );
    
    return ApiErrorHandler.handleApiResponse<PledgeAcceptanceResponse>(
      response,
      'Pledge acceptance recorded successfully',
      'PledgeAcceptanceError',
    );
  }
}

export const userApiService = new UserApiService();

// Export the function for easier testing
export const updatePledgeAcceptance = () => userApiService.updatePledgeAcceptance();
