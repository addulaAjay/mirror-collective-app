import { useEffect, useState } from 'react';
import { tokenManager } from '../services/tokenManager';

interface UseAuthGuardResult {
  isAuthenticated: boolean;
  isLoading: boolean;
  hasValidToken: boolean;
  checkAuthentication: () => Promise<void>;
  getAuthToken: () => Promise<string | null>;
}

/**
 * Hook to manage authentication state and token validation
 * Use this for protected routes and components that need authentication
 */
export const useAuthGuard = (): UseAuthGuardResult => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasValidToken, setHasValidToken] = useState(false);

  const checkAuthentication = async () => {
    try {
      setIsLoading(true);

      // Check if user is authenticated
      const authStatus = await tokenManager.isAuthenticated();
      setIsAuthenticated(authStatus);

      // Check if we have a valid token (this will refresh if needed)
      const validToken = await tokenManager.getValidToken();
      setHasValidToken(validToken !== null);
    } catch (error) {
      console.error('Authentication check failed:', error);
      setIsAuthenticated(false);
      setHasValidToken(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getAuthToken = async (): Promise<string | null> => {
    try {
      return await tokenManager.getValidToken();
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  return {
    isAuthenticated,
    isLoading,
    hasValidToken,
    checkAuthentication,
    getAuthToken,
  };
};

/**
 * Hook specifically for getting authentication headers for API calls
 */
export const useAuthHeaders = () => {
  const getHeaders = async (): Promise<Record<string, string>> => {
    try {
      return await tokenManager.getAuthHeaders();
    } catch (error) {
      console.error('Failed to get auth headers:', error);
      return {
        'Content-Type': 'application/json',
      };
    }
  };

  return { getHeaders };
};
