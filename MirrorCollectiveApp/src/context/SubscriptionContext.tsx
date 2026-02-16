import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';

import {useUser} from './UserContext';

import {subscriptionApiService} from '@/services/api/subscriptionApi';

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

  const refreshSubscriptionStatus = useCallback(async () => {
    if (!user) {
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
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

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
