import AsyncStorage from '@react-native-async-storage/async-storage';
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

// Last-known profile, persisted so the avatar + name paint instantly on the
// next launch (from expo-image's warm disk cache, keyed on the stable S3 path)
// instead of waiting ~seconds for GET /api/auth/me + the image download.
const PERSISTED_USER_KEY = '@mc/last_user_profile';

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
  // True only while the FIRST profile fetch runs with no cached profile to
  // show. Once we've hydrated a persisted profile, refreshes happen silently
  // in the background — screens never blank out waiting on the network.
  const [isUserLoading, setIsUserLoading] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const profileResponse = await authApiService.getUserProfile();
      if (profileResponse.success && profileResponse.data?.user) {
        const raw = profileResponse.data.user;
        const next: UserProfile = {
          id: raw.id || raw.sub || '',
          email: raw.email || '',
          fullName: raw.display_name || raw.fullName || `${raw.firstName || ''} ${raw.lastName || ''}`.trim(),
          isVerified: raw.isVerified ?? raw.emailVerified ?? false,
          profileImageUrl: raw.profile_image_url ?? undefined,
          phoneNumber: raw.phone_number ?? undefined,
        };
        setUser(next);
        // Persist for instant hydration next launch. The presigned signature
        // rotates, but CachedImage keys on the stable S3 path, so the cached
        // image still hits even with a slightly stale URL here.
        AsyncStorage.setItem(PERSISTED_USER_KEY, JSON.stringify(next)).catch(
          () => {},
        );
      } else {
        console.warn('Refresh user failed:', profileResponse.message);
      }
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  }, []);

  // React to session changes. Hydrate the last-known profile first (so the
  // avatar/name paint immediately from disk cache), THEN refresh in the
  // background. Only show the loading flag when there's nothing cached.
  useEffect(() => {
    if (sessionState.isAuthenticated) {
      let cancelled = false;
      (async () => {
        let hadCached = false;
        try {
          const cached = await AsyncStorage.getItem(PERSISTED_USER_KEY);
          if (cached && !cancelled) {
            setUser(JSON.parse(cached) as UserProfile);
            hadCached = true;
          }
        } catch {
          /* corrupt cache — ignore and fetch fresh */
        }
        if (cancelled) return;
        if (!hadCached) setIsUserLoading(true);
        await refreshUser();
        if (!cancelled) setIsUserLoading(false);
      })();
      return () => {
        cancelled = true;
      };
    } else {
      setUser(null);
      setIsUserLoading(false);
      AsyncStorage.removeItem(PERSISTED_USER_KEY).catch(() => {});
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
