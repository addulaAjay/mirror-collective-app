import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { Platform, Alert } from 'react-native';
import {
  initConnection,
  endConnection,
  getSubscriptions,
  getAvailablePurchases,
  requestSubscription,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  ErrorCode,
  type Subscription,
  type SubscriptionPurchase,
  type ProductPurchase,
} from 'react-native-iap';

import { subscriptionApiService } from '@/services/api/subscriptionApi';

/**
 * True when a purchase error is the user backing out of the Apple payment sheet
 * (tapping Cancel). That's a normal action, not a failure — callers should reset
 * the purchasing flag silently rather than surface an error.
 */
const isUserCancelled = (error: any): boolean =>
  error?.code === ErrorCode.E_USER_CANCELLED ||
  error?.code === 'E_USER_CANCELLED';

/**
 * Reject a promise if it doesn't settle within `ms`. Native StoreKit calls
 * (initConnection / getSubscriptions) can hang indefinitely rather than
 * rejecting — without a timeout the init `loading` flag would stay true forever
 * and wedge the paywall on "LOADING...". Wrapping them guarantees the init
 * always resolves one way or the other.
 */
const withTimeout = <T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      err => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
};

const IAP_INIT_TIMEOUT_MS = 10000;

// Product IDs
const PRODUCT_IDS = {
  // Must match the product IDs created in App Store Connect exactly (product
  // IDs are immutable once created). ASC group "Mirror Basic":
  //   com.themirrorcollective.mirror.monthly / .yearly
  CORE_MONTHLY: Platform.select({
    ios: 'com.themirrorcollective.mirror.monthly',
    android: 'com.themirrorcollective.mirror.monthly',
  })!,
  CORE_YEARLY: Platform.select({
    ios: 'com.themirrorcollective.mirror.yearly',
    android: 'com.themirrorcollective.mirror.yearly',
  })!,
  STORAGE_MONTHLY: Platform.select({
    ios: 'com.themirrorcollective.mirror.storage.monthly',
    android: 'com.themirrorcollective.mirror.storage.monthly',
  })!,
  STORAGE_YEARLY: Platform.select({
    ios: 'com.themirrorcollective.mirror.storage.yearly',
    android: 'com.themirrorcollective.mirror.storage.yearly',
  })!,
};

/**
 * Localized App Store / Play Store price for a product (e.g. "$9.99"), or the
 * fallback when products haven't loaded yet or the id isn't found. Lets the UI
 * show the real store price instead of a hard-coded one — a price change in
 * App Store Connect then reflects automatically.
 */
export const localizedPrice = (
  products: Subscription[],
  productId: string,
  fallback: string,
): string => {
  const product = products.find(p => p.productId === productId);
  // localizedPrice is present on iOS subscriptions; the Android variant nests
  // pricing under subscriptionOfferDetails, so read it defensively.
  const price = (product as { localizedPrice?: string } | undefined)
    ?.localizedPrice;
  return price || fallback;
};

interface PurchaseState {
  products: Subscription[];
  loading: boolean;
  purchasing: boolean;
  // Restore runs on its own flag rather than reusing `loading` — `loading` is
  // the initial product-fetch state a paywall may gate its CTA on, and a restore
  // triggered from another mounted screen must not flip it.
  restoring: boolean;
  error: string | null;
}

type VerifiedCallback = () => void | Promise<void>;

// ── Module-level singleton store ───────────────────────────────────────────
//
// The IAP connection, the purchase/error listeners, and the purchase state are
// shared across ALL mounted useInAppPurchase() callers rather than owned per
// hook instance. Two screens use this hook (the paywall and My Subscription),
// and native-stack keeps a pushed-from screen mounted underneath — so a
// per-instance design registered TWO purchase listeners (double verify + double
// "Activated" alert), and unmounting one screen called endConnection() out from
// under the other. A single shared store fixes all of that: one connection
// (ref-counted), one listener pair, one state.

let state: PurchaseState = {
  products: [],
  loading: true,
  purchasing: false,
  restoring: false,
  error: null,
};
const subscribers = new Set<() => void>();

let refCount = 0;
let started = false;
let updateSub: { remove: () => void } | null = null;
let errorSub: { remove: () => void } | null = null;

// Transaction ids already verified+finished this session — guards against a
// listener firing twice or StoreKit redelivering an already-processed receipt.
const processedTransactionIds = new Set<string>();

// Whichever caller most recently initiated a purchase, and its onPurchaseVerified
// callback. StoreKit also delivers transactions the user did NOT just tap for
// (renewals, queued/Ask-to-Buy). Those must be verified+finished silently — we
// only pop the "Activated" alert and route the user forward for a purchase the
// user actually initiated in this session.
let userInitiatedPurchase = false;
let activeVerifiedCallback: VerifiedCallback | undefined;

const emit = (): void => {
  subscribers.forEach(fn => fn());
};

const setState = (patch: Partial<PurchaseState>): void => {
  state = { ...state, ...patch };
  emit();
};

const getSnapshot = (): PurchaseState => state;

const subscribe = (fn: () => void): (() => void) => {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
};

const handlePurchaseUpdate = async (
  purchase: SubscriptionPurchase | ProductPurchase,
): Promise<void> => {
  if (__DEV__) {
    // Never log the full purchase object in release — it carries the signed
    // transaction receipt. Product/transaction ids are enough to debug with.
    console.log('Purchase updated:', {
      productId: purchase.productId,
      transactionId: purchase.transactionId,
    });
  }

  const txId = purchase.transactionId || purchase.productId;
  // Dedupe: never verify/finish/alert the same transaction twice (two listeners
  // in the old design, or StoreKit redelivering a queued transaction).
  if (txId && processedTransactionIds.has(txId)) {
    return;
  }

  const receipt = Platform.select({
    ios: purchase.transactionReceipt,
    android: purchase.purchaseToken,
  });

  // No receipt means there is nothing to verify — clear the flag so the CTA
  // never wedges on "LOADING..." waiting for a verification that can't happen.
  // Do NOT mark the transaction processed here: if StoreKit later redelivers
  // the same transaction WITH a receipt, we must still verify it (else the user
  // could be charged but never activated).
  if (!receipt) {
    setState({ purchasing: false });
    return;
  }

  // Mark processed only now that we're actually going to verify + finish it.
  if (txId) {
    processedTransactionIds.add(txId);
  }

  const wasUserInitiated = userInitiatedPurchase;

  try {
    const result = await subscriptionApiService.verifyPurchase({
      platform: Platform.OS as 'ios' | 'android',
      receipt_data: receipt,
      product_id: purchase.productId,
      transaction_id: purchase.transactionId || purchase.productId,
    });

    if (!result.success) {
      throw new Error(result.message || 'Verification failed');
    }

    // Verified server-side — finish so StoreKit stops redelivering. (On a
    // FAILED verify we deliberately do NOT finish, so StoreKit redelivers and
    // the listener can retry on next launch — see catch.)
    await finishTransaction({ purchase, isConsumable: false });
    setState({ purchasing: false });

    // Only surface the modal + route the user forward for a purchase they just
    // initiated. A renewal/queued transaction delivered mid-session is verified
    // and finished silently; the app reflects it on the next status refresh.
    if (wasUserInitiated) {
      userInitiatedPurchase = false;
      Alert.alert(
        'Subscription Activated',
        'Your subscription has been successfully activated!',
        [{ text: 'OK' }],
      );
      try {
        await activeVerifiedCallback?.();
      } catch (cbError) {
        console.warn('onPurchaseVerified callback failed:', cbError);
      }
    }
  } catch (error: any) {
    console.error('Purchase verification error:', error);
    // Allow the transaction to be reprocessed when StoreKit redelivers it
    // (transient network/backend failure) so a charged user can still recover.
    if (txId) {
      processedTransactionIds.delete(txId);
    }
    setState({
      purchasing: false,
      error: 'Failed to verify purchase. Please contact support.',
    });
  }
};

const handlePurchaseError = (error: any): void => {
  // Cancel fires here too — treat it as a silent no-op.
  if (isUserCancelled(error)) {
    userInitiatedPurchase = false;
    setState({ purchasing: false });
    return;
  }
  console.warn('Purchase error:', error);
  userInitiatedPurchase = false;
  setState({ purchasing: false, error: error.message });
};

/** Open the shared connection + register listeners exactly once. */
const startConnection = async (): Promise<void> => {
  refCount += 1;
  if (started) {
    return;
  }
  started = true;

  // Register the purchase listeners BEFORE anything that can hang or throw
  // (initConnection / getSubscriptions). StoreKit can deliver a queued
  // transaction the instant the connection opens; if the listeners aren't
  // attached yet that event is lost.
  updateSub = purchaseUpdatedListener(handlePurchaseUpdate);
  errorSub = purchaseErrorListener(handlePurchaseError);

  try {
    await withTimeout(initConnection(), IAP_INIT_TIMEOUT_MS, 'initConnection');
    if (__DEV__) {
      console.log('IAP connection initialized');
    }
    const productIds = Object.values(PRODUCT_IDS);
    const availableProducts = await withTimeout(
      getSubscriptions({ skus: productIds }),
      IAP_INIT_TIMEOUT_MS,
      'getSubscriptions',
    );
    setState({ products: availableProducts, loading: false });
  } catch (error: any) {
    console.error('IAP initialization error:', error);
    setState({ loading: false, error: 'Failed to initialize store connection' });
  }
};

/** Release one caller; tear the connection down only when the last unmounts. */
const releaseConnection = (): void => {
  refCount = Math.max(0, refCount - 1);
  if (refCount > 0) {
    return;
  }
  updateSub?.remove();
  errorSub?.remove();
  updateSub = null;
  errorSub = null;
  started = false;
  endConnection();
  // Reset transient flags so a later fresh mount re-initialises cleanly. Keep
  // the last-known products so the paywall can render immediately on remount.
  state = {
    products: state.products,
    loading: true,
    purchasing: false,
    restoring: false,
    error: null,
  };
  userInitiatedPurchase = false;
  activeVerifiedCallback = undefined;
  processedTransactionIds.clear();
};

const purchase = async (
  productId: string,
  verifiedCallback: VerifiedCallback,
): Promise<void> => {
  userInitiatedPurchase = true;
  activeVerifiedCallback = verifiedCallback;
  setState({ purchasing: true, error: null });
  try {
    await requestSubscription({ sku: productId });
  } catch (error: any) {
    // User tapped Cancel on the Apple sheet — a normal action, not a failure.
    if (isUserCancelled(error)) {
      userInitiatedPurchase = false;
      setState({ purchasing: false });
      return;
    }
    console.error('Purchase error:', error);
    userInitiatedPurchase = false;
    setState({ purchasing: false, error: error.message || 'Purchase failed' });
  }
};

const restore = async () => {
  setState({ restoring: true, error: null });
  try {
    const availablePurchases = await getAvailablePurchases();

    if (!availablePurchases || availablePurchases.length === 0) {
      Alert.alert(
        'No Purchases Found',
        'No previous purchases were found to restore.',
        [{ text: 'OK' }],
      );
      setState({ restoring: false });
      return { success: true, data: { restored_count: 0, subscriptions: [] } };
    }

    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const receipts =
      Platform.OS === 'ios'
        ? availablePurchases
            .map(p => p.transactionReceipt)
            .filter((r): r is string => r !== undefined)
        : availablePurchases.map(p => ({
            purchaseToken: p.purchaseToken || '',
            productId: p.productId,
          }));

    const result = await subscriptionApiService.restorePurchases({
      platform,
      receipts,
    });

    if (result.success && result.data) {
      Alert.alert(
        'Purchases Restored',
        `${result.data.restored_count} subscription(s) restored successfully.`,
        [{ text: 'OK' }],
      );
    }

    setState({ restoring: false });
    return result;
  } catch (error: any) {
    console.error('Restore error:', error);
    setState({ restoring: false, error: 'Failed to restore purchases' });
    return null;
  }
};

/** Test-only: reset the module singleton between test cases. */
export const __resetIapStoreForTests = (): void => {
  state = {
    products: [],
    loading: true,
    purchasing: false,
    restoring: false,
    error: null,
  };
  subscribers.clear();
  processedTransactionIds.clear();
  refCount = 0;
  started = false;
  updateSub = null;
  errorSub = null;
  userInitiatedPurchase = false;
  activeVerifiedCallback = undefined;
};

export const useInAppPurchase = (options?: {
  /**
   * Called after a StoreKit purchase the user initiated has been verified by
   * the backend. Use it to refresh subscription status and route the user
   * forward — the purchase is confirmed by an async listener, so
   * `purchaseSubscription()` resolving does NOT mean the purchase is done yet.
   */
  onPurchaseVerified?: () => void | Promise<void>;
}) => {
  // Keep the latest callback in a ref so the shared listener always invokes the
  // current one without re-registering.
  const onPurchaseVerifiedRef = useRef(options?.onPurchaseVerified);
  onPurchaseVerifiedRef.current = options?.onPurchaseVerified;

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    startConnection();
    return () => {
      releaseConnection();
    };
  }, []);

  const purchaseSubscription = useCallback((productId: string) => {
    return purchase(productId, () => onPurchaseVerifiedRef.current?.());
  }, []);

  const restorePurchases = useCallback(() => restore(), []);

  return {
    products: snapshot.products,
    loading: snapshot.loading,
    purchasing: snapshot.purchasing,
    restoring: snapshot.restoring,
    error: snapshot.error,
    purchaseSubscription,
    restorePurchases,
    PRODUCT_IDS,
  };
};
