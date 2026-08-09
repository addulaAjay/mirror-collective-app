import { useEffect, useState, useCallback, useRef } from 'react';
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
 * rejecting — without a timeout the init effect's `loading` flag would stay
 * true forever and wedge the paywall on "LOADING...". Wrapping them guarantees
 * the effect always resolves one way or the other.
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
  error: string | null;
}

export const useInAppPurchase = (options?: {
  /**
   * Called after a StoreKit purchase has been verified by the backend. Use it
   * to refresh subscription status and route the user forward — the purchase
   * is confirmed by an async listener, so `purchaseSubscription()` resolving
   * does NOT mean the purchase is done yet.
   */
  onPurchaseVerified?: () => void | Promise<void>;
}) => {
  const [state, setState] = useState<PurchaseState>({
    products: [],
    loading: true,
    purchasing: false,
    error: null,
  });

  // Keep the latest callback in a ref so the purchase listener (subscribed
  // once in the init effect below) always invokes the current one without
  // needing to re-subscribe on every render.
  const onPurchaseVerifiedRef = useRef(options?.onPurchaseVerified);
  onPurchaseVerifiedRef.current = options?.onPurchaseVerified;

  // Initialize IAP connection
  useEffect(() => {
    let purchaseUpdateSubscription: any;
    let purchaseErrorSubscription: any;

    const initIAP = async () => {
      // Register the purchase listeners BEFORE anything that can hang or throw
      // (initConnection / getSubscriptions). StoreKit can deliver a queued
      // transaction — e.g. an Ask-to-Buy approval or a restore — the instant the
      // connection opens; if the listeners aren't attached yet that event is
      // lost. Registering first also means a slow/hung getSubscriptions never
      // costs us purchase delivery.
      purchaseUpdateSubscription = purchaseUpdatedListener(
        async (purchase: SubscriptionPurchase | ProductPurchase) => {
          if (__DEV__) {
            // Never log the full purchase object in release — it carries the
            // signed transaction receipt. Product/transaction ids are enough
            // to debug with.
            console.log('Purchase updated:', {
              productId: purchase.productId,
              transactionId: purchase.transactionId,
            });
          }

          const receipt = Platform.select({
            ios: purchase.transactionReceipt,
            android: purchase.purchaseToken,
          });

          if (receipt) {
            try {
              // Verify purchase with backend
              const result = await subscriptionApiService.verifyPurchase({
                platform: Platform.OS as 'ios' | 'android',
                receipt_data: receipt,
                product_id: purchase.productId,
                transaction_id: purchase.transactionId || purchase.productId,
              });

              if (result.success) {
                // Finish the transaction
                await finishTransaction({ purchase, isConsumable: false });

                Alert.alert(
                  'Subscription Activated',
                  'Your subscription has been successfully activated!',
                  [{ text: 'OK' }],
                );

                setState(prev => ({ ...prev, purchasing: false }));

                // Purchase is verified — let the caller refresh status and
                // route the user into the app.
                try {
                  await onPurchaseVerifiedRef.current?.();
                } catch (cbError) {
                  console.warn('onPurchaseVerified callback failed:', cbError);
                }
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
        // Cancel fires here too — treat it as a silent no-op.
        if (isUserCancelled(error)) {
          setState(prev => ({ ...prev, purchasing: false }));
          return;
        }
        console.warn('Purchase error:', error);
        setState(prev => ({
          ...prev,
          purchasing: false,
          error: error.message,
        }));
      });

      // Listeners are attached — now open the store connection and load
      // products. Both native calls are wrapped in a timeout because StoreKit
      // can hang without ever resolving or rejecting; on any failure we still
      // clear `loading` so the paywall renders (with fallback prices) instead
      // of being wedged on "LOADING..." forever.
      try {
        await withTimeout(
          initConnection(),
          IAP_INIT_TIMEOUT_MS,
          'initConnection',
        );
        if (__DEV__) {
          console.log('IAP connection initialized');
        }

        const productIds = Object.values(PRODUCT_IDS);
        const availableProducts = await withTimeout(
          getSubscriptions({ skus: productIds }),
          IAP_INIT_TIMEOUT_MS,
          'getSubscriptions',
        );

        setState(prev => ({
          ...prev,
          products: availableProducts,
          loading: false,
        }));
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
    setState(prev => ({ ...prev, purchasing: true, error: null }));

    try {
      await requestSubscription({
        sku: productId,
      });
    } catch (error: any) {
      // User tapped Cancel on the Apple sheet — a normal action, not a failure.
      // Reset the flag silently; don't log or set an error state.
      if (isUserCancelled(error)) {
        setState(prev => ({ ...prev, purchasing: false }));
        return;
      }
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
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Get available purchases from the store
      const availablePurchases = await getAvailablePurchases();

      if (!availablePurchases || availablePurchases.length === 0) {
        Alert.alert(
          'No Purchases Found',
          'No previous purchases were found to restore.',
          [{ text: 'OK' }],
        );
        setState(prev => ({ ...prev, loading: false }));
        return {
          success: true,
          data: { restored_count: 0, subscriptions: [] },
        };
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
          [{ text: 'OK' }],
        );
      }

      setState(prev => ({ ...prev, loading: false }));
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

  return {
    products: state.products,
    loading: state.loading,
    purchasing: state.purchasing,
    error: state.error,
    purchaseSubscription,
    restorePurchases,
    PRODUCT_IDS,
  };
};
