import AsyncStorage from '@react-native-async-storage/async-storage';
import { BaseApiService } from './base';
import { API_CONFIG } from '../../constants/config';
import { ApiErrorHandler } from './errorHandler';
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
    const response = await this.makeRequest<any>(
      API_CONFIG.ENDPOINTS.AUTH.SIGNUP,
      'POST',
      data,
    );
    return ApiErrorHandler.handleApiResponse<SimpleResponse>(
      response,
      'Account created successfully',
      'SignUpError',
    );
  }

  async signIn(
    credentials: AuthCredentials,
  ): Promise<ApiResponse<AuthResponse>> {
    const response = await this.makeRequest<any>(
      API_CONFIG.ENDPOINTS.AUTH.LOGIN,
      'POST',
      credentials,
    );
    return ApiErrorHandler.handleApiResponse<AuthResponse>(
      response,
      'Login successful',
      'AuthenticationError',
    );
  }

  async verifyEmail(
    data: VerifyEmailData,
  ): Promise<ApiResponse<SimpleResponse>> {
    const response = await this.makeRequest<any>(
      API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL,
      'POST',
      data,
    );
    return ApiErrorHandler.handleApiResponse<SimpleResponse>(
      response,
      'Email verified successfully',
      'VerificationError',
    );
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    const response = await this.makeRequest<any>(
      API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD,
      'POST',
      { email },
    );
    return ApiErrorHandler.handleApiResponse(
      response,
      'Reset email sent successfully',
      'ForgotPasswordError',
    );
  }

  async resetPassword(data: ResetPasswordData): Promise<ApiResponse> {
    const response = await this.makeRequest<any>(
      API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD,
      'POST',
      data,
    );
    return ApiErrorHandler.handleApiResponse(
      response,
      'Password reset successfully',
      'ResetPasswordError',
    );
  }

  async resendVerificationCode(email: string): Promise<ApiResponse> {
    const response = await this.makeRequest<any>(
      API_CONFIG.ENDPOINTS.AUTH.RESEND_VERIFICATION_CODE,
      'POST',
      { email },
    );
    return ApiErrorHandler.handleApiResponse(
      response,
      'Verification code sent successfully',
      'VerificationError',
    );
  }

  async signOut(): Promise<ApiResponse> {
    const response = await this.makeRequest<any>(
      '/auth/logout',
      'POST',
      {},
      true,
    );

    // Always clear tokens, regardless of API response
    await this.clearTokens();

    return ApiErrorHandler.handleApiResponse(
      response,
      'Signed out successfully',
      'SignOutError',
    );
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
      return ApiErrorHandler.createErrorResponse<AuthResponse>(
        'No refresh token available',
        'RefreshTokenError',
      );
    }

    const response = await this.makeRequest<any>('/auth/refresh', 'POST', {
      refreshToken,
    });

    // If token refresh fails, clear stored tokens
    if (response && response.success === false) {
      await this.clearTokens();
    }

    return ApiErrorHandler.handleApiResponse<AuthResponse>(
      response,
      'Token refreshed successfully',
      'RefreshTokenError',
    );
  }
}

export const authApiService = new AuthApiService();
