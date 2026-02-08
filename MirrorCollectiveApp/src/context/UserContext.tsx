import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

import PushNotificationService from '@services/PushNotificationService';
import { authApiService } from '@services/api';

import { useSession } from './SessionContext';

// Types
interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  isVerified: boolean;
}

interface UserContextType {
  user: UserProfile | null;
  refreshUser: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
}

// Context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider Component
interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const { state: sessionState } = useSession();
  const [user, setUser] = useState<UserProfile | null>(null);

  const refreshUser = async () => {
    try {
      const profileResponse = await authApiService.getUserProfile();
      if (profileResponse.success && profileResponse.data?.user) {
        setUser(profileResponse.data.user);
      } else {
        // If we can't get the user profile, but think we're authenticated, 
        // it might be a token issue. 
        console.warn('Refresh user failed:', profileResponse.message);
      }
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  };

  // React to session changes
  useEffect(() => {
    if (sessionState.isAuthenticated) {
       // If we authenticated but don't have user data, fetch it
       // Optimization: fetch only if user is null
       if (!user) {
          refreshUser();
       } else {
          // Initialize push notification handlers once user is available
          // Ensure we don't re-initialize unnecessarily if user object reference changes but ID is same
          PushNotificationService.initialize(user.id).catch((err: any) => {
            console.error('Failed to initialize push notification service:', err);
          });
       }
    } else {
      // If not authenticated, clear user data
      setUser(null);
    }
  }, [sessionState.isAuthenticated, user?.id]); // Depend on user.id instead of user object to avoid loops

  const contextValue: UserContextType = {
    user,
    refreshUser,
    setUser,
  };

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;
