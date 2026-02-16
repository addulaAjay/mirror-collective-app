import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useRef,
  useCallback,
} from 'react';

import { authApiService } from '@services/api';
import PushNotificationService from '@services/PushNotificationService';

// Types
interface SessionState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface SessionContextType {
  state: SessionState;
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<any>; // Returns full response for UserContext to use
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (
    email: string,
    resetCode: string,
    newPassword: string,
  ) => Promise<void>;
  clearError: () => void;
  setLoading: (isLoading: boolean) => void;
}

// Action Types
type SessionAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'LOGIN_SUCCESS' }
  | { type: 'LOGOUT_SUCCESS' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

// Initial State
const initialState: SessionState = {
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

// Reducer
const sessionReducer = (state: SessionState, action: SessionAction): SessionState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGOUT_SUCCESS':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

// Context
const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Provider Component
interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider = ({ children }: SessionProviderProps) => {
  const [state, dispatch] = useReducer(sessionReducer, initialState);
  const isMountedRef = useRef(true);
  const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const safeDispatch = useCallback((action: SessionAction) => {
    if (isMountedRef.current) {
      dispatch(action);
    }
  }, []);

  // Initialize authentication state
  useEffect(() => {
    let isInitializing = true;

    const initializeAuth = async () => {
      try {
        if (!isMountedRef.current) return;

        safeDispatch({ type: 'SET_LOADING', payload: true });

        // Clear tokens on app start as per original logic
        try {
          await authApiService.clearTokens();
          if (__DEV__) {
            console.log('Cleared authentication tokens on app initialization');
          }
        } catch (error) {
          if (__DEV__) {
            console.warn('Failed to clear tokens during initialization:', error);
          }
        }

        if (!isMountedRef.current || !isInitializing) return;
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
    }, 5000);

    initializeAuth();

    return () => {
      isMountedRef.current = false;
      isInitializing = false;
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
      }
    };
  }, [safeDispatch]);

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
        await authApiService.storeTokens({
          accessToken: response.data.tokens.accessToken,
          refreshToken: response.data.tokens.refreshToken,
        });
        if (isMountedRef.current) {
          safeDispatch({ type: 'LOGIN_SUCCESS' });
        }
        return response.data; // Return data for UserContext
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
  const signOut = async () => {
    if (!isMountedRef.current) return;
    try {
      safeDispatch({ type: 'SET_LOADING', payload: true });
      
      // Unregister push notifications before clearing tokens
      try {
        await PushNotificationService.unregisterDevice();
      } catch (error) {
        if (__DEV__) console.warn('Push unregistration failed:', error);
      }

      try {
        await authApiService.signOut();
      } catch (error) {
        if (__DEV__) console.warn('Server logout failed:', error);
      }
      await authApiService.clearTokens();
      if (isMountedRef.current) {
        safeDispatch({ type: 'LOGOUT_SUCCESS' });
      }
    } catch (error: any) {
      console.error('Logout error:', error);
      try {
        await authApiService.clearTokens();
      } catch (e) {}
      if (isMountedRef.current) {
        safeDispatch({ type: 'LOGOUT_SUCCESS' });
      }
    }
  };

  const forgotPassword = async (email: string) => {
    if (!isMountedRef.current) return;
    try {
      safeDispatch({ type: 'SET_LOADING', payload: true });
      safeDispatch({ type: 'CLEAR_ERROR' });
      const response = await authApiService.forgotPassword(email.toLowerCase().trim());
      if (!response.success) throw new Error(response.message || 'Failed to send reset email');
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

  const resetPassword = async (email: string, resetCode: string, newPassword: string) => {
    if (!isMountedRef.current) return;
    try {
      safeDispatch({ type: 'SET_LOADING', payload: true });
      safeDispatch({ type: 'CLEAR_ERROR' });
      const response = await authApiService.resetPassword({
        email: email.toLowerCase().trim(),
        resetCode: resetCode.trim(),
        newPassword,
      });
      if (!response.success) throw new Error(response.message || 'Failed to reset password');
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

  const clearError = () => {
    if (isMountedRef.current) {
      safeDispatch({ type: 'CLEAR_ERROR' });
    }
  };

  const setLoading = (isLoading: boolean) => {
      if (isMountedRef.current) {
          safeDispatch({ type: 'SET_LOADING', payload: isLoading });
      }
  }

  const contextValue: SessionContextType = {
    state,
    signUp,
    signIn,
    signOut,
    forgotPassword,
    resetPassword,
    clearError,
    setLoading
  };

  return (
    <SessionContext.Provider value={contextValue}>{children}</SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export default SessionContext;
