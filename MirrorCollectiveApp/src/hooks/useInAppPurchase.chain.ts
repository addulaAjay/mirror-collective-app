/**
 * Sequential-sheets helper for paywall flows that bundle Mirror Basic
 * with the optional Echo Vault Storage add-on (pricing spec
 * 2026-05-12 §8).
 *
 * Native IAP can't bundle two subscriptions in one transaction, so the
 * "toggle on paywall" UX translates to: present Basic sheet → on
 * success, optionally present Storage sheet. This helper owns the
 * branching so the screen-level handler stays terse.
 *
 * Extracted from StartFreeTrialScreen.handleButtonPress so the logic
 * can be unit-tested without rendering the screen (which pulls in
 * StoreKit, navigation, Linking, etc.).
 *
 * Semantics:
 *   - Basic sheet cancelled (returns false) → no chain, silent.
 *     `purchaseSubscription` has already set `error` on its hook
 *     state for callers that want to surface it.
 *   - Basic ok + toggle off → exactly one transaction, no chain.
 *   - Basic ok + toggle on + storage product unavailable → skip the
 *     chain, info toast pointing to EchoVaultUpsellScreen so the
 *     user's stated intent isn't dropped silently.
 *   - Basic ok + toggle on + storage sheet ok → two transactions.
 *   - Basic ok + toggle on + storage sheet cancelled → info toast,
 *     user stays on Basic; EchoVaultUpsellScreen still available.
 */

export interface PurchaseBasicWithOptionalStorageArgs {
  basicSku: string;
  storageSku: string;
  addStorage: boolean;
  /**
   * `true` when StoreKit / Play returned the storage product for the
   * selected billing period. The UI disables the toggle when this is
   * false; this helper accepts it as a guard in case the user taps
   * Start exactly as products are loading.
   */
  storageProductAvailable: boolean;
  /**
   * Reference to `useInAppPurchase().purchaseSubscription`. Returns
   * `true` when the underlying native sheet was confirmed, `false`
   * when cancelled or errored.
   */
  purchaseSubscription: (sku: string) => Promise<boolean>;
  /**
   * Reference to `useSubscription().refreshSubscriptionStatus`. Called
   * after each successful purchase so the rest of the app sees the
   * new entitlement state.
   */
  refreshSubscriptionStatus: () => Promise<void>;
  /**
   * Reference to `useToast().showToast`. Used for the non-blocking
   * "you're on Mirror Basic, add storage later" pointer.
   */
  showToast: (input: {
    title?: string;
    message: string;
    tone?: 'info' | 'success' | 'error';
  }) => unknown;
}

export interface PurchaseBasicWithOptionalStorageResult {
  /** Did the Basic sheet complete successfully? */
  basicPurchased: boolean;
  /** Did the optional storage sheet complete successfully? */
  storagePurchased: boolean;
  /**
   * What did the helper decide to do with the storage step?
   *   - 'not_requested'   — the toggle was off
   *   - 'unavailable'     — toggle was on but storage product hadn't loaded
   *   - 'cancelled'       — user backed out of the storage sheet
   *   - 'completed'       — storage sheet confirmed
   *   - 'skipped_basic_failed' — Basic was cancelled, so we didn't reach storage
   */
  storageOutcome:
    | 'not_requested'
    | 'unavailable'
    | 'cancelled'
    | 'completed'
    | 'skipped_basic_failed';
}

export async function purchaseBasicWithOptionalStorage(
  args: PurchaseBasicWithOptionalStorageArgs,
): Promise<PurchaseBasicWithOptionalStorageResult> {
  const {
    basicSku,
    storageSku,
    addStorage,
    storageProductAvailable,
    purchaseSubscription,
    refreshSubscriptionStatus,
    showToast,
  } = args;

  const basicPurchased = await purchaseSubscription(basicSku);

  if (!basicPurchased) {
    // Skip the refresh on cancel — nothing changed server-side, and
    // the unnecessary round-trip causes a brief loading-spinner flash
    // on the screen behind the dismissed sheet. The error/state on
    // useInAppPurchase is already set by purchaseSubscription itself.
    return {
      basicPurchased: false,
      storagePurchased: false,
      storageOutcome: 'skipped_basic_failed',
    };
  }

  await refreshSubscriptionStatus();

  if (!addStorage) {
    return {
      basicPurchased: true,
      storagePurchased: false,
      storageOutcome: 'not_requested',
    };
  }

  if (!storageProductAvailable) {
    showToast({
      title: "You're on Mirror Basic",
      message:
        "We couldn't load the storage add-on. You can add it anytime from Echo Vault.",
      tone: 'info',
    });
    return {
      basicPurchased: true,
      storagePurchased: false,
      storageOutcome: 'unavailable',
    };
  }

  const storagePurchased = await purchaseSubscription(storageSku);
  await refreshSubscriptionStatus();

  if (!storagePurchased) {
    showToast({
      title: "You're on Mirror Basic",
      message: 'You can add 100 GB storage anytime from Echo Vault.',
      tone: 'info',
    });
    return {
      basicPurchased: true,
      storagePurchased: false,
      storageOutcome: 'cancelled',
    };
  }

  return {
    basicPurchased: true,
    storagePurchased: true,
    storageOutcome: 'completed',
  };
}
