import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { useInAppPurchase, __resetIapStoreForTests } from './useInAppPurchase';

// Control requestSubscription per-test; stub the rest of the IAP surface so the
// hook mounts cleanly. Capture the purchaseUpdated callback so tests can
// simulate StoreKit delivering a transaction.
const mockRequestSubscription = jest.fn();
const mockInitConnection = jest.fn().mockResolvedValue(true);
const mockGetSubscriptions = jest.fn().mockResolvedValue([]);
const mockFinishTransaction = jest.fn().mockResolvedValue(undefined);
let capturedUpdateListener: (purchase: any) => void | Promise<void> = () => {};
const mockPurchaseUpdatedListener = jest.fn((cb: any) => {
  capturedUpdateListener = cb;
  return { remove: jest.fn() };
});
const mockPurchaseErrorListener = jest.fn(() => ({ remove: jest.fn() }));

jest.mock('react-native-iap', () => ({
  initConnection: (...args: unknown[]) => mockInitConnection(...args),
  endConnection: jest.fn().mockResolvedValue(undefined),
  getSubscriptions: (...args: unknown[]) => mockGetSubscriptions(...args),
  getAvailablePurchases: jest.fn().mockResolvedValue([]),
  requestSubscription: (...args: unknown[]) => mockRequestSubscription(...args),
  finishTransaction: (...args: unknown[]) => mockFinishTransaction(...args),
  purchaseUpdatedListener: (cb: any) => mockPurchaseUpdatedListener(cb),
  purchaseErrorListener: (...args: unknown[]) =>
    mockPurchaseErrorListener(...(args as [])),
  ErrorCode: { E_USER_CANCELLED: 'E_USER_CANCELLED' },
}));

const mockVerifyPurchase = jest.fn();
jest.mock('@/services/api/subscriptionApi', () => ({
  subscriptionApiService: {
    verifyPurchase: (...args: unknown[]) => mockVerifyPurchase(...args),
    restorePurchases: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  // The store is a module-level singleton — reset it between tests.
  __resetIapStoreForTests();
  mockInitConnection.mockResolvedValue(true);
  mockGetSubscriptions.mockResolvedValue([]);
  mockVerifyPurchase.mockResolvedValue({ success: true });
});

describe('useInAppPurchase — init resilience (paywall wedge fix)', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('registers purchase listeners BEFORE loading products', async () => {
    renderHook(() => useInAppPurchase());

    await waitFor(() => expect(mockGetSubscriptions).toHaveBeenCalled());

    // A queued StoreKit transaction can arrive the instant the connection
    // opens; if getSubscriptions ran first (and hung) the listener would miss
    // it. Assert the listener was wired up first via invocation order.
    const listenerOrder =
      mockPurchaseUpdatedListener.mock.invocationCallOrder[0];
    const getSubsOrder = mockGetSubscriptions.mock.invocationCallOrder[0];
    expect(listenerOrder).toBeLessThan(getSubsOrder);
  });

  it('clears loading even when getSubscriptions hangs forever', async () => {
    jest.useFakeTimers();
    mockGetSubscriptions.mockReturnValue(new Promise(() => {}));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useInAppPurchase());
    expect(result.current.loading).toBe(true);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(10000);
    });

    expect(result.current.loading).toBe(false);
  });

  it('clears loading when getSubscriptions rejects', async () => {
    mockGetSubscriptions.mockRejectedValueOnce(new Error('store down'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useInAppPurchase());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Failed to initialize store connection');
  });

  it('opens the connection only once across multiple hook instances', async () => {
    const a = renderHook(() => useInAppPurchase());
    const b = renderHook(() => useInAppPurchase());
    await waitFor(() => expect(mockGetSubscriptions).toHaveBeenCalled());

    // Two mounted callers share ONE connection + ONE listener pair.
    expect(mockInitConnection).toHaveBeenCalledTimes(1);
    expect(mockPurchaseUpdatedListener).toHaveBeenCalledTimes(1);

    // Unmounting one caller must NOT tear down the shared connection.
    const iap = require('react-native-iap');
    a.unmount();
    expect(iap.endConnection).not.toHaveBeenCalled();
    b.unmount();
    expect(iap.endConnection).toHaveBeenCalledTimes(1);
  });
});

describe('useInAppPurchase — user cancel handling', () => {
  afterEach(() => jest.restoreAllMocks());

  it('treats a Cancel on the Apple sheet as a silent no-op', async () => {
    const cancel = Object.assign(new Error('cancelled'), {
      code: 'E_USER_CANCELLED',
    });
    mockRequestSubscription.mockRejectedValueOnce(cancel);
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useInAppPurchase());
    await act(async () => {
      await result.current.purchaseSubscription('sku');
    });

    expect(result.current.purchasing).toBe(false);
    expect(result.current.error).toBeNull();
    expect(errSpy).not.toHaveBeenCalledWith(
      'Purchase error:',
      expect.anything(),
    );
  });

  it('still surfaces a genuine (non-cancel) purchase failure', async () => {
    const fail = Object.assign(new Error('network down'), { code: 'E_UNKNOWN' });
    mockRequestSubscription.mockRejectedValueOnce(fail);
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useInAppPurchase());
    await act(async () => {
      await result.current.purchaseSubscription('sku');
    });

    expect(result.current.error).toBe('network down');
    expect(result.current.purchasing).toBe(false);
  });
});

describe('useInAppPurchase — transaction delivery hardening', () => {
  afterEach(() => jest.restoreAllMocks());

  const deliver = (purchase: any) =>
    act(async () => {
      await capturedUpdateListener(purchase);
    });

  it('verifies + finishes + alerts + routes for a user-initiated purchase', async () => {
    const onVerified = jest.fn();
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { result } = renderHook(() =>
      useInAppPurchase({ onPurchaseVerified: onVerified }),
    );
    await waitFor(() => expect(mockGetSubscriptions).toHaveBeenCalled());

    await act(async () => {
      await result.current.purchaseSubscription('sku');
    });
    await deliver({
      productId: 'sku',
      transactionId: 'tx-1',
      transactionReceipt: 'receipt-1',
    });

    expect(mockVerifyPurchase).toHaveBeenCalledTimes(1);
    expect(mockFinishTransaction).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledWith(
      'Subscription Activated',
      expect.any(String),
      expect.any(Array),
    );
    expect(onVerified).toHaveBeenCalledTimes(1);
    expect(result.current.purchasing).toBe(false);
  });

  it('dedupes: the same transaction is verified/finished only once', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { result } = renderHook(() => useInAppPurchase());
    await waitFor(() => expect(mockGetSubscriptions).toHaveBeenCalled());
    await act(async () => {
      await result.current.purchaseSubscription('sku');
    });

    const tx = {
      productId: 'sku',
      transactionId: 'tx-dupe',
      transactionReceipt: 'r',
    };
    await deliver(tx);
    await deliver(tx); // redelivery / second listener

    expect(mockVerifyPurchase).toHaveBeenCalledTimes(1);
    expect(mockFinishTransaction).toHaveBeenCalledTimes(1);
  });

  it('verifies a background transaction silently — no alert, no routing', async () => {
    const onVerified = jest.fn();
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    renderHook(() => useInAppPurchase({ onPurchaseVerified: onVerified }));
    await waitFor(() => expect(mockGetSubscriptions).toHaveBeenCalled());

    // No purchaseSubscription() call → this is a renewal/queued delivery.
    await deliver({
      productId: 'sku',
      transactionId: 'tx-renewal',
      transactionReceipt: 'r',
    });

    expect(mockVerifyPurchase).toHaveBeenCalledTimes(1); // still verified
    expect(mockFinishTransaction).toHaveBeenCalledTimes(1); // and finished
    expect(alertSpy).not.toHaveBeenCalled(); // but no modal
    expect(onVerified).not.toHaveBeenCalled(); // and no navigation
  });

  it('never wedges purchasing:true when the receipt is missing', async () => {
    const { result } = renderHook(() => useInAppPurchase());
    await waitFor(() => expect(mockGetSubscriptions).toHaveBeenCalled());
    await act(async () => {
      await result.current.purchaseSubscription('sku');
    });
    expect(result.current.purchasing).toBe(true);

    // StoreKit delivers a transaction with no receipt.
    await deliver({ productId: 'sku', transactionId: 'tx-no-receipt' });

    expect(mockVerifyPurchase).not.toHaveBeenCalled();
    expect(result.current.purchasing).toBe(false);
  });

  it('does NOT finish on verify failure, so StoreKit can redeliver + retry', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useInAppPurchase());
    await waitFor(() => expect(mockGetSubscriptions).toHaveBeenCalled());
    await act(async () => {
      await result.current.purchaseSubscription('sku');
    });

    mockVerifyPurchase.mockResolvedValueOnce({ success: false, message: 'boom' });
    const tx = { productId: 'sku', transactionId: 'tx-retry', transactionReceipt: 'r' };
    await deliver(tx);

    expect(mockFinishTransaction).not.toHaveBeenCalled();
    expect(result.current.error).toBe(
      'Failed to verify purchase. Please contact support.',
    );

    // Redelivery after a transient failure is reprocessed (not deduped away).
    mockVerifyPurchase.mockResolvedValueOnce({ success: true });
    await deliver(tx);
    expect(mockFinishTransaction).toHaveBeenCalledTimes(1);
  });
});
