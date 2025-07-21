import AsyncStorage from '@react-native-async-storage/async-storage';
import { BaseApiService } from './base';
import { API_CONFIG } from '../../constants/config';
import type {
  AuthCredentials,
  SignUpData,
  VerifyEmailData,
  ResetPasswordData,
  ApiResponse,
} from '../../types';

interface AuthResponse {
  user?: {
    id: string;
    email: string;
    fullName: string;
    isVerified: boolean;
  };
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
}

interface SimpleResponse {
  success: boolean;
  message: string;
}

export class AuthApiService extends BaseApiService {
  async signUp(data: SignUpData): Promise<ApiResponse<SimpleResponse>> {
    return this.makeRequest<SimpleResponse>(
      API_CONFIG.ENDPOINTS.AUTH.SIGNUP,
      'POST',
      data,
    );
  }

  async signIn(
    credentials: AuthCredentials,
  ): Promise<ApiResponse<AuthResponse>> {
    const response = await this.makeRequest<AuthResponse>(
      API_CONFIG.ENDPOINTS.AUTH.LOGIN,
      'POST',
      credentials,
    );
    // Login response doesn't have success field, so we wrap it
    return {
      success: true,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async verifyEmail(
    data: VerifyEmailData,
  ): Promise<ApiResponse<SimpleResponse>> {
    return this.makeRequest<SimpleResponse>(
      API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL,
      'POST',
      data,
    );
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.makeRequest(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD, 'POST', {
      email,
    });
  }

  async resetPassword(data: ResetPasswordData): Promise<ApiResponse> {
    return this.makeRequest(
      API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD,
      'POST',
      data,
    );
  }

  async resendVerificationCode(email: string): Promise<ApiResponse> {
    try {
      const response = await fetch(
        API_CONFIG.ENDPOINTS.AUTH.RESEND_VERIFICATION_CODE,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        },
      );
      const data = await response.json();
      return {
        success: response.ok,
        data: data,
        message: data?.message,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message || 'Network error',
      };
    }
  }

  async signOut(): Promise<ApiResponse> {
    const result = await this.makeRequest('/auth/logout', 'POST', {}, true);
    await this.clearTokens();
    return result;
  }

  // Token management
  async storeTokens(tokens: {
    accessToken: string;
    refreshToken: string;
  }): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem('accessToken', tokens.accessToken),
        AsyncStorage.setItem('refreshToken', tokens.refreshToken),
        AsyncStorage.setItem('isAuthenticated', 'true'),
      ]);
    } catch (error) {
      throw new Error('Failed to store authentication tokens');
    }
  }

  async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        'accessToken',
        'refreshToken',
        'isAuthenticated',
      ]);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const [isAuth, accessToken] = await Promise.all([
        AsyncStorage.getItem('isAuthenticated'),
        AsyncStorage.getItem('accessToken'),
      ]);

      return isAuth === 'true' && accessToken !== null;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  async getUserProfile(): Promise<ApiResponse<{ user: any }>> {
    return this.makeRequest('/auth/me', 'GET', null, true);
  }

  async refreshToken(): Promise<ApiResponse<AuthResponse>> {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await this.makeRequest<AuthResponse>(
      '/auth/refresh',
      'POST',
      { refreshToken },
    );
    
    return {
      success: true,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }
}

export const authApiService = new AuthApiService();
