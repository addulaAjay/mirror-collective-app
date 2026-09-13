import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';

import {subscriptionApiService} from '@/services/api/subscriptionApi';

import {useUser} from './UserContext';


interface SubscriptionFeatures {
  echo_vault_enabled: boolean;
  quota_gb: number;
  used_gb: number;
  mirror_gpt_enabled: boolean;
  echo_map_enabled: boolean;
}

interface SubscriptionInfo {
  subscription_id?: string;
  product_id?: string;
  status?: string;
  expiry_date?: string;
  auto_renew_enabled?: boolean;
}

interface SubscriptionContextType {
  tier: string; // "free" | "trial" | "core" | "core_plus"
  status: string; // "none" | "trial" | "trial_expired" | "active" | "expired"
  trialDaysRemaining: number;
  features: SubscriptionFeatures;
  coreSubscription: SubscriptionInfo | null;
  storageSubscription: SubscriptionInfo | null;
  loading: boolean;
  refreshSubscriptionStatus: () => Promise<void>;
  hasActiveSubscription: boolean;
  isInTrial: boolean;
  hasUsedTrial: boolean;
}

const defaultFeatures: SubscriptionFeatures = {
  echo_vault_enabled: false,
  quota_gb: 0,
  used_gb: 0,
  mirror_gpt_enabled: true,
  echo_map_enabled: false,
};

/** A 401 from the status call means the session is invalid (not a transient
 * error), so entitlement state should be cleared rather than retained. */
const isUnauthorized = (statusCode?: number): boolean => statusCode === 401;

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider = ({
  children,
}: SubscriptionProviderProps) => {
  const {user} = useUser();
  const [tier, setTier] = useState<string>('free');
  const [status, setStatus] = useState<string>('none');
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number>(0);
  const [features, setFeatures] =
    useState<SubscriptionFeatures>(defaultFeatures);
  const [coreSubscription, setCoreSubscription] =
    useState<SubscriptionInfo | null>(null);
  const [storageSubscription, setStorageSubscription] =
    useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasUsedTrial, setHasUsedTrial] = useState<boolean>(false);

  const resetToDefaults = useCallback(() => {
    setTier('free');
    setStatus('none');
    setTrialDaysRemaining(0);
    setFeatures(defaultFeatures);
    setCoreSubscription(null);
    setStorageSubscription(null);
    setHasUsedTrial(false);
  }, []);

  const refreshSubscriptionStatus = useCallback(async () => {
    if (!user) {
      // Logged out (or between accounts): reset to the free/no-subscription
      // defaults. Without this, the PREVIOUS user's status (e.g. 'active')
      // lingers in the shared provider and bleeds into the next session — a
      // brand-new user would then see the paywall's "MANAGE SUBSCRIPTION"
      // (isActivePaid) instead of "START FREE TRIAL".
      resetToDefaults();
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await subscriptionApiService.getSubscriptionStatus();

      if (response.success && response.data) {
        setTier(response.data.tier || 'free');
        setStatus(response.data.status || 'none');
        setTrialDaysRemaining(response.data.trial_days_remaining || 0);
        setFeatures(response.data.features || defaultFeatures);
        setCoreSubscription(response.data.core_subscription || null);
        setStorageSubscription(response.data.storage_subscription || null);
        setHasUsedTrial(response.data.has_used_trial || false);
      } else if (isUnauthorized((response as {statusCode?: number}).statusCode)) {
        // 401 = the session is invalid (the API layer also emits sessionExpired,
        // which logs the user out). Reset now so we never keep showing the prior
        // user's entitlement. A non-auth failure (5xx/network) is retained so a
        // transient blip doesn't flap a real subscriber's UI.
        resetToDefaults();
      }
    } catch (error) {
      if (isUnauthorized((error as {status?: number})?.status)) {
        resetToDefaults();
      } else {
        // Transient (5xx / network): keep last-known status — server-side
        // entitlement enforcement is authoritative regardless.
        console.error('Failed to fetch subscription status:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [user, resetToDefaults]);

  // Refresh on mount and when user changes
  useEffect(() => {
    refreshSubscriptionStatus();
  }, [refreshSubscriptionStatus, user]);

  const hasActiveSubscription = status === 'active' || status === 'trial';
  const isInTrial = status === 'trial';

  const contextValue: SubscriptionContextType = {
    tier,
    status,
    trialDaysRemaining,
    features,
    coreSubscription,
    storageSubscription,
    loading,
    refreshSubscriptionStatus,
    hasActiveSubscription,
    isInTrial,
    hasUsedTrial,
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      'useSubscription must be used within a SubscriptionProvider',
    );
  }
  return context;
};

export default SubscriptionContext;
