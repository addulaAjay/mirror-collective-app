import {useEffect, useState, useCallback, useMemo} from 'react';
import {Platform, Alert} from 'react-native';
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

import {ALL_PRODUCT_SKUS, PRODUCTS} from '@/constants/products';
import {subscriptionApiService} from '@/services/api/subscriptionApi';

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

  // Initialize IAP connection
  useEffect(() => {
    let purchaseUpdateSubscription: any;
    let purchaseErrorSubscription: any;

    const initIAP = async () => {
      try {
        await initConnection();
        console.log('IAP connection initialized');

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
            console.log('Purchase updated:', purchase);

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
                const originalTransactionId =
                  (Platform.OS === 'ios'
                    ? (purchase as any).originalTransactionIdentifierIOS
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

                  Alert.alert(
                    'Subscription Activated',
                    'Your subscription has been successfully activated!',
                    [{text: 'OK'}],
                  );

                  setState(prev => ({...prev, purchasing: false}));
                } else {
                  throw new Error(result.message || 'Verification failed');
                }
              } catch (error: any) {
                console.error('Purchase verification error:', error);
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
          console.warn('Purchase error:', error);
          setState(prev => ({
            ...prev,
            purchasing: false,
            error: error.message,
          }));
        });
      } catch (error: any) {
        console.error('IAP initialization error:', error);
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
    } catch (error: any) {
      console.error('Purchase error:', error);
      setState(prev => ({
        ...prev,
        purchasing: false,
        error: error.message || 'Purchase failed',
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
        Alert.alert(
          'No Purchases Found',
          'No previous purchases were found to restore.',
          [{text: 'OK'}],
        );
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
        Alert.alert(
          'Purchases Restored',
          `${result.data.restored_count} subscription(s) restored successfully.`,
          [{text: 'OK'}],
        );
      }

      setState(prev => ({...prev, loading: false}));
      return result;
    } catch (error: any) {
      console.error('Restore error:', error);
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

/**
 * Return a store-localized display price for a Subscription.
 *
 * iOS:
 *   - `localizedPrice` is the formatted string from StoreKit.
 *
 * Android:
 *   - For one-time products `localizedPrice` exists.
 *   - For subscriptions (the case here) the price lives inside
 *     `subscriptionOfferDetails[].pricingPhases.pricingPhaseList[]` —
 *     we read the LAST phase (the recurring/converted price after any
 *     intro offer or free trial).
 *
 * Falls back to a string that's safe to render — never an empty string,
 * never `undefined`.
 */
export function formatLocalizedPrice(
  sub: Subscription | undefined,
  fallback = '',
): string {
  if (!sub) return fallback;

  // iOS shape
  if ('localizedPrice' in sub && sub.localizedPrice) {
    return String(sub.localizedPrice);
  }

  // Android shape — pick the LAST pricing phase, which is the
  // recurring price after any intro / trial phase.
  const offers = (sub as any).subscriptionOfferDetails;
  if (Array.isArray(offers) && offers.length > 0) {
    const phases = offers[0]?.pricingPhases?.pricingPhaseList;
    if (Array.isArray(phases) && phases.length > 0) {
      const last = phases[phases.length - 1];
      if (last?.formattedPrice) return String(last.formattedPrice);
    }
  }

  return fallback;
}

/**
 * Does this Subscription carry an introductory offer (free trial /
 * discounted intro period)?
 *
 * iOS exposes `introductoryPrice` on the Subscription. Android exposes
 * multiple pricing phases — anything beyond a single phase indicates
 * an intro offer (the first phase is the promo, the last phase is the
 * recurring price).
 */
export function hasIntroductoryOffer(sub: Subscription | undefined): boolean {
  if (!sub) return false;
  if ((sub as any).introductoryPrice) return true;
  const offers = (sub as any).subscriptionOfferDetails;
  const phases = offers?.[0]?.pricingPhases?.pricingPhaseList;
  return Array.isArray(phases) && phases.length > 1;
}
