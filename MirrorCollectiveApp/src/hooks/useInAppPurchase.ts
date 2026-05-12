import {useEffect, useState, useCallback, useMemo} from 'react';
import {Platform} from 'react-native';
import {
  initConnection,
  endConnection,
  getSubscriptions,
  getAvailablePurchases,
  requestSubscription,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type Subscription,
  type SubscriptionPurchase,
  type ProductPurchase,
} from 'react-native-iap';

import {useToast} from '@components/Toast';
import {ALL_PRODUCT_SKUS, PRODUCTS} from '@/constants/products';
import {subscriptionApiService} from '@/services/api/subscriptionApi';

/**
 * iOS-only fields that react-native-iap exposes on its base
 * SubscriptionPurchase type but doesn't declare in its TS surface (the
 * union has the field as optional only on the iOS purchase shape and
 * the lib's union doesn't expose it).
 *
 * Locally extending the type here gives us safe access without
 * `(purchase as any)` at each call site.
 */
interface IosSubscriptionPurchase extends SubscriptionPurchase {
  originalTransactionIdentifierIOS?: string;
}

/**
 * Narrow an `unknown` thrown value to a user-facing error string.
 * Project rule: prefer `catch (error: unknown)` + this helper over the
 * convenience-but-unsafe `catch (error: any)` pattern.
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unexpected error';
}

/**
 * Gate console output behind __DEV__. In a real-money flow these logs
 * fired in production were potentially leaking receipt blobs to the
 * device console — not a bearer-token leak, but unnecessary noise +
 * a project lint violation.
 */
function devLog(...args: unknown[]): void {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}
function devWarn(...args: unknown[]): void {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn(...args);
  }
}
function devError(...args: unknown[]): void {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.error(...args);
  }
}

// Re-export under the legacy shape (PRODUCT_IDS) so existing consumers
// keep working. New code should import PRODUCTS from @/constants/products.
const PRODUCT_IDS = {
  CORE_MONTHLY: PRODUCTS.CORE_MONTHLY.sku,
  CORE_YEARLY: PRODUCTS.CORE_YEARLY.sku,
  STORAGE_MONTHLY: PRODUCTS.STORAGE_MONTHLY.sku,
  STORAGE_YEARLY: PRODUCTS.STORAGE_YEARLY.sku,
} as const;

interface PurchaseState {
  products: Subscription[];
  loading: boolean;
  purchasing: boolean;
  error: string | null;
}

export const useInAppPurchase = () => {
  const [state, setState] = useState<PurchaseState>({
    products: [],
    loading: true,
    purchasing: false,
    error: null,
  });
  const {showToast} = useToast();

  // Initialize IAP connection
  useEffect(() => {
    // react-native-iap returns event-emitter subscription handles
    // from `purchaseUpdatedListener` / `purchaseErrorListener`. The
    // lib's types call this `EmitterSubscription | null`. Inferring
    // the type via `ReturnType<>` keeps it tied to the lib's declared
    // shape without a hard `any`.
    let purchaseUpdateSubscription:
      | ReturnType<typeof purchaseUpdatedListener>
      | undefined;
    let purchaseErrorSubscription:
      | ReturnType<typeof purchaseErrorListener>
      | undefined;

    const initIAP = async () => {
      try {
        await initConnection();
        devLog('IAP connection initialized');

        // Fetch available products
        const availableProducts = await getSubscriptions({
          skus: [...ALL_PRODUCT_SKUS],
        });

        setState(prev => ({
          ...prev,
          products: availableProducts,
          loading: false,
        }));

        // Listen for purchase updates
        purchaseUpdateSubscription = purchaseUpdatedListener(
          async (purchase: SubscriptionPurchase | ProductPurchase) => {
            // Don't log the full purchase object — `transactionReceipt`
            // contains the raw receipt blob. Log only the productId +
            // transactionId metadata.
            devLog(
              'Purchase updated',
              purchase.productId,
              purchase.transactionId,
            );

            const receipt = Platform.select({
              ios: purchase.transactionReceipt,
              android: purchase.purchaseToken,
            });

            if (receipt) {
              try {
                // Resolve the canonical identifier for backend idempotency.
                // On iOS: `originalTransactionIdentifierIOS` is the
                // StoreKit-canonical id and stays constant across
                // renewals — exactly what we want as the dedupe key.
                // It's only undefined for non-StoreKit purchases.
                // On Android: react-native-iap exposes the orderId via
                // `transactionId`; the field doesn't change semantics
                // between purchase and renewal the same way it does on iOS.
                const iosPurchase = purchase as IosSubscriptionPurchase;
                const originalTransactionId =
                  (Platform.OS === 'ios'
                    ? iosPurchase.originalTransactionIdentifierIOS
                    : undefined) ?? purchase.transactionId;

                if (!originalTransactionId) {
                  // No usable id from the SDK. Don't fabricate one —
                  // a productId-as-transaction-id (the old fallback)
                  // would 404 against Apple's API and surface a
                  // misleading "Purchase Failed" alert.
                  throw new Error(
                    'Purchase succeeded but the platform did not return a transaction id. Please tap "Restore Purchase" or contact support.',
                  );
                }

                // Verify purchase with backend
                const result = await subscriptionApiService.verifyPurchase({
                  platform: Platform.OS as 'ios' | 'android',
                  receipt_data: receipt,
                  product_id: purchase.productId,
                  original_transaction_id: originalTransactionId,
                  transaction_id: purchase.transactionId || originalTransactionId,
                });

                if (result.success) {
                  // Finish the transaction
                  await finishTransaction({purchase, isConsumable: false});

                  showToast({
                    title: 'Subscription Activated',
                    message: 'Your subscription is active.',
                    tone: 'success',
                  });

                  setState(prev => ({...prev, purchasing: false}));
                } else {
                  throw new Error(result.message || 'Verification failed');
                }
              } catch (error: unknown) {
                devError('Purchase verification error:', getErrorMessage(error));
                setState(prev => ({
                  ...prev,
                  purchasing: false,
                  error: 'Failed to verify purchase. Please contact support.',
                }));
              }
            }
          },
        );

        // Listen for purchase errors
        purchaseErrorSubscription = purchaseErrorListener(error => {
          devWarn('Purchase error:', error.message);
          setState(prev => ({
            ...prev,
            purchasing: false,
            error: error.message,
          }));
        });
      } catch (error: unknown) {
        devError('IAP initialization error:', getErrorMessage(error));
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to initialize store connection',
        }));
      }
    };

    initIAP();

    return () => {
      // Cleanup
      if (purchaseUpdateSubscription) {
        purchaseUpdateSubscription.remove();
      }
      if (purchaseErrorSubscription) {
        purchaseErrorSubscription.remove();
      }
      endConnection();
    };
  }, []);

  // Purchase a subscription
  const purchaseSubscription = useCallback(async (productId: string) => {
    setState(prev => ({...prev, purchasing: true, error: null}));

    try {
      await requestSubscription({
        sku: productId,
      });
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      devError('Purchase error:', message);
      setState(prev => ({
        ...prev,
        purchasing: false,
        error: message,
      }));
    }
  }, []);

  // Restore purchases
  const restorePurchases = useCallback(async () => {
    setState(prev => ({...prev, loading: true, error: null}));

    try {
      // Get available purchases from the store
      const availablePurchases = await getAvailablePurchases();

      if (!availablePurchases || availablePurchases.length === 0) {
        showToast({
          title: 'No purchases found',
          message: 'There are no previous purchases to restore on this account.',
          tone: 'info',
        });
        setState(prev => ({...prev, loading: false}));
        return {success: true, data: {restored_count: 0, subscriptions: []}};
      }

      // Format receipts based on platform
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      const receipts =
        Platform.OS === 'ios'
          ? // iOS: Send transaction receipts (base64 encoded), filter out undefined
            availablePurchases
              .map(purchase => purchase.transactionReceipt)
              .filter((receipt): receipt is string => receipt !== undefined)
          : // Android: Send purchase tokens with product IDs
            availablePurchases.map(purchase => ({
              purchaseToken: purchase.purchaseToken || '',
              productId: purchase.productId,
            }));

      // Call backend to restore and sync
      const result = await subscriptionApiService.restorePurchases({
        platform,
        receipts,
      });

      if (result.success && result.data) {
        const count = result.data.restored_count;
        showToast({
          title: 'Purchases restored',
          message:
            count === 1
              ? '1 subscription restored.'
              : `${count} subscriptions restored.`,
          tone: 'success',
        });
      }

      setState(prev => ({...prev, loading: false}));
      return result;
    } catch (error: unknown) {
      devError('Restore error:', getErrorMessage(error));
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to restore purchases',
      }));
      return null;
    }
  }, []);

  // Lookup helper — returns the Subscription metadata (price, title,
  // intro offer) for a given SKU. Used by paywall screens to render
  // store-localized pricing instead of hard-coded numbers.
  const findProduct = useCallback(
    (sku: string): Subscription | undefined =>
      state.products.find(p => p.productId === sku),
    [state.products],
  );

  return {
    products: state.products,
    loading: state.loading,
    purchasing: state.purchasing,
    error: state.error,
    purchaseSubscription,
    restorePurchases,
    findProduct,
    PRODUCT_IDS,
  };
};

// Pure helpers extracted to a dependency-free module so they can be
// unit-tested without dragging in the full IAP / api import chain.
// Re-exported here so existing call sites continue to work.
export {formatLocalizedPrice, hasIntroductoryOffer} from './useInAppPurchase.helpers';
