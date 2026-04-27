import type { ApiResponse } from '@types';
import { BaseApiService } from './base';
import { ApiErrorHandler } from './errorHandler';

interface PledgeAcceptanceResponse {
  pledgeAcceptedAt: string;
}

export interface UpdateProfileRequest {
  profile_image_url?: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  profile_image_url?: string;
  [key: string]: unknown;
}

export class UserApiService extends BaseApiService {
  async getProfile(): Promise<ApiResponse<UserProfileResponse>> {
    const response = await this.makeRequest<UserProfileResponse>(
      '/auth/me',
      'GET',
      null,
      true,
    );
    return ApiErrorHandler.handleApiResponse<UserProfileResponse>(response, 'Profile retrieved');
  }

  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<void>> {
    const response = await this.makeRequest<void>(
      '/auth/me',
      'PATCH',
      data,
      true,
    );
    return ApiErrorHandler.handleApiResponse<void>(response, 'Profile updated');
  }

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
    );
  }
}

export const userApiService = new UserApiService();

// Export the function for easier testing
export const updatePledgeAcceptance = () => userApiService.updatePledgeAcceptance();
