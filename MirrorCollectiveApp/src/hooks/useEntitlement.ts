import {useCallback, useMemo} from 'react';

import {useSubscription} from '@context/SubscriptionContext';

/**
 * Reason a feature is locked. Maps 1:1 to UpgradePrompt's `reason` prop so
 * the caller can pipe `lockReason` straight into <UpgradePrompt>.
 *
 *  - 'free'            user has never started a trial; show paywall
 *  - 'trial_expired'   trial finished without a paid subscription
 *  - 'expired'         paid subscription lapsed (failed renewal, cancel, refund)
 *  - 'quota_exceeded'  entitled but over their storage allowance
 *
 * Per the locked entitlement matrix (docs/IAP_SUBSCRIPTION_REVIEW.md),
 * UpgradePrompt only models the first three. We pass 'trial_expired' for
 * any locked state so the user sees a consistent paywall — the screen
 * still has the precise reason available via `status` if it wants to
 * branch copy.
 */
type LockReason = 'free' | 'trial_expired' | 'expired' | 'quota_exceeded';

interface EntitlementInfo {
  /** True iff the user can use paid features right now. */
  entitled: boolean;
  /** True while the SubscriptionContext is still fetching. Treat as locked. */
  loading: boolean;
  /** Raw status from backend, e.g. 'trial' | 'active' | 'expired'. */
  status: string;
  /** Raw tier, e.g. 'basic' (future: 'plus'). Storage upgrade is
   *  signalled separately via the backend's `storage_add_on_active`
   *  flag — it does NOT promote the tier value. */
  tier: string;
  /** Why the user is locked, or null if entitled. */
  lockReason: LockReason | null;
  /** Reason to feed into <UpgradePrompt>'s `reason` prop. */
  promptReason: 'quota_exceeded' | 'trial_expired';

  /** Total quota in GB (50 for basic/trial, +100 with the storage
   *  add-on, 0 if locked). */
  quotaGb: number;
  /** Bytes used, expressed in GB. */
  usedGb: number;
  /** 0..1 fraction of quota used. */
  quotaPercent: number;
  /** True when usage >= quota. */
  quotaExceeded: boolean;
  /** True when usage >= 90 % of quota. */
  quotaApproaching: boolean;

  /**
   * Can the user start an upload right now?
   *
   *   - false if not entitled (returns lockReason)
   *   - false if quota would be exceeded by `declaredBytes`
   *
   * Pass the declared file size in bytes when known; the check falls back
   * to "current usage < quota" when called without an argument.
   *
   * This is a client-side guard for snappy UX. The server-side pre-flight
   * in POST /echoes/upload-url is the authoritative check.
   */
  canUpload: (declaredBytes?: number) => {
    allowed: boolean;
    reason: LockReason | null;
  };

  /** Re-fetch subscription status from the backend. */
  refresh: () => Promise<void>;
}

const ENTITLED_STATUSES = new Set(['trial', 'active', 'grace_period']);

const BYTES_PER_GB = 1024 * 1024 * 1024;

export function useEntitlement(): EntitlementInfo {
  const {
    status,
    tier,
    features,
    loading,
    hasUsedTrial,
    refreshSubscriptionStatus,
  } = useSubscription();

  const entitled = ENTITLED_STATUSES.has(status);

  const lockReason: LockReason | null = useMemo(() => {
    if (entitled) return null;
    if (status === 'trial_expired') return 'trial_expired';
    if (status === 'expired' || status === 'cancelled') return 'expired';
    if (hasUsedTrial) return 'trial_expired';
    return 'free';
  }, [entitled, status, hasUsedTrial]);

  const quotaGb = features.quota_gb;
  const usedGb = features.used_gb;
  const quotaPercent = quotaGb > 0 ? Math.min(1, usedGb / quotaGb) : 1;
  const quotaExceeded = quotaGb > 0 ? usedGb >= quotaGb : !entitled;
  const quotaApproaching = quotaGb > 0 && usedGb / quotaGb >= 0.9;

  const canUpload = useCallback(
    (declaredBytes?: number) => {
      if (!entitled) {
        return {allowed: false, reason: lockReason};
      }
      const declaredGb = declaredBytes ? declaredBytes / BYTES_PER_GB : 0;
      if (usedGb + declaredGb >= quotaGb) {
        return {allowed: false, reason: 'quota_exceeded' as const};
      }
      return {allowed: true, reason: null};
    },
    [entitled, lockReason, usedGb, quotaGb],
  );

  // For UpgradePrompt: only "quota_exceeded" survives if entitled-but-full;
  // every locked state collapses to "trial_expired" copy (per locked design).
  const promptReason: 'quota_exceeded' | 'trial_expired' =
    entitled && quotaExceeded ? 'quota_exceeded' : 'trial_expired';

  return {
    entitled,
    loading,
    status,
    tier,
    lockReason,
    promptReason,
    quotaGb,
    usedGb,
    quotaPercent,
    quotaExceeded,
    quotaApproaching,
    canUpload,
    refresh: refreshSubscriptionStatus,
  };
}
