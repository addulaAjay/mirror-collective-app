import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApiService } from './api';

class TokenManager {
  private refreshPromise: Promise<string | null> | null = null;
  private readonly TOKEN_KEYS = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    TOKEN_EXPIRY: 'tokenExpiry',
    IS_AUTHENTICATED: 'isAuthenticated',
  };

  /**
   * Get the current access token, refreshing if necessary
   */
  async getValidToken(): Promise<string | null> {
    try {
      const accessToken = await this.getAccessToken();

      if (!accessToken) {
        return null;
      }

      // Check if token is expired or will expire soon (within 5 minutes)
      if (await this.isTokenExpired()) {
        return await this.refreshTokenIfNeeded();
      }

      return accessToken;
    } catch (error) {
      console.error('Error getting valid token:', error);
      return null;
    }
  }

  /**
   * Get the stored access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.TOKEN_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Get the stored refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.TOKEN_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Store authentication tokens with expiry
   */
  async storeTokens(tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn?: number; // Optional expiry in seconds
  }): Promise<void> {
    try {
      const expiresAt = tokens.expiresIn
        ? Date.now() + tokens.expiresIn * 1000
        : Date.now() + 60 * 60 * 1000; // Default 1 hour

      await AsyncStorage.multiSet([
        [this.TOKEN_KEYS.ACCESS_TOKEN, tokens.accessToken],
        [this.TOKEN_KEYS.REFRESH_TOKEN, tokens.refreshToken],
        [this.TOKEN_KEYS.TOKEN_EXPIRY, expiresAt.toString()],
        [this.TOKEN_KEYS.IS_AUTHENTICATED, 'true'],
      ]);
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  /**
   * Check if the current token is expired or will expire soon
   */
  async isTokenExpired(): Promise<boolean> {
    try {
      const expiryString = await AsyncStorage.getItem(
        this.TOKEN_KEYS.TOKEN_EXPIRY,
      );
      if (!expiryString) {
        return true; // If no expiry is set, assume expired
      }

      const expiryTime = parseInt(expiryString, 10);
      const now = Date.now();
      const fiveMinutesInMs = 5 * 60 * 1000;

      // Return true if token expires within 5 minutes
      return expiryTime - now <= fiveMinutesInMs;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true;
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  async refreshTokenIfNeeded(): Promise<string | null> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return await this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh
   */
  private async performTokenRefresh(): Promise<string | null> {
    try {
      const refreshToken = await this.getRefreshToken();

      if (!refreshToken) {
        await this.clearTokens();
        return null;
      }

      const response = await authApiService.refreshToken();

      if (response.success && response.data?.tokens) {
        await this.storeTokens({
          accessToken: response.data.tokens.accessToken,
          refreshToken: response.data.tokens.refreshToken,
        });

        return response.data.tokens.accessToken;
      } else {
        // Refresh failed, clear all tokens
        await this.clearTokens();
        return null;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.clearTokens();
      return null;
    }
  }

  /**
   * Clear all stored tokens
   */
  async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.TOKEN_KEYS.ACCESS_TOKEN,
        this.TOKEN_KEYS.REFRESH_TOKEN,
        this.TOKEN_KEYS.TOKEN_EXPIRY,
        this.TOKEN_KEYS.IS_AUTHENTICATED,
      ]);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  /**
   * Check if user is authenticated (has valid tokens)
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const [isAuth, accessToken] = await Promise.all([
        AsyncStorage.getItem(this.TOKEN_KEYS.IS_AUTHENTICATED),
        this.getAccessToken(),
      ]);

      if (isAuth !== 'true' || !accessToken) {
        return false;
      }

      // Check if token is expired
      if (await this.isTokenExpired()) {
        // Try to refresh
        const newToken = await this.refreshTokenIfNeeded();
        return newToken !== null;
      }

      return true;
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }

  /**
   * Get authentication headers for API requests
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getValidToken();

    if (token) {
      return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
    }

    return {
      'Content-Type': 'application/json',
    };
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();
