import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../constants/config';
import type { ApiResponse, ApiError } from '../../types';
import { ApiErrorHandler } from './errorHandler';

export class BaseApiService {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor() {
    this.baseUrl = API_CONFIG.HOST;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  protected async makeRequest<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    requiresAuth: boolean = false,
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    let response: Response | undefined;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (requiresAuth) {
        const token = await this.getAuthToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      }

      const config: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        config.body = JSON.stringify(data);
      }

      response = await fetch(`${this.baseUrl}${endpoint}`, config);

      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        // Handle cases where response is not valid JSON
        clearTimeout(timeoutId);
        if (!response.ok) {
          throw this.createApiError(
            `Server error: ${response.statusText}`,
            response.status,
          );
        }
        // For successful responses that aren't JSON, return empty object
        return {} as ApiResponse<T>;
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        // For auth endpoints and client errors, return error response instead of throwing
        if (ApiErrorHandler.shouldHandleGracefully(endpoint, response.status)) {
          return responseData;
        }
        throw this.createApiError(responseData, response.status);
      }

      return responseData;
    } catch (error) {
      clearTimeout(timeoutId);

      // Use centralized error handling for system errors
      const errorResponse = ApiErrorHandler.handleSystemError(error, {
        endpoint,
        method,
        statusCode: response?.status,
        originalError: error,
      });

      // If it's a graceful endpoint, return the error response
      if (ApiErrorHandler.shouldHandleGracefully(endpoint)) {
        return errorResponse;
      }

      // Otherwise, throw the error
      throw this.createApiError(
        errorResponse.message || 'Unknown error',
        errorResponse.error as any,
      );
    }
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('accessToken');
    } catch (error) {
      console.error('Error retrieving auth token:', error);
      return null;
    }
  }

  private createApiError(message: string, status?: number): ApiError {
    return {
      message,
      status,
    };
  }
}
