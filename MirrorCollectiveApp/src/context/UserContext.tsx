import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

import { authApiService } from '@services/api';
import PushNotificationService from '@services/PushNotificationService';

import { useSession } from './SessionContext';

// Types
export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  isVerified: boolean;
  profileImageUrl?: string;
  phoneNumber?: string;
}

interface UserContextType {
  user: UserProfile | null;
  isUserLoading: boolean;
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
  // True while the auth-triggered profile fetch is in-flight. App.tsx gates
  // the authenticated navigator behind this flag so TalkToMirrorScreen (and
  // every other authenticated screen) never renders with user === null.
  const [isUserLoading, setIsUserLoading] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const profileResponse = await authApiService.getUserProfile();
      if (profileResponse.success && profileResponse.data?.user) {
        const raw = profileResponse.data.user;
        setUser({
          id: raw.id || raw.sub || '',
          email: raw.email || '',
          fullName: raw.display_name || raw.fullName || `${raw.firstName || ''} ${raw.lastName || ''}`.trim(),
          isVerified: raw.isVerified ?? raw.emailVerified ?? false,
          profileImageUrl: raw.profile_image_url ?? undefined,
          phoneNumber: raw.phone_number ?? undefined,
        });
      } else {
        console.warn('Refresh user failed:', profileResponse.message);
      }
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  }, []);

  // React to session changes — always fetch when auth state becomes true so
  // the full profile (image, phone) is ready before authenticated screens render.
  useEffect(() => {
    if (sessionState.isAuthenticated) {
      setIsUserLoading(true);
      refreshUser().finally(() => setIsUserLoading(false));
    } else {
      setUser(null);
      setIsUserLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionState.isAuthenticated]);

  // Init push notifications once user is available
  useEffect(() => {
    if (user?.id) {
      PushNotificationService.initialize(user.id).catch((err: unknown) => {
        console.error('Failed to initialize push notification service:', err);
      });
    }
  }, [user?.id]);

  const contextValue: UserContextType = {
    user,
    isUserLoading,
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
