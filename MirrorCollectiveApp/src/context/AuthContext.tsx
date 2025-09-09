import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useRef,
} from 'react';
import { authApiService } from '../services/api';

// Types
interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  isVerified: boolean;
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

  // Initialize authentication state - force logout on app start
  useEffect(() => {
    let isInitializing = true;

    const initializeAuth = async () => {
      try {
        if (!isMountedRef.current) return;

        safeDispatch({ type: 'SET_LOADING', payload: true });

        // Clear any existing authentication state on app start
        // This ensures users must login every time the app is opened
        try {
          await authApiService.clearTokens();
          if (__DEV__) {
            console.log('Cleared authentication tokens on app initialization');
          }
        } catch (error) {
          if (__DEV__) {
            console.warn(
              'Failed to clear tokens during initialization:',
              error,
            );
          }
        }

        if (!isMountedRef.current || !isInitializing) return;

        // Always start in logged-out state to require fresh login
        safeDispatch({ type: 'LOGOUT_SUCCESS' });
      } catch (error) {
        console.error('Auth initialization error:', error);
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
    }, 5000); // Reduced to 5 seconds since we're not doing complex auth checks

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

      const response = await authApiService.signUp({
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

      const response = await authApiService.signIn({
        email: email.toLowerCase().trim(),
        password,
      });

      if (response.success && response.data?.user && response.data?.tokens) {
        // Store tokens
        await authApiService.storeTokens({
          accessToken: response.data.tokens.accessToken,
          refreshToken: response.data.tokens.refreshToken,
        });

        if (isMountedRef.current) {
          safeDispatch({ type: 'LOGIN_SUCCESS', payload: response.data.user });
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
        await authApiService.signOut();
      } catch (error) {
        if (__DEV__) {
          console.warn(
            'Server logout failed, continuing with local logout:',
            error,
          );
        }
      }

      // Clear local storage
      await authApiService.clearTokens();

      if (isMountedRef.current) {
        safeDispatch({ type: 'LOGOUT_SUCCESS' });
      }
    } catch (error: any) {
      console.error('Logout error:', error);
      // Force logout locally even if something fails
      try {
        await authApiService.clearTokens();
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

      const response = await authApiService.forgotPassword(
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

      const response = await authApiService.resetPassword({
        email: email.toLowerCase().trim(),
        resetCode: resetCode.trim(),
        newPassword,
      });

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
      const profileResponse = await authApiService.getUserProfile();
      if (
        profileResponse.success &&
        profileResponse.data?.user &&
        isMountedRef.current
      ) {
        safeDispatch({ type: 'SET_USER', payload: profileResponse.data.user });
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
