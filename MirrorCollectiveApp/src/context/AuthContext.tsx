import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import apiService from '../services/apiService';

// Types
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

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface AuthContextType {
  state: AuthState;
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, resetCode: string, newPassword: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
}

// Action Types
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: UserProfile }
  | { type: 'LOGOUT_SUCCESS' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_USER'; payload: UserProfile | null };

// Initial State
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        isLoading: false,
        error: null,
      };
    case 'LOGOUT_SUCCESS':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: action.payload !== null,
      };
    default:
      return state;
  }
};

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });

        // Check if user is authenticated
        const isAuth = await apiService.isAuthenticated();
        
        if (isAuth) {
          // Try to get user profile
          try {
            const profileResponse = await apiService.getUserProfile();
            if (profileResponse.success && profileResponse.user) {
              dispatch({ type: 'LOGIN_SUCCESS', payload: profileResponse.user });
            } else {
              // Clear invalid authentication
              await apiService.clearTokens();
              dispatch({ type: 'LOGOUT_SUCCESS' });
            }
          } catch (error) {
            // Token might be expired, try to refresh
            try {
              const refreshResponse = await apiService.refreshToken();
              if (refreshResponse.success && refreshResponse.accessToken && refreshResponse.refreshToken) {
                await apiService.storeTokens({
                  accessToken: refreshResponse.accessToken,
                  refreshToken: refreshResponse.refreshToken,
                });

                // Try to get profile again
                const profileResponse = await apiService.getUserProfile();
                if (profileResponse.success && profileResponse.user) {
                  dispatch({ type: 'LOGIN_SUCCESS', payload: profileResponse.user });
                } else {
                  throw new Error('Failed to get user profile after refresh');
                }
              } else {
                throw new Error('Failed to refresh token');
              }
            } catch (refreshError) {
              // Clear invalid authentication
              await apiService.clearTokens();
              dispatch({ type: 'LOGOUT_SUCCESS' });
            }
          }
        } else {
          dispatch({ type: 'LOGOUT_SUCCESS' });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        await apiService.clearTokens();
        dispatch({ type: 'LOGOUT_SUCCESS' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      }
    };

    initializeAuth();
  }, []);

  // Sign Up
  const signUp = async (fullName: string, email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await apiService.signUp({
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        password,
      });

      if (!response.success) {
        throw new Error(response.message || 'Registration failed');
      }

      // Note: User will need to verify email before being fully authenticated
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Registration failed' });
      throw error;
    }
  };

  // Sign In
  const signIn = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await apiService.signIn({
        email: email.toLowerCase().trim(),
        password,
      });

      if (response.success && response.user && response.accessToken && response.refreshToken) {
        // Store tokens
        await apiService.storeTokens({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        });

        dispatch({ type: 'LOGIN_SUCCESS', payload: response.user });
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Login failed' });
      throw error;
    }
  };

  // Sign Out
  const signOut = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Call backend logout endpoint
      try {
        await apiService.signOut();
      } catch (error) {
        // Continue with local logout even if server logout fails
        console.warn('Server logout failed:', error);
      }

      // Clear local storage
      await apiService.clearTokens();
      
      dispatch({ type: 'LOGOUT_SUCCESS' });
    } catch (error: any) {
      console.error('Logout error:', error);
      // Force logout locally even if server call fails
      await apiService.clearTokens();
      dispatch({ type: 'LOGOUT_SUCCESS' });
    }
  };

  // Forgot Password
  const forgotPassword = async (email: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await apiService.forgotPassword(email.toLowerCase().trim());

      if (!response.success) {
        throw new Error(response.message || 'Failed to send reset email');
      }

      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to send reset email' });
      throw error;
    }
  };

  // Reset Password
  const resetPassword = async (email: string, resetCode: string, newPassword: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await apiService.resetPassword(
        email.toLowerCase().trim(),
        resetCode.trim(),
        newPassword
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to reset password');
      }

      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to reset password' });
      throw error;
    }
  };

  // Refresh Authentication
  const refreshAuth = async () => {
    try {
      const profileResponse = await apiService.getUserProfile();
      if (profileResponse.success && profileResponse.user) {
        dispatch({ type: 'SET_USER', payload: profileResponse.user });
      }
    } catch (error) {
      console.error('Failed to refresh auth:', error);
      // Don't throw error, just log it
    }
  };

  // Clear Error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue: AuthContextType = {
    state,
    signUp,
    signIn,
    signOut,
    forgotPassword,
    resetPassword,
    refreshAuth,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;