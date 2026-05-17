import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import {AppState, type AppStateStatus} from 'react-native';

import {useUser} from './UserContext';

import {subscriptionApiService} from '@/services/api/subscriptionApi';

/**
 * Subset of the backend's `/subscription/status.features` block that
 * the client actually consumes. The backend returns boolean flags for
 * `mirror_gpt_enabled` / `echo_vault_enabled` / `echo_map_enabled` too,
 * but no client surface reads them — all paid-feature gating is done
 * server-side via `require_feature` (see core/entitlement.py) and
 * surfaced to the UI via the single `status`-based `useEntitlement`
 * hook. Adding those flags here just to mirror the payload would be
 * dead state; if a future surface needs per-feature gating on the
 * client, extend this type then.
 */
interface SubscriptionFeatures {
  quota_gb: number;
  used_gb: number;
}

interface SubscriptionInfo {
  subscription_id?: string;
  product_id?: string;
  status?: string;
  expiry_date?: string;
  auto_renew_enabled?: boolean;
}

interface SubscriptionContextType {
  // Tier values per pricing spec 2026-05-12: free | trial | basic
  // (future: plus). Storage add-on is signalled separately by the
  // backend `storage_add_on_active` flag — tier is orthogonal to it.
  tier: string; // "free" | "trial" | "basic"  (future: "plus")
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

// Fail-closed defaults — quota=0 means useEntitlement reports
// `canUpload=false` while the context is still loading or for
// unauthenticated users. The previous shape also carried per-feature
// boolean flags (mirror_gpt_enabled etc.) which were never read on the
// client and have been removed.
const defaultFeatures: SubscriptionFeatures = {
  quota_gb: 0,
  used_gb: 0,
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
      // Gated behind __DEV__ — this is called on every AppState→active
      // foreground event, so a flaky network in production would spam
      // the device console without dev-time benefit. Real errors that
      // affect the user surface via SubscriptionGate / useEntitlement
      // (fail-closed defaults).
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch subscription status:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Refresh on mount and when user changes
  useEffect(() => {
    refreshSubscriptionStatus();
  }, [refreshSubscriptionStatus, user]);

  // Re-hydrate when the app returns to the foreground. A user whose
  // subscription expired in the background, or who renewed in the App
  // Store / Play Store while we were suspended, gets correct state on
  // their next interaction instead of stale "active" until next launch.
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (
        user &&
        (prev === 'background' || prev === 'inactive') &&
        next === 'active'
      ) {
        refreshSubscriptionStatus();
      }
    });
    return () => sub.remove();
  }, [refreshSubscriptionStatus, user]);

  // Entitlement predicate. Locked in 2026-05-11: see
  // docs/IAP_SUBSCRIPTION_REVIEW.md §"Entitlement matrix".
  // grace_period covers Apple's billing grace window where access continues.
  // billing_retry is intentionally NOT entitled (we want the user to update
  // their payment method).
  const hasActiveSubscription =
    status === 'active' || status === 'trial' || status === 'grace_period';
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
