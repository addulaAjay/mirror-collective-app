import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../constants/config';
import type { ApiResponse, ApiError } from '../../types';

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

      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      const responseData = await response.json();

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw this.createApiError(responseData, response.status);
      }

      return responseData;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw this.createApiError('Request timeout', 408);
        }
        
        if (error.message.includes('Network request failed')) {
          throw this.createApiError('Network error. Please check your connection.', 0);
        }
      }

      throw error;
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