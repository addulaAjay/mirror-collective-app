import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useRef,
} from 'react';
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
  resetPassword: (
    email: string,
    resetCode: string,
    newPassword: string,
  ) => Promise<void>;
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
  const isMountedRef = useRef(true);
  const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Safe dispatch that checks if component is still mounted
  const safeDispatch = (action: AuthAction) => {
    if (isMountedRef.current) {
      dispatch(action);
    }
  };

  // Initialize authentication state with enhanced error handling
  useEffect(() => {
    let isInitializing = true;

    const initializeAuth = async () => {
      try {
        if (!isMountedRef.current) return;

        safeDispatch({ type: 'SET_LOADING', payload: true });

        // Add progressive delays to prevent race conditions
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!isMountedRef.current) return;

        // Check if user is authenticated with enhanced timeout handling
        let isAuth = false;
        try {
          const authCheckPromise = apiService.isAuthenticated();
          const timeoutPromise = new Promise<boolean>((_, reject) => {
            setTimeout(() => reject(new Error('Auth check timeout')), 10000);
          });

          isAuth = await Promise.race([authCheckPromise, timeoutPromise]);
        } catch (error) {
          if (__DEV__) {
            console.warn(
              'Auth check failed, assuming not authenticated:',
              error,
            );
          }
          isAuth = false;
        }

        if (!isMountedRef.current || !isInitializing) return;

        if (isAuth) {
          // Try to get user profile with enhanced error handling
          try {
            const profileResponse = await apiService.getUserProfile();
            if (!isMountedRef.current || !isInitializing) return;

            if (profileResponse.success && profileResponse.user) {
              safeDispatch({
                type: 'LOGIN_SUCCESS',
                payload: profileResponse.user,
              });
            } else {
              throw new Error('Invalid profile response');
            }
          } catch (profileError) {
            if (__DEV__) {
              console.warn(
                'Profile fetch failed, trying token refresh:',
                profileError,
              );
            }

            if (!isMountedRef.current || !isInitializing) return;

            // Attempt token refresh
            try {
              const refreshResponse = await apiService.refreshToken();
              if (!isMountedRef.current || !isInitializing) return;

              if (
                refreshResponse.success &&
                refreshResponse.accessToken &&
                refreshResponse.refreshToken
              ) {
                await apiService.storeTokens({
                  accessToken: refreshResponse.accessToken,
                  refreshToken: refreshResponse.refreshToken,
                });

                if (!isMountedRef.current || !isInitializing) return;

                // Retry profile fetch
                const retryProfileResponse = await apiService.getUserProfile();
                if (!isMountedRef.current || !isInitializing) return;

                if (retryProfileResponse.success && retryProfileResponse.user) {
                  safeDispatch({
                    type: 'LOGIN_SUCCESS',
                    payload: retryProfileResponse.user,
                  });
                } else {
                  throw new Error('Profile fetch failed after refresh');
                }
              } else {
                throw new Error('Token refresh failed');
              }
            } catch (refreshError) {
              if (__DEV__) {
                console.warn(
                  'Token refresh failed, clearing auth:',
                  refreshError,
                );
              }
              // Clear tokens safely
              try {
                await apiService.clearTokens();
              } catch (tokenClearError) {
                if (__DEV__) {
                  console.warn('Token clear failed:', tokenClearError);
                }
              }
              if (isMountedRef.current && isInitializing) {
                safeDispatch({ type: 'LOGOUT_SUCCESS' });
              }
            }
          }
        } else {
          if (isMountedRef.current && isInitializing) {
            safeDispatch({ type: 'LOGOUT_SUCCESS' });
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear any potentially corrupted state
        try {
          await apiService.clearTokens();
        } catch (tokensClearError) {
          if (__DEV__) {
            console.warn(
              'Error clearing tokens during error handling:',
              tokensClearError,
            );
          }
        }
        if (isMountedRef.current && isInitializing) {
          safeDispatch({ type: 'LOGOUT_SUCCESS' });
        }
      } finally {
        if (isMountedRef.current && isInitializing) {
          safeDispatch({ type: 'SET_LOADING', payload: false });
          safeDispatch({ type: 'SET_INITIALIZED', payload: true });
        }
        isInitializing = false;
      }
    };

    // Set timeout to force initialization completion if needed
    initializationTimeoutRef.current = setTimeout(() => {
      if (__DEV__) {
        console.warn('Auth initialization timeout, forcing completion');
      }
      if (isMountedRef.current && isInitializing) {
        isInitializing = false;
        safeDispatch({ type: 'SET_LOADING', payload: false });
        safeDispatch({ type: 'SET_INITIALIZED', payload: true });
        safeDispatch({ type: 'LOGOUT_SUCCESS' });
      }
    }, 15000); // 15 second timeout

    initializeAuth();

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      isInitializing = false;
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
        initializationTimeoutRef.current = null;
      }
    };
  }, []);

  // Sign Up with enhanced error handling
  const signUp = async (fullName: string, email: string, password: string) => {
    if (!isMountedRef.current) return;

    try {
      safeDispatch({ type: 'SET_LOADING', payload: true });
      safeDispatch({ type: 'CLEAR_ERROR' });

      const response = await apiService.signUp({
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        password,
      });

      if (!response.success) {
        throw new Error(response.message || 'Registration failed');
      }

      safeDispatch({ type: 'SET_LOADING', payload: false });
    } catch (error: any) {
      if (isMountedRef.current) {
        safeDispatch({
          type: 'SET_ERROR',
          payload: error.message || 'Registration failed',
        });
      }
      throw error;
    }
  };

  // Sign In with enhanced error handling
  const signIn = async (email: string, password: string) => {
    if (!isMountedRef.current) return;

    try {
      safeDispatch({ type: 'SET_LOADING', payload: true });
      safeDispatch({ type: 'CLEAR_ERROR' });

      const response = await apiService.signIn({
        email: email.toLowerCase().trim(),
        password,
      });

      if (
        response.success &&
        response.user &&
        response.accessToken &&
        response.refreshToken
      ) {
        // Store tokens
        await apiService.storeTokens({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        });

        if (isMountedRef.current) {
          safeDispatch({ type: 'LOGIN_SUCCESS', payload: response.user });
        }
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      if (isMountedRef.current) {
        safeDispatch({
          type: 'SET_ERROR',
          payload: error.message || 'Login failed',
        });
      }
      throw error;
    }
  };

  // Sign Out with enhanced error handling
  const signOut = async () => {
    if (!isMountedRef.current) return;

    try {
      safeDispatch({ type: 'SET_LOADING', payload: true });

      // Call backend logout endpoint (don't fail if it doesn't work)
      try {
        await apiService.signOut();
      } catch (error) {
        if (__DEV__) {
          console.warn(
            'Server logout failed, continuing with local logout:',
            error,
          );
        }
      }

      // Clear local storage
      await apiService.clearTokens();

      if (isMountedRef.current) {
        safeDispatch({ type: 'LOGOUT_SUCCESS' });
      }
    } catch (error: any) {
      console.error('Logout error:', error);
      // Force logout locally even if something fails
      try {
        await apiService.clearTokens();
      } catch (clearTokensError) {
        if (__DEV__) {
          console.warn(
            'Error clearing tokens during logout:',
            clearTokensError,
          );
        }
      }
      if (isMountedRef.current) {
        safeDispatch({ type: 'LOGOUT_SUCCESS' });
      }
    }
  };

  // Other methods with similar enhanced error handling
  const forgotPassword = async (email: string) => {
    if (!isMountedRef.current) return;

    try {
      safeDispatch({ type: 'SET_LOADING', payload: true });
      safeDispatch({ type: 'CLEAR_ERROR' });

      const response = await apiService.forgotPassword(
        email.toLowerCase().trim(),
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to send reset email');
      }

      safeDispatch({ type: 'SET_LOADING', payload: false });
    } catch (error: any) {
      if (isMountedRef.current) {
        safeDispatch({
          type: 'SET_ERROR',
          payload: error.message || 'Failed to send reset email',
        });
      }
      throw error;
    }
  };

  const resetPassword = async (
    email: string,
    resetCode: string,
    newPassword: string,
  ) => {
    if (!isMountedRef.current) return;

    try {
      safeDispatch({ type: 'SET_LOADING', payload: true });
      safeDispatch({ type: 'CLEAR_ERROR' });

      const response = await apiService.resetPassword(
        email.toLowerCase().trim(),
        resetCode.trim(),
        newPassword,
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to reset password');
      }

      safeDispatch({ type: 'SET_LOADING', payload: false });
    } catch (error: any) {
      if (isMountedRef.current) {
        safeDispatch({
          type: 'SET_ERROR',
          payload: error.message || 'Failed to reset password',
        });
      }
      throw error;
    }
  };

  const refreshAuth = async () => {
    if (!isMountedRef.current) return;

    try {
      const profileResponse = await apiService.getUserProfile();
      if (
        profileResponse.success &&
        profileResponse.user &&
        isMountedRef.current
      ) {
        safeDispatch({ type: 'SET_USER', payload: profileResponse.user });
      }
    } catch (error) {
      console.error('Failed to refresh auth:', error);
      // Don't throw error, just log it
    }
  };

  const clearError = () => {
    if (isMountedRef.current) {
      safeDispatch({ type: 'CLEAR_ERROR' });
    }
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
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
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

// Keep both exports for backward compatibility during transition
export const useSafeAuth = useAuth;
export const SafeAuthProvider = AuthProvider;

export default AuthContext;
