import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration
const getApiBaseUrl = () => {
  if (__DEV__) {
    // Development environment
    const Platform = require('react-native').Platform;
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000/api'; // Android emulator localhost
    } else {
      return 'http://localhost:3000/api'; // iOS simulator localhost
    }
  } else {
    return 'https://your-production-api.com/api'; // Production API URL
  }
};

const API_BASE_URL = getApiBaseUrl();

interface SignUpData {
  fullName: string;
  email: string;
  password: string;
}

interface SignInData {
  email: string;
  password: string;
}

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  provider: 'cognito' | 'google';
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  success: boolean;
  user?: UserProfile;
  accessToken?: string;
  refreshToken?: string;
  message?: string;
  error?: string;
  data?: {
    user?: UserProfile & {
      isVerified?: boolean;
      fullName?: string;
    };
    tokens?: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

class ApiService {
  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    requiresAuth: boolean = false,
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    try {
      // Add authorization header if required
      if (requiresAuth) {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      }

      const config: RequestInit = {
        method,
        headers,
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Request failed');
      }

      return responseData;
    } catch (error) {
      console.error(`API Error [${method} ${endpoint}]:`, error);
      console.error('Request URL:', `${API_BASE_URL}${endpoint}`);
      console.error('Request headers:', JSON.stringify(headers));
      if (data) console.error('Request data:', JSON.stringify(data));

      // Log network errors specifically
      if (
        error instanceof TypeError &&
        error.message.includes('Network request failed')
      ) {
        console.error(
          'Network Error: Check if your backend server is running and accessible',
        );
        console.error('Current API_BASE_URL:', API_BASE_URL);
      }

      throw error;
    }
  }

  // Authentication Endpoints
  async signUp(userData: SignUpData): Promise<AuthResponse> {
    return this.makeRequest('/auth/register', 'POST', userData);
  }

  async signIn(userData: SignInData): Promise<AuthResponse> {
    return this.makeRequest('/auth/login', 'POST', userData);
  }

  async forgotPassword(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.makeRequest('/auth/forgot-password', 'POST', { email });
  }

  async resetPassword(
    email: string,
    resetCode: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.makeRequest('/auth/reset-password', 'POST', {
      email,
      resetCode,
      newPassword,
    });
  }

  async verifyEmail(
    email: string,
    verificationCode: string,
  ): Promise<AuthResponse> {
    console.log('Verifying email with:', { email, verificationCode });

    // Check what field name your backend expects:
    // Option 1: verificationCode
    // Option 2: code
    // Option 3: token
    // Option 4: confirmationCode

    const payload = {
      email,
      code: verificationCode, // Convert string to number
    };

    console.log('Payload being sent:', JSON.stringify(payload));
    return this.makeRequest('/auth/confirm-email', 'POST', payload);
  }

  async resendVerificationCode(
    email: string,
  ): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest('/auth/resend-verification-code', 'POST', {
      email,
    });
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    return this.makeRequest('/auth/refresh', 'POST', { refreshToken });
  }

  async signOut(): Promise<{ success: boolean; message: string }> {
    return this.makeRequest('/auth/logout', 'POST', {}, true);
  }

  // User Profile Endpoints
  async getUserProfile(): Promise<{
    success: boolean;
    user?: UserProfile;
  }> {
    return this.makeRequest('/auth/me', 'GET', null, true);
  }

  async deleteAccount(): Promise<{ success: boolean; message: string }> {
    return this.makeRequest('/auth/account', 'DELETE', null, true);
  }

  // Token Management
  async storeTokens(tokens: { accessToken: string; refreshToken: string }) {
    try {
      await AsyncStorage.setItem('accessToken', tokens.accessToken);
      await AsyncStorage.setItem('refreshToken', tokens.refreshToken);
      await AsyncStorage.setItem('isAuthenticated', 'true');
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  async clearTokens() {
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

  async getStoredTokens(): Promise<{
    accessToken: string | null;
    refreshToken: string | null;
  }> {
    try {
      const [accessToken, refreshToken] = await AsyncStorage.multiGet([
        'accessToken',
        'refreshToken',
      ]);

      return {
        accessToken: accessToken[1],
        refreshToken: refreshToken[1],
      };
    } catch (error) {
      console.error('Error retrieving tokens:', error);
      return { accessToken: null, refreshToken: null };
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const isAuth = await AsyncStorage.getItem('isAuthenticated');
      const { accessToken } = await this.getStoredTokens();
      return isAuth === 'true' && accessToken !== null;
    } catch (error) {
      return false;
    }
  }
}

export default new ApiService();
