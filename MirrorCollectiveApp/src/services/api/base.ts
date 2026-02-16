import type { ApiResponse, ApiError } from '@types';

import { API_CONFIG } from '@constants/config';
import { tokenManager } from '@services/tokenManager';

import { ApiErrorHandler } from './errorHandler';

export class BaseApiService {
  public readonly baseUrl: string;
  private readonly timeout: number;

  constructor() {
    this.baseUrl = API_CONFIG.HOST;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  protected async makeRequest<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
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
        const token = await tokenManager.getValidToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      }

      const config: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
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
        if (ApiErrorHandler.shouldHandleGracefully(endpoint, response.status)) {
          return responseData;
        }
        // Extract error message from response data
        const errorMessage = responseData?.error || responseData?.message || `Server error: ${response.status}`;
        throw this.createApiError(errorMessage, response.status);
      }

      return responseData;
    } catch (error: any) {
      clearTimeout(timeoutId);

      // If it is already an ApiError (custom), rethrow it
      if (error && error.message && error.status) {
         throw error;
      }

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

  private createApiError(message: string, status?: number): ApiError {
    return {
      message,
      status,
    };
  }

  protected async get<T = any>(endpoint: string, requiresAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, 'GET', undefined, requiresAuth);
  }

  protected async post<T = any>(endpoint: string, data?: any, requiresAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, 'POST', data, requiresAuth);
  }

  protected async put<T = any>(endpoint: string, data?: any, requiresAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, 'PUT', data, requiresAuth);
  }

  protected async delete<T = any>(endpoint: string, requiresAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, 'DELETE', undefined, requiresAuth);
  }
}
