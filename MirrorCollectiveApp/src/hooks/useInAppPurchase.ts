import {useEffect, useState, useCallback} from 'react';
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

import {subscriptionApiService} from '@/services/api/subscriptionApi';

// Product IDs
const PRODUCT_IDS = {
  CORE_MONTHLY: Platform.select({
    ios: 'com.mirrorcollective.core.monthly',
    android: 'com.mirrorcollective.core.monthly',
  })!,
  CORE_YEARLY: Platform.select({
    ios: 'com.mirrorcollective.core.yearly',
    android: 'com.mirrorcollective.core.yearly',
  })!,
  STORAGE_MONTHLY: Platform.select({
    ios: 'com.mirrorcollective.storage.monthly',
    android: 'com.mirrorcollective.storage.monthly',
  })!,
  STORAGE_YEARLY: Platform.select({
    ios: 'com.mirrorcollective.storage.yearly',
    android: 'com.mirrorcollective.storage.yearly',
  })!,
};

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
        const productIds = Object.values(PRODUCT_IDS);
        const availableProducts = await getSubscriptions({skus: productIds});

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
                // Verify purchase with backend
                const result = await subscriptionApiService.verifyPurchase({
                  platform: Platform.OS as 'ios' | 'android',
                  receipt_data: receipt,
                  product_id: purchase.productId,
                  transaction_id: purchase.transactionId || purchase.productId,
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
